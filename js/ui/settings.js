/**
 * settings.js — Preferências do aplicativo.
 */

import { h, mount, panel, field, select, segmented, slider, button } from './ui.js';
import { t, pick, getLang } from '../i18n.js';
import { state, setSetting, resetAll } from '../state.js';
import { audio, WAVEFORMS } from '../audio/audio.js';
import { available as storageAvailable } from '../storage.js';
import { TUNINGS } from '../view/fretboard.js';

export function createSettings(onAnyChange) {
  const root = h('div.section-body');
  const status = h('p.muted', { text: '' });

  function render() {
    const lang = getLang();
    const wf = WAVEFORMS.find((w) => w.id === state.waveform) || WAVEFORMS[0];

    mount(root,
      panel(t('settings.title'), null, [
        h('div.controls-grid', {}, [
          field(t('settings.language'), segmented([
            { value: 'pt', label: 'Português' },
            { value: 'en', label: 'English' }
          ], state.lang, (v) => { setSetting('lang', v); onAnyChange(); }, t('settings.language'))),
          field(t('settings.notation'), segmented([
            { value: 'pt', label: t('settings.notation.pt') },
            { value: 'en', label: t('settings.notation.en') }
          ], state.notation, (v) => { setSetting('notation', v); onAnyChange(); }, t('settings.notation'))),
          field(t('settings.theme'), segmented([
            { value: 'auto', label: t('settings.theme.auto') },
            { value: 'light', label: t('settings.theme.light') },
            { value: 'dark', label: t('settings.theme.dark') }
          ], state.theme, (v) => { setSetting('theme', v); render(); }, t('settings.theme'))),
          field(t('tuning'), select(TUNINGS.map((x) => ({ value: x.id, label: pick(x.names) })), state.tuning,
            (v) => { setSetting('tuning', v); onAnyChange(); }))
        ])
      ]),
      panel(lang === 'pt' ? 'Som' : 'Sound', null, [
        h('div.controls-grid', {}, [
          field(t('settings.waveform'), select(WAVEFORMS.map((w) => ({ value: w.id, label: pick(w.names) })), state.waveform,
            (v) => { setSetting('waveform', v); render(); }), pick(wf.desc)),
          slider(t('settings.volume'), { min: 0, max: 1, step: 0.05, value: state.volume, format: (v) => `${Math.round(v * 100)}%` },
            (v) => setSetting('volume', v)),
          slider(t('settings.tempo'), { min: 40, max: 200, step: 1, value: state.tempo, format: (v) => `${v} BPM` },
            (v) => setSetting('tempo', v)),
          slider(t('settings.a4'), { min: 392, max: 466, step: 1, value: state.a4, format: (v) => `${v} Hz` },
            (v) => { setSetting('a4', v); onAnyChange(); })
        ]),
        h('div.play-bar', {}, [
          button(`▶ ${lang === 'pt' ? 'Testar som' : 'Test sound'}`, () => audio.playSequence([60, 64, 67, 72], { stepSeconds: 0.3 })),
          button(`■ ${t('stop')}`, () => audio.stopAll(), { class: 'btn-ghost' })
        ]),
        h('p.notice.notice-info', { text: t('settings.audioNote') })
      ]),
      panel(t('home.privacy'), null, [
        h('p', { text: t('settings.storageNote') }),
        storageAvailable() ? null : h('p.notice.notice-warn', {
          text: lang === 'pt'
            ? 'O armazenamento local está indisponível neste navegador (janela anônima ou bloqueio de cookies). O aplicativo funciona, mas não vai lembrar suas escolhas.'
            : 'Local storage is unavailable in this browser (private window or blocked cookies). The app works, but it will not remember your choices.'
        }),
        button(t('settings.reset'), () => {
          resetAll();
          status.textContent = t('settings.resetDone');
          onAnyChange();
          render();
        }, { class: 'btn-ghost' }),
        status
      ])
    );
  }

  render();
  return { element: root, refresh: render };
}
