/**
 * earTraining.js — Exercícios de treinamento auditivo.
 *
 * As questões vêm de core/training.js (puras e testáveis); aqui só tocamos
 * o áudio, mostramos as alternativas e guardamos o histórico localmente.
 */

import { h, mount, dash, card, sectionHead, field, select, segmented, button, badge, kv, liveRegion, announce } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { noteLang } from '../state.js';
import { audio } from '../audio/audio.js';
import { EXERCISES, LEVELS, makeQuestion, summarize } from '../core/training.js';
import { readList, writeList, read, write } from '../storage.js';

const HISTORY = 'training';

export function createEarTraining() {
  const root = h('div.section-body');
  const live = liveRegion();
  const ui = {
    exercise: read('trainingExercise') || 'interval',
    level: read('trainingLevel') || 'easy',
    question: null,
    attempts: [],
    revealed: false,
    solved: false
  };

  /**
   * Sorteia uma questão. `autoPlay` fica desligado na primeira, porque o
   * navegador só libera áudio depois de um gesto do usuário.
   */
  function newQuestion(autoPlay = true) {
    ui.question = makeQuestion(ui.exercise, ui.level, { noteLang: noteLang() });
    ui.attempts = [];
    ui.revealed = false;
    ui.solved = false;
    render();
    if (autoPlay) window.setTimeout(playQuestion, 120);
  }

  function playQuestion() {
    const q = ui.question;
    if (!q) return;
    audio.stopAll();
    if (q.play.mode === 'chord') {
      audio.playChord(q.play.midis, { dur: 2.2 });
    } else if (q.play.mode === 'progression') {
      audio.playProgression(q.play.chords, { beatsPerChord: q.play.beatsPerChord || 2 });
    } else if (q.play.chordFirst) {
      // Toca o acorde de tônica e, depois, a nota da pergunta.
      audio.playChord(q.play.chordFirst, { dur: 1.2 });
      const last = q.play.midis[q.play.midis.length - 1];
      audio.playMidi(last, 1.5, 1.2);
    } else {
      audio.playSequence(q.play.midis, { stepSeconds: q.play.stepSeconds || 0.7 });
    }
  }

  function answer(optionId) {
    if (ui.solved || ui.revealed) return;
    const correct = optionId === ui.question.answerId;
    ui.attempts.push({ optionId, correct });
    if (correct) {
      ui.solved = true;
      record(true, ui.attempts.length);
      announce(live, t('training.correct'));
    } else {
      announce(live, t('training.wrong'));
    }
    render();
  }

  function reveal() {
    if (ui.solved) return;
    ui.revealed = true;
    record(false, ui.attempts.length);
    render();
  }

  function record(correct, attempts) {
    const history = readList(HISTORY);
    history.unshift({ exercise: ui.exercise, level: ui.level, correct, attempts, at: Date.now() });
    writeList(HISTORY, history.slice(0, 400));
  }

  function optionLabel(opt) {
    const lang = getLang();
    return opt.label[lang] || opt.label.pt;
  }

  function render() {
    const lang = getLang();
    const q = ui.question;
    const stats = summarize(readList(HISTORY));

    const controls = [
      field(t('training.exercise'), select(EXERCISES.map((e) => ({ value: e.id, label: pick(e.names) })),
        ui.exercise, (v) => {
          ui.exercise = v;
          write('trainingExercise', v);
          newQuestion(false);
        })),
      field(t('training.level'), segmented(LEVELS.map((l) => ({ value: l.id, label: pick(l.names) })),
        ui.level, (v) => {
          ui.level = v;
          write('trainingLevel', v);
          newQuestion(false);
        }, t('training.level'))),
      h('p.muted.small', { text: pick(EXERCISES.find((e) => e.id === ui.exercise).desc) })
    ];

    const statsBlock = [
      kv(t('training.score'), `${stats.correct} / ${stats.total}`),
      kv(t('training.accuracy'), `${Math.round(stats.accuracy * 100)}%`),
      kv(t('training.recent'), `${Math.round(stats.recentAccuracy * 100)}%`),
      kv(t('training.streak'), String(stats.streak)),
      h('div.progress-track', { 'aria-hidden': 'true' }, [
        h('div.progress-fill', { style: `width:${Math.round(stats.recentAccuracy * 100)}%` })
      ]),
      h('h4.sub-title', { text: t('training.byExercise') }),
      stats.total
        ? h('ul.stat-list', {}, Object.entries(stats.byExercise).map(([id, v]) => {
          const ex = EXERCISES.find((e) => e.id === id);
          return h('li', {}, [
            h('span', { text: ex ? pick(ex.names) : id }),
            h('span.muted', { text: `${v.correct}/${v.total}` })
          ]);
        }))
        : h('p.empty-note', { text: t('training.noHistory') }),
      button(t('training.reset'), () => { writeList(HISTORY, []); render(); }, { class: 'btn-ghost btn-small' })
    ];

    let questionBlock;
    if (!q) {
      questionBlock = [
        h('p.lead', { text: t('training.lead') }),
        button(`▶ ${t('training.start')}`, () => newQuestion(), { class: 'btn-primary' })
      ];
    } else {
      const feedback = ui.solved
        ? h('p.notice.notice-ok', { text: t('training.correct') })
        : ui.revealed
          ? h('p.notice.notice-warn', {}, [
            h('strong', { text: `${t('training.revealed')} ` }),
            h('span', { text: optionLabel(q.options.find((o) => o.id === q.answerId)) })
          ])
          : ui.attempts.length
            ? h('p.notice.notice-warn', { text: t('training.wrong') })
            : null;

      const done = ui.solved || ui.revealed;
      questionBlock = [
        h('p.question-prompt', { text: q.prompt[lang] || q.prompt.pt }),
        h('div.play-bar', {}, [
          button(`▶ ${t('training.replay')}`, playQuestion, { class: 'btn-primary' }),
          button(`■ ${t('stop')}`, () => audio.stopAll(), { class: 'btn-ghost' }),
          done ? null : button(t('training.reveal'), reveal, { class: 'btn-ghost' }),
          button(`⏭ ${t('training.next')}`, () => newQuestion())
        ]),
        h('div.option-grid', {}, q.options.map((opt) => {
          const tried = ui.attempts.find((a) => a.optionId === opt.id);
          const isAnswer = opt.id === q.answerId;
          const cls = done && isAnswer ? 'right' : tried && !tried.correct ? 'wrong' : '';
          return h('button.option', {
            type: 'button', class: cls, disabled: done || (tried && !tried.correct),
            text: optionLabel(opt),
            onclick: () => answer(opt.id)
          });
        })),
        ui.attempts.length ? kv(t('training.attempts'), String(ui.attempts.length)) : null,
        feedback,
        done ? h('p.explain', { text: q.explain[lang] || q.explain.pt }) : null
      ];
    }

    mount(root,
      sectionHead(t('training.title'), t('training.lead')),
      live,
      dash([
        card(3, t('training.exercise'), controls),
        card(6, t('training.title'), questionBlock),
        card(3, t('training.score'), statsBlock, { scroll: 'md' })
      ])
    );
  }

  newQuestion(false);
  return { element: root, refresh: render };
}
