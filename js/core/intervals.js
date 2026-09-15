/**
 * intervals.js — Intervalos musicais com grafia correta.
 *
 * Um intervalo tem DUAS dimensões independentes:
 *  - o NÚMERO (2ª, 3ª, 7ª...), que vem da distância entre as LETRAS;
 *  - a QUALIDADE (justa, maior, menor, aumentada, diminuta), que vem da
 *    diferença entre os semitons reais e os semitons da referência diatônica.
 * Por isso Dó→Mi♭ (3ª menor, 3 semitons) e Dó→Ré♯ (2ª aumentada, 3 semitons)
 * soam igual mas NÃO são o mesmo intervalo.
 */

import { LETTERS, LETTER_SEMITONES, toMidi, note, noteName, midiToNote } from './notes.js';

/** Qualidades possíveis, da mais estreita para a mais larga. */
export const QUALITIES = ['dd', 'd', 'm', 'M', 'A', 'AA', 'P'];

export const QUALITY_NAMES = {
  P: { pt: 'justa', en: 'perfect', abbr: 'J', abbrEn: 'P' },
  M: { pt: 'maior', en: 'major', abbr: 'M', abbrEn: 'M' },
  m: { pt: 'menor', en: 'minor', abbr: 'm', abbrEn: 'm' },
  A: { pt: 'aumentada', en: 'augmented', abbr: 'A', abbrEn: 'A' },
  AA: { pt: 'duplamente aumentada', en: 'doubly augmented', abbr: 'AA', abbrEn: 'AA' },
  d: { pt: 'diminuta', en: 'diminished', abbr: 'd', abbrEn: 'd' },
  dd: { pt: 'duplamente diminuta', en: 'doubly diminished', abbr: 'dd', abbrEn: 'dd' }
};

const ORDINAL_PT = ['', 'uníssono', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sétima', 'oitava',
  'nona', 'décima', 'décima primeira', 'décima segunda', 'décima terceira', 'décima quarta', 'décima quinta'];
const ORDINAL_EN = ['', 'unison', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'octave',
  'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth'];

/** Números que admitem qualidade "justa" (1, 4, 5, 8, 11, 12, 15...). */
export function isPerfectNumber(number) {
  const d = (Math.abs(number) - 1) % 7;
  return d === 0 || d === 3 || d === 4;
}

/** Semitons da versão justa/maior de um número de intervalo. */
export function baseSemitones(number) {
  const n = Math.abs(number);
  const d = (n - 1) % 7;
  const octaves = Math.floor((n - 1) / 7);
  return [0, 2, 4, 5, 7, 9, 11][d] + 12 * octaves;
}

/** Semitons de um intervalo {number, quality}. */
export function intervalSemitones(number, quality) {
  const base = baseSemitones(number);
  const perfect = isPerfectNumber(number);
  const offsets = perfect
    ? { dd: -2, d: -1, P: 0, A: 1, AA: 2 }
    : { dd: -3, d: -2, m: -1, M: 0, A: 1, AA: 2 };
  const off = offsets[quality];
  if (off === undefined) throw new Error(`Qualidade inválida para ${number}ª: ${quality}`);
  return base + off;
}

/** Qualidade a partir do número e dos semitons reais. */
export function qualityFromSemitones(number, semitones) {
  const diff = semitones - baseSemitones(number);
  if (isPerfectNumber(number)) {
    return { '-2': 'dd', '-1': 'd', 0: 'P', 1: 'A', 2: 'AA' }[String(diff)] || null;
  }
  return { '-3': 'dd', '-2': 'd', '-1': 'm', 0: 'M', 1: 'A', 2: 'AA' }[String(diff)] || null;
}

/**
 * Intervalo entre duas notas grafadas (a → b).
 * Retorna { number, quality, semitones, direction }.
 * direction = +1 ascendente, -1 descendente, 0 uníssono.
 */
