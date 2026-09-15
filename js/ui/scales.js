/**
 * scales.js (ui) — Explorador de escalas e modos.
 */

import { h, mount, dash, card, sectionHead, field, select, button, badge, table, kv } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { noteLang, state } from '../state.js';
import { audio } from '../audio/audio.js';
import { parseNote, noteName, toMidi, pitchClass } from '../core/notes.js';
import {
  SCALE_TYPES, SCALE_CATEGORIES, buildScale, scaleType, stepPattern, scaleOffsets
} from '../core/scales.js';
import { CHORD_TYPES, buildChord, chordSymbol, typeOffsets } from '../core/chords.js';
import { harmonicField, HARMONIC_FIELD_SCALES, romanNumeral } from '../core/harmony.js';
import { renderStaff } from '../view/staff.js';
import { renderFretboard, TUNINGS, tuningById } from '../view/fretboard.js';
import { renderKeyboard } from '../view/keyboard.js';
import { ROOT_OPTIONS } from './chordLibrary.js';

/** Tipos de acorde considerados ao procurar o que cabe dentro da escala. */
const FIT_TYPES = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'maj7', 'm7', '7', 'm7b5', 'dim7', '6', 'm6', 'mMaj7'];

/** Acordes cujas notas cabem inteiramente na escala. */
function chordsFittingScale(scale) {
  const pcs = new Set(scale.notes.map(pitchClass));
  const out = [];
  for (const n of scale.notes) {
    for (const id of FIT_TYPES) {
      const type = CHORD_TYPES.find((x) => x.id === id);
      const rootPc = pitchClass(n);
      const chordPcs = typeOffsets(type).map((o) => (rootPc + o) % 12);
      if (chordPcs.every((pc) => pcs.has(pc))) out.push(buildChord({ ...n, octave: 3 }, id));
    }
  }
  return out;
}

