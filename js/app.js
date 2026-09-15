/**
 * app.js — Montagem da aplicação: abas, navegação e ciclo de vida.
 *
 * Cada seção é criada sob demanda (na primeira vez que é aberta) e depois
 * apenas redesenhada. A navegação usa o hash da URL, então é possível
 * compartilhar um link direto para uma ferramenta e usar voltar/avançar.
 *
 * O cabeçalho ocupa uma única linha; a antiga página inicial virou o
 * diálogo "Como usar", aberto pelo botão à direita.
 */

import { h, mount, clear } from './ui/ui.js';
import { t, setLang, getLang } from './i18n.js';
import { state, applyAll, onChange, setSetting } from './state.js';
import { audio } from './audio/audio.js';
import { createGuide } from './ui/home.js';
import { createChordLibrary } from './ui/chordLibrary.js';
import { createChordFinder } from './ui/chordFinder.js';
import { createScales } from './ui/scales.js';
import { createIntervals } from './ui/intervals.js';
import { createHarmonicField } from './ui/harmonicField.js';
import { createProgressions } from './ui/progressions.js';
import { createTranspose } from './ui/transpose.js';
import { createEarTraining } from './ui/earTraining.js';
import { createInterference } from './ui/interferenceView.js';
import { createSettings } from './ui/settings.js';

const TABS = [
  { id: 'chords', key: 'nav.chords', titleKey: 'chords.title' },
  { id: 'finder', key: 'nav.finder', titleKey: 'finder.title' },
  { id: 'scales', key: 'nav.scales', titleKey: 'scales.title' },
  { id: 'intervals', key: 'nav.intervals', titleKey: 'intervals.title' },
  { id: 'field', key: 'nav.field', titleKey: 'field.title' },
  { id: 'progressions', key: 'nav.progressions', titleKey: 'prog.title' },
  { id: 'transpose', key: 'nav.transpose', titleKey: 'transpose.title' },
  { id: 'training', key: 'nav.training', titleKey: 'training.title' },
  { id: 'interference', key: 'nav.interference', titleKey: 'interf.title' }
];

/** Ajustes existe como seção, mas fica no botão do cabeçalho, não nas abas. */
const EXTRA_SECTIONS = ['settings'];
const ALL_SECTIONS = [...TABS.map((x) => x.id), ...EXTRA_SECTIONS];

const sections = new Map();
let currentId = 'chords';
let nav = null;
let contentEl = null;
let guideDialog = null;

function factoryFor(id) {
  switch (id) {
    case 'chords': return () => createChordLibrary();
    case 'finder': return () => createChordFinder();
    case 'scales': return () => createScales();
    case 'intervals': return () => createIntervals();
    case 'field': return () => createHarmonicField();
    case 'progressions': return () => createProgressions();
    case 'transpose': return () => createTranspose();
    case 'training': return () => createEarTraining();
    case 'interference': return () => createInterference();
    case 'settings': return () => createSettings(refreshAll);
    default: return () => createChordLibrary();
  }
}

function getSection(id) {
  if (!sections.has(id)) sections.set(id, factoryFor(id)());
  return sections.get(id);
}

/** Troca de seção. */
export function navigate(id, { push = true } = {}) {
  if (!ALL_SECTIONS.includes(id)) id = 'chords';
  audio.stopAll();
  currentId = id;
  const section = getSection(id);
  section.refresh();
  mount(contentEl, section.element);
  renderNav();
  if (push && window.location.hash !== `#${id}`) window.location.hash = `#${id}`;
  contentEl.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/** Redesenha tudo (após troca de idioma, notação, afinação de referência...). */
function refreshAll() {
  sections.forEach((s) => s.refresh());
  renderNav();
  mount(contentEl, getSection(currentId).element);
  refreshShellTexts();
}

function renderNav() {
  if (!nav) return;
  mount(nav, ...TABS.map((tab) => h('button.tab', {
    type: 'button',
    role: 'tab',
    'aria-selected': tab.id === currentId ? 'true' : 'false',
    class: tab.id === currentId ? 'active' : '',
    text: t(tab.key),
    onclick: () => navigate(tab.id)
  })));
}

function openGuide() {
  if (guideDialog) guideDialog.remove();
  guideDialog = createGuide((id) => { guideDialog.close(); navigate(id); });
  document.body.appendChild(guideDialog);
  guideDialog.showModal();
}

function buildShell() {
  const app = document.getElementById('app');
  clear(app);

  nav = h('nav.tabs', { role: 'tablist', 'aria-label': t('appName') });
  contentEl = h('main#content.content', { tabindex: '-1', role: 'tabpanel' });

  const settingsBtn = h('button.btn.btn-ghost', {
    type: 'button', 'aria-label': t('settings.title'), title: t('settings.title'),
    text: '⚙', onclick: () => navigate('settings')
  });

  const themeBtn = h('button.btn.btn-ghost', {
    type: 'button', 'aria-label': t('settings.theme'), title: t('settings.theme'),
    text: themeIcon(),
    onclick: () => {
      const order = ['auto', 'light', 'dark'];
      const next = order[(order.indexOf(state.theme) + 1) % order.length];
      setSetting('theme', next);
      themeBtn.textContent = themeIcon();
    }
  });

  const header = h('header.app-header', {}, [
    h('div.bar', {}, [
      h('div.brand', {}, [
        h('span.brand-mark', { 'aria-hidden': 'true', text: '♫' }),
        h('h1.brand-name', { text: t('appName') })
      ]),
      nav,
      h('div.header-actions', {}, [
        h('button.btn', { type: 'button', text: `? ${t('nav.guide')}`, onclick: openGuide }),
        settingsBtn,
        themeBtn
      ])
    ])
  ]);

  app.appendChild(h('a.skip-link', { href: '#content', text: t('skipToContent') }));
  app.appendChild(header);
  app.appendChild(h('div.page', {}, [contentEl]));
}

function themeIcon() {
  return state.theme === 'dark' ? '☾' : state.theme === 'light' ? '☀' : '◑';
}

/** Atalhos de teclado: 1..9 e 0 trocam de aba; Esc interrompe o som. */
function bindKeys() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') { audio.stopAll(); return; }
    if (e.key === '?') { openGuide(); return; }
    if (e.key === ',') { navigate('settings'); return; }
    const n = e.key === '0' ? 10 : parseInt(e.key, 10);
    if (n >= 1 && n <= TABS.length) navigate(TABS[n - 1].id);
  });
}

function refreshShellTexts() {
  const app = document.getElementById('app');
  const brandName = app.querySelector('.brand-name');
  const skip = app.querySelector('.skip-link');
  const guideBtn = app.querySelector('.header-actions .btn');
  if (brandName) brandName.textContent = t('appName');
  if (skip) skip.textContent = t('skipToContent');
  if (guideBtn) guideBtn.textContent = `? ${t('nav.guide')}`;
}

export function start() {
  setLang(state.lang);
  applyAll();
  buildShell();
  bindKeys();

  window.addEventListener('hashchange', () => {
    const id = window.location.hash.replace('#', '') || 'chords';
    if (id !== currentId) navigate(id, { push: false });
  });

  onChange((key) => {
    if (key === 'lang' || key === 'notation' || key === 'a4' || key === 'tuning' || key === '*') {
      refreshAll();
    }
  });

  const initial = window.location.hash.replace('#', '') || 'chords';
  navigate(initial, { push: false });
}

document.addEventListener('DOMContentLoaded', start);
