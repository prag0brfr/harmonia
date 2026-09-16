/**
 * transpose.js — Transposição de notas, acordes e progressões.
 *
 * Transpor não é somar semitons: Dó maior subido um tom vira Ré maior, e
 * Dó♯ menor subido uma terça menor vira Mi menor — mas Ré♭ maior subido uma
 * terça menor vira Fá♭? Não: vira Mi maior, porque na prática trocamos a
 * grafia quando ela fica impraticável. Aqui:
 *
 *  1. transpomos pelo INTERVALO (preservando a lógica de letras);
 *  2. se o resultado tiver acidente duplo, buscamos a enarmonia simples.
 */

import {
  LETTERS, toMidi, note, noteName, midiToNote, parseNote, simpleEnharmonic
} from './notes.js';
import {
  transposeNote, parseDegree, qualityFromSemitones, intervalSemitones,
  intervalBetween, intervalName, intervalAbbr
} from './intervals.js';
import { CHORD_TYPES } from './chords.js';

/** Intervalos ascendentes mais naturais para cada distância em semitons. */
const SEMITONE_INTERVALS = [
  { number: 1, quality: 'P' }, { number: 2, quality: 'm' }, { number: 2, quality: 'M' },
  { number: 3, quality: 'm' }, { number: 3, quality: 'M' }, { number: 4, quality: 'P' },
  { number: 4, quality: 'A' }, { number: 5, quality: 'P' }, { number: 6, quality: 'm' },
  { number: 6, quality: 'M' }, { number: 7, quality: 'm' }, { number: 7, quality: 'M' },
  { number: 8, quality: 'P' }
];
/** Versão preferida quando o destino tende a bemóis (trítono como 5ª diminuta). */
const SEMITONE_INTERVALS_FLAT = SEMITONE_INTERVALS.map((iv, i) => (i === 6 ? { number: 5, quality: 'd' } : iv));

/** Intervalo correspondente a uma distância em semitons (0..12). */
export function intervalForSemitones(semitones, preferFlats = false) {
  const s = ((semitones % 12) + 12) % 12;
  return (preferFlats ? SEMITONE_INTERVALS_FLAT : SEMITONE_INTERVALS)[s];
}

/**
 * Intervalo que leva de uma tônica a outra, respeitando as letras.
 * Dó → Mi♭ dá terça menor; Dó → Fá♯ dá quarta aumentada.
 */
export function intervalForKeyChange(from, to) {
  const letterDist = ((LETTERS.indexOf(to.letter) - LETTERS.indexOf(from.letter)) + 7) % 7;
  const number = letterDist + 1;
  const semis = ((toMidi(to) - toMidi(from)) % 12 + 12) % 12;
  const quality = qualityFromSemitones(number, semis);
  if (!quality) return intervalForSemitones(semis);
  return { number, quality };
}

/** Simplifica grafias impraticáveis (Fá♭♭, Sol♯♯) para a enarmonia usual. */
export function simplifySpelling(n) {
  if (Math.abs(n.alter) <= 1) return n;
  const alt = simpleEnharmonic(n);
  return alt || n;
}

/** Transpõe uma nota por um intervalo, simplificando grafias extremas. */
export function transposeNoteByInterval(n, iv, dir = 1) {
  return simplifySpelling(transposeNote(n, iv, dir));
}

/** Transpõe por semitons (positivo sobe, negativo desce). */
export function transposeNoteBySemitones(n, semitones, preferFlats = false) {
  const dir = semitones >= 0 ? 1 : -1;
  const abs = Math.abs(semitones);
  const octaves = Math.floor(abs / 12);
  const iv = intervalForSemitones(abs % 12, preferFlats);
  const moved = transposeNoteByInterval(n, iv, dir);
  moved.octave += dir * octaves;
  return moved;
}

/* ------------------------------------------------------------------ *
 *  CIFRAS
 * ------------------------------------------------------------------ */

const PT_ROOTS = ['Dó', 'Do', 'Ré', 'Re', 'Mi', 'Fá', 'Fa', 'Sol', 'Lá', 'La', 'Si'];

/**
 * Separa uma cifra em fundamental, sufixo e baixo.
 * Aceita "C", "Am7", "G7/B", "Dó#m", "Sib maj7".
 * O sufixo NÃO precisa estar no catálogo: transpor "Cmaj7(#11)" funciona.
 * @returns {{root, suffix, bass}|null}
 */