export function createScales() {
  const root = h('div.section-body');
  const ui = { tonic: 'C', scaleId: 'major', tuning: state.tuning || 'standard' };

  function scale() {
    return buildScale(parseNote(`${ui.tonic}4`), ui.scaleId);
  }

  function playScale(direction = 'up') {
    const sc = scale();
    const midis = sc.notes.map(toMidi);
    midis.push(midis[0] + 12);
    const seq = direction === 'down' ? [...midis].reverse() : midis;
    audio.playSequence(seq, { stepSeconds: 0.34 });
  }

  function playThirds() {
    const sc = scale();
    const midis = sc.notes.map(toMidi);
    const seq = [];
    for (let i = 0; i < midis.length; i += 1) {
      seq.push(midis[i]);
      seq.push(midis[(i + 2) % midis.length] + (i + 2 >= midis.length ? 12 : 0));
    }
    audio.playSequence(seq, { stepSeconds: 0.24 });
  }

  function render() {
    const lang = getLang();
    const nl = noteLang();
    const sc = scale();
    const type = scaleType(ui.scaleId);

    const scaleOptions = SCALE_TYPES.map((x) => ({
      value: x.id, group: pick(SCALE_CATEGORIES[x.category]), label: pick(x.names)
    }));

    const controls = [
      field(t('field.key'), select(ROOT_OPTIONS.map((r) => ({ value: r, label: noteName(parseNote(r), { lang: nl }) })),
        ui.tonic, (v) => { ui.tonic = v; render(); })),
      field(t('field.scale'), select(scaleOptions, ui.scaleId, (v) => { ui.scaleId = v; render(); })),
      h('div.play-bar', {}, [
        button(`▶ ${t('scales.playUp')}`, () => playScale('up')),
        button(`▶ ${t('scales.playDown')}`, () => playScale('down')),
        button(`▶ ${t('scales.playThirds')}`, playThirds),
        button(`■ ${t('stop')}`, () => audio.stopAll(), { class: 'btn-ghost' })
      ]),
      kv(t('formula'), sc.degrees.join(' ')),
      kv(t('scales.steps'), stepPattern(ui.scaleId, lang)),
      kv(t('notes'), sc.notes.map((n) => noteName(n, { lang: nl })).join(' · ')),
      h('p.muted.small', { text: pick(type.use) })
    ];

    // --- graus e notas ---
    const offs = scaleOffsets(ui.scaleId);
    const degreeRows = sc.notes.map((n, i) => ([
      h('strong', { text: sc.degrees[i] }),
      noteName(n, { lang: nl }),
      `${offs[i]}`,
      button('▶', () => audio.playNote(n, 0, 0.7), { class: 'btn-small', 'aria-label': t('play') })
    ]));
    const degreeTable = table(
      [lang === 'pt' ? 'Grau' : 'Degree', t('notes'), lang === 'pt' ? 'Semitons da tônica' : 'Semitones from tonic', ''],
      degreeRows
    );

    // --- acordes ---
    let chordBlock;
    if (HARMONIC_FIELD_SCALES.includes(ui.scaleId)) {
      const f = harmonicField(parseNote(`${ui.tonic}3`), ui.scaleId, { sevenths: false });
      const f7 = harmonicField(parseNote(`${ui.tonic}3`), ui.scaleId, { sevenths: true });
      chordBlock = table(
        [lang === 'pt' ? 'Grau' : 'Degree', lang === 'pt' ? 'Tríade' : 'Triad', lang === 'pt' ? 'Tétrade' : 'Seventh', ''],
        f.degrees.map((d, i) => ([
          h('strong', { text: d.roman }),
          chordSymbol(d.chord, { lang: nl }),
          chordSymbol(f7.degrees[i].chord, { lang: nl }),
          button('▶', () => audio.playChord(f7.degrees[i].notes.map(toMidi), { dur: 1.5 }), { class: 'btn-small', 'aria-label': t('play') })
        ]))
      );
    } else {
      const fits = chordsFittingScale(sc);
      chordBlock = h('div', {}, [
        h('p.muted.small', { text: t('scales.noChords') }),
        h('div.chip-row', {}, fits.slice(0, 24).map((ch) => h('button.chip', {
          type: 'button', text: chordSymbol(ch, { lang: nl }),
          onclick: () => audio.playChord(ch.notes.map(toMidi), { dur: 1.4 })
        })))
      ]);
    }

    // --- visualizações ---
    const marks = new Map();
    sc.notes.forEach((n, i) => marks.set(pitchClass(n), { label: sc.degrees[i], role: i === 0 ? 'root' : 'scale' }));

    const kb = h('div.viz-scroll', {}, [renderKeyboard({
      fromMidi: 48, toMidi: 79, pcMarks: marks, lang: nl, height: 84,
      onSelect: (midi) => audio.playMidi(midi, 0, 0.9)
    })]);

    const tuning = tuningById(ui.tuning);
    const fret = h('div.viz-scroll', {}, [renderFretboard({
      tuning, fromFret: 0, toFret: 12, marks, lang: nl, labelMode: 'degree',
      onSelect: (midi) => audio.playMidi(midi, 0, 0.9)
    })]);

    const staff = h('div.viz-scroll', {}, [renderStaff({
      notes: sc.notes.map((n) => [n]), clef: 'treble', lang: nl, duration: 'quarter', showNames: false
    })]);

    mount(root,
      sectionHead(t('scales.title'), t('scales.lead')),
      dash([
        card(3, t('field.scale'), controls),
        card(4, t('scales.degrees'), [degreeTable, staff], { scroll: 'md' }),
        card(5, t('scales.chords'), [chordBlock], { scroll: 'md' }),
        card(5, t('keyboard'), [kb]),
        card(7, t('fretboard'), [
          field(t('tuning'), select(TUNINGS.map((x) => ({ value: x.id, label: pick(x.names) })), ui.tuning,
            (v) => { ui.tuning = v; render(); })),
          fret
        ])
      ])
    );
  }

  render();
  return { element: root, refresh: render };
}
