/**
 * scales.js — Escalas e modos.
 *
 * Cada escala é definida por uma FÓRMULA em graus, e não por uma lista de
 * semitons. Isso garante a grafia correta: a escala de Fá maior traz Si♭
 * (e nunca Lá♯), porque o grau 4 precisa ser a letra Si.
 */

import { toMidi, noteName, midiToNote, note } from './notes.js';
import { parseDegree, transposeNote, intervalSemitones, intervalAbbr, intervalBetween } from './intervals.js';

export const SCALE_TYPES = [
  {
    id: 'major',
    formula: ['1', '2', '3', '4', '5', '6', '7'],
    names: { pt: 'Maior (jônio)', en: 'Major (Ionian)' },
    category: 'basic',
    use: {
      pt: 'A escala de referência da música tonal ocidental. Base do campo harmônico maior.',
      en: 'The reference scale of Western tonal music. Basis of the major harmonic field.'
    }
  },
  {
    id: 'naturalMinor',
    formula: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    names: { pt: 'Menor natural (eólio)', en: 'Natural minor (Aeolian)' },
    category: 'basic',
    use: { pt: 'Som menor "puro". Relativa menor de uma escala maior.', en: 'Pure minor sound. Relative minor of a major scale.' }
  },
  {
    id: 'harmonicMinor',
    formula: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    names: { pt: 'Menor harmônica', en: 'Harmonic minor' },
    category: 'basic',
    use: {
      pt: 'Eleva o 7º grau para criar sensível e um V maior. Gera a 2ª aumentada entre b6 e 7.',
      en: 'Raises the 7th to create a leading tone and a major V. Produces the augmented 2nd between b6 and 7.'
    }
  },
  {
    id: 'melodicMinor',
    formula: ['1', '2', 'b3', '4', '5', '6', '7'],
    names: { pt: 'Menor melódica', en: 'Melodic minor' },
    category: 'basic',
    use: { pt: 'Menor com 6 e 7 maiores; no jazz é usada subindo e descendo.', en: 'Minor with major 6th and 7th; in jazz used both ascending and descending.' }
  },
  {
    id: 'pentaMajor',
    formula: ['1', '2', '3', '5', '6'],
    names: { pt: 'Pentatônica maior', en: 'Major pentatonic' },
    category: 'pentatonic',
    use: { pt: 'Sem semitons: quase não gera atrito. Muito usada em melodia e improviso.', en: 'No semitones: almost no friction. Very common in melody and improvisation.' }
  },
  {
    id: 'pentaMinor',
    formula: ['1', 'b3', '4', '5', 'b7'],
    names: { pt: 'Pentatônica menor', en: 'Minor pentatonic' },
    category: 'pentatonic',
    use: { pt: 'Base do blues e do rock. Relativa da pentatônica maior.', en: 'Foundation of blues and rock. Relative of the major pentatonic.' }
  },
  {
    id: 'blues',
    formula: ['1', 'b3', '4', 'b5', '5', 'b7'],
    names: { pt: 'Blues', en: 'Blues' },
    category: 'pentatonic',
    use: { pt: 'Pentatônica menor com a "blue note" b5 de passagem.', en: 'Minor pentatonic with the passing b5 blue note.' }
  },
  {
    id: 'wholeTone',
    formula: ['1', '2', '3', '#4', '#5', 'b7'],
    names: { pt: 'Tons inteiros', en: 'Whole tone' },
    category: 'symmetric',
    use: { pt: 'Só tons inteiros: simétrica, sem centro claro. Som impressionista.', en: 'Whole tones only: symmetric, no clear centre. Impressionist sound.' }
  },
  {
    id: 'dimWH',
    formula: ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'],
    names: { pt: 'Diminuta (tom–semitom)', en: 'Diminished (whole–half)' },
    category: 'symmetric',
    use: { pt: 'Oito notas alternando tom e semitom. Combina com acordes diminutos.', en: 'Eight notes alternating whole and half steps. Fits diminished chords.' }
  },
  {
    id: 'dimHW',
    formula: ['1', 'b2', 'b3', '3', '#4', '5', '6', 'b7'],
    names: { pt: 'Diminuta (semitom–tom)', en: 'Diminished (half–whole)' },
    category: 'symmetric',
    use: { pt: 'Usada sobre dominantes com b9 e #9.', en: 'Used over dominants with b9 and #9.' }
  },
  {
    id: 'chromatic',
    formula: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'],
    names: { pt: 'Cromática', en: 'Chromatic' },
    category: 'symmetric',
    use: { pt: 'Todos os doze semitons. Serve para passagens e cromatismos.', en: 'All twelve semitones. Used for passing tones and chromaticism.' }
  },

  // --- Modos gregos ---
  { id: 'ionian', formula: ['1', '2', '3', '4', '5', '6', '7'], names: { pt: 'Jônio', en: 'Ionian' }, category: 'modes', parent: 'major', degree: 1, use: { pt: 'Idêntico à escala maior. Som estável e "resolvido".', en: 'Identical to the major scale. Stable, resolved sound.' } },
  { id: 'dorian', formula: ['1', '2', 'b3', '4', '5', '6', 'b7'], names: { pt: 'Dórico', en: 'Dorian' }, category: 'modes', parent: 'major', degree: 2, use: { pt: 'Menor com 6ª maior: menos sombrio que o eólio. Jazz modal, funk.', en: 'Minor with major 6th: brighter than Aeolian. Modal jazz, funk.' } },
  { id: 'phrygian', formula: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], names: { pt: 'Frígio', en: 'Phrygian' }, category: 'modes', parent: 'major', degree: 3, use: { pt: 'A b2 dá cor espanhola/flamenca e forte tensão.', en: 'The b2 gives a Spanish/flamenco colour and strong tension.' } },
  { id: 'lydian', formula: ['1', '2', '3', '#4', '5', '6', '7'], names: { pt: 'Lídio', en: 'Lydian' }, category: 'modes', parent: 'major', degree: 4, use: { pt: 'Maior com #4: som flutuante, muito usado em trilhas.', en: 'Major with #4: floating sound, common in film scores.' } },
  { id: 'mixolydian', formula: ['1', '2', '3', '4', '5', '6', 'b7'], names: { pt: 'Mixolídio', en: 'Mixolydian' }, category: 'modes', parent: 'major', degree: 5, use: { pt: 'Maior com b7: a escala natural do acorde dominante.', en: 'Major with b7: the natural scale of the dominant chord.' } },
  { id: 'aeolian', formula: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], names: { pt: 'Eólio', en: 'Aeolian' }, category: 'modes', parent: 'major', degree: 6, use: { pt: 'Idêntico à menor natural.', en: 'Identical to the natural minor.' } },
  { id: 'locrian', formula: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], names: { pt: 'Lócrio', en: 'Locrian' }, category: 'modes', parent: 'major', degree: 7, use: { pt: 'Único modo com quinta diminuta: instável, usado sobre m7♭5.', en: 'The only mode with a diminished fifth: unstable, used over m7♭5.' } }
];

