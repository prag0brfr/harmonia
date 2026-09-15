/**
 * interferenceView.js — Seção "Interferência entre frequências".
 */

import { h, mount, dash, card, sectionHead, field, select, segmented, button, slider, badge, table, details } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { noteLang, state } from '../state.js';
import { audio } from '../audio/audio.js';
import { parseNote, noteName, toMidi, freq, midiToFreq, justFreq, cents } from '../core/notes.js';
import {
  drawInterference, drawBeatEnvelope, beatFrequency, ratioApprox,
  consonanceScore, nearestInterval, harmonicSeries, REFERENCE_INTERVALS,
  beatWindowSeconds, beatIsAudibleAsPulse
} from '../view/interference.js';
import { ROOT_OPTIONS } from './chordLibrary.js';

const OCTAVES = [2, 3, 4, 5, 6];

export function createInterference() {
  const root = h('div.section-body');
  const ui = {
    a: { note: 'C', octave: 4, manual: null },
    b: { note: 'G', octave: 4, manual: null },
    tuning: 'equal',
    mode: 'all',
    windowMs: 40,
    resolution: 1
  };
  let stopDrone = null;
  let mainCanvas = null;
  let beatCanvas = null;

  function freqOf(side) {
    const s = ui[side];
    if (s.manual) return s.manual;
    const n = parseNote(`${s.note}${s.octave}`);
    if (ui.tuning === 'just' && side === 'b') {
      const base = freq(parseNote(`${ui.a.note}${ui.a.octave}`), state.a4);
      const semis = toMidi(n) - toMidi(parseNote(`${ui.a.note}${ui.a.octave}`));
      if (semis >= 0) return justFreq(base, semis);
    }
    return freq(n, state.a4);
  }

  function redraw() {
    const f1 = freqOf('a');
    const f2 = freqOf('b');
    const css = getComputedStyle(document.documentElement);
    const colors = {
      wave1: css.getPropertyValue('--wave1').trim() || '#4f9cf9',
      wave2: css.getPropertyValue('--wave2').trim() || '#f59e42',
      sum: css.getPropertyValue('--wave-sum').trim() || '#22c55e',
      envelope: css.getPropertyValue('--wave-env').trim() || '#e0679b',
      grid: css.getPropertyValue('--grid').trim() || 'rgba(128,128,128,0.18)',
      axis: css.getPropertyValue('--axis').trim() || 'rgba(128,128,128,0.45)'
    };
    if (mainCanvas) {
      drawInterference(mainCanvas, {
        f1, f2, windowMs: ui.windowMs, mode: ui.mode, resolution: ui.resolution, colors
      });
    }
    if (beatCanvas) {
      drawBeatEnvelope(beatCanvas, { f1, f2, seconds: beatWindowSeconds(f1, f2), colors });
    }
  }

  function sideControls(side, label) {
    const lang = getLang();
    const nl = noteLang();
    const s = ui[side];
    return h('div.freq-side', {}, [
      h('h4.sub-title', { text: label }),
      h('div.controls-inline', {}, [
        field(lang === 'pt' ? 'Nota' : 'Note', select(
          ROOT_OPTIONS.map((r) => ({ value: r, label: noteName(parseNote(r), { lang: nl }) })),
          s.note, (v) => { s.note = v; s.manual = null; render(); }
        )),
        field(t('octave'), select(OCTAVES.map((o) => ({ value: o, label: String(o) })), s.octave,
          (v) => { s.octave = parseInt(v, 10); s.manual = null; render(); })),
        field(t('interf.manual'), h('input.control', {
          type: 'number', min: '20', max: '8000', step: '0.1',
          value: freqOf(side).toFixed(2),
          onchange: (e) => {
            const v = parseFloat(e.target.value);
            s.manual = Number.isFinite(v) && v > 0 ? v : null;
            render();
          }
        }))
      ]),
      h('p.freq-readout', {}, [
        h('strong', { text: `${freqOf(side).toFixed(2)} Hz` }),
        s.manual ? badge(lang === 'pt' ? 'manual' : 'manual') : null
      ])
    ]);
  }

  function render() {
    const lang = getLang();
    const nl = noteLang();
    const f1 = freqOf('a');
    const f2 = freqOf('b');
    const beat = beatFrequency(f1, f2);
    const ratio = ratioApprox(Math.min(f1, f2), Math.max(f1, f2));
    const near = nearestInterval(f1, f2);
    const cons = consonanceScore(Math.min(f1, f2), Math.max(f1, f2));
    // Nomeia a relação incluindo as oitavas: 2º harmônico = "Oitava",
    // 3º = "Quinta justa + 1 oitava", e não "Uníssono +18ª".
    const describeRelation = (f0, fx) => {
      const n = nearestInterval(f0, fx);
      const word = lang === 'pt'
        ? (n.octaves === 1 ? 'oitava' : 'oitavas')
        : (n.octaves === 1 ? 'octave' : 'octaves');
      if (n.ref.key === 'unison') {
        if (n.octaves === 0) return pick(n.ref.names);
        return n.octaves === 1 ? (lang === 'pt' ? 'Oitava' : 'Octave') : `${n.octaves} ${word}`;
      }
      return pick(n.ref.names) + (n.octaves ? ` + ${n.octaves} ${word}` : '');
    };

    const consLabel = cons > 0.66 ? t('interf.moreConsonant') : cons < 0.4 ? t('interf.moreDissonant') : t('interf.intermediate');

    mainCanvas = h('canvas.wave-canvas', { 'aria-label': lang === 'pt' ? 'Formas de onda' : 'Waveforms' });
    beatCanvas = h('canvas.beat-canvas', { 'aria-label': t('interf.beatsVisible') });

    const readout = h('div.readout-grid', {}, [
      readoutItem(t('interf.beat'), `${beat.toFixed(2)} Hz`, t('interf.beatFormula')),
      readoutItem(t('ratio'), `${ratio.num} : ${ratio.den}`, `${lang === 'pt' ? 'erro' : 'error'} ${(ratio.error * 100).toFixed(2)}%`),
      readoutItem(t('interf.nearest'), describeRelation(Math.min(f1, f2), Math.max(f1, f2)),
        `${near.centsOff >= 0 ? '+' : ''}${near.centsOff.toFixed(1)} cents`),
      h('div.readout-item', {}, [
        h('span.readout-label', { text: t('interf.consonance') }),
        h('div.score-bar', { 'aria-hidden': 'true' }, [h('div.score-fill', { style: `width:${Math.round(cons * 100)}%` })]),
        h('span.readout-value', { text: consLabel })
      ])
    ]);

    const viewControls = h('div.controls-inline', {}, [
      field(t('interf.view'), segmented([
        { value: 'waves', label: t('interf.view.waves') },
        { value: 'sum', label: t('interf.view.sum') },
        { value: 'envelope', label: t('interf.view.envelope') },
        { value: 'all', label: t('interf.view.all') }
      ], ui.mode, (v) => { ui.mode = v; redraw(); }, t('interf.view'))),
      field(t('interf.temperament'), segmented([
        { value: 'equal', label: t('interf.equal') },
        { value: 'just', label: t('interf.just') }
      ], ui.tuning, (v) => { ui.tuning = v; render(); }, t('interf.temperament')))
    ]);

    const zoom = slider(`${t('interf.window')} / ${t('interf.zoom')}`, {
      min: 2, max: 200, step: 1, value: ui.windowMs, format: (v) => `${v} ms`
    }, (v) => { ui.windowMs = v; redraw(); });

    const res = slider(t('interf.resolution'), {
      min: 1, max: 4, step: 1, value: ui.resolution, format: (v) => `${v}×`
    }, (v) => { ui.resolution = v; redraw(); });

    const playBar = h('div.play-bar', {}, [
      button(`▶ ${t('interf.holdToHear')}`, () => {
        if (stopDrone) { stopDrone(); stopDrone = null; return; }
        stopDrone = audio.drone([f1, f2]);
        setTimeout(() => { if (stopDrone) { stopDrone(); stopDrone = null; } }, 4000);
      }),
      button(`▶ ${lang === 'pt' ? 'Uma depois da outra' : 'One after the other'}`, () => {
        audio.playFreq(f1, 0, 1.1);
        audio.playFreq(f2, 1.2, 1.1);
      }),
      button(`■ ${t('stop')}`, () => { if (stopDrone) { stopDrone(); stopDrone = null; } audio.stopAll(); }, { class: 'btn-ghost' })
    ]);

    // Série harmônica da nota mais grave
    const base = Math.min(f1, f2);
    const series = harmonicSeries(base, 8);
    const seriesTable = table(
      [lang === 'pt' ? 'Harmônico' : 'Harmonic', t('frequency'), lang === 'pt' ? 'Intervalo com a fundamental' : 'Interval above the fundamental', ''],
      series.map((x) => ([
        String(x.n),
        `${x.freq.toFixed(1)} Hz`,
        describeRelation(base, x.freq),
        button('▶', () => audio.playFreq(x.freq, 0, 0.9), { class: 'btn-small', 'aria-label': t('play') })
      ]))
    );

    const glossary = h('div.gloss-grid', {}, [
      ['gloss.unison', 'gloss.unison.d'], ['gloss.octave', 'gloss.octave.d'],
      ['gloss.fifth', 'gloss.fifth.d'], ['gloss.fourth', 'gloss.fourth.d'],
      ['gloss.M3', 'gloss.M3.d'], ['gloss.m3', 'gloss.m3.d'],
      ['gloss.tritone', 'gloss.tritone.d'], ['gloss.beats', 'gloss.beats.d'],
      ['gloss.series', 'gloss.series.d'], ['gloss.consonance', 'gloss.consonance.d']
    ].map(([k, d]) => h('div.gloss-item', {}, [
      h('h5', { text: t(k) }), h('p', { text: t(d) })
    ])));

    const comparison = h('div.chip-row', {}, REFERENCE_INTERVALS.map((iv) => h('button.chip', {
      type: 'button', text: `${pick(iv.names)} (${iv.ratio[0]}:${iv.ratio[1]})`,
      onclick: () => {
        const a = parseNote(`${ui.a.note}${ui.a.octave}`);
        const target = toMidi(a) + iv.semitones;
        ui.b.manual = null;
        ui.b.note = ROOT_OPTIONS.find((r) => (toMidi(parseNote(`${r}4`)) % 12 + 12) % 12 === ((target % 12) + 12) % 12) || 'C';
        ui.b.octave = Math.floor(target / 12) - 1;
        render();
      }
    })));

    mount(root,
      sectionHead(t('interf.title'), t('interf.lead')),
      dash([
        card(4, `${t('interf.noteA')} · ${t('interf.noteB')}`, [
          h('div.freq-sides-stack', {}, [sideControls('a', t('interf.noteA')), sideControls('b', t('interf.noteB'))]),
          h('span.label', { text: `${lang === 'pt' ? 'Comparar com' : 'Compare with'}:` }),
          comparison,
          playBar
        ], { scroll: 'md' }),
        card(8, t('interf.view'), [viewControls, h('div.controls-inline', {}, [zoom, res]), mainCanvas]),
        card(4, t('interf.beat'), [
          readout,
          h('h4.sub-title', { text: `${t('interf.beatsVisible')} — ${t('interf.beatWindow')} ${beatWindowSeconds(f1, f2).toFixed(2)} s` }),
          beatCanvas,
          beatIsAudibleAsPulse(f1, f2) ? null : h('p.muted.small', { text: t('interf.beatTooFast') })
        ], { scroll: 'md' }),
        card(4, t('interf.harmonicSeries'), [seriesTable], { scroll: 'md' }),
        card(4, t('gloss.title'), [
          h('p.notice.notice-info.small', { text: t('interf.caveat') }),
          glossary
        ], { scroll: 'md' })
      ])
    );

    // O canvas precisa estar no documento para ter largura medida.
    requestAnimationFrame(redraw);
  }

  function readoutItem(label, value, hint) {
    return h('div.readout-item', {}, [
      h('span.readout-label', { text: label }),
      h('span.readout-value', { text: value }),
      hint ? h('span.readout-hint', { text: hint }) : null
    ]);
  }

  window.addEventListener('resize', () => redraw());

  render();
  return { element: root, refresh: render, redraw };
}