export function parseChordToken(text) {
  const raw = String(text).trim();
  if (!raw) return null;

  const ptPattern = PT_ROOTS.slice().sort((a, b) => b.length - a.length).join('|');
  const re = new RegExp(`^(${ptPattern}|[A-Ga-g])([#b♯♭x]*)(.*)$`);
  const m = re.exec(raw);
  if (!m) return null;

  const root = parseNote(m[1] + m[2].replace(/♯/g, '#').replace(/♭/g, 'b'));
  if (!root) return null;

  let rest = m[3];
  let bass = null;
  const slash = rest.lastIndexOf('/');
  if (slash >= 0) {
    const bassText = rest.slice(slash + 1).trim();
    const parsed = parseNote(bassText);
    if (parsed) {
      bass = parsed;
      rest = rest.slice(0, slash);
    }
  }
  return { root, suffix: rest.trim(), bass };
}

/** Escreve a cifra de volta como texto. */
export function chordTokenText(token, { lang = 'en' } = {}) {
  const base = noteName(token.root, { lang }) + token.suffix;
  return token.bass ? `${base}/${noteName(token.bass, { lang })}` : base;
}

/** Transpõe uma cifra por um intervalo. */
export function transposeChordToken(token, iv, dir = 1) {
  return {
    root: transposeNoteByInterval(token.root, iv, dir),
    suffix: token.suffix,
    bass: token.bass ? transposeNoteByInterval(token.bass, iv, dir) : null
  };
}

/**
 * Transpõe uma linha inteira de cifras, preservando separadores.
 * "C | Am | F G" continua com as barras no lugar.
 * @returns {{tokens: Array<{text:string, chord:object|null}>}}
 */
export function transposeLine(text, iv, dir = 1, { lang = 'en' } = {}) {
  const parts = String(text).split(/(\s+|\|)/);
  const out = parts.map((part) => {
    if (/^\s*$/.test(part) || part === '|') return { text: part, chord: null };
    const token = parseChordToken(part);
    if (!token) return { text: part, chord: null };
    const moved = transposeChordToken(token, iv, dir);
    return { text: chordTokenText(moved, { lang }), chord: moved, original: token };
  });
  return { tokens: out, text: out.map((x) => x.text).join('') };
}

/** Lê uma linha de cifras sem transpor (para exibir lado a lado). */
export function readLine(text) {
  return String(text).split(/(\s+|\|)/).map((part) => {
    if (/^\s*$/.test(part) || part === '|') return { text: part, chord: null };
    const token = parseChordToken(part);
    return { text: part, chord: token };
  });
}

/** Tipo de acorde do catálogo correspondente a um sufixo, se houver. */
export function typeForSuffix(suffix) {
  const s = suffix.trim().toLowerCase().replace(/♭/g, 'b').replace(/♯/g, '#');
  return CHORD_TYPES.find((t) => t.symbol.toLowerCase().replace(/♭/g, 'b').replace(/♯/g, '#') === s)
    || CHORD_TYPES.find((t) => t.id.toLowerCase() === s)
    || (s === '' ? CHORD_TYPES[0] : null);
}

/** Notas MIDI tocáveis de uma cifra, quando o sufixo é reconhecido. */
export function tokenMidis(token, octave = 3) {
  const type = typeForSuffix(token.suffix);
  if (!type) return null;
  const root = { ...token.root, octave };
  const notes = type.formula.map((d) => transposeNote(root, parseDegree(d), 1));
  const midis = notes.map(toMidi);
  if (token.bass) {
    const bassMidi = toMidi({ ...token.bass, octave: octave - 1 });
    midis.unshift(bassMidi);
  }
  return midis.sort((a, b) => a - b);
}

/** Descrição curta do salto aplicado, para mostrar na interface. */
export function describeShift(iv, dir, lang = 'en') {
  const dirWord = dir > 0
    ? (lang === 'pt' ? 'acima' : 'up')
    : (lang === 'pt' ? 'abaixo' : 'down');
  return `${intervalName(iv, lang)} ${dirWord} (${intervalAbbr(iv, lang)}, ${intervalSemitones(iv.number, iv.quality)} ${lang === 'pt' ? 'semitons' : 'semitones'})`;
}