export const SCALE_CATEGORIES = {
  basic: { pt: 'Principais', en: 'Core' },
  pentatonic: { pt: 'Pentatônicas e blues', en: 'Pentatonic & blues' },
  symmetric: { pt: 'Simétricas', en: 'Symmetric' },
  modes: { pt: 'Modos gregos', en: 'Greek modes' }
};

const SCALE_BY_ID = new Map(SCALE_TYPES.map((s) => [s.id, s]));

export function scaleType(id) {
  const s = SCALE_BY_ID.get(id);
  if (!s) throw new Error(`Escala desconhecida: ${id}`);
  return s;
}

/**
 * Constrói a escala a partir da tônica grafada.
 * @returns {{tonic, type, notes: Array, degrees: string[]}}
 */
export function buildScale(tonic, typeId) {
  const type = scaleType(typeId);
  const notes = type.formula.map((d) => transposeNote(tonic, parseDegree(d), 1));
  return { tonic, type, typeId, notes, degrees: type.formula };
}

/** Escala com a oitava incluída no fim (útil para tocar). */
export function scaleWithOctave(scale) {
  const last = { ...scale.tonic, octave: scale.tonic.octave + 1 };
  return [...scale.notes, last];
}

/** Semitons acumulados de cada grau. */
export function scaleOffsets(typeId) {
  return scaleType(typeId).formula.map((d) => {
    const iv = parseDegree(d);
    return intervalSemitones(iv.number, iv.quality);
  });
}

/** Passos entre graus consecutivos, em semitons (T = 2, S = 1). */
export function scaleSteps(typeId) {
  const offs = scaleOffsets(typeId);
  const steps = [];
  for (let i = 1; i < offs.length; i += 1) steps.push(offs[i] - offs[i - 1]);
  steps.push(12 - offs[offs.length - 1]);
  return steps;
}

/** Passos escritos como T/S (ou W/H em inglês). */
export function stepPattern(typeId, lang = 'en') {
  const tone = lang === 'pt' ? 'T' : 'W';
  const semi = lang === 'pt' ? 'S' : 'H';
  return scaleSteps(typeId).map((s) => {
    if (s === 2) return tone;
    if (s === 1) return semi;
    if (s === 3) return lang === 'pt' ? 'T+S' : 'W+H';
    return String(s);
  }).join(' - ');
}

/** A nota pertence à escala? Compara classes de altura. */
export function scaleContains(scale, n) {
  const pcs = new Set(scale.notes.map((x) => ((toMidi(x) % 12) + 12) % 12));
  return pcs.has(((toMidi(n) % 12) + 12) % 12);
}

/** Grau da nota dentro da escala (1..n) ou null. */
export function degreeOf(scale, n) {
  const pc = ((toMidi(n) % 12) + 12) % 12;
  const idx = scale.notes.findIndex((x) => ((toMidi(x) % 12) + 12) % 12 === pc);
  return idx < 0 ? null : idx + 1;
}

/** Cifra do grau da nota na escala ("b3", "5"). */
export function degreeLabelOf(scale, n) {
  const idx = degreeOf(scale, n);
  return idx ? scale.degrees[idx - 1] : null;
}

/** Notas da escala em uma oitava específica, em ordem ascendente contínua. */
export function scaleNotesInOctave(scale, octave) {
  let prev = -Infinity;
  return scale.notes.map((n) => {
    const shifted = { ...n, octave: n.octave - scale.tonic.octave + octave };
    let midi = toMidi(shifted);
    while (midi <= prev) {
      shifted.octave += 1;
      midi = toMidi(shifted);
    }
    prev = midi;
    return shifted;
  });
}

/** Lista legível das notas. */
export function scaleNoteNames(scale, lang = 'en') {
  return scale.notes.map((n) => noteName(n, { lang }));
}