export function intervalBetween(a, b) {
  const semis = toMidi(b) - toMidi(a);
  const letterDist = (LETTERS.indexOf(b.letter) - LETTERS.indexOf(a.letter)) + 7 * (b.octave - a.octave);
  const number = Math.abs(letterDist) + 1;
  const quality = qualityFromSemitones(number, Math.abs(semis));
  let direction = 0;
  if (letterDist !== 0) direction = Math.sign(letterDist);
  else if (semis !== 0) direction = Math.sign(semis);
  return { number, quality, semitones: semis, direction };
}

/** Nome do intervalo. */
export function intervalName(iv, lang = 'pt') {
  const n = iv.number;
  const q = QUALITY_NAMES[iv.quality];
  if (!q) return '?';
  if (lang === 'pt') {
    const ord = ORDINAL_PT[n] || `${n}ª`;
    if (n === 1 && iv.quality === 'P') return 'uníssono';
    const feminine = q.pt;
    return `${ord} ${feminine}`;
  }
  const ord = ORDINAL_EN[n] || `${n}th`;
  return `${q.en} ${ord}`;
}

/** Abreviação usual: J5, M3, m7, A4, d5... (P5, M3, m7 em inglês). */
export function intervalAbbr(iv, lang = 'pt') {
  const q = QUALITY_NAMES[iv.quality];
  const letter = lang === 'pt' ? q.abbr : q.abbrEn;
  return `${letter}${iv.number}`;
}

/** Intervalo simples (reduzido a uma oitava) correspondente. */
export function simpleInterval(iv) {
  if (iv.number <= 8) return { ...iv };
  let number = iv.number;
  let semitones = Math.abs(iv.semitones);
  while (number > 8) {
    number -= 7;
    semitones -= 12;
  }
  return { number, quality: iv.quality, semitones, direction: iv.direction };
}

export function isCompound(iv) {
  return iv.number > 8;
}

/** Inversão do intervalo simples: 9 − número, qualidade espelhada. */
export function invertInterval(iv) {
  const simple = simpleInterval(iv);
  const number = 9 - simple.number;
  const map = { P: 'P', M: 'm', m: 'M', A: 'd', d: 'A', AA: 'dd', dd: 'AA' };
  const quality = map[simple.quality];
  return { number, quality, semitones: intervalSemitones(number, quality), direction: 1 };
}

/**
 * Lê uma cifra de grau: "1", "b3", "#5", "bb7", "13", "#11".
 * Retorna { number, quality }.
 */
