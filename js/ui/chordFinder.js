/**
 * chordFinder.js — Seção "Construtor e identificador de acordes".
 */

import { h, mount, dash, card, sectionHead, field, select, button, badge, details, liveRegion, announce } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { noteLang, state } from '../state.js';
import { audio } from '../audio/audio.js';
import { midiToNote, noteName, toMidi, pitchClass, parseNote, sortByPitch } from '../core/notes.js';
import {
  identifyChords, explainResult, INVERSION_NAMES, buildChord, chordSymbol, allInversions
} from '../core/chords.js';
import { renderKeyboard } from '../view/keyboard.js';
import { renderStaff, autoClef } from '../view/staff.js';
import { ROOT_OPTIONS } from './chordLibrary.js';

export function createChordFinder() {
  const root = h('div.section-body');
  const live = liveRegion();
  const ui = {
    selected: [60, 64, 67, 70],   // Dó4 Mi4 Sol4 Si♭4
    forcedRoot: '',
    from: 48,
    to: 84
  };

  function toggleMidi(midi) {
    const i = ui.selected.indexOf(midi);
    if (i >= 0) ui.selected.splice(i, 1);
    else ui.selected.push(midi);
    ui.selected.sort((a, b) => a - b);
    audio.playMidi(midi, 0, 0.8);
    render();
  }

  /**
   * Grafia das notas selecionadas.
   * Primeiro tentamos a leitura mais provável: se o conjunto é um C7, faz
   * sentido escrever Si♭ e não Lá♯. Só caímos na grafia genérica quando
   * nenhuma leitura exata aparece.
   */
  function notes() {
    const raw = ui.selected.map((m) => midiToNote(m, state.preferFlats));
    if (raw.length < 3) return raw;
    const guess = identifyChords(raw, { limit: 1 });
    const best = guess.results[0];
    if (!best || !best.exact) return raw;
    const model = buildChord(best.rootNote, best.typeId);
    return ui.selected.map((m, i) => {
      const spelled = model.notes.find((n) => pitchClass(n) === ((m % 12) + 12) % 12);
      return spelled ? { ...spelled, octave: spelled.octave + Math.floor((m - toMidi(spelled)) / 12) } : raw[i];
    });
  }

  function render() {
    const lang = getLang();
    const nl = noteLang();
    const sel = notes();

    const marks = new Map();
    ui.selected.forEach((m, i) => marks.set(m, { role: i === 0 ? 'root' : 'chord', label: '' }));

    const kb = h('div.viz-scroll', {}, [renderKeyboard({
      fromMidi: ui.from, toMidi: ui.to, marks, lang: nl, onSelect: toggleMidi, height: 104
    })]);

    // Botões de nota (alternativa acessível ao teclado gráfico)
    const octaveButtons = h('div.note-buttons', {}, [3, 4, 5].map((oct) => h('div.note-row', {}, [
      h('span.note-row-label', { text: `${lang === 'pt' ? 'Oitava' : 'Octave'} ${oct}` }),
      ...ROOT_OPTIONS.filter((r) => !r.endsWith('b')).map((r) => {
        const midi = toMidi(parseNote(`${r}${oct}`));
        const on = ui.selected.includes(midi);
        return h('button.note-btn', {
          type: 'button', class: on ? 'on' : '', 'aria-pressed': on ? 'true' : 'false',
          text: noteName(parseNote(r), { lang: nl }),
          onclick: () => toggleMidi(midi)
        });
      })
    ])));

    const selectedList = sel.length
      ? h('div.chip-row', {}, sel.map((n) => h('button.chip', {
        type: 'button', text: noteName(n, { lang: nl, octave: true }),
        'aria-label': `${lang === 'pt' ? 'Remover' : 'Remove'} ${noteName(n, { lang: nl, octave: true })}`,
        onclick: () => toggleMidi(toMidi(n))
      })))
      : h('p.empty-note', { text: t('finder.empty') });

    const playBar = h('div.play-bar', {}, [
      button(`▶ ${t('finder.simultaneous')}`, () => audio.playChord([...ui.selected], { dur: 2 })),
      button(`▶ ${t('finder.sequence')}`, () => audio.playSequence([...ui.selected], { stepSeconds: 0.5 })),
      button(t('clear'), () => { ui.selected = []; render(); }, { class: 'btn-ghost' }),
      button(`■ ${t('stop')}`, () => audio.stopAll(), { class: 'btn-ghost' })
    ]);

    const rootOptions = [{ value: '', label: t('finder.auto') },
      ...ROOT_OPTIONS.map((r) => ({ value: r, label: noteName(parseNote(r), { lang: nl }) }))];

    const rootField = field(t('finder.forceRoot'),
      select(rootOptions, ui.forcedRoot, (v) => { ui.forcedRoot = v; render(); }));

    // --- identificação ---
    let resultsBlock;
    if (sel.length < 3) {
      resultsBlock = h('p.empty-note', { text: t('finder.empty') });
    } else {
      const forced = ui.forcedRoot ? parseNote(`${ui.forcedRoot}${sortByPitch(sel)[0].octave}`) : null;
      const { results, warning } = identifyChords(sel, { forcedRoot: forced });
      const warn = warning ? h(`p.notice.notice-${warning === 'noMatch' ? 'warn' : 'info'}`, { text: t(`finder.warn.${warning}`) }) : null;
      resultsBlock = h('div', {}, [
        warn,
        h('div.results-grid', {}, results.map((r) => {
          const chord = buildChord(r.rootNote, r.typeId);
          const pct = Math.round(r.score * 100);
          const invName = pick(INVERSION_NAMES[Math.min(r.inversion, INVERSION_NAMES.length - 1)]);
          return h('article.result-card', {}, [
            h('div.result-head', {}, [
              h('div.result-symbol', { text: chordSymbol(chord, { lang: nl }) }),
              h('div.result-info', {}, [
                h('p.result-name', { text: `${noteName(r.rootNote, { lang: nl })} ${pick(r.type.names)}` }),
                h('p.result-formula', {}, [h('code', { text: r.type.formula.join(' - ') })]),
                h('p.result-inv', { text: invName })
              ]),
              h('div.result-score', {}, [
                h('div.score-bar', { 'aria-hidden': 'true' }, [h('div.score-fill', { style: `width:${pct}%` })]),
                h('span.score-text', { text: `${pct}% ${t('finder.match')}` }),
                r.exact ? badge(t('finder.exact'), 'badge-ok') : null,
                r.missing.length ? badge(`${t('finder.missing')}: ${r.missing.join(', ')}`, 'badge-warn') : null,
                r.extra.length ? badge(`${r.extra.length} ${t('finder.extra')}`, 'badge-warn') : null
              ])
            ]),
            h('div.result-actions', {}, [
              button('▶', () => audio.playChord(sortByPitch(chord.notes).map(toMidi), { dur: 1.8 }), { class: 'btn-small', 'aria-label': t('play') }),
              details(t('finder.why'), [
                h('ul.why-list', {}, explainResult(r, lang).lines.map((line) => h('li', { text: line }))),
                h('p.why-inversions', { text: lang === 'pt' ? 'Inversões possíveis:' : 'Possible inversions:' }),
                h('div.chip-row', {}, allInversions(chord).map((inv) => h('button.chip', {
                  type: 'button',
                  text: `${pick(inv.name)} — ${inv.notes.map((n) => noteName(n, { lang: nl })).join(' ')}`,
                  onclick: () => audio.playChord(inv.notes.map(toMidi), { arpeggio: true, dur: 1.4 })
                })))
              ])
            ])
          ]);
        }))
      ]);
      announce(live, results.length ? `${results.length} ${lang === 'pt' ? 'leituras encontradas' : 'readings found'}` : t('finder.warn.noMatch'));
    }

    const staffWrap = sel.length
      ? h('div.viz-scroll', {}, [renderStaff({ notes: [sel], clef: autoClef([sel]), lang: nl, duration: 'whole' })])
      : null;

    mount(root,
      sectionHead(t('finder.title'), t('finder.lead')),
      live,
      dash([
        card(7, t('finder.selected'), [kb, octaveButtons, selectedList, playBar, rootField]),
        card(5, t('staff'), [staffWrap || h('p.empty-note', { text: t('finder.empty') })]),
        card(12, t('finder.results'), [resultsBlock])
      ])
    );
  }

  render();
  return { element: root, refresh: render };
}
