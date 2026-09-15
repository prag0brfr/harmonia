/**
 * audio.js — Geração sonora com a Web Audio API.
 *
 * Usamos osciladores simples com envoltória ADSR. É um som sintético e
 * propositalmente simples: serve para ouvir relações de altura, não para
 * imitar o timbre de um instrumento real (um violão real tem dezenas de
 * parciais, ruído de ataque e ressonância de corpo).
 */

import { midiToFreq, toMidi, DEFAULT_A4 } from '../core/notes.js';

export const WAVEFORMS = [
  { id: 'sine', names: { pt: 'Senoidal', en: 'Sine' }, desc: { pt: 'Só a fundamental, sem harmônicos. Som puro e macio.', en: 'Fundamental only, no harmonics. Pure, soft sound.' } },
  { id: 'triangle', names: { pt: 'Triangular', en: 'Triangle' }, desc: { pt: 'Poucos harmônicos ímpares. Som doce, parecido com flauta.', en: 'Few odd harmonics. Sweet, flute-like.' } },
  { id: 'square', names: { pt: 'Quadrada', en: 'Square' }, desc: { pt: 'Harmônicos ímpares fortes. Som "de videogame".', en: 'Strong odd harmonics. Chiptune-like.' } },
  { id: 'sawtooth', names: { pt: 'Dente de serra', en: 'Sawtooth' }, desc: { pt: 'Todos os harmônicos. Som rico e cortante, base dos sintetizadores.', en: 'All harmonics. Rich, bright, the staple of synths.' } }
];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.waveform = 'triangle';
    this.volume = 0.7;
    this.a4 = DEFAULT_A4;
    this.tempo = 90;             // BPM
    this.active = new Set();     // vozes em andamento
    this.timeouts = new Set();
    this.onStateChange = null;
  }

  /** Cria (ou retoma) o contexto. Precisa ser chamado a partir de um gesto do usuário. */
  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  get available() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  setWaveform(w) { this.waveform = w; }
  setTempo(bpm) { this.tempo = Math.max(30, Math.min(240, bpm)); }
  setA4(hz) { this.a4 = hz; }

  /** Duração de uma semínima, em segundos. */
  get beat() { return 60 / this.tempo; }

  /**
   * Toca uma frequência com envoltória ADSR.
   * @param {number} freq hertz
   * @param {number} when atraso em segundos a partir de agora
   * @param {number} dur duração em segundos
   * @param {number} gain ganho relativo (0..1)
   */
  playFreq(freq, when = 0, dur = 0.9, gain = 0.28) {
    const ctx = this.ensure();
    if (!ctx) return null;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = this.waveform;
    osc.frequency.setValueAtTime(freq, t0);

    // ADSR curto: ataque 12 ms, decaimento até 70 %, release suave.
    const attack = 0.012;
    const decay = 0.09;
    const sustain = gain * 0.7;
    const release = Math.min(0.35, dur * 0.4);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, sustain), t0 + attack + decay);
    env.gain.setValueAtTime(Math.max(0.0002, sustain), t0 + Math.max(attack + decay, dur - release));
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(env);
    env.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    const voice = { osc, env };
    this.active.add(voice);
    osc.onended = () => this.active.delete(voice);
    return voice;
  }

  /** Toca uma nota MIDI. */
  playMidi(midi, when = 0, dur = 0.9, gain = 0.28) {
    return this.playFreq(midiToFreq(midi, this.a4), when, dur, gain);
  }

  /** Toca uma nota grafada. */
  playNote(n, when = 0, dur = 0.9, gain = 0.28) {
    return this.playMidi(toMidi(n), when, dur, gain);
  }

  /**
   * Toca um acorde.
   * @param {Array<number>} midis
   * @param {{arpeggio?: boolean, stepSeconds?: number, dur?: number}} opts
   */
  playChord(midis, opts = {}) {
    const { arpeggio = false, dur = 1.6 } = opts;
    const step = opts.stepSeconds ?? (arpeggio ? this.beat * 0.45 : 0);
    const gain = Math.max(0.1, 0.34 - midis.length * 0.025);
    midis.forEach((m, i) => this.playMidi(m, i * step, dur, gain));
    return (midis.length - 1) * step + dur;
  }

  /** Toca uma sequência de notas (escala, arpejo, intervalo melódico). */
  playSequence(midis, opts = {}) {
    const step = opts.stepSeconds ?? this.beat * 0.55;
    const dur = opts.dur ?? step * 0.95;
    midis.forEach((m, i) => this.playMidi(m, i * step, dur));
    return midis.length * step;
  }

  /**
   * Toca uma progressão: lista de listas de notas MIDI.
   * @param {Array<Array<number>>} chords
   * @param {{beatsPerChord?: number, arpeggio?: boolean, onChord?: Function}} opts
   */
  playProgression(chords, opts = {}) {
    const beats = opts.beatsPerChord ?? 2;
    const spacing = this.beat * beats;
    chords.forEach((midis, i) => {
      const when = i * spacing;
      if (opts.arpeggio) {
        midis.forEach((m, k) => this.playMidi(m, when + k * this.beat * 0.25, spacing * 0.9, 0.24));
      } else {
        const gain = Math.max(0.1, 0.32 - midis.length * 0.025);
        midis.forEach((m) => this.playMidi(m, when, spacing * 0.92, gain));
      }
      if (opts.onChord) {
        const id = setTimeout(() => { opts.onChord(i); this.timeouts.delete(id); }, when * 1000);
        this.timeouts.add(id);
      }
    });
    return chords.length * spacing;
  }

  /** Interrompe tudo imediatamente. */
  stopAll() {
    this.timeouts.forEach((id) => clearTimeout(id));
    this.timeouts.clear();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.active.forEach(({ osc, env }) => {
      try {
        env.gain.cancelScheduledValues(now);
        env.gain.setValueAtTime(Math.max(env.gain.value, 0.0001), now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.stop(now + 0.08);
      } catch { /* voz já encerrada */ }
    });
    this.active.clear();
  }

  /**
   * Zumbido contínuo de duas frequências, usado na seção de interferência.
   * Devolve uma função para interromper.
   */
  drone(freqs, gain = 0.18) {
    const ctx = this.ensure();
    if (!ctx) return () => {};
    const nodes = freqs.map((f) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = this.waveform;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.05);
      osc.connect(g);
      g.connect(this.master);
      osc.start();
      return { osc, g };
    });
    return () => {
      const now = ctx.currentTime;
      nodes.forEach(({ osc, g }) => {
        try {
          g.gain.cancelScheduledValues(now);
          g.gain.setValueAtTime(g.gain.value, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
          osc.stop(now + 0.1);
        } catch { /* já parado */ }
      });
    };
  }
}

export const audio = new AudioEngine();
