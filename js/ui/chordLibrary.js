/**
 * chordLibrary.js — Seção "Biblioteca de acordes".
 */

import { h, mount, dash, card, sectionHead, field, select, segmented, button, badge, table, details, term } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { state, noteLang } from '../state.js';
import { audio } from '../audio/audio.js';
import {
  parseNote, noteName, toMidi, freq, pitchClass, simpleEnharmonic, midiToNote
} from '../core/notes.js';
import {
  CHORD_TYPES, CHORD_CATEGORIES, buildChord, chordSymbol, chordFullName,
  chordFormula, chordIntervalTable, invertNotes, INVERSION_NAMES, chordMidis
} from '../core/chords.js';
import { intervalBetween, intervalAbbr, degreeLabel } from '../core/intervals.js';
import { renderStaff, autoClef } from '../view/staff.js';
import { renderFretboard, renderChordDiagram, findVoicings, TUNINGS, tuningById, voicingText } from '../view/fretboard.js';
import { renderKeyboard } from '../view/keyboard.js';

/** Fundamentais oferecidas, com as duas grafias das teclas pretas. */
export const ROOT_OPTIONS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

const FRET_RANGES = [
  { value: '0-12', label: '0 – 12' },
  { value: '0-5', label: '0 – 5' },
  { value: '5-12', label: '5 – 12' },
  { value: '12-19', label: '12 – 19' },
  { value: '12-24', label: '12 – 24' },
  { value: '0-24', label: '0 – 24' }
];

