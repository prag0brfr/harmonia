/**
 * fretboard.js — Braço da guitarra em SVG e gerador de digitações.
 *
 * O braço é um mapa: cada casa de cada corda soa uma nota. A partir da
 * afinação (notas das cordas soltas) tudo é aritmética de semitons.
 */

import { midiToNote, toMidi, pitchClass, noteName, parseNote } from '../core/notes.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Afinações (da corda mais grave para a mais aguda). */
export const TUNINGS = [
  { id: 'standard', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], names: { pt: 'Padrão (Mi)', en: 'Standard (E)' } },
  { id: 'dropD', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], names: { pt: 'Drop D', en: 'Drop D' } },
  { id: 'dStandard', strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'], names: { pt: 'Afinação em Ré', en: 'D standard' } },
  { id: 'dropC', strings: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'], names: { pt: 'Drop C', en: 'Drop C' } },
  { id: 'openG', strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'], names: { pt: 'Sol aberto', en: 'Open G' } },
  { id: 'openD', strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], names: { pt: 'Ré aberto', en: 'Open D' } },
  { id: 'dadgad', strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'], names: { pt: 'DADGAD', en: 'DADGAD' } },
  { id: 'sevenString', strings: ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'], names: { pt: '7 cordas (Si)', en: '7-string (B)' } },
  { id: 'bass4', strings: ['E1', 'A1', 'D2', 'G2'], names: { pt: 'Baixo 4 cordas', en: '4-string bass' } },
  { id: 'bass5', strings: ['B0', 'E1', 'A1', 'D2', 'G2'], names: { pt: 'Baixo 5 cordas', en: '5-string bass' } },
  { id: 'ukulele', strings: ['G4', 'C4', 'E4', 'A4'], names: { pt: 'Ukulele (reentrante)', en: 'Ukulele (re-entrant)' } }
];

export function tuningById(id) {
  return TUNINGS.find((t) => t.id === id) || TUNINGS[0];
}

/** Notas MIDI das cordas soltas de uma afinação. */
export function openStringMidis(tuning) {
  return tuning.strings.map((s) => toMidi(parseNote(s)));
}

/** Nota MIDI de uma casa. */
export function fretMidi(tuning, stringIndex, fret) {
  return openStringMidis(tuning)[stringIndex] + fret;
}

/** Casas com marcação de posição. */
const INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_INLAYS = new Set([12, 24]);

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  return node;
}

/**
 * Desenha o braço.
 * @param {object} opts
 *   tuning     — objeto de TUNINGS
 *   fromFret / toFret — região exibida (0..24)
 *   marks      — Map de classe de altura → { label, role: 'root'|'chord'|'scale' }
 *   lang, showOpen
 *   onSelect   — callback(midi, stringIndex, fret)
 */
export function renderFretboard(opts = {}) {
  const {
    tuning = TUNINGS[0],
    fromFret = 0,
    toFret = 12,
    marks = new Map(),
    lang = 'pt',
    onSelect = null,
    labelMode = 'note'
  } = opts;

  const strings = tuning.strings.length;
  const fretCount = toFret - fromFret;
  const padL = 64;
  const padR = 16;
  const padT = 26;
  const padB = 26;
  const fretW = 54;
  const stringGap = 30;
  const w = padL + fretCount * fretW + padR;
  const h = padT + (strings - 1) * stringGap + padB;

  const svg = el('svg', {
    class: 'fretboard-svg', viewBox: `0 0 ${w} ${h}`, width: w, height: h,
    role: 'img', 'aria-label': lang === 'pt' ? 'Braço da guitarra' : 'Guitar fretboard',
    preserveAspectRatio: 'xMinYMid meet'
  });

  const yOf = (visualIndex) => padT + visualIndex * stringGap;
  const xOfFret = (f) => padL + (f - fromFret) * fretW;

  // Corpo do braço
  svg.appendChild(el('rect', {
    x: padL, y: padT - 8, width: fretCount * fretW, height: (strings - 1) * stringGap + 16,
    class: 'fb-body', rx: 3
  }));

  // Marcações de posição
  for (let f = fromFret + 1; f <= toFret; f += 1) {
    const cx = xOfFret(f) - fretW / 2;
    const cy = padT + ((strings - 1) * stringGap) / 2;
    if (DOUBLE_INLAYS.has(f)) {
      svg.appendChild(el('circle', { cx, cy: cy - stringGap * 0.7, r: 4.5, class: 'fb-inlay' }));
      svg.appendChild(el('circle', { cx, cy: cy + stringGap * 0.7, r: 4.5, class: 'fb-inlay' }));
    } else if (INLAYS.has(f)) {
      svg.appendChild(el('circle', { cx, cy, r: 4.5, class: 'fb-inlay' }));
    }
  }

  // Trastes
  for (let f = fromFret; f <= toFret; f += 1) {
    const x = xOfFret(f);
    svg.appendChild(el('line', {
      x1: x, y1: padT - 8, x2: x, y2: padT + (strings - 1) * stringGap + 8,
      class: f === 0 ? 'fb-nut' : 'fb-fret'
    }));
    if (f > fromFret) {
      const t = el('text', { x: x - fretW / 2, y: h - 8, class: 'fb-fret-number', 'text-anchor': 'middle' });
      t.textContent = String(f);
      svg.appendChild(t);
    }
  }

  // Cordas: a mais aguda no topo (como se olhássemos o braço de frente)
  const order = [...tuning.strings.keys()].reverse();
  order.forEach((stringIndex, visual) => {
    const y = yOf(visual);
    svg.appendChild(el('line', {
      x1: padL, y1: y, x2: padL + fretCount * fretW, y2: y,
      class: 'fb-string', 'stroke-width': 1 + (strings - 1 - stringIndex) * 0.35
    }));
    const label = el('text', { x: padL - 34, y: y + 4, class: 'fb-string-name', 'text-anchor': 'end' });
    label.textContent = noteName(parseNote(tuning.strings[stringIndex]), { lang, octave: false });
    svg.appendChild(label);
  });

  // Notas marcadas
  order.forEach((stringIndex, visual) => {
    const y = yOf(visual);
    for (let f = fromFret; f <= toFret; f += 1) {
      const midi = fretMidi(tuning, stringIndex, f);
      const pc = ((midi % 12) + 12) % 12;
      const mark = marks.get(pc);
      if (!mark) continue;
      const cx = f === 0 ? xOfFret(0) - 16 : xOfFret(f) - fretW / 2;
      const g = el('g', {
        class: `fb-note ${mark.role}`, tabindex: onSelect ? '0' : null,
        role: onSelect ? 'button' : null,
        'aria-label': `${noteName(midiToNote(midi), { lang, octave: true })} — ${lang === 'pt' ? 'corda' : 'string'} ${stringIndex + 1}, ${lang === 'pt' ? 'casa' : 'fret'} ${f}`
      });
      g.appendChild(el('circle', { cx, cy: y, r: 12, class: 'fb-note-dot' }));
      const t = el('text', { x: cx, y: y + 3.6, class: 'fb-note-label', 'text-anchor': 'middle' });
      t.textContent = labelMode === 'note' ? noteName(midiToNote(midi), { lang }) : mark.label;
      g.appendChild(t);
      const title = el('title');
      title.textContent = `${noteName(midiToNote(midi), { lang, octave: true })} · ${mark.label} · ${lang === 'pt' ? 'casa' : 'fret'} ${f}`;
      g.appendChild(title);
      if (onSelect) {
        g.addEventListener('click', () => onSelect(midi, stringIndex, f));
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(midi, stringIndex, f); }
        });
      }
      svg.appendChild(g);
    }
  });

  return svg;
}

