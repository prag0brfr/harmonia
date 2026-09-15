/**
 * transpose.js (ui) — Transposição de notas, acordes e progressões.
 */

import { h, mount, dash, card, sectionHead, field, select, segmented, button, badge, kv, table } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { noteLang, state } from '../state.js';
import { audio } from '../audio/audio.js';
import { parseNote, noteName, toMidi } from '../core/notes.js';
import { intervalSemitones } from '../core/intervals.js';
import {
  intervalForKeyChange, intervalForSemitones, transposeLine, readLine,
  tokenMidis, describeShift, transposeNoteByInterval
} from '../core/transpose.js';
import { buildScale, SCALE_TYPES } from '../core/scales.js';
import { renderStaff, autoClef } from '../view/staff.js';
import { ROOT_OPTIONS } from './chordLibrary.js';

const SEMITONE_CHOICES = Array.from({ length: 25 }, (_, i) => i - 12);

export function createTranspose() {
  const root = h('div.section-body');
  const ui = {
    text: 'C | Am7 | F | G7',
    mode: 'key',
    from: 'C',
    to: 'Eb',
    semitones: 2,
    scaleId: 'major'
  };

  /** Intervalo e direção correspondentes ao modo escolhido. */
  function shift() {
    if (ui.mode === 'key') {
      const from = parseNote(ui.from);
      const to = parseNote(ui.to);
      return { iv: intervalForKeyChange(from, to), dir: 1 };
    }
    const dir = ui.semitones >= 0 ? 1 : -1;
    const abs = Math.abs(ui.semitones);
    return { iv: intervalForSemitones(abs % 12), dir, octaves: Math.floor(abs / 12) };
  }

  function playLine(tokens, octave = 3) {
    const chords = tokens.map((x) => (x.chord ? tokenMidis(x.chord, octave) : null)).filter(Boolean);
    if (!chords.length) return;
    audio.playProgression(chords, { beatsPerChord: 2 });
  }

  function render() {
    const lang = getLang();
    const nl = noteLang();
    const { iv, dir } = shift();
    const original = readLine(ui.text);
    const moved = transposeLine(ui.text, iv, dir, { lang: nl });

    const textArea = h('textarea.control.code-input', {
      rows: '3', spellcheck: 'false',
      oninput: (e) => { ui.text = e.target.value; renderResult(); }
    });
    textArea.value = ui.text;

    const controls = [
      field(t('transpose.mode'), segmented([
        { value: 'key', label: t('transpose.byKey') },
        { value: 'semis', label: t('transpose.bySemitones') }
      ], ui.mode, (v) => { ui.mode = v; render(); }, t('transpose.mode'))),
      ui.mode === 'key'
        ? h('div.controls-inline', {}, [
          field(t('transpose.from'), select(ROOT_OPTIONS.map((r) => ({ value: r, label: noteName(parseNote(r), { lang: nl }) })),
            ui.from, (v) => { ui.from = v; render(); })),
          field(t('transpose.to'), select(ROOT_OPTIONS.map((r) => ({ value: r, label: noteName(parseNote(r), { lang: nl }) })),
            ui.to, (v) => { ui.to = v; render(); }))
        ])
        : field(t('transpose.amount'), select(
          SEMITONE_CHOICES.map((n) => ({ value: n, label: n > 0 ? `+${n}` : String(n) })),
          ui.semitones, (v) => { ui.semitones = parseInt(v, 10); render(); }
        )),
      field(t('transpose.input'), textArea, t('transpose.inputHint')),
      kv(t('transpose.shift'), describeShift(iv, dir, lang)),
      h('div.play-bar', {}, [
        button(`▶ ${t('transpose.playOriginal')}`, () => playLine(original)),
        button(`▶ ${t('transpose.playResult')}`, () => playLine(moved.tokens)),
        button(`■ ${t('stop')}`, () => audio.stopAll(), { class: 'btn-ghost' })
      ])
    ];

    const resultBox = h('div');

    function renderResult() {
      const { iv: iv2, dir: dir2 } = shift();
      const before = readLine(ui.text).filter((x) => x.text.trim() && x.text !== '|');
      const after = transposeLine(ui.text, iv2, dir2, { lang: nl }).tokens
        .filter((x) => x.text.trim() && x.text !== '|');

      const rows = before.map((b, i) => ([
        h('strong', { text: b.text }),
        h('span.arrow', { text: '→' }),
        b.chord
          ? h('strong.result-chord', { text: after[i] ? after[i].text : '?' })
          : badge(t('transpose.unknown'), 'badge-warn'),
        b.chord
          ? button('▶', () => {
            const midis = tokenMidis(after[i].chord, 3);
            if (midis) audio.playChord(midis, { dur: 1.6 });
          }, { class: 'btn-small', 'aria-label': t('play') })
          : ''
      ]));

      mount(resultBox, table(
        [t('transpose.original'), '', t('transpose.result'), ''],
        rows
      ));
    }
    renderResult();

    // Escala transposta lado a lado
    const scaleFrom = buildScale(parseNote(ui.mode === 'key' ? `${ui.from}4` : 'C4'), ui.scaleId);
    const scaleTo = {
      notes: scaleFrom.notes.map((n) => {
        const moved2 = transposeNoteByInterval(n, iv, dir);
        return moved2;
      })
    };

    const scaleBlock = [
      field(t('field.scale'), select(
        SCALE_TYPES.filter((x) => x.formula.length === 7).map((x) => ({ value: x.id, label: pick(x.names) })),
        ui.scaleId, (v) => { ui.scaleId = v; render(); }
      )),
      kv(t('transpose.original'), scaleFrom.notes.map((n) => noteName(n, { lang: nl })).join(' ')),
      kv(t('transpose.result'), scaleTo.notes.map((n) => noteName(n, { lang: nl })).join(' ')),
      h('div.play-bar', {}, [
        button(`▶ ${t('transpose.original')}`, () => audio.playSequence(scaleFrom.notes.map(toMidi), { stepSeconds: 0.3 })),
        button(`▶ ${t('transpose.result')}`, () => audio.playSequence(scaleTo.notes.map(toMidi), { stepSeconds: 0.3 }))
      ]),
      h('div.viz-scroll', {}, [renderStaff({
        notes: scaleTo.notes.map((n) => [n]), clef: 'treble', lang: nl, duration: 'quarter', showNames: false
      })])
    ];

    mount(root,
      sectionHead(t('transpose.title'), t('transpose.lead')),
      dash([
        card(4, t('transpose.mode'), controls),
        card(4, t('transpose.result'), [resultBox], { scroll: 'md' }),
        card(4, t('transpose.scaleToo'), scaleBlock)
      ])
    );
  }

  render();
  return { element: root, refresh: render };
}
