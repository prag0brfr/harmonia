/**
 * notes.js — Notas, classes de altura, números MIDI e frequências.
 * notes.js — Notes, pitch classes, MIDI numbers and frequencies.
 *
 * Conceitos distintos tratados aqui (ver seção 12 da especificação):
 *  - NOTA GRAFADA (spelled note): letra + alteração + oitava. Dó# e Réb são
 *    notas diferentes, mesmo soando igual.
 *  - CLASSE DE ALTURA (pitch class): 0..11, ignora oitava e grafia.
 *  - FREQUÊNCIA: número em hertz, depende da afinação de referência.
 */

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Semitons de cada letra dentro da oitava (Dó = 0). */
export const LETTER_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Nomes em português (sistema de solfejo latino). */
export const LETTER_PT = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };

/** Símbolos de alteração. Evitamos os glifos duplos U+1D12A/B por falta de suporte tipográfico. */
export const ACCIDENTALS = {
  '-2': { symbol: '♭♭', ascii: 'bb', pt: 'dobrado bemol', en: 'double flat' },
  '-1': { symbol: '♭', ascii: 'b', pt: 'bemol', en: 'flat' },
  '0': { symbol: '', ascii: '', pt: 'natural', en: 'natural' },
  '1': { symbol: '♯', ascii: '#', pt: 'sustenido', en: 'sharp' },
  '2': { symbol: '♯♯', ascii: '##', pt: 'dobrado sustenido', en: 'double sharp' }
};

export const DEFAULT_A4 = 440;

/**
 * Cria uma nota grafada.
 * @param {string} letter A..G
 * @param {number} alter  -2..+2 (semitons de alteração)
 * @param {number} octave oitava científica (Dó4 = Dó central = MIDI 60)
 */
export function note(letter, alter = 0, octave = 4) {
  const L = String(letter).toUpperCase();
  if (!(L in LETTER_SEMITONES)) throw new Error(`Letra inválida: ${letter}`);
  return { letter: L, alter, octave };
}

/** Índice diatônico da letra (C=0 .. B=6). */
export function letterIndex(n) {
  return LETTERS.indexOf(n.letter);
}

/**
 * Número MIDI da nota. Dó4 = 60, Lá4 = 69.
 * A fórmula é puramente aritmética: (oitava + 1) * 12 + semitons da letra + alteração.
 */
export function toMidi(n) {
  return (n.octave + 1) * 12 + LETTER_SEMITONES[n.letter] + n.alter;
}

/** Classe de altura 0..11 (sempre positiva, mesmo para notas muito graves). */
export function pitchClass(n) {
  return ((toMidi(n) % 12) + 12) % 12;
}

/**
 * Frequência em hertz a partir do número MIDI, em temperamento igual.
 *   f = a4 * 2^((m - 69) / 12)
 */
export function midiToFreq(midi, a4 = DEFAULT_A4) {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** Frequência de uma nota grafada. */
export function freq(n, a4 = DEFAULT_A4) {
  return midiToFreq(toMidi(n), a4);
}

/** Converte frequência em número MIDI fracionário (útil para afinação/análise). */
export function freqToMidi(f, a4 = DEFAULT_A4) {
  return 69 + 12 * Math.log2(f / a4);
}

/** Grafias preferidas por classe de altura, usando sustenidos. */
const SHARP_SPELLING = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]
];
/** Grafias preferidas por classe de altura, usando bemóis. */
const FLAT_SPELLING = [
  ['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0],
  ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0]
];

/**
 * Converte um número MIDI em nota grafada.
 * Como um mesmo som admite várias grafias, escolhemos sustenidos ou bemóis.
 */
export function midiToNote(midi, preferFlats = false) {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const [letter, alter] = (preferFlats ? FLAT_SPELLING : SHARP_SPELLING)[pc];
  // A grafia pode empurrar a nota para a oitava vizinha (ex.: Si# soa como Dó).
  const naive = note(letter, alter, octave);
  const diff = midi - toMidi(naive);
  if (diff !== 0) naive.octave += Math.round(diff / 12);
  return naive;
}

/**
 * Lê um nome de nota. Aceita notação internacional e portuguesa:
 *   "C4", "C#4", "Db", "F##3", "Dó#4", "Sib3", "Lá4"
 * Oitava ausente assume 4.
 */