/* ------------------------------------------------------------------ *
 *  DIGITAÇÕES DE ACORDE
 * ------------------------------------------------------------------ */

/**
 * Procura digitações tocáveis para um acorde.
 *
 * Regras de praticidade adotadas:
 *  - todas as notas caem numa janela de no máximo 4 casas (ou usam cordas soltas);
 *  - não se permite corda abafada no meio de cordas tocadas;
 *  - a fundamental deve estar presente, de preferência no baixo;
 *  - pelo menos três cordas soando.
 *
 * @param {number[]} chordPcs classes de altura do acorde
 * @param {number} rootPc classe de altura da fundamental
 * @param {object} tuning
 * @param {{maxFret?: number, limit?: number, essential?: number[]}} opts
 */
export function findVoicings(chordPcs, rootPc, tuning, opts = {}) {
  const { maxFret = 15, limit = 6, span = 4 } = opts;
  const opens = openStringMidis(tuning);
  const n = opens.length;
  const wanted = new Set(chordPcs);
  const results = [];

  for (let base = 0; base <= maxFret; base += 1) {
    // Opções por corda: casas dentro da janela + corda solta + abafada (null).
    const perString = opens.map((open) => {
      const options = [];
      for (let f = base; f < base + span; f += 1) {
        if (f > 24) break;
        const pc = ((open + f) % 12 + 12) % 12;
        if (wanted.has(pc)) options.push(f);
      }
      if (base > 0) {
        const openPc = ((open % 12) + 12) % 12;
        if (wanted.has(openPc)) options.push(0);
      }
      options.push(null);
      return options;
    });

    const current = new Array(n).fill(null);
    const walk = (i) => {
      if (results.length > 600) return;
      if (i === n) {
        const v = evaluateVoicing(current, opens, wanted, rootPc, span);
        if (v) results.push(v);
        return;
      }
      for (const opt of perString[i]) {
        current[i] = opt;
        walk(i + 1);
      }
      current[i] = null;
    };
    walk(0);
  }

  // Remove duplicatas e ordena por facilidade.
  const seen = new Set();
  const unique = [];
  results.sort((a, b) => b.score - a.score);
  for (const v of results) {
    const key = v.frets.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(v);
    if (unique.length >= limit) break;
  }
  return unique;
}

