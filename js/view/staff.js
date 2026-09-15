/**
 * staff.js — Partitura em SVG, sem bibliotecas externas.
 *
 * Todo o desenho é feito com primitivas SVG. As claves são traçadas com
 * curvas de Bézier próprias (ver createClef) em vez de glifos de fonte
 * musical, para que a partitura apareça igual em qualquer sistema, sem
 * depender da fonte Bravura ou de suporte a U+1D11E.
 *
 * Posicionamento vertical: cada nota ocupa um "degrau diatônico".
 *   índice diatônico = letra (0..6) + 7 * oitava
 * Na clave de sol, a linha inferior é Mi4; na clave de fá, Sol2.
 */

import { LETTERS, toMidi, noteName } from '../core/notes.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export const DURATIONS = [
  { id: 'whole', beats: 4, names: { pt: 'Semibreve', en: 'Whole' } },
  { id: 'half', beats: 2, names: { pt: 'Mínima', en: 'Half' } },
  { id: 'quarter', beats: 1, names: { pt: 'Semínima', en: 'Quarter' } },
  { id: 'eighth', beats: 0.5, names: { pt: 'Colcheia', en: 'Eighth' } },
  { id: 'sixteenth', beats: 0.25, names: { pt: 'Semicolcheia', en: 'Sixteenth' } }
];

/** Linha inferior de cada clave, em índice diatônico. */
const CLEF_BOTTOM = {
  treble: 2 + 7 * 4,   // Mi4
  bass: 4 + 7 * 2      // Sol2
};

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  return node;
}

function diatonicIndex(n) {
  return LETTERS.indexOf(n.letter) + 7 * n.octave;
}

/**
 * Clave de sol desenhada como traço contínuo.
 * S = espaçamento entre linhas; yG = altura da linha do Sol4 (2ª de baixo).
 */
function trebleClefPath(cx, yG, S) {
  const p = (x, y) => `${(cx + x * S).toFixed(2)},${(yG + y * S).toFixed(2)}`;
  // Haste: do topo (uma linha acima da pauta) até o gancho, abaixo da pauta.
  const stem = `M ${p(0.30, -3.95)} C ${p(0.22, -2.2)} ${p(0.06, -0.2)} ${p(0.02, 1.85)} `
    + `C ${p(0.0, 2.45)} ${p(-0.4, 2.8)} ${p(-0.85, 2.35)}`;
  // Volta superior → descida → laço inferior → espiral fechando sobre a linha do Sol.
  const curl = `M ${p(0.30, -3.95)} C ${p(-0.32, -4.25)} ${p(-0.95, -3.55)} ${p(-0.90, -2.85)} `
    + `C ${p(-0.86, -2.15)} ${p(-0.36, -1.70)} ${p(0.04, -1.15)} `
    + `C ${p(0.55, -0.48)} ${p(0.95, 0.02)} ${p(0.95, 0.62)} `
    + `C ${p(0.95, 1.38)} ${p(0.30, 1.92)} ${p(-0.35, 1.76)} `
    + `C ${p(-0.96, 1.60)} ${p(-1.14, 0.88)} ${p(-0.74, 0.42)} `
    + `C ${p(-0.44, 0.06)} ${p(0.04, 0.06)} ${p(0.24, 0.40)} `
    + `C ${p(0.42, 0.70)} ${p(0.10, 0.94)} ${p(-0.16, 0.72)}`;
  return [stem, curl];
}

/** Clave de fá: laço e dois pontos em torno da linha do Fá3. */
function bassClefPaths(cx, yF, S) {
  const p = (x, y) => `${(cx + x * S).toFixed(2)},${(yF + y * S).toFixed(2)}`;
  const body = `M ${p(-0.85, -0.45)} C ${p(-0.15, -0.95)} ${p(0.85, -0.5)} ${p(0.85, 0.5)} `
    + `C ${p(0.85, 1.7)} ${p(-0.05, 2.5)} ${p(-1.05, 2.85)}`;
  return { body, head: [cx - 0.75 * S, yF - 0.2 * S, 0.3 * S], dots: [[cx + 1.2 * S, yF - 0.5 * S], [cx + 1.2 * S, yF + 0.5 * S]] };
}

