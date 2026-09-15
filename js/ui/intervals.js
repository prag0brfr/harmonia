/**
 * intervals.js (ui) — Calculadora de intervalos.
 */

import { h, mount, dash, card, sectionHead, field, select, button, badge, kv } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { noteLang, state } from '../state.js';
import { audio } from '../audio/audio.js';
import { parseNote, noteName, toMidi, freq, pitchClass, cents, justFreq } from '../core/notes.js';
import {
  intervalBetween, intervalName, intervalAbbr, invertInterval, simpleInterval,
  isCompound, intervalKey, INTERVAL_NOTES, QUALITY_NAMES
} from '../core/intervals.js';
import { ratioApprox } from '../view/interference.js';
import { renderStaff, autoClef } from '../view/staff.js';
import { renderFretboard, tuningById } from '../view/fretboard.js';
import { renderKeyboard } from '../view/keyboard.js';
import { ROOT_OPTIONS } from './chordLibrary.js';

const OCTAVES = [2, 3, 4, 5, 6];

/** Atalhos usuais, em semitons a partir da primeira nota. */
const QUICK = [
  { semis: 1, key: 'm2' }, { semis: 2, key: 'M2' }, { semis: 3, key: 'm3' }, { semis: 4, key: 'M3' },
  { semis: 5, key: 'P4' }, { semis: 6, key: 'A4' }, { semis: 7, key: 'P5' }, { semis: 8, key: 'm6' },
  { semis: 9, key: 'M6' }, { semis: 10, key: 'm7' }, { semis: 11, key: 'M7' }, { semis: 12, key: 'P8' }
];

export function createIntervals() {
  const root = h('div.section-body');
  const ui = { a: { note: 'C', octave: 4 }, b: { note: 'G', octave: 4 } };

  const noteOf = (side) => parseNote(`${ui[side].note}${ui[side].octave}`);

  function sideControls(side, label) {
    const nl = noteLang();
    const s = ui[side];
    return h('div.controls-inline', {}, [
      field(label, select(ROOT_OPTIONS.map((r) => ({ value: r, label: noteName(parseNote(r), { lang: nl }) })),
        s.note, (v) => { s.note = v; render(); })),
      field(t('octave'), select(OCTAVES.map((o) => ({ value: o, label: String(o) })), s.octave,
        (v) => { s.octave = parseInt(v, 10); render(); }))
    ]);
  }

  function render() {
    const lang = getLang();
    const nl = noteLang();
    const a = noteOf('a');
    const b = noteOf('b');
    const iv = intervalBetween(a, b);
    const simple = simpleInterval(iv);
    const inv = invertInterval(iv);
    const fa = freq(a, state.a4);
    const fb = freq(b, state.a4);
    const lo = Math.min(fa, fb);
    const hi = Math.max(fa, fb);
    const ratio = ratioApprox(lo, hi);
    const note = INTERVAL_NOTES[intervalKey(iv)];
    const semis = Math.abs(iv.semitones);

    const quality = QUALITY_NAMES[iv.quality];
    const classification = [
      isCompound(iv) ? t('intervals.compound') : t('intervals.simple'),
      pick(quality)
    ].join(' · ');

    const quickRow = h('div.chip-row', {}, QUICK.map((q) => h('button.chip', {
      type: 'button', text: q.key,
      title: pick(INTERVAL_NOTES[q.key] || {}),
      onclick: () => {
        const target = toMidi(a) + q.semis;
        const pc = ((target % 12) + 12) % 12;
        ui.b.note = ROOT_OPTIONS.find((r) => pitchClass(parseNote(`${r}4`)) === pc) || 'C';
        ui.b.octave = Math.floor(target / 12) - 1;
        render();
      }
    })));

    const controls = [
      sideControls('a', t('intervals.first')),
      sideControls('b', t('intervals.second')),
      h('div.play-bar', {}, [
        button(`▶ ${t('intervals.ascending')}`, () => audio.playSequence([Math.min(toMidi(a), toMidi(b)), Math.max(toMidi(a), toMidi(b))], { stepSeconds: 0.7 })),
        button(`▶ ${t('intervals.descending')}`, () => audio.playSequence([Math.max(toMidi(a), toMidi(b)), Math.min(toMidi(a), toMidi(b))], { stepSeconds: 0.7 })),
        button(`▶ ${t('intervals.together')}`, () => audio.playChord([toMidi(a), toMidi(b)], { dur: 2 })),
        button(`■ ${t('stop')}`, () => audio.stopAll(), { class: 'btn-ghost' })
      ]),
      button(`⇅ ${t('intervals.swap')}`, () => {
        const tmp = ui.a;
        ui.a = ui.b;
        ui.b = tmp;
        render();
      }, { class: 'btn-small' }),
      h('h4.sub-title', { text: t('intervals.quickPick') }),
      quickRow
    ];

    const results = [
      h('div.big-answer', {}, [
        h('span.big-answer-value', { text: intervalName(iv, lang) }),
        h('span.big-answer-sub', { text: `${intervalAbbr(iv, lang)} · ${semis} ${t('semitones')}` })
      ]),
      kv(t('intervals.classification'), classification),
      kv(t('intervals.inversionOf'), `${intervalName(inv, lang)} (${intervalAbbr(inv, lang)})`),
      isCompound(iv) ? kv(lang === 'pt' ? 'Intervalo simples' : 'Simple form', `${intervalName(simple, lang)} (${intervalAbbr(simple, lang)})`) : null,
      kv(`${t('frequency')} A`, `${fa.toFixed(2)} Hz`),
      kv(`${t('frequency')} B`, `${fb.toFixed(2)} Hz`),
      kv(t('ratio'), `${ratio.num} : ${ratio.den}  (${(ratio.error * 100).toFixed(2)}%)`),
      kv(lang === 'pt' ? 'Desvio da afinação justa' : 'Deviation from just intonation',
        `${cents(justFreq(lo, semis % 12) * Math.pow(2, Math.floor(semis / 12)), hi).toFixed(1)} cents`),
      note ? h('p.muted.small', { text: pick(note) }) : null,
      h('p.muted.small', { text: t('intervals.melodicVsHarmonic') })
    ];

    const staff = h('div.viz-scroll', {}, [renderStaff({
      notes: [[a], [b], [a, b]], clef: autoClef([[a, b]]), lang: nl, duration: 'half'
    })]);

    const marks = new Map();
    marks.set(pitchClass(a), { label: '1', role: 'root' });
    marks.set(pitchClass(b), { label: intervalAbbr(simple, lang), role: 'chord' });

    const fret = h('div.viz-scroll', {}, [renderFretboard({
      tuning: tuningById(state.tuning || 'standard'), fromFret: 0, toFret: 12, marks, lang: nl,
      labelMode: 'note', onSelect: (midi) => audio.playMidi(midi, 0, 0.9)
    })]);

    const kb = h('div.viz-scroll', {}, [renderKeyboard({
      fromMidi: 48, toMidi: 84, marks: new Map([[toMidi(a), { role: 'root', label: '1' }], [toMidi(b), { role: 'chord', label: intervalAbbr(simple, lang) }]]),
      lang: nl, height: 84, onSelect: (midi) => audio.playMidi(midi, 0, 0.9)
    })]);

    mount(root,
      sectionHead(t('intervals.title'), t('intervals.lead')),
      dash([
        card(4, t('intervals.first') + ' · ' + t('intervals.second'), controls),
        card(4, t('intervals.name'), results, { scroll: 'md' }),
        card(4, t('staff'), [staff, kb]),
        card(12, t('fretboard'), [fret])
      ])
    );
  }

  render();
  return { element: root, refresh: render };
}
