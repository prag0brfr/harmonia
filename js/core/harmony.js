/**
 * harmony.js — Campos harmônicos, graus, funções e progressões.
 *
 * O campo harmônico é obtido empilhando terças sobre cada grau da escala,
 * usando APENAS notas da própria escala. O tipo de cada acorde é então
 * deduzido dos intervalos resultantes.
 */

import { toMidi, pitchClass, noteName } from './notes.js';
import { intervalBetween, intervalSemitones, transposeNote, parseDegree } from './intervals.js';
import { buildScale, scaleType } from './scales.js';
import { CHORD_TYPES, typeOffsets, chordSymbol, buildChord, chordType } from './chords.js';

/** Funções harmônicas reconhecidas. */
export const FUNCTIONS = {
  tonic: { pt: 'Tônica', en: 'Tonic', abbr: 'T', color: 'fn-tonic', desc: { pt: 'Repouso. É o ponto de chegada da música.', en: 'Rest. The point of arrival.' } },
  subdominant: { pt: 'Subdominante', en: 'Subdominant', abbr: 'SD', color: 'fn-subdominant', desc: { pt: 'Afastamento do repouso. Prepara a dominante.', en: 'Departure from rest. Prepares the dominant.' } },
  dominant: { pt: 'Dominante', en: 'Dominant', abbr: 'D', color: 'fn-dominant', desc: { pt: 'Tensão máxima. Pede resolução na tônica.', en: 'Maximum tension. Calls for resolution to the tonic.' } },
  tonicRelative: { pt: 'Tônica (relativo)', en: 'Tonic (relative)', abbr: 'Tr', color: 'fn-tonic', desc: { pt: 'Substituto da tônica: compartilha duas notas com ela.', en: 'Tonic substitute: shares two notes with it.' } },
  subdominantRelative: { pt: 'Subdominante (relativo)', en: 'Subdominant (relative)', abbr: 'SDr', color: 'fn-subdominant', desc: { pt: 'Substituto da subdominante, muito usado como acorde de preparação.', en: 'Subdominant substitute, widely used as a preparation chord.' } },
  dominantRelative: { pt: 'Dominante (relativo)', en: 'Dominant (relative)', abbr: 'Dr', color: 'fn-dominant', desc: { pt: 'Substituto da dominante: carrega o trítono.', en: 'Dominant substitute: carries the tritone.' } }
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Mapas de função por grau, para cada tipo de escala suportado. */
const FUNCTION_MAPS = {
  major: ['tonic', 'subdominantRelative', 'tonicRelative', 'subdominant', 'dominant', 'tonicRelative', 'dominantRelative'],
  naturalMinor: ['tonic', 'subdominantRelative', 'tonicRelative', 'subdominant', 'dominant', 'subdominantRelative', 'dominantRelative'],
  harmonicMinor: ['tonic', 'subdominantRelative', 'tonicRelative', 'subdominant', 'dominant', 'subdominantRelative', 'dominantRelative'],
  melodicMinor: ['tonic', 'subdominant', 'tonicRelative', 'subdominant', 'dominant', 'dominantRelative', 'dominantRelative'],
  dorian: ['tonic', 'subdominant', 'tonicRelative', 'subdominant', 'dominant', 'dominantRelative', 'subdominantRelative'],
  mixolydian: ['tonic', 'subdominantRelative', 'dominantRelative', 'subdominant', 'tonicRelative', 'dominantRelative', 'subdominant'],
  lydian: ['tonic', 'dominant', 'tonicRelative', 'dominantRelative', 'subdominant', 'tonicRelative', 'subdominantRelative'],
  phrygian: ['tonic', 'subdominant', 'dominantRelative', 'subdominantRelative', 'dominantRelative', 'subdominant', 'tonicRelative'],
  aeolian: ['tonic', 'subdominantRelative', 'tonicRelative', 'subdominant', 'dominant', 'subdominantRelative', 'dominantRelative'],
  locrian: ['tonic', 'subdominant', 'tonicRelative', 'subdominant', 'dominantRelative', 'dominant', 'subdominantRelative'],
  ionian: ['tonic', 'subdominantRelative', 'tonicRelative', 'subdominant', 'dominant', 'tonicRelative', 'dominantRelative']
};

/** Escalas que geram campo harmônico completo (sete graus). */
export const HARMONIC_FIELD_SCALES = [
  'major', 'naturalMinor', 'harmonicMinor', 'melodicMinor',
  'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'
];

/**
 * Empilha terças sobre o grau `index` da escala.
 * @param {Array} notes notas da escala (uma oitava)
 * @param {number} index 0..6
 * @param {number} size 3 (tríade) ou 4 (tétrade)
 */
function stackThirds(notes, index, size) {
  const len = notes.length;
  const out = [];
  let prevMidi = -Infinity;
  for (let k = 0; k < size; k += 1) {
    const pos = index + k * 2;
    const base = notes[pos % len];
    const octaveJump = Math.floor(pos / len);
    const n = { ...base, octave: base.octave + octaveJump };
    // Garante ordem ascendente mesmo quando a escala "volta" de oitava.
    while (toMidi(n) <= prevMidi) n.octave += 1;
    prevMidi = toMidi(n);
    out.push(n);
  }
  return out;
}

/** Descobre o tipo de acorde a partir das notas empilhadas. */
function detectType(notes) {
  const rootPc = pitchClass(notes[0]);
  const offsets = notes.map((n) => ((pitchClass(n) - rootPc) + 12) % 12).sort((a, b) => a - b);
  const key = [...new Set(offsets)].join(',');
  for (const t of CHORD_TYPES) {
    const tk = [...new Set(typeOffsets(t))].sort((a, b) => a - b).join(',');
    if (tk === key) return t;
  }
  return null;
}

/** Algarismo romano do grau, com maiúsculas/minúsculas e símbolos. */
export function romanNumeral(index, type, { sevenths = false } = {}) {
  const base = ROMAN[index];
  if (!type) return base;
  const id = type.id;
  const minorish = ['min', 'dim', 'm7', 'm7b5', 'dim7', 'm9', 'm6', 'mMaj7', 'm11', 'm13'].includes(id);
  let numeral = minorish ? base.toLowerCase() : base;
  if (id === 'dim') numeral += '°';
  else if (id === 'dim7') numeral += '°7';
  else if (id === 'm7b5') numeral += 'ø7';
  else if (id === 'aug') numeral += '+';
  else if (sevenths) {
    if (id === 'maj7') numeral += 'maj7';
    else if (id === '7') numeral += '7';
    else if (id === 'm7') numeral += '7';
    else if (id === 'mMaj7') numeral += '(maj7)';
    else if (id === 'maj7#5') numeral += '+maj7';
  }
  return numeral;
}

/**
 * Gera o campo harmônico completo.
 * @param {object} tonic nota grafada
 * @param {string} scaleId id da escala
 * @param {{sevenths?: boolean}} opts
 */
export function harmonicField(tonic, scaleId, opts = {}) {
  const sevenths = !!opts.sevenths;
  const scale = buildScale(tonic, scaleId);
  if (scale.notes.length !== 7) {
    throw new Error('Campo harmônico requer escala de sete notas.');
  }
  const fnMap = FUNCTION_MAPS[scaleId] || FUNCTION_MAPS.major;
  const degrees = scale.notes.map((root, i) => {
    const notes = stackThirds(scale.notes, i, sevenths ? 4 : 3);
    const type = detectType(notes);
    const chord = type
      ? buildChord(notes[0], type.id)
      : { root: notes[0], type: { id: 'unknown', symbol: '?', names: { pt: 'não catalogado', en: 'uncatalogued' }, formula: [] }, typeId: 'unknown', notes, degrees: [], intervals: [] };
    return {
      index: i,
      degreeNumber: i + 1,
      roman: romanNumeral(i, type, { sevenths }),
      root: notes[0],
      notes: chord.notes,
      type: chord.type,
      typeId: chord.typeId,
      chord,
      fn: fnMap[i],
      formula: (type ? type.formula : []).join(' ')
    };
  });
  return { tonic, scale, scaleId, sevenths, degrees };
}

/** Acordes que costumam preceder / suceder cada grau (índices 0..6). */
const MOTION_MAJOR = {
  0: { prev: [4, 3, 6, 5], next: [3, 4, 5, 1] },
  1: { prev: [0, 5, 3], next: [4, 6] },
  2: { prev: [0, 5], next: [3, 5, 1] },
  3: { prev: [0, 5, 1], next: [4, 0, 1] },
  4: { prev: [1, 3, 0, 5], next: [0, 5] },
  5: { prev: [0, 4, 3], next: [1, 3, 4] },
  6: { prev: [0, 1], next: [0, 2] }
};
const MOTION_MINOR = {
  0: { prev: [4, 3, 6, 5], next: [3, 4, 5, 2] },
  1: { prev: [0, 5, 3], next: [4, 6] },
  2: { prev: [0, 5], next: [5, 3, 6] },
  3: { prev: [0, 5, 2], next: [4, 0, 6] },
  4: { prev: [1, 3, 0], next: [0, 5] },
  5: { prev: [0, 3, 2], next: [3, 6, 4] },
  6: { prev: [0, 2], next: [2, 0] }
};

const MINOR_SCALES = new Set(['naturalMinor', 'harmonicMinor', 'melodicMinor', 'aeolian', 'dorian', 'phrygian', 'locrian']);

/** Movimento harmônico típico de um grau dentro do campo. */
export function chordMotion(field, index) {
  const table = MINOR_SCALES.has(field.scaleId) ? MOTION_MINOR : MOTION_MAJOR;
  const entry = table[index] || { prev: [], next: [] };
  const pick = (list) => list.map((i) => field.degrees[i]).filter(Boolean);
  return { prev: pick(entry.prev), next: pick(entry.next) };
}

/** Progressões-modelo, em algarismos romanos por índice de grau. */
export const PROGRESSIONS = [
  { id: 'I-IV-V', degrees: [0, 3, 4], mode: 'major', names: { pt: 'I – IV – V', en: 'I – IV – V' }, note: { pt: 'A progressão fundamental da música popular. Tônica, afastamento, tensão.', en: 'The fundamental popular-music progression. Tonic, departure, tension.' } },
  { id: 'I-IV-V-I', degrees: [0, 3, 4, 0], mode: 'major', names: { pt: 'I – IV – V – I', en: 'I – IV – V – I' }, note: { pt: 'Cadência completa: sai do repouso e volta a ele.', en: 'Full cadence: leaves rest and returns to it.' } },
  { id: 'I-V-vi-IV', degrees: [0, 4, 5, 3], mode: 'major', names: { pt: 'I – V – vi – IV', en: 'I – V – vi – IV' }, note: { pt: 'Presente em milhares de canções pop.', en: 'Found in thousands of pop songs.' } },
  { id: 'vi-IV-I-V', degrees: [5, 3, 0, 4], mode: 'major', names: { pt: 'vi – IV – I – V', en: 'vi – IV – I – V' }, note: { pt: 'Mesma sequência começando pelo relativo menor: som mais melancólico.', en: 'Same loop starting on the relative minor: a more wistful sound.' } },
  { id: 'ii-V-I', degrees: [1, 4, 0], mode: 'major', names: { pt: 'ii – V – I', en: 'ii – V – I' }, note: { pt: 'A célula básica do jazz: preparação, dominante, resolução.', en: 'The basic jazz cell: preparation, dominant, resolution.' } },
  { id: 'I-vi-ii-V', degrees: [0, 5, 1, 4], mode: 'major', names: { pt: 'I – vi – ii – V', en: 'I – vi – ii – V' }, note: { pt: 'O "turnaround" clássico, típico dos standards.', en: 'The classic turnaround, typical of standards.' } },
  { id: 'I-iii-IV-V', degrees: [0, 2, 3, 4], mode: 'major', names: { pt: 'I – iii – IV – V', en: 'I – iii – IV – V' }, note: { pt: 'Subida suave por graus conjuntos na harmonia.', en: 'A smooth stepwise rise in the harmony.' } },
  { id: 'i-iv-V', degrees: [0, 3, 4], mode: 'minor', names: { pt: 'i – iv – V', en: 'i – iv – V' }, note: { pt: 'Em menor, o V maior (da menor harmônica) reforça a resolução.', en: 'In minor, the major V (from harmonic minor) strengthens the resolution.' } },
  { id: 'i-VI-III-VII', degrees: [0, 5, 2, 6], mode: 'minor', names: { pt: 'i – VI – III – VII', en: 'i – VI – III – VII' }, note: { pt: 'Loop menor muito usado em rock e música eletrônica.', en: 'Minor loop widely used in rock and electronic music.' } },
  { id: 'i-VII-VI-V', degrees: [0, 6, 5, 4], mode: 'minor', names: { pt: 'i – VII – VI – V', en: 'i – VII – VI – V' }, note: { pt: 'Descida por graus conjuntos, o chamado "andaluz".', en: 'Stepwise descent, the so-called Andalusian cadence.' } },
  { id: 'iiø-V-i', degrees: [1, 4, 0], mode: 'minor', names: { pt: 'iiø – V – i', en: 'iiø – V – i' }, note: { pt: 'O ii-V-I menor, com meio diminuto no segundo grau.', en: 'The minor ii-V-i, with a half-diminished second degree.' } }
];

/** Progressões aplicáveis a um campo harmônico. */
export function progressionsFor(field) {
  const isMinor = MINOR_SCALES.has(field.scaleId);
  return PROGRESSIONS.filter((p) => (isMinor ? p.mode === 'minor' : p.mode === 'major'));
}

/** Realiza uma progressão: devolve os graus do campo na ordem indicada. */
export function realizeProgression(field, degreeIndexes) {
  return degreeIndexes.map((i) => field.degrees[i]).filter(Boolean);
}

/** Texto em algarismos romanos de uma sequência de graus. */
export function romanLine(field, degreeIndexes) {
  return degreeIndexes.map((i) => (field.degrees[i] ? field.degrees[i].roman : '?')).join(' – ');
}

/**
 * Relações entre acordes do campo: quantas notas dois graus compartilham.
 * Serve para explicar por que certos acordes se substituem.
 */
export function sharedNotes(a, b) {
  const pa = new Set(a.notes.map(pitchClass));
  const pb = new Set(b.notes.map(pitchClass));
  let n = 0;
  pa.forEach((pc) => { if (pb.has(pc)) n += 1; });
  return n;
}

/** Acordes do campo que compartilham ao menos duas notas com o grau dado. */
export function substitutesFor(field, index) {
  const target = field.degrees[index];
  return field.degrees
    .filter((d) => d.index !== index && sharedNotes(target, d) >= 2)
    .map((d) => ({ degree: d, shared: sharedNotes(target, d) }))
    .sort((x, y) => y.shared - x.shared);
}

/** Dominante secundário de um grau (V7/x): o acorde dominante da quinta acima. */
export function secondaryDominant(field, index) {
  const target = field.degrees[index];
  if (!target || index === 0) return null;
  const newRoot = transposeNote(target.root, parseDegree('5'), 1);
  return { chord: buildChord(newRoot, '7'), label: `V7/${target.roman}` };
}
