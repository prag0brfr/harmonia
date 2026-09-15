/**
 * ui.js — Pequenos utilitários de interface.
 *
 * Não usamos framework: a função h() cria elementos e o restante são
 * componentes simples (select, grupo de botões, deslizador, tooltip).
 * Todos os controles são operáveis pelo teclado e carregam rótulos ARIA.
 */

/**
 * Cria um elemento.
 * @param {string} tag  'div', 'button.classe', 'span#id.a.b'
 * @param {object} attrs atributos; 'class', 'text', 'html', on* para eventos
 * @param {Array} children
 */
export function h(tag, attrs = {}, children = []) {
  const m = /^([a-zA-Z0-9-]+)((?:[.#][^.#]+)*)$/.exec(tag);
  const name = m ? m[1] : tag;
  const node = document.createElement(name);
  if (m && m[2]) {
    for (const token of m[2].match(/[.#][^.#]+/g) || []) {
      if (token[0] === '.') node.classList.add(token.slice(1));
      else node.id = token.slice(1);
    }
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'class') node.className = [node.className, v].filter(Boolean).join(' ');
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, String(v));
  }
  const list = Array.isArray(children) ? children : [children];
  for (const c of list.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function mount(node, ...children) {
  clear(node);
  children.flat().forEach((c) => { if (c) node.appendChild(c); });
  return node;
}

/** Bloco de seção com título e texto de apoio. */
export function panel(title, subtitle, children = []) {
  return h('section.panel', {}, [
    title ? h('h3.panel-title', { text: title }) : null,
    subtitle ? h('p.panel-sub', { text: subtitle }) : null,
    h('div.panel-body', {}, children)
  ]);
}

/** Campo rotulado. */
export function field(labelText, control, hint = null) {
  const id = control.id || `f${Math.random().toString(36).slice(2, 8)}`;
  control.id = id;
  return h('div.field', {}, [
    h('label.field-label', { for: id, text: labelText }),
    control,
    hint ? h('p.field-hint', { text: hint }) : null
  ]);
}

/** <select> a partir de uma lista de { value, label, group? }. */
export function select(options, value, onChange, attrs = {}) {
  const sel = h('select.control', { ...attrs, onchange: (e) => onChange(e.target.value) });
  const groups = new Map();
  for (const opt of options) {
    const target = opt.group
      ? (groups.get(opt.group) || (() => {
        const g = h('optgroup', { label: opt.group });
        groups.set(opt.group, g);
        sel.appendChild(g);
        return g;
      })())
      : sel;
    target.appendChild(h('option', { value: opt.value, text: opt.label, selected: String(opt.value) === String(value) }));
  }
  sel.value = String(value);
  return sel;
}

/** Grupo de botões exclusivos (radiogroup acessível). */
export function segmented(options, value, onChange, label = '') {
  const group = h('div.segmented', { role: 'radiogroup', 'aria-label': label });
  options.forEach((opt) => {
    const active = String(opt.value) === String(value);
    const btn = h('button.seg', {
      type: 'button', role: 'radio', 'aria-checked': active ? 'true' : 'false',
      class: active ? 'active' : '', text: opt.label,
      title: opt.title || '',
      onclick: () => onChange(opt.value)
    });
    group.appendChild(btn);
  });
  return group;
}

/** Botão comum. */
export function button(label, onClick, attrs = {}) {
  return h('button.btn', { type: 'button', onclick: onClick, ...attrs }, [label]);
}

/** Deslizador com valor visível. */
export function slider(labelText, { min, max, step = 1, value, format = (v) => v }, onInput) {
  const out = h('output.slider-value', { text: format(value) });
  const input = h('input.slider', {
    type: 'range', min, max, step, value,
    oninput: (e) => {
      const v = parseFloat(e.target.value);
      out.textContent = format(v);
      onInput(v);
    }
  });
  const id = `s${Math.random().toString(36).slice(2, 8)}`;
  input.id = id;
  return h('div.field.slider-field', {}, [
    h('div.slider-head', {}, [h('label.field-label', { for: id, text: labelText }), out]),
    input
  ]);
}

/** Interruptor (checkbox estilizado). */
export function toggle(labelText, checked, onChange) {
  const input = h('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) });
  return h('label.toggle', {}, [input, h('span.toggle-track', {}, [h('span.toggle-thumb')]), h('span', { text: labelText })]);
}

/** Termo com explicação ao passar o cursor ou focar. */
export function term(text, explanation) {
  return h('span.term', { tabindex: '0', 'aria-label': `${text}: ${explanation}`, title: explanation }, [text]);
}

/** Etiqueta colorida. */
export function badge(text, cls = '') {
  return h(`span.badge${cls ? `.${cls}` : ''}`, { text });
}

/** Tabela simples a partir de cabeçalhos e linhas. */
export function table(headers, rows, caption = null) {
  return h('div.table-wrap', {}, [
    h('table.data-table', {}, [
      caption ? h('caption', { text: caption }) : null,
      h('thead', {}, [h('tr', {}, headers.map((x) => h('th', { scope: 'col' }, [x])))]),
      h('tbody', {}, rows.map((r) => h('tr', {}, r.map((cell) => h('td', {}, [cell])))))
    ])
  ]);
}

/** Bloco expansível. */
export function details(summaryText, children, open = false) {
  return h('details.disclosure', { open }, [h('summary', { text: summaryText }), h('div.disclosure-body', {}, children)]);
}

/** Área que anuncia mudanças para leitores de tela. */
export function liveRegion() {
  return h('div.sr-only', { role: 'status', 'aria-live': 'polite' });
}

export function announce(region, text) {
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => { region.textContent = text; }, 30);
}

/* ------------------------------------------------------------------ *
 *  Layout em colunas (painel de instrumentos)
 * ------------------------------------------------------------------ */

/** Grade de 12 colunas. Os filhos usam as classes .span-N. */
export function dash(children = []) {
  return h('div.dash', {}, children);
}

/**
 * Cartão da grade.
 * @param {number} span colunas ocupadas (1..12)
 * @param {string|null} title
 * @param {Array} children
 * @param {{scroll?: boolean, sub?: string}} opts
 */
export function card(span, title, children, opts = {}) {
  // scroll: true | 'sm' | 'md' | 'lg' — limita a altura do cartão e rola por dentro,
  // de modo que a seção inteira caiba numa tela sem rolar a página.
  const size = opts.scroll === true ? 'md' : opts.scroll;
  const body = h('div.card-body', { class: size ? `scroll scroll-${size}` : '' }, children);
  return h(`section.panel.span-${span}`, {}, [
    title ? h('h3.panel-title', { text: title }) : null,
    opts.sub ? h('p.panel-sub', { text: opts.sub }) : null,
    body
  ]);
}

/** Cabeçalho compacto da seção: título + botão de explicação. */
export function sectionHead(title, leadText, infoLabel = 'Sobre esta ferramenta') {
  const lead = h('p.lead.section-lead', { text: leadText, hidden: true });
  const btn = h('button.info-btn', {
    type: 'button', 'aria-expanded': 'false', 'aria-label': infoLabel, title: infoLabel,
    text: 'ⓘ',
    onclick: () => {
      const showing = lead.hidden;
      lead.hidden = !showing;
      btn.setAttribute('aria-expanded', showing ? 'true' : 'false');
    }
  });
  return h('div.section-head-wrap', {}, [
    h('div.section-head', {}, [h('h2.section-title', { text: title }), btn]),
    lead
  ]);
}

/** Diálogo modal simples, fechável por Esc e pelo botão. */
export function modal(title, children, closeLabel = 'Fechar') {
  const dlg = h('dialog.modal', {}, [
    h('div.modal-head', {}, [
      h('h2', { text: title }),
      h('button.btn.btn-ghost', { type: 'button', text: '✕', 'aria-label': closeLabel, onclick: () => dlg.close() })
    ]),
    h('div.modal-body', {}, children)
  ]);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  return dlg;
}

/** Linha compacta rótulo → valor. */
export function kv(label, value) {
  return h('div.kv', {}, [
    h('span.kv-label', { text: label }),
    typeof value === 'string' ? h('span.kv-value', { text: value }) : h('span.kv-value', {}, [value])
  ]);
}
