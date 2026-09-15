/**
 * progressions.js — Montador de progressões harmônicas, com salvamento local.
 */

import { h, mount, dash, card, sectionHead, field, select, segmented, button, badge, kv, slider } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { noteLang, state } from '../state.js';
import { audio } from '../audio/audio.js';
import { parseNote, noteName, toMidi } from '../core/notes.js';
import { chordSymbol } from '../core/chords.js';
import { scaleType } from '../core/scales.js';
import {
  harmonicField, HARMONIC_FIELD_SCALES, FUNCTIONS, chordMotion,
  progressionsFor, secondaryDominant
} from '../core/harmony.js';
import { readList, writeList } from '../storage.js';
import { ROOT_OPTIONS } from './chordLibrary.js';

const STORE = 'progressions';

export function createProgressions() {
  const root = h('div.section-body');
  const ui = {
    tonic: 'C',
    scaleId: 'major',
    sevenths: false,
    items: [{ kind: 'degree', index: 0 }, { kind: 'degree', index: 5 }, { kind: 'degree', index: 3 }, { kind: 'degree', index: 4 }],
    rhythm: 'block',
    beats: 2,
    loop: false,
    playingIndex: -1,
    name: ''
  };
  let loopTimer = null;

  function field_() {
    return harmonicField(parseNote(`${ui.tonic}3`), ui.scaleId, { sevenths: ui.sevenths });
  }

  /** Acorde de um item da sequência, resolvido no campo harmônico atual. */
  function chordOf(f, item) {
    if (item.kind === 'secondary') {
      const sd = secondaryDominant(f, item.index);
      return sd ? { label: sd.label, notes: sd.chord.notes, chord: sd.chord, fn: 'dominant' } : null;
    }
    const d = f.degrees[item.index];
    if (!d) return null;
    return { label: d.roman, notes: d.notes, chord: d.chord, fn: d.fn, degree: d };
  }

  function stop() {
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    ui.loop = false;
    ui.playingIndex = -1;
    audio.stopAll();
    render();
  }

  function play() {
    const f = field_();
    const resolved = ui.items.map((it) => chordOf(f, it)).filter(Boolean);
    if (!resolved.length) return;
    audio.stopAll();

    const beat = 60 / audio.tempo;
    const spacing = beat * ui.beats;
    resolved.forEach((r, i) => {
      const midis = r.notes.map(toMidi).sort((a, b) => a - b);
      const when = i * spacing;
      if (ui.rhythm === 'arpeggio') {
        midis.forEach((m, k) => audio.playMidi(m, when + k * beat * 0.28, spacing * 0.85, 0.24));
      } else if (ui.rhythm === 'bass') {
        audio.playMidi(midis[0] - 12, when, spacing * 0.45, 0.3);
        midis.forEach((m) => audio.playMidi(m, when + spacing * 0.5, spacing * 0.45, 0.22));
      } else {
        const gain = Math.max(0.1, 0.32 - midis.length * 0.025);
        midis.forEach((m) => audio.playMidi(m, when, spacing * 0.92, gain));
      }
      setTimeout(() => { ui.playingIndex = i; paintSequence(); }, when * 1000);
    });

    const total = resolved.length * spacing;
    setTimeout(() => {
      if (!ui.loop) { ui.playingIndex = -1; paintSequence(); }
    }, total * 1000);
    if (ui.loop) loopTimer = setTimeout(play, total * 1000);
  }

  /** Redesenha só a fita de acordes (evita recriar a tela toda durante a reprodução). */
  let sequenceBox = null;
  function paintSequence() {
    if (!sequenceBox) return;
    const f = field_();
    const nl = noteLang();
    const lang = getLang();
    if (!ui.items.length) {
      mount(sequenceBox, h('p.empty-note', { text: t('prog.empty') }));
      return;
    }
    mount(sequenceBox, h('div.prog-strip', {}, ui.items.map((item, i) => {
      const r = chordOf(f, item);
      if (!r) return null;
      const fn = FUNCTIONS[r.fn];
      return h('div.prog-chip', { class: `${fn.color}${i === ui.playingIndex ? ' playing' : ''}` }, [
        h('span.prog-roman', { text: r.label }),
        h('span.prog-symbol', { text: chordSymbol(r.chord, { lang: nl }) }),
        h('span.prog-fn', { text: fn.abbr }),
        h('div.prog-actions', {}, [
          h('button.mini', { type: 'button', text: '◀', 'aria-label': t('prog.moveLeft'), onclick: () => moveItem(i, -1) }),
          h('button.mini', { type: 'button', text: '▶', 'aria-label': t('play'), onclick: () => audio.playChord(r.notes.map(toMidi), { dur: 1.5 }) }),
          h('button.mini', { type: 'button', text: '▶|', 'aria-label': t('prog.moveRight'), onclick: () => moveItem(i, 1) }),
          h('button.mini.danger', { type: 'button', text: '✕', 'aria-label': t('prog.remove'), onclick: () => { ui.items.splice(i, 1); render(); } })
        ])
      ]);
    })));
  }

  function moveItem(i, delta) {
    const j = i + delta;
    if (j < 0 || j >= ui.items.length) return;
    [ui.items[i], ui.items[j]] = [ui.items[j], ui.items[i]];
    render();
  }

  function saveCurrent() {
    const list = readList(STORE);
    const name = ui.name.trim() || `${ui.tonic} ${pick(scaleType(ui.scaleId).names)} — ${ui.items.length}`;
    list.unshift({
      name, tonic: ui.tonic, scaleId: ui.scaleId, sevenths: ui.sevenths,
      items: ui.items.map((x) => ({ ...x })), at: Date.now()
    });
    writeList(STORE, list.slice(0, 40));
    ui.name = '';
    render();
  }

  function render() {
    const lang = getLang();
    const nl = noteLang();
    const f = field_();

    // --- controles ---
    const controls = [
      h('div.controls-inline', {}, [
        field(t('field.key'), select(ROOT_OPTIONS.map((r) => ({ value: r, label: noteName(parseNote(r), { lang: nl }) })),
          ui.tonic, (v) => { ui.tonic = v; render(); })),
        field(t('field.scale'), select(HARMONIC_FIELD_SCALES.map((id) => ({ value: id, label: pick(scaleType(id).names) })),
          ui.scaleId, (v) => { ui.scaleId = v; render(); }))
      ]),
      field(t('showAs'), segmented([
        { value: 'triads', label: t('field.triads') },
        { value: 'sevenths', label: t('field.sevenths') }
      ], ui.sevenths ? 'sevenths' : 'triads', (v) => { ui.sevenths = v === 'sevenths'; render(); }, t('showAs'))),
      h('h4.sub-title', { text: t('prog.addFromField') }),
      h('div.degree-add', {}, f.degrees.map((d) => h('button.chip', {
        type: 'button', class: FUNCTIONS[d.fn].color,
        text: `${d.roman} · ${chordSymbol(d.chord, { lang: nl })}`,
        onclick: () => {
          ui.items.push({ kind: 'degree', index: d.index });
          audio.playChord(d.notes.map(toMidi), { dur: 1.2 });
          render();
        }
      }))),
      h('div.chip-row', {}, f.degrees.slice(1).map((d) => {
        const sd = secondaryDominant(f, d.index);
        if (!sd) return null;
        return h('button.chip', {
          type: 'button', text: sd.label,
          title: chordSymbol(sd.chord, { lang: nl }),
          onclick: () => { ui.items.push({ kind: 'secondary', index: d.index }); render(); }
        });
      }))
    ];

    // --- sequência ---
    sequenceBox = h('div.sequence-box');
    paintSequence();

    const romanLine = ui.items.map((it) => {
      const r = chordOf(f, it);
      return r ? r.label : '?';
    }).join(' – ');

    const playControls = [
      h('div.controls-inline', {}, [
        field(t('prog.rhythm'), segmented([
          { value: 'block', label: t('prog.rhythm.block') },
          { value: 'arpeggio', label: t('prog.rhythm.arpeggio') },
          { value: 'bass', label: t('prog.rhythm.bass') }
        ], ui.rhythm, (v) => { ui.rhythm = v; render(); }, t('prog.rhythm'))),
        field(t('prog.beats'), select([1, 2, 4].map((n) => ({ value: n, label: String(n) })), ui.beats,
          (v) => { ui.beats = parseInt(v, 10); render(); }))
      ]),
      slider(t('settings.tempo'), { min: 40, max: 200, step: 1, value: audio.tempo, format: (v) => `${v} BPM` },
        (v) => audio.setTempo(v)),
      h('div.play-bar', {}, [
        button(`▶ ${t('field.playProgression')}`, () => { ui.loop = false; play(); }),
        button(`↻ ${t('field.loop')}`, () => { ui.loop = true; play(); }),
        button(`■ ${t('stop')}`, stop, { class: 'btn-ghost' }),
        button(t('clear'), () => { ui.items = []; render(); }, { class: 'btn-ghost' })
      ])
    ];

    // --- sugestões ---
    const lastItem = ui.items[ui.items.length - 1];
    const suggestions = lastItem && lastItem.kind === 'degree'
      ? chordMotion(f, lastItem.index).next
      : f.degrees.slice(0, 4);
    const suggestionRow = h('div.chip-row', {}, suggestions.map((d) => h('button.chip', {
      type: 'button', text: `${d.roman} · ${chordSymbol(d.chord, { lang: nl })}`,
      onclick: () => { ui.items.push({ kind: 'degree', index: d.index }); audio.playChord(d.notes.map(toMidi), { dur: 1.2 }); render(); }
    })));

    // --- modelos ---
    const presets = h('div.chip-row', {}, progressionsFor(f).map((p) => h('button.chip', {
      type: 'button', text: pick(p.names), title: pick(p.note),
      onclick: () => { ui.items = p.degrees.map((i) => ({ kind: 'degree', index: i })); render(); }
    })));

    // --- salvos ---
    const nameInput = h('input.control', {
      type: 'text', placeholder: t('prog.nameIt'), value: ui.name,
      oninput: (e) => { ui.name = e.target.value; }
    });
    const saved = readList(STORE);
    const savedList = saved.length
      ? h('ul.saved-list', {}, saved.map((item, i) => h('li', {}, [
        h('span.saved-name', { text: item.name }),
        h('span.saved-meta', { text: `${noteName(parseNote(item.tonic), { lang: nl })} · ${item.items.length}` }),
        button(t('prog.load'), () => {
          ui.tonic = item.tonic;
          ui.scaleId = item.scaleId;
          ui.sevenths = !!item.sevenths;
          ui.items = item.items.map((x) => ({ ...x }));
          render();
        }, { class: 'btn-small' }),
        button('✕', () => {
          const list = readList(STORE);
          list.splice(i, 1);
          writeList(STORE, list);
          render();
        }, { class: 'btn-small btn-ghost', 'aria-label': t('prog.remove') })
      ])))
      : h('p.empty-note', { text: t('prog.noSaved') });

    mount(root,
      sectionHead(t('prog.title'), t('prog.lead')),
      dash([
        card(4, t('field.key'), controls, { scroll: 'lg' }),
        card(5, t('prog.sequence'), [
          sequenceBox,
          h('p.roman-line', {}, [h('code', { text: romanLine || '—' })]),
          ...playControls,
          h('h4.sub-title', { text: t('prog.suggestions') }),
          suggestionRow,
          h('h4.sub-title', { text: t('prog.presets') }),
          presets
        ]),
        card(3, t('prog.saved'), [
          h('div.controls-inline', {}, [field(t('prog.nameIt'), nameInput)]),
          button(t('prog.save'), saveCurrent, { class: 'btn-primary' }),
          savedList
        ], { scroll: 'md' })
      ])
    );
  }

  render();
  return { element: root, refresh: render, dispose: stop };
}