/** Ordem padrão dos acidentes na armadura. */
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
/** Degraus (a partir da linha inferior) de cada acidente, por clave. */
const SHARP_STEPS = { treble: [8, 5, 9, 6, 3, 7, 4], bass: [6, 3, 7, 4, 1, 5, 2] };
const FLAT_STEPS = { treble: [4, 7, 3, 6, 2, 5, 1], bass: [2, 5, 1, 4, 0, 3, -1] };

/**
 * Renderiza uma pauta.
 *
 * @param {object} opts
 *   notes      — lista de notas grafadas, OU lista de grupos (acordes) [[n,n],[n]]
 *   clef       — 'treble' | 'bass' | 'grand'
 *   keySignature — { count: number, type: 'sharp'|'flat' }
 *   showNames  — mostra o nome abaixo da pauta
 *   lang       — 'pt' | 'en'
 *   duration   — id de DURATIONS
 * @returns {SVGElement}
 */
export function renderStaff(opts = {}) {
  const {
    notes = [],
    clef = 'treble',
    keySignature = null,
    showNames = true,
    lang = 'pt',
    duration = 'quarter',
    width = null,
    highlightIndex = -1
  } = opts;

  const S = 16;                       // espaçamento entre linhas (px)
  const staffH = S * 4;
  const groups = normalizeGroups(notes);
  const isGrand = clef === 'grand';
  const clefs = isGrand ? ['treble', 'bass'] : [clef];

  const leftPad = 20;
  const clefW = 58;
  const keyW = keySignature && keySignature.count ? keySignature.count * 13 + 10 : 0;
  const noteSpacing = 52;
  const startX = leftPad + clefW + keyW + 10;
  const contentW = Math.max(groups.length * noteSpacing + 40, 150);
  const totalW = width || startX + contentW;

  const topPad = 66;
  const gap = isGrand ? S * 7 : 0;
  const totalH = topPad + staffH + gap + (isGrand ? staffH : 0) + (showNames ? 40 : 20) + 26;

  const svg = el('svg', {
    class: 'staff-svg',
    viewBox: `0 0 ${totalW} ${totalH}`,
    width: totalW,
    height: totalH,
    role: 'img',
    'aria-label': lang === 'pt' ? 'Partitura' : 'Music staff',
    preserveAspectRatio: 'xMinYMid meet'
  });

  const staffTops = clefs.map((_, i) => topPad + i * (staffH + gap));

  // --- linhas da pauta ---
  clefs.forEach((cl, i) => {
    const top = staffTops[i];
    for (let k = 0; k < 5; k += 1) {
      svg.appendChild(el('line', {
        x1: leftPad, y1: top + k * S, x2: totalW - 8, y2: top + k * S, class: 'staff-line'
      }));
    }
    // barras inicial e final
    svg.appendChild(el('line', { x1: leftPad, y1: top, x2: leftPad, y2: top + staffH, class: 'staff-line' }));
    drawClef(svg, cl, leftPad + 8, top, S);
    if (keySignature && keySignature.count) drawKeySignature(svg, cl, leftPad + clefW, top, S, keySignature);
  });

  if (isGrand) {
    svg.appendChild(el('line', {
      x1: leftPad, y1: staffTops[0], x2: leftPad, y2: staffTops[1] + staffH, class: 'staff-brace'
    }));
  }

  // --- notas ---
  groups.forEach((group, gi) => {
    const x = startX + gi * noteSpacing;
    const assigned = clefs.map(() => []);
    group.forEach((n) => {
      const idx = isGrand ? (toMidi(n) >= 60 ? 0 : 1) : 0;
      assigned[idx].push(n);
    });
    clefs.forEach((cl, ci) => {
      if (!assigned[ci].length) return;
      drawChordGroup(svg, assigned[ci], cl, x, staffTops[ci], S, duration, gi === highlightIndex);
    });
    if (showNames) {
      const label = group.map((n) => noteName(n, { lang, octave: group.length === 1 })).join(' ');
      svg.appendChild(textNode(label, x, staffTops[staffTops.length - 1] + staffH + 40, 'staff-note-name'));
    }
  });

  return svg;
}