function evaluateVoicing(frets, opens, wanted, rootPc, span) {
  const sounding = frets.map((f, i) => (f === null ? null : opens[i] + f));
  const played = sounding.filter((m) => m !== null);
  if (played.length < 3) return null;

  // Cordas abafadas não podem ficar no meio.
  const first = frets.findIndex((f) => f !== null);
  const last = frets.length - 1 - [...frets].reverse().findIndex((f) => f !== null);
  for (let i = first; i <= last; i += 1) if (frets[i] === null) return null;

  const pcs = new Set(played.map((m) => ((m % 12) + 12) % 12));
  for (const pc of wanted) if (!pcs.has(pc)) return null;   // exige o acorde completo

  const fretted = frets.filter((f) => f !== null && f > 0);
  if (fretted.length) {
    const min = Math.min(...fretted);
    const max = Math.max(...fretted);
    if (max - min >= span) return null;
  }

  const bassMidi = Math.min(...played);
  const bassPc = ((bassMidi % 12) + 12) % 12;

  // Pontuação: fundamental no baixo, poucas cordas abafadas, posição baixa,
  // poucos dedos diferentes.
  let score = 1;
  if (bassPc === rootPc) score += 0.45;
  score += played.length * 0.06;
  const distinct = new Set(fretted).size;
  score -= distinct * 0.07;
  score -= (fretted.length ? Math.min(...fretted) : 0) * 0.05;   // posições baixas são mais fáceis
  score -= frets.filter((f) => f === null).length * 0.07;

  // Copiamos o arranjo: o buscador reutiliza o mesmo vetor durante a varredura.
  return { frets: frets.slice(), score, bassPc, rootInBass: bassPc === rootPc, midis: played.slice() };
}

/** Diagrama de acorde (caixinha vertical), como nos livros de violão. */
export function renderChordDiagram(voicing, tuning, opts = {}) {
  const { lang = 'pt', labelFn = null } = opts;
  const strings = tuning.strings.length;
  const fretted = voicing.frets.filter((f) => f !== null && f > 0);
  const minFret = fretted.length ? Math.min(...fretted) : 1;
  const startFret = minFret > 1 ? minFret : 1;
  const rows = 5;

  const padT = 26;
  const padL = 16;
  const cellW = 22;
  const cellH = 24;
  const w = padL * 2 + (strings - 1) * cellW;
  const h = padT + rows * cellH + 22;

  const svg = el('svg', { class: 'chord-diagram', viewBox: `0 0 ${w} ${h}`, width: w, height: h, role: 'img' });

  const xOf = (visual) => padL + visual * cellW;
  const yOf = (row) => padT + row * cellH;

  // Pestana (nut) ou indicação de casa
  if (startFret === 1) {
    svg.appendChild(el('rect', { x: padL - 1, y: padT - 4, width: (strings - 1) * cellW + 2, height: 4, class: 'cd-nut' }));
  } else {
    const t = el('text', { x: padL - 8, y: padT + 14, class: 'cd-fret-label', 'text-anchor': 'end' });
    t.textContent = `${startFret}`;
    svg.appendChild(t);
  }

  for (let r = 0; r <= rows; r += 1) {
    svg.appendChild(el('line', { x1: padL, y1: yOf(r), x2: padL + (strings - 1) * cellW, y2: yOf(r), class: 'cd-line' }));
  }
  for (let s = 0; s < strings; s += 1) {
    svg.appendChild(el('line', { x1: xOf(s), y1: padT, x2: xOf(s), y2: yOf(rows), class: 'cd-line' }));
  }

  voicing.frets.forEach((f, stringIndex) => {
    const visual = stringIndex;   // corda mais grave à esquerda, como nos livros
    const x = xOf(visual);
    if (f === null) {
      const t = el('text', { x, y: padT - 8, class: 'cd-mark', 'text-anchor': 'middle' });
      t.textContent = '×';
      svg.appendChild(t);
      return;
    }
    if (f === 0) {
      svg.appendChild(el('circle', { cx: x, cy: padT - 12, r: 4.5, class: 'cd-open' }));
      return;
    }
    const row = f - startFret;
    svg.appendChild(el('circle', { cx: x, cy: yOf(row) + cellH / 2, r: 7.5, class: 'cd-dot' }));
    if (labelFn) {
      const t = el('text', { x, y: yOf(row) + cellH / 2 + 3.4, class: 'cd-dot-label', 'text-anchor': 'middle' });
      t.textContent = labelFn(stringIndex, f);
      svg.appendChild(t);
    }
  });

  return svg;
}

/** Descrição textual da digitação: "x 3 2 0 1 0". */
export function voicingText(voicing) {
  return voicing.frets.map((f) => (f === null ? 'x' : String(f))).join(' ');
}
