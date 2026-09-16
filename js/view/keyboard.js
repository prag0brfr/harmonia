/**
 * keyboard.js — Teclado de piano em SVG.
 *
 * Serve de ponte entre instrumentos: a mesma nota que aparece numa casa do
 * braço aparece aqui numa tecla, o que ajuda a entender que o "mapa" do
 * violão é só uma forma de organizar as mesmas doze classes de altura.
 */

import { midiToNote, noteName, toMidi } from '../core/notes.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_OFFSETS = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  return node;
}

function isWhite(midi) {
  return WHITE_PCS.includes(((midi % 12) + 12) % 12);
}

/**
 * Desenha o teclado.
 * @param {object} opts
 *   fromMidi, toMidi — extremos (serão ajustados para começar/terminar em tecla branca)
 *   marks       — Map de MIDI → { role, label }  (alturas exatas)
 *   pcMarks     — Map de classe de altura → { role, label } (qualquer oitava)
 *   onSelect    — callback(midi)
 *   showLabels  — nomes nas teclas brancas de Dó
 */
export function renderKeyboard(opts = {}) {
  const {
    fromMidi = 48, toMidi: to = 84, marks = new Map(), pcMarks = new Map(),
    lang = 'en', onSelect = null, showLabels = true, height = 112
  } = opts;

  let start = fromMidi;
  while (!isWhite(start)) start -= 1;
  let end = to;
  while (!isWhite(end)) end += 1;

  const whites = [];
  for (let m = start; m <= end; m += 1) if (isWhite(m)) whites.push(m);

  const wKeyW = 31;
  const wKeyH = height;
  const bKeyW = wKeyW * 0.62;
  const bKeyH = wKeyH * 0.62;
  const padX = 6;
  const padTop = 4;
  const w = padX * 2 + whites.length * wKeyW;
  const h = padTop + wKeyH + 20;

  const svg = el('svg', {
    class: 'keyboard-svg', viewBox: `0 0 ${w} ${h}`, width: w, height: h,
    preserveAspectRatio: 'xMinYMid meet', role: 'img',
    'aria-label': lang === 'pt' ? 'Teclado de piano' : 'Piano keyboard'
  });

  const markFor = (midi) => marks.get(midi) || pcMarks.get(((midi % 12) + 12) % 12) || null;

  const addKey = (midi, x, width, keyH, black) => {
    const mark = markFor(midi);
    const g = el('g', {
      class: `kb-key ${black ? 'black' : 'white'}${mark ? ` marked ${mark.role}` : ''}`,
      tabindex: onSelect ? '0' : null, role: onSelect ? 'button' : null,
      'aria-label': noteName(midiToNote(midi, false), { lang, octave: true })
    });
    g.appendChild(el('rect', {
      x, y: padTop, width, height: keyH, rx: 3, class: 'kb-key-shape'
    }));
    if (mark) {
      g.appendChild(el('circle', { cx: x + width / 2, cy: padTop + keyH - 14, r: 7.5, class: 'kb-mark' }));
      const t = el('text', { x: x + width / 2, y: padTop + keyH - 10.6, class: 'kb-mark-label', 'text-anchor': 'middle' });
      t.textContent = mark.label || '';
      g.appendChild(t);
    } else if (showLabels && !black && ((midi % 12) + 12) % 12 === 0) {
      const t = el('text', { x: x + width / 2, y: padTop + keyH - 6, class: 'kb-octave-label', 'text-anchor': 'middle' });
      t.textContent = noteName(midiToNote(midi), { lang, octave: true });
      g.appendChild(t);
    }
    const title = el('title');
    title.textContent = noteName(midiToNote(midi, false), { lang, octave: true })
      + (mark && mark.label ? ` · ${mark.label}` : '');
    g.appendChild(title);
    if (onSelect) {
      g.addEventListener('click', () => onSelect(midi));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(midi); }
      });
    }
    return g;
  };

  // Brancas primeiro, depois pretas por cima.
  whites.forEach((midi, i) => {
    svg.appendChild(addKey(midi, padX + i * wKeyW, wKeyW - 1.5, wKeyH, false));
  });
  whites.forEach((midi, i) => {
    const pc = ((midi % 12) + 12) % 12;
    const blackPc = pc + 1;
    if (!(blackPc in BLACK_OFFSETS)) return;
    const blackMidi = midi + 1;
    if (blackMidi > end) return;
    const x = padX + (i + 1) * wKeyW - bKeyW / 2 - 0.75;
    svg.appendChild(addKey(blackMidi, x, bKeyW, bKeyH, true));
  });

  return svg;
}

/** Constrói o Map de marcações a partir de uma lista de notas grafadas. */
export function marksFromNotes(notes, labelFn = null, roleFn = null) {
  const map = new Map();
  notes.forEach((n, i) => {
    map.set(toMidi(n), {
      role: roleFn ? roleFn(n, i) : (i === 0 ? 'root' : 'chord'),
      label: labelFn ? labelFn(n, i) : ''
    });
  });
  return map;
}