function normalizeGroups(notes) {
  if (!notes.length) return [];
  return Array.isArray(notes[0]) ? notes : notes.map((n) => [n]);
}

function textNode(text, x, y, cls) {
  const t = el('text', { x, y, class: cls, 'text-anchor': 'middle' });
  t.textContent = text;
  return t;
}

function drawClef(svg, clef, x, top, S) {
  if (clef === 'treble') {
    const yG = top + 3 * S;               // 2ª linha de baixo = Sol4
    const [stem, curl] = trebleClefPath(x + 22, yG, S);
    svg.appendChild(el('path', { d: stem, class: 'clef-stroke' }));
    svg.appendChild(el('path', { d: curl, class: 'clef-stroke' }));
  } else {
    const yF = top + S;                   // 2ª linha de cima = Fá3
    const { body, head, dots } = bassClefPaths(x + 22, yF, S);
    svg.appendChild(el('path', { d: body, class: 'clef-stroke clef-stroke-thick' }));
    svg.appendChild(el('circle', { cx: head[0], cy: head[1], r: head[2], class: 'clef-fill' }));
    dots.forEach(([cx, cy]) => svg.appendChild(el('circle', { cx, cy, r: S * 0.14, class: 'clef-fill' })));
  }
}

function drawKeySignature(svg, clef, x, top, S, key) {
  const bottomY = top + 4 * S;
  const isSharp = key.type === 'sharp';
  const steps = (isSharp ? SHARP_STEPS : FLAT_STEPS)[clef === 'bass' ? 'bass' : 'treble'];
  const glyph = isSharp ? '♯' : '♭';
  for (let i = 0; i < Math.min(key.count, 7); i += 1) {
    const y = bottomY - steps[i] * (S / 2);
    const t = el('text', { x: x + 8 + i * 12, y: y + S * 0.34, class: 'staff-accidental', 'text-anchor': 'middle' });
    t.textContent = glyph;
    svg.appendChild(t);
  }
}

const ACC_GLYPH = { '-2': '♭♭', '-1': '♭', 0: '', 1: '♯', 2: '♯♯' };

function drawChordGroup(svg, notes, clef, x, top, S, duration, highlight) {
  const bottomIdx = CLEF_BOTTOM[clef];
  const bottomY = top + 4 * S;
  const items = notes
    .map((n) => ({ n, step: diatonicIndex(n) - bottomIdx }))
    .sort((a, b) => a.step - b.step);

  // Notas a uma segunda de distância são deslocadas horizontalmente.
  let side = 0;
  items.forEach((it, i) => {
    if (i > 0 && it.step - items[i - 1].step === 1 && items[i - 1].offset === 0) {
      it.offset = 1;
    } else {
      it.offset = 0;
    }
    side = it.offset;
  });

  const headRx = S * 0.62;
  const filled = duration !== 'whole' && duration !== 'half';
  const stemUp = items[items.length - 1].step < 4;

  items.forEach((it) => {
    const y = bottomY - it.step * (S / 2);
    const cx = x + it.offset * headRx * 1.85 * (stemUp ? 1 : -1);

    // linhas suplementares
    drawLedgerLines(svg, it.step, x, bottomY, S, headRx);

    const head = el('ellipse', {
      cx, cy: y, rx: headRx, ry: S * 0.45,
      transform: `rotate(-18 ${cx} ${y})`,
      class: `note-head${filled ? ' filled' : ''}${highlight ? ' highlight' : ''}`
    });
    svg.appendChild(head);

    if (it.n.alter !== 0) {
      const acc = el('text', {
        x: cx - headRx - 6 - (it.offset ? 10 : 0), y: y + S * 0.34,
        class: 'staff-accidental', 'text-anchor': 'middle'
      });
      acc.textContent = ACC_GLYPH[String(it.n.alter)] || '';
      svg.appendChild(acc);
    }
  });

  if (duration !== 'whole') {
    const topItem = items[items.length - 1];
    const bottomItem = items[0];
    const yTop = bottomY - topItem.step * (S / 2);
    const yBottom = bottomY - bottomItem.step * (S / 2);
    const stemX = stemUp ? x + headRx - 0.6 : x - headRx + 0.6;
    const y1 = stemUp ? yBottom : yTop;
    const y2 = stemUp ? yTop - S * 3.1 : yBottom + S * 3.1;
    svg.appendChild(el('line', { x1: stemX, y1, x2: stemX, y2, class: 'note-stem' }));

    if (duration === 'eighth' || duration === 'sixteenth') {
      drawFlag(svg, stemX, y2, S, stemUp);
      if (duration === 'sixteenth') drawFlag(svg, stemX, y2 + (stemUp ? S * 0.75 : -S * 0.75), S, stemUp);
    }
  }
}

