/**
 * harmonicField.js — Seção "Campo harmônico".
 */

import { h, mount, dash, card, sectionHead, field, select, segmented, button, badge, table } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { noteLang, state } from '../state.js';
import { audio } from '../audio/audio.js';
import { parseNote, noteName, toMidi, pitchClass } from '../core/notes.js';
import { chordSymbol } from '../core/chords.js';
import { scaleType, stepPattern, SCALE_TYPES } from '../core/scales.js';
import {
  harmonicField, HARMONIC_FIELD_SCALES, FUNCTIONS, chordMotion,
  progressionsFor, realizeProgression, romanLine, substitutesFor, secondaryDominant
} from '../core/harmony.js';
import { renderStaff, keySignatureFor } from '../view/staff.js';
import { renderFretboard, TUNINGS, tuningById } from '../view/fretboard.js';
import { renderKeyboard } from '../view/keyboard.js';
import { ROOT_OPTIONS } from './chordLibrary.js';

export function createHarmonicField() {
  const root = h('div.section-body');
  const ui = {
    tonic: 'C',
    scaleId: 'major',
    sevenths: false,
    selected: 0,
    loop: false
  };
  let loopTimer = null;

  function field_() {
    return harmonicField(parseNote(`${ui.tonic}4`), ui.scaleId, { sevenths: ui.sevenths });
  }

  function playChordOf(deg) {
    audio.playChord(deg.notes.map(toMidi), { dur: 1.8 });
  }

  function playProgression(f, indexes) {
    audio.stopAll();
    const chords = realizeProgression(f, indexes).map((d) => d.notes.map(toMidi));
    const total = audio.playProgression(chords, { beatsPerChord: 2, arpeggio: false });
    if (loopTimer) clearTimeout(loopTimer);
    if (ui.loop) {
      loopTimer = setTimeout(() => playProgression(f, indexes), total * 1000);
    }
  }

  function stop() {
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    ui.loop = false;
    audio.stopAll();
  }

  function render() {
    const lang = getLang();
    const nl = noteLang();
    const f = field_();
    const sel = f.degrees[Math.min(ui.selected, f.degrees.length - 1)];

    const scaleOptions = HARMONIC_FIELD_SCALES.map((id) => ({
      value: id, label: pick(scaleType(id).names)
    }));

    const controls = h('div.controls-grid', {}, [
      field(t('field.key'), select(ROOT_OPTIONS.map((r) => ({ value: r, label: noteName(parseNote(r), { lang: nl }) })), ui.tonic, (v) => { ui.tonic = v; render(); })),
      field(t('field.scale'), select(scaleOptions, ui.scaleId, (v) => { ui.scaleId = v; ui.selected = 0; render(); })),
      field(t('showAs'), segmented([
        { value: 'triads', label: t('field.triads') },
        { value: 'sevenths', label: t('field.sevenths') }
      ], ui.sevenths ? 'sevenths' : 'triads', (v) => { ui.sevenths = v === 'sevenths'; render(); }, t('showAs')))
    ]);

    // --- escala ---
    const scaleInfo = h('div.scale-info', {}, [
      h('p', {}, [
        h('span.label', { text: `${t('field.scaleNotes')}: ` }),
        h('strong', { text: f.scale.notes.map((n) => noteName(n, { lang: nl })).join(' · ') })
      ]),
      h('p', {}, [
        h('span.label', { text: `${t('field.stepPattern')}: ` }),
        h('code', { text: stepPattern(ui.scaleId, lang) })
      ]),
      h('p.muted', { text: pick(scaleType(ui.scaleId).use) }),
      h('div.play-bar', {}, [
        button(`▶ ${lang === 'pt' ? 'Tocar escala' : 'Play scale'}`, () => {
          const midis = f.scale.notes.map(toMidi);
          audio.playSequence([...midis, midis[0] + 12], { stepSeconds: 0.38 });
        }),
        button(`■ ${t('stop')}`, stop, { class: 'btn-ghost' })
      ])
    ]);

    // --- grade de graus ---
    const grid = h('div.degree-grid', {}, f.degrees.map((d) => {
      const fn = FUNCTIONS[d.fn];
      const active = d.index === sel.index;
      return h('button.degree-card', {
        type: 'button', class: `${fn.color}${active ? ' active' : ''}`,
        'aria-pressed': active ? 'true' : 'false',
        onclick: () => { ui.selected = d.index; playChordOf(d); render(); }
      }, [
        h('span.degree-roman', { text: d.roman }),
        h('span.degree-symbol', { text: chordSymbol(d.chord, { lang: nl }) }),
        h('span.degree-fn', { text: fn.abbr }),
        h('span.degree-notes', { text: d.notes.map((n) => noteName(n, { lang: nl })).join(' ') })
      ]);
    }));

    // --- tabela ---
    const rows = f.degrees.map((d) => ([
      h('strong', { text: d.roman }),
      chordSymbol(d.chord, { lang: nl }),
      pick(d.type.names),
      h('code', { text: d.formula }),
      d.notes.map((n) => noteName(n, { lang: nl })).join(' '),
      pick(FUNCTIONS[d.fn]),
      button('▶', () => playChordOf(d), { class: 'btn-small', 'aria-label': t('play') })
    ]));
    const degreeTable = table(
      [lang === 'pt' ? 'Grau' : 'Degree', lang === 'pt' ? 'Cifra' : 'Symbol',
        lang === 'pt' ? 'Qualidade' : 'Quality', t('formula'), t('notes'), t('field.function'), ''],
      rows
    );

    // --- detalhe do grau selecionado ---
    const motion = chordMotion(f, sel.index);
    const subs = substitutesFor(f, sel.index);
    const secDom = secondaryDominant(f, sel.index);
    const fn = FUNCTIONS[sel.fn];

    const chipList = (list) => h('div.chip-row', {}, list.map((d) => h('button.chip', {
      type: 'button', text: `${d.roman} (${chordSymbol(d.chord, { lang: nl })})`,
      onclick: () => { ui.selected = d.index; playChordOf(d); render(); }
    })));

    const keySig = keySignatureFor(f.tonic, ui.scaleId.toLowerCase().includes('minor') || ui.scaleId === 'aeolian' ? 'minor' : 'major');
    const detail = h('div.degree-detail', {}, [
      h('div.detail-head', {}, [
        h('h4', { text: `${sel.roman} — ${chordSymbol(sel.chord, { lang: nl })}` }),
        badge(pick(fn), fn.color),
        button(`▶ ${t('play')}`, () => playChordOf(sel), { class: 'btn-small' })
      ]),
      h('p.muted', { text: pick(fn.desc) }),
      h('p', {}, [h('span.label', { text: `${t('notes')}: ` }), h('strong', { text: sel.notes.map((n) => noteName(n, { lang: nl, octave: true })).join(' · ') })]),
      h('p', {}, [h('span.label', { text: `${t('formula')}: ` }), h('code', { text: sel.formula })]),
      h('div.viz-scroll', {}, [renderStaff({ notes: [sel.notes], clef: 'treble', keySignature: keySig, lang: nl, duration: 'whole' })]),
      h('h5.sub-title', { text: t('field.comesAfter') }),
      chipList(motion.prev),
      h('h5.sub-title', { text: t('field.goesTo') }),
      chipList(motion.next),
      h('h5.sub-title', { text: t('field.substitutes') }),
      h('div.chip-row', {}, subs.map((s) => h('span.chip.static', {
        text: `${s.degree.roman} (${s.shared} ${lang === 'pt' ? 'notas em comum' : 'shared notes'})`
      }))),
      secDom ? h('p', {}, [
        h('span.label', { text: `${t('field.secondaryDominant')}: ` }),
        h('strong', { text: `${secDom.label} = ${chordSymbol(secDom.chord, { lang: nl })}` }),
        button('▶', () => audio.playChord(secDom.chord.notes.map(toMidi), { dur: 1.6 }), { class: 'btn-small', 'aria-label': t('play') })
      ]) : null
    ]);

    // --- progressões ---
    const progs = progressionsFor(f);
    const progList = h('div.prog-list', {}, progs.map((p) => h('div.prog-item', {}, [
      h('div.prog-head', {}, [
        h('strong', { text: pick(p.names) }),
        h('span.muted', { text: realizeProgression(f, p.degrees).map((d) => chordSymbol(d.chord, { lang: nl })).join(' – ') })
      ]),
      h('p.muted.small', { text: pick(p.note) }),
      h('div.play-bar', {}, [
        button(`▶ ${t('field.playProgression')}`, () => { ui.loop = false; playProgression(f, p.degrees); }),
        button(`↻ ${t('field.loop')}`, () => { ui.loop = true; playProgression(f, p.degrees); }),
        button(`■ ${t('stop')}`, stop, { class: 'btn-ghost' })
      ])
    ])));

    // --- braço e teclado com a escala ---
    const marks = new Map();
    f.scale.notes.forEach((n, i) => marks.set(pitchClass(n), { label: f.scale.degrees[i], role: i === 0 ? 'root' : 'scale' }));
    sel.notes.forEach((n) => {
      const pc = pitchClass(n);
      const prev = marks.get(pc);
      marks.set(pc, { label: prev ? prev.label : '', role: pitchClass(sel.root) === pc ? 'root' : 'chord' });
    });
    const tuning = tuningById(state.tuning || 'standard');
    const fretWrap = h('div.viz-scroll', {}, [renderFretboard({
      tuning, fromFret: 0, toFret: 12, marks, lang: nl, labelMode: 'degree',
      onSelect: (midi) => audio.playMidi(midi, 0, 1)
    })]);
    const kbWrap = h('div.viz-scroll', {}, [renderKeyboard({
      fromMidi: 48, toMidi: 84, pcMarks: marks, lang: nl, onSelect: (midi) => audio.playMidi(midi, 0, 1)
    })]);

    mount(root,
      sectionHead(t('field.title'), t('field.lead')),
      dash([
        card(3, t('field.key'), [controls, scaleInfo], { scroll: 'md' }),
        card(5, t('field.triads'), [grid, degreeTable], { scroll: 'md' }),
        card(4, `${sel.roman} — ${chordSymbol(sel.chord, { lang: nl })}`, [detail], { scroll: 'md' }),
        card(5, t('field.progressions'), [progList], { scroll: 'md' }),
        card(7, t('fretboard'), [fretWrap, kbWrap], { scroll: 'md' })
      ])
    );
  }

  render();
  return { element: root, refresh: render, dispose: stop };
}