export function parseNote(text, defaultOctave = 4) {
  let s = String(text).trim();
  if (!s) return null;
  s = s.replace(/♯/g, '#').replace(/♭/g, 'b').replace(/♮/g, '');

  let letter = null;
  let rest = '';

  // Nomes em português (mais longos primeiro, para "Sol" não virar "Si").
  const ptEntries = Object.entries(LETTER_PT).sort((a, b) => b[1].length - a[1].length);
  const normalized = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const [L, ptName] of ptEntries) {
    const ptPlain = ptName.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (normalized.startsWith(ptPlain)) {
      letter = L;
      rest = s.slice(ptName.length);
      break;
    }
  }
  if (!letter) {
    const m = /^([A-Ga-g])(.*)$/.exec(s);
    if (!m) return null;
    letter = m[1].toUpperCase();
    rest = m[2];
  }

  let alter = 0;
  let i = 0;
  while (i < rest.length && (rest[i] === '#' || rest[i] === 'b' || rest[i] === 'x')) {
    if (rest[i] === '#') alter += 1;
    else if (rest[i] === 'x') alter += 2;
    else alter -= 1;
    i += 1;
  }
  const octText = rest.slice(i).trim();
  const octave = octText === '' ? defaultOctave : parseInt(octText, 10);
  if (Number.isNaN(octave)) return null;
  return note(letter, alter, octave);
}

/**
 * Nome legível da nota.
 * @param {object} n
 * @param {{lang?: 'pt'|'en', octave?: boolean, ascii?: boolean}} opts
 */
export function noteName(n, opts = {}) {
  const { lang = 'en', octave = false, ascii = false } = opts;
  const base = lang === 'pt' ? LETTER_PT[n.letter] : n.letter;
  const acc = ACCIDENTALS[String(n.alter)];
  const accText = acc ? (ascii ? acc.ascii : acc.symbol) : '';
  return base + accText + (octave ? String(n.octave) : '');
}

/** Nome da classe de altura, sem oitava. */
export function pcName(n, lang = 'en') {
  return noteName(n, { lang, octave: false });
}

/**
 * Grafias enarmônicas alternativas para a mesma altura.
 * Limitamos a alterações de -2..+2 e descartamos grafias exóticas demais.
 */
export function enharmonics(n, { maxAlter = 2 } = {}) {
  const midi = toMidi(n);
  const out = [];
  for (const letter of LETTERS) {
    for (let octave = n.octave - 1; octave <= n.octave + 1; octave += 1) {
      const natural = (octave + 1) * 12 + LETTER_SEMITONES[letter];
      const alter = midi - natural;
      if (Math.abs(alter) <= maxAlter) {
        const cand = note(letter, alter, octave);
        if (!(cand.letter === n.letter && cand.alter === n.alter && cand.octave === n.octave)) {
          out.push(cand);
        }
      }
    }
  }
  // Grafias mais simples primeiro.
  return out.sort((a, b) => Math.abs(a.alter) - Math.abs(b.alter));
}

/** Melhor alternativa enarmônica "usual" (alteração simples), ou null. */
export function simpleEnharmonic(n) {
  return enharmonics(n).find((c) => Math.abs(c.alter) <= 1 && c.alter !== n.alter) || null;
}

/** Duas notas soam iguais? */
export function sameSound(a, b) {
  return toMidi(a) === toMidi(b);
}

/** Duas notas têm a mesma grafia? */
export function sameSpelling(a, b) {
  return a.letter === b.letter && a.alter === b.alter && a.octave === b.octave;
}

/** Ordena notas por altura real. */
export function sortByPitch(list) {
  return [...list].sort((a, b) => toMidi(a) - toMidi(b));
}

/**
 * Razões da entonação justa (afinação justa) para cada distância em semitons,
 * usando as razões mais simples tradicionalmente associadas a cada intervalo.
 */
export const JUST_RATIOS = [
  [1, 1], [16, 15], [9, 8], [6, 5], [5, 4], [4, 3],
  [45, 32], [3, 2], [8, 5], [5, 3], [16, 9], [15, 8], [2, 1]
];

/**
 * Frequência em afinação justa, relativa a uma tônica.
 * @param {number} tonicFreq frequência da tônica em hertz
 * @param {number} semitones distância em semitons (pode passar de 12)
 */
export function justFreq(tonicFreq, semitones) {
  const octaves = Math.floor(semitones / 12);
  const within = semitones - octaves * 12;
  const [num, den] = JUST_RATIOS[within];
  return tonicFreq * (num / den) * Math.pow(2, octaves);
}

/** Diferença em cents entre duas frequências. */
export function cents(f1, f2) {
  return 1200 * Math.log2(f2 / f1);
}

/** Lista de todas as 12 classes de altura grafadas, para menus. */
export function chromaticRoots(preferFlats = false) {
  return Array.from({ length: 12 }, (_, pc) => midiToNote(60 + pc, preferFlats));
}