function drawFlag(svg, x, y, S, up) {
  const dir = up ? 1 : -1;
  const d = `M ${x},${y} C ${x + S * 0.9},${y + dir * S * 0.5} ${x + S * 0.95},${y + dir * S * 1.3} ${x + S * 0.35},${y + dir * S * 1.9}`;
  svg.appendChild(el('path', { d, class: 'note-flag' }));
}

function drawLedgerLines(svg, step, x, bottomY, S, headRx) {
  const w = headRx * 1.7;
  if (step < 0) {
    for (let s = -2; s >= step; s -= 2) {
      const y = bottomY - s * (S / 2);
      svg.appendChild(el('line', { x1: x - w, y1: y, x2: x + w, y2: y, class: 'ledger-line' }));
    }
  } else if (step > 8) {
    for (let s = 10; s <= step; s += 2) {
      const y = bottomY - s * (S / 2);
      svg.appendChild(el('line', { x1: x - w, y1: y, x2: x + w, y2: y, class: 'ledger-line' }));
    }
  }
}

/**
 * Armadura de clave para uma tonalidade maior ou menor.
 * Devolve { count, type } ou null.
 */
export function keySignatureFor(tonic, mode = 'major') {
  // Círculo das quintas: quantidade de sustenidos/bemóis por tônica maior.
  const SHARP_KEYS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7 };
  const FLAT_KEYS = { F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7 };
  const RELATIVE = { A: 'C', E: 'G', B: 'D', 'F#': 'A', 'C#': 'E', 'G#': 'B', 'D#': 'F#', D: 'F', G: 'Bb', C: 'Eb', F: 'Ab', Bb: 'Db', Eb: 'Gb' };

  const asText = (n) => n.letter + (n.alter === 1 ? '#' : n.alter === -1 ? 'b' : '');
  let key = asText(tonic);
  if (mode === 'minor') {
    key = RELATIVE[key];
    if (!key) return null;
  }
  if (key in SHARP_KEYS) {
    const c = SHARP_KEYS[key];
    return c ? { count: c, type: 'sharp' } : { count: 0, type: 'sharp' };
  }
  if (key in FLAT_KEYS) return { count: FLAT_KEYS[key], type: 'flat' };
  return null;
}

/** Escolhe automaticamente a melhor clave para um conjunto de notas. */
export function autoClef(notes) {
  if (!notes.length) return 'treble';
  const midis = notes.flat().map(toMidi);
  const min = Math.min(...midis);
  const max = Math.max(...midis);
  if (max - min > 20) return 'grand';
  return (min + max) / 2 >= 58 ? 'treble' : 'bass';
}
