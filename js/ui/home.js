/**
 * home.js — Diálogo "Como usar".
 *
 * A antiga página inicial virou este diálogo: explica o objetivo, sugere um
 * caminho de estudo, lista as ferramentas (com atalho para abrir cada uma)
 * e traz o aviso de privacidade. Assim o espaço da tela fica todo para as
 * ferramentas em si.
 */

import { h, modal, button } from './ui.js';
import { t, getLang } from '../i18n.js';

const TOOLS = [
  { id: 'chords', icon: '🎸', titleKey: 'chords.title', descKey: 'chords.lead' },
  { id: 'finder', icon: '🔎', titleKey: 'finder.title', descKey: 'finder.lead' },
  { id: 'scales', icon: '🪜', titleKey: 'scales.title', descKey: 'scales.lead' },
  { id: 'intervals', icon: '📏', titleKey: 'intervals.title', descKey: 'intervals.lead' },
  { id: 'field', icon: '🎼', titleKey: 'field.title', descKey: 'field.lead' },
  { id: 'progressions', icon: '🔗', titleKey: 'prog.title', descKey: 'prog.lead' },
  { id: 'transpose', icon: '↕️', titleKey: 'transpose.title', descKey: 'transpose.lead' },
  { id: 'training', icon: '👂', titleKey: 'training.title', descKey: 'training.lead' },
  { id: 'interference', icon: '〰️', titleKey: 'interf.title', descKey: 'interf.lead' }
];

/**
 * Monta o diálogo.
 * @param {(id: string) => void} onNavigate chamado ao clicar em "Abrir"
 * @returns {HTMLDialogElement}
 */
export function createGuide(onNavigate) {
  const lang = getLang();

  const steps = h('ol.study-path', {}, [1, 2, 3, 4].map((i) => h('li', {}, [
    h('h4', { text: t(`home.step${i}`) }),
    h('p', { text: t(`home.step${i}.desc`) })
  ])));

  const tools = h('div.guide-tools', {}, TOOLS.map((c) => h('article.guide-tool', {}, [
    h('span.tool-icon', { text: c.icon, 'aria-hidden': 'true' }),
    h('div', {}, [
      h('h4', { text: t(c.titleKey) }),
      h('p', { text: t(c.descKey) })
    ]),
    button(t('home.open'), () => onNavigate(c.id), { class: 'btn-small' })
  ])));

  const shortcuts = h('ul.shortcut-list', {}, [
    [lang === 'pt' ? '1 … 9, 0' : '1 … 9, 0', lang === 'pt' ? 'trocar de ferramenta' : 'switch tool'],
    ['Esc', lang === 'pt' ? 'interromper o som' : 'stop the sound'],
    ['?', lang === 'pt' ? 'abrir esta ajuda' : 'open this help'],
    ['Tab', lang === 'pt' ? 'percorrer os controles' : 'move through the controls']
  ].map(([k, v]) => h('li', {}, [h('kbd', { text: k }), h('span', { text: ` — ${v}` })])));

  return modal(t('home.title'), [
    h('p', { text: t('home.intro') }),
    h('h3', { text: t('home.path') }),
    steps,
    h('h3', { text: lang === 'pt' ? 'Ferramentas' : 'Tools' }),
    tools,
    h('h3', { text: lang === 'pt' ? 'Atalhos de teclado' : 'Keyboard shortcuts' }),
    shortcuts,
    h('h3', { text: t('home.privacy') }),
    h('p', { text: t('home.privacyText') })
  ], lang === 'pt' ? 'Fechar' : 'Close');
}