export function parseDegree(text) {
  const m = /^([#b]*)(\d+)$/.exec(String(text).trim());
  if (!m) throw new Error(`Grau inválido: ${text}`);
  const number = parseInt(m[2], 10);
  // Partimos da referência diatônica (justa ou maior) e aplicamos cada acidente.
  let semis = baseSemitones(number);
  for (const ch of m[1]) semis += ch === '#' ? 1 : -1;
  const quality = qualityFromSemitones(number, semis);
  if (!quality) throw new Error(`Grau fora do alcance: ${text}`);
  return { number, quality };
}

/** Escreve o grau em cifra a partir de {number, quality}. */
export function degreeLabel(iv) {
  const diff = intervalSemitones(iv.number, iv.quality) - baseSemitones(iv.number);
  const sign = diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff);
  return `${sign}${iv.number}`;
}

/**
 * Transpõe uma nota por um intervalo.
 * A letra é determinada pelo NÚMERO; a alteração é ajustada para bater com os semitons.
 * @param {object} n nota
 * @param {{number:number, quality:string}} iv
 * @param {number} dir +1 ascendente, -1 descendente
 */
export function transposeNote(n, iv, dir = 1) {
  const steps = (iv.number - 1) * dir;
  const idx = LETTERS.indexOf(n.letter) + steps;
  const newLetter = LETTERS[((idx % 7) + 7) % 7];
  const octaveShift = Math.floor(idx / 7);
  const newOctave = n.octave + octaveShift;
  const targetMidi = toMidi(n) + intervalSemitones(iv.number, iv.quality) * dir;
  const naturalMidi = (newOctave + 1) * 12 + LETTER_SEMITONES[newLetter];
  return note(newLetter, targetMidi - naturalMidi, newOctave);
}

/**
 * Transpõe por semitons escolhendo a grafia mais simples (um acidente no máximo).
 * Para transposição que preserva grafia diatônica, use transposeNote com um intervalo.
 */
export function transposeBySemitones(n, semitones, preferFlats = false) {
  return midiToNote(toMidi(n) + semitones, preferFlats);
}

/** Descrições didáticas curtas de cada intervalo simples. */
export const INTERVAL_NOTES = {
  'P1': { pt: 'Mesma altura. Razão 1:1, fusão total.', en: 'Same pitch. 1:1 ratio, total fusion.' },
  'm2': { pt: 'O menor passo do sistema temperado. Muito dissonante, cria tensão de condução.', en: 'Smallest step in equal temperament. Very dissonant, strong leading tension.' },
  'M2': { pt: 'Passo de tom inteiro. Dissonância suave, típica de escalas.', en: 'Whole-tone step. Mild dissonance, typical of scales.' },
  'm3': { pt: 'Terça menor (~6:5). Define o caráter menor do acorde.', en: 'Minor third (~6:5). Defines the minor quality.' },
  'M3': { pt: 'Terça maior (~5:4). Define o caráter maior, som brilhante.', en: 'Major third (~5:4). Defines the major quality, bright sound.' },
  'P4': { pt: 'Quarta justa (~4:3). Consonante, mas ambígua sobre a fundamental.', en: 'Perfect fourth (~4:3). Consonant but ambiguous about the root.' },
  'A4': { pt: 'Trítono. Três tons inteiros, razão complexa, forte instabilidade.', en: 'Tritone. Three whole tones, complex ratio, strong instability.' },
  'd5': { pt: 'Trítono grafado como quinta diminuta, típico do acorde diminuto.', en: 'Tritone spelled as diminished fifth, typical of diminished chords.' },
  'P5': { pt: 'Quinta justa (~3:2). A consonância mais forte depois da oitava.', en: 'Perfect fifth (~3:2). Strongest consonance after the octave.' },
  'm6': { pt: 'Sexta menor (~8:5). Inversão da terça maior.', en: 'Minor sixth (~8:5). Inversion of the major third.' },
  'M6': { pt: 'Sexta maior (~5:3). Inversão da terça menor, som doce.', en: 'Major sixth (~5:3). Inversion of the minor third, sweet sound.' },
  'm7': { pt: 'Sétima menor (~16:9 ou 7:4). Tensão característica do acorde dominante.', en: 'Minor seventh (~16:9 or 7:4). Characteristic dominant tension.' },
  'M7': { pt: 'Sétima maior (~15:8). Tensão suave e "colorida", típica do jazz.', en: 'Major seventh (~15:8). Soft, colourful tension, typical of jazz.' },
  'P8': { pt: 'Oitava (2:1). Mesma classe de altura em registro diferente.', en: 'Octave (2:1). Same pitch class in a different register.' }
};

/** Chave "M3" a partir do intervalo. */
export function intervalKey(iv) {
  const s = simpleInterval(iv);
  return `${s.quality}${s.number}`;
}

/** Texto pronto para exibir: "Dó → Mi: terça maior (M3, 4 semitons)". */
export function describeInterval(a, b, lang = 'pt') {
  const iv = intervalBetween(a, b);
  const abbr = intervalAbbr(iv, lang);
  const semis = Math.abs(iv.semitones);
  const sem = lang === 'pt' ? `${semis} semitom${semis === 1 ? '' : 's'}` : `${semis} semitone${semis === 1 ? '' : 's'}`;
  return `${noteName(a, { lang })} → ${noteName(b, { lang })}: ${intervalName(iv, lang)} (${abbr}, ${sem})`;
}