export function createChordLibrary() {
  const root = h('div.section-body');
  const ui = {
    rootText: 'C',
    typeId: 'maj',
    octave: 4,
    inversion: 0,
    tuning: state.tuning || 'standard',
    fretRange: '0-12',
    labelMode: 'note'
  };

  function chord() {
    const rootNote = parseNote(`${ui.rootText}${ui.octave}`);
    return buildChord(rootNote, ui.typeId, { inversion: ui.inversion });
  }

  /** Marcações por classe de altura: grau da fórmula + papel (fundamental ou não). */
  function marksFor() {
    const plain = buildChord(parseNote(`${ui.rootText}${ui.octave}`), ui.typeId);
    const map = new Map();
    plain.notes.forEach((n, i) => {
      map.set(pitchClass(n), { label: plain.degrees[i], role: i === 0 ? 'root' : 'chord' });
    });
    return map;
  }

  function render() {
    const lang = getLang();
    const nl = noteLang();
    const ch = chord();
    const plain = buildChord(ch.root, ui.typeId);
    const marks = marksFor();
    // Só faz sentido oferecer a troca quando a nota tem acidente (Dó♯ ↔ Ré♭).
    const alt = ch.root.alter !== 0 ? simpleEnharmonic(ch.root) : null;

    const typeOptions = CHORD_TYPES.map((ty) => ({
      value: ty.id,
      group: pick(CHORD_CATEGORIES[ty.category]),
      label: ty.symbol ? `${ty.symbol} — ${pick(ty.names)}` : pick(ty.names)
    }));

    const rootOptions = ROOT_OPTIONS.map((r) => ({
      value: r, label: noteName(parseNote(r), { lang: nl })
    }));

    const controls = h('div.controls-grid', {}, [
      field(t('root'), select(rootOptions, ui.rootText, (v) => { ui.rootText = v; update(); })),
      field(t('chordType'), select(typeOptions, ui.typeId, (v) => { ui.typeId = v; ui.inversion = 0; update(); })),
      field(t('octave'), select([2, 3, 4, 5].map((o) => ({ value: o, label: String(o) })), ui.octave, (v) => { ui.octave = parseInt(v, 10); update(); })),
      field(t('inversion'), select(
        plain.notes.map((_, i) => ({ value: i, label: pick(INVERSION_NAMES[Math.min(i, INVERSION_NAMES.length - 1)]) })),
        ui.inversion, (v) => { ui.inversion = parseInt(v, 10); update(); }
      ))
    ]);

    const header = h('div.chord-header', {}, [
      h('div.chord-symbol', { text: chordSymbol(ch, { lang: nl }) }),
      h('div.chord-meta', {}, [
        h('p.chord-fullname', { text: chordFullName(plain, lang) }),
        h('p.chord-formula', {}, [
          h('span.label', { text: `${t('formula')}: ` }),
          h('code', { text: chordFormula(plain) })
        ]),
        alt ? h('p.chord-enh', {}, [
          badge(t('enharmonic')),
          h('span', { text: ` ${noteName(ch.root, { lang: nl })} = ${noteName(alt, { lang: nl })} ` }),
          button(t('switchSpelling'), () => {
            ui.rootText = alt.letter + (alt.alter === 1 ? '#' : alt.alter === -1 ? 'b' : '');
            update();
          }, { class: 'btn-small' })
        ]) : null
      ])
    ]);

    const playBar = h('div.play-bar', {}, [
      button(`▶ ${t('playChord')}`, () => audio.playChord(chordMidis(ch), { dur: 2 })),
      button(`▶ ${t('playArpeggio')}`, () => audio.playChord(chordMidis(ch), { arpeggio: true, dur: 1.4 })),
      button(`▶ ${t('playNotes')}`, () => audio.playSequence(chordMidis(ch), { stepSeconds: 0.55 })),
      button(`■ ${t('stop')}`, () => audio.stopAll(), { class: 'btn-ghost' })
    ]);

    // Numa coluna estreita, quatro colunas bastam: o nome completo do
    // intervalo vai no atributo title, para não estourar a largura.
    const rows = chordIntervalTable(ch, nl).map((r) => ([
      h('strong', { text: r.name }),
      degreeOf(plain, r.note),
      h('span', { title: `${r.full} — ${r.semitones} ${t('semitones')}`, text: r.abbr }),
      `${freq(r.note, state.a4).toFixed(1)} Hz`
    ]));
    const notesTable = table(
      [t('notes'), lang === 'pt' ? 'Grau' : 'Degree', lang === 'pt' ? 'Intervalo' : 'Interval', t('frequency')],
      rows
    );

    // --- partitura ---
    const staffWrap = h('div.viz-scroll', {}, [renderStaff({
      notes: [ch.notes], clef: autoClef([ch.notes]), showNames: true, lang: nl, duration: 'whole'
    })]);

    // --- braço ---
    const tuning = tuningById(ui.tuning);
    const [from, to] = ui.fretRange.split('-').map(Number);
    const fretWrap = h('div.viz-scroll', {}, [renderFretboard({
      tuning, fromFret: from, toFret: to, marks, lang: nl, labelMode: ui.labelMode,
      onSelect: (midi) => audio.playMidi(midi, 0, 1.1)
    })]);

    const fretControls = h('div.controls-inline', {}, [
      field(t('tuning'), select(TUNINGS.map((x) => ({ value: x.id, label: pick(x.names) })), ui.tuning, (v) => { ui.tuning = v; update(); })),
      field(t('fretRange'), select(FRET_RANGES, ui.fretRange, (v) => { ui.fretRange = v; update(); })),
      field(t('showAs'), segmented([
        { value: 'note', label: t('noteNames') },
        { value: 'degree', label: t('degrees') }
      ], ui.labelMode, (v) => { ui.labelMode = v; update(); }, t('showAs')))
    ]);

    // --- digitações ---
    const pcs = plain.notes.map(pitchClass);
    const voicings = findVoicings([...new Set(pcs)], pitchClass(plain.root), tuning, { limit: 4, maxFret: 12 });
    const diagrams = voicings.length
      ? h('div.diagram-row', {}, voicings.map((v) => h('figure.diagram', {}, [
        renderChordDiagram(v, tuning, { lang: nl }),
        h('figcaption', {}, [
          h('code', { text: voicingText(v) }),
          h('br'),
          button('▶', () => audio.playChord(v.midis.sort((a, b) => a - b), { arpeggio: true, dur: 1.6 }), { class: 'btn-small', 'aria-label': t('play') })
        ])
      ])))
      : h('p.empty-note', { text: t('noFingerings') });

    // --- teclado ---
    const kbMarks = new Map();
    plain.notes.forEach((n, i) => kbMarks.set(pitchClass(n), { role: i === 0 ? 'root' : 'chord', label: plain.degrees[i] }));
    const kbWrap = h('div.viz-scroll', {}, [renderKeyboard({
      fromMidi: 48, toMidi: 84, pcMarks: kbMarks, lang: nl,
      onSelect: (midi) => audio.playMidi(midi, 0, 1.1)
    })]);

    mount(root,
      sectionHead(t('chords.title'), t('chords.lead')),
      dash([
        card(3, t('chordType'), [controls]),
        card(4, chordSymbol(ch, { lang: nl }), [header, playBar, notesTable], { scroll: 'md' }),
        card(5, t('staff'), [staffWrap, kbWrap]),
        card(7, t('fretboard'), [fretControls, fretWrap]),
        card(5, t('fingerings'), [diagrams], { scroll: 'sm' })
      ])
    );
  }

  /** Grau da nota dentro da fórmula do acorde (funciona com 9, 11, 13). */
  function degreeOf(plainChord, n) {
    const pc = pitchClass(n);
    const idx = plainChord.notes.findIndex((x) => pitchClass(x) === pc);
    return idx >= 0 ? plainChord.degrees[idx] : '';
  }

  function update() { render(); }

  render();
  return { element: root, refresh: render };
}
