/**
 * chords.js — Fórmulas, construção e identificação de acordes.
 *
 * Um acorde é descrito por uma FÓRMULA em graus ("1 3 5 b7"). A partir da
 * fundamental grafada, cada grau vira um intervalo e, portanto, uma nota com
 * grafia correta (Dó7 = Dó Mi Sol Si♭, e não Dó Mi Sol Lá♯).
 */

import { note, toMidi, pitchClass, noteName, midiToNote, sortByPitch } from './notes.js';
import {
  parseDegree, degreeLabel, intervalSemitones, transposeNote,
  intervalBetween, intervalAbbr, intervalName, simpleInterval
} from './intervals.js';

/**
 * Catálogo de tipos de acorde.
 *  id       — identificador estável
 *  formula  — graus em relação à fundamental
 *  symbol   — sufixo da cifra (ex.: "m7", "7", "maj7")
 *  names    — nome por extenso em pt/en
 *  category — para agrupar no menu
 *  weightless — graus que podem faltar sem prejuízo grave na identificação
 */
export const CHORD_TYPES = [
  // --- Tríades ---
  { id: 'maj', formula: ['1', '3', '5'], symbol: '', names: { pt: 'maior', en: 'major' }, category: 'triads' },
  { id: 'min', formula: ['1', 'b3', '5'], symbol: 'm', names: { pt: 'menor', en: 'minor' }, category: 'triads' },
  { id: 'dim', formula: ['1', 'b3', 'b5'], symbol: '°', names: { pt: 'diminuto', en: 'diminished' }, category: 'triads' },
  { id: 'aug', formula: ['1', '3', '#5'], symbol: '+', names: { pt: 'aumentado', en: 'augmented' }, category: 'triads' },
  { id: 'sus2', formula: ['1', '2', '5'], symbol: 'sus2', names: { pt: 'suspenso de segunda', en: 'suspended 2nd' }, category: 'triads' },
  { id: 'sus4', formula: ['1', '4', '5'], symbol: 'sus4', names: { pt: 'suspenso de quarta', en: 'suspended 4th' }, category: 'triads' },
  { id: '5', formula: ['1', '5'], symbol: '5', names: { pt: 'quinta (power chord)', en: 'power chord' }, category: 'triads' },

  // --- Sextas ---
  { id: '6', formula: ['1', '3', '5', '6'], symbol: '6', names: { pt: 'maior com sexta', en: 'major sixth' }, category: 'sixths' },
  { id: 'm6', formula: ['1', 'b3', '5', '6'], symbol: 'm6', names: { pt: 'menor com sexta', en: 'minor sixth' }, category: 'sixths' },
  { id: '69', formula: ['1', '3', '5', '6', '9'], symbol: '6/9', names: { pt: 'sexta com nona', en: 'six-nine' }, category: 'sixths' },

  // --- Sétimas ---
  { id: 'maj7', formula: ['1', '3', '5', '7'], symbol: 'maj7', names: { pt: 'com sétima maior', en: 'major seventh' }, category: 'sevenths' },
  { id: 'm7', formula: ['1', 'b3', '5', 'b7'], symbol: 'm7', names: { pt: 'menor com sétima', en: 'minor seventh' }, category: 'sevenths' },
  { id: '7', formula: ['1', '3', '5', 'b7'], symbol: '7', names: { pt: 'com sétima dominante', en: 'dominant seventh' }, category: 'sevenths' },
  { id: 'm7b5', formula: ['1', 'b3', 'b5', 'b7'], symbol: 'm7♭5', names: { pt: 'meio diminuto', en: 'half-diminished' }, category: 'sevenths' },
  { id: 'dim7', formula: ['1', 'b3', 'b5', 'bb7'], symbol: '°7', names: { pt: 'diminuto com sétima diminuta', en: 'diminished seventh' }, category: 'sevenths' },
  { id: 'mMaj7', formula: ['1', 'b3', '5', '7'], symbol: 'm(maj7)', names: { pt: 'menor com sétima maior', en: 'minor major seventh' }, category: 'sevenths' },
  { id: 'maj7#5', formula: ['1', '3', '#5', '7'], symbol: 'maj7♯5', names: { pt: 'sétima maior com quinta aumentada', en: 'major seventh sharp five' }, category: 'sevenths' },
  { id: '7sus4', formula: ['1', '4', '5', 'b7'], symbol: '7sus4', names: { pt: 'sétima com quarta suspensa', en: 'dominant seventh suspended 4th' }, category: 'sevenths' },

  // --- Nonas, décimas primeiras, décimas terceiras ---
  { id: '9', formula: ['1', '3', '5', 'b7', '9'], symbol: '9', names: { pt: 'com nona (dominante)', en: 'dominant ninth' }, category: 'extended' },
  { id: 'maj9', formula: ['1', '3', '5', '7', '9'], symbol: 'maj9', names: { pt: 'com nona maior', en: 'major ninth' }, category: 'extended' },
  { id: 'm9', formula: ['1', 'b3', '5', 'b7', '9'], symbol: 'm9', names: { pt: 'menor com nona', en: 'minor ninth' }, category: 'extended' },
  { id: 'add9', formula: ['1', '3', '5', '9'], symbol: 'add9', names: { pt: 'com nona acrescentada', en: 'added ninth' }, category: 'extended' },
  { id: '11', formula: ['1', '3', '5', 'b7', '9', '11'], symbol: '11', names: { pt: 'com décima primeira', en: 'eleventh' }, category: 'extended' },
  { id: 'm11', formula: ['1', 'b3', '5', 'b7', '9', '11'], symbol: 'm11', names: { pt: 'menor com décima primeira', en: 'minor eleventh' }, category: 'extended' },
  { id: 'maj11', formula: ['1', '3', '5', '7', '9', '11'], symbol: 'maj11', names: { pt: 'com décima primeira maior', en: 'major eleventh' }, category: 'extended' },
  { id: '13', formula: ['1', '3', '5', 'b7', '9', '13'], symbol: '13', names: { pt: 'com décima terceira', en: 'thirteenth' }, category: 'extended' },
  { id: 'maj13', formula: ['1', '3', '5', '7', '9', '13'], symbol: 'maj13', names: { pt: 'com décima terceira maior', en: 'major thirteenth' }, category: 'extended' },
  { id: 'm13', formula: ['1', 'b3', '5', 'b7', '9', '13'], symbol: 'm13', names: { pt: 'menor com décima terceira', en: 'minor thirteenth' }, category: 'extended' },

  // --- Alterados ---
  { id: '7b5', formula: ['1', '3', 'b5', 'b7'], symbol: '7♭5', names: { pt: 'sétima com quinta diminuta', en: 'seventh flat five' }, category: 'altered' },
  { id: '7#5', formula: ['1', '3', '#5', 'b7'], symbol: '7♯5', names: { pt: 'sétima com quinta aumentada', en: 'seventh sharp five' }, category: 'altered' },
  { id: '7b9', formula: ['1', '3', '5', 'b7', 'b9'], symbol: '7♭9', names: { pt: 'sétima com nona menor', en: 'seventh flat nine' }, category: 'altered' },
  { id: '7#9', formula: ['1', '3', '5', 'b7', '#9'], symbol: '7♯9', names: { pt: 'sétima com nona aumentada', en: 'seventh sharp nine' }, category: 'altered' },
  { id: '7#11', formula: ['1', '3', '5', 'b7', '#11'], symbol: '7♯11', names: { pt: 'sétima com décima primeira aumentada', en: 'seventh sharp eleven' }, category: 'altered' },
  { id: '7b13', formula: ['1', '3', '5', 'b7', 'b13'], symbol: '7♭13', names: { pt: 'sétima com décima terceira menor', en: 'seventh flat thirteen' }, category: 'altered' },
  { id: '7alt', formula: ['1', '3', 'b7', 'b9', '#9', 'b13'], symbol: '7alt', names: { pt: 'dominante alterado', en: 'altered dominant' }, category: 'altered' },
  { id: 'maj7#11', formula: ['1', '3', '5', '7', '#11'], symbol: 'maj7♯11', names: { pt: 'sétima maior com décima primeira aumentada', en: 'major seventh sharp eleven' }, category: 'altered' }
];

export const CHORD_CATEGORIES = {
  triads: { pt: 'Tríades', en: 'Triads' },
  sixths: { pt: 'Sextas', en: 'Sixths' },
  sevenths: { pt: 'Sétimas', en: 'Sevenths' },
  extended: { pt: 'Extensões', en: 'Extensions' },
  altered: { pt: 'Alterados', en: 'Altered' }
};

const TYPE_BY_ID = new Map(CHORD_TYPES.map((t) => [t.id, t]));

export function chordType(id) {
  const t = TYPE_BY_ID.get(id);
  if (!t) throw new Error(`Tipo de acorde desconhecido: ${id}`);
  return t;
}

/** Peso de cada grau na identificação: a terça e a sétima definem o acorde. */
function degreeWeight(deg) {
  const n = parseDegree(deg).number;
  if (n === 1) return 1.0;
  if (n === 3 || n === 2 || n === 4) return 1.0; // terça (ou a nota suspensa que a substitui)
  if (n === 7) return 0.95;
  if (n === 5) return 0.45;   // a quinta justa é a nota mais dispensável
  if (n === 6) return 0.8;
  return 0.65;                 // 9, 11, 13 e alterações
}

/**
 * Constrói o acorde a partir da fundamental grafada.
 * @param {object} root nota grafada (a oitava importa)
 * @param {string} typeId id do tipo
 * @param {{inversion?: number, drop?: boolean}} opts
 * @returns {{root, type, notes: Array, degrees: string[], intervals: Array, inversion:number}}
 */
export function buildChord(root, typeId, opts = {}) {
  const type = chordType(typeId);
  const degrees = type.formula;
  const intervals = degrees.map(parseDegree);
  let notes = intervals.map((iv) => transposeNote(root, iv, 1));
  const inversion = opts.inversion || 0;
  if (inversion > 0) notes = invertNotes(notes, inversion);
  return { root, type, typeId, notes, degrees, intervals, inversion };
}

/**
 * Inverte um acorde subindo as `n` notas mais graves uma oitava.
 * 1ª inversão = terça no baixo, 2ª = quinta no baixo, 3ª = sétima no baixo.
 */
export function invertNotes(notes, n) {
  const out = sortByPitch(notes);
  for (let i = 0; i < n; i += 1) {
    const first = out.shift();
    out.push({ ...first, octave: first.octave + 1 });
  }
  return sortByPitch(out);
}

/** Cifra completa: "C", "Am7", "G7♭9", com baixo quando invertido. */
export function chordSymbol(chord, { lang = 'en', ascii = false } = {}) {
  const rootName = noteName(chord.root, { lang: lang === 'pt' ? 'pt' : 'en', ascii });
  const base = rootName + chord.type.symbol;
  const bass = sortByPitch(chord.notes)[0];
  if (bass && toMidi(bass) % 12 !== toMidi(chord.root) % 12) {
    return `${base}/${noteName(bass, { lang: lang === 'pt' ? 'pt' : 'en', ascii })}`;
  }
  return base;
}

/** Nome por extenso: "Dó maior com sétima menor". */
export function chordFullName(chord, lang = 'en') {
  const rootName = noteName(chord.root, { lang });
  return `${rootName} ${chord.type.names[lang] || chord.type.names.pt}`;
}

/** Fórmula legível: "1 - 3 - 5 - b7". */
export function chordFormula(chord) {
  return chord.degrees.join(' - ');
}

/** Conjunto de classes de altura (0..11) relativas à fundamental. */
export function typeOffsets(type) {
  return type.formula.map((d) => {
    const iv = parseDegree(d);
    return ((intervalSemitones(iv.number, iv.quality) % 12) + 12) % 12;
  });
}

/** Distribui o acorde em oitavas contíguas, útil para tocar. */
export function chordMidis(chord) {
  return sortByPitch(chord.notes).map(toMidi);
}

/**
 * Qual inversão está soando, dada a nota mais grave.
 * Retorna { index, label } onde index 0 = posição fundamental.
 */
export function inversionOf(chord) {
  const sorted = sortByPitch(chord.notes);
  const bassPc = pitchClass(sorted[0]);
  const idx = chord.intervals.findIndex((iv, i) => {
    const pc = ((pitchClass(chord.root) + intervalSemitones(iv.number, iv.quality)) % 12 + 12) % 12;
    return pc === bassPc;
  });
  return idx < 0 ? 0 : idx;
}

export const INVERSION_NAMES = [
  { pt: 'posição fundamental', en: 'root position' },
  { pt: '1ª inversão (terça no baixo)', en: '1st inversion (third in the bass)' },
  { pt: '2ª inversão (quinta no baixo)', en: '2nd inversion (fifth in the bass)' },
  { pt: '3ª inversão (sétima no baixo)', en: '3rd inversion (seventh in the bass)' },
  { pt: '4ª inversão (nona no baixo)', en: '4th inversion (ninth in the bass)' },
  { pt: '5ª inversão', en: '5th inversion' }
];

/* ------------------------------------------------------------------ *
 *  IDENTIFICAÇÃO DE ACORDES
 * ------------------------------------------------------------------ */

/**
 * Identifica acordes possíveis para um conjunto de notas.
 *
 * Estratégia:
 *  1. Reduzimos as notas a classes de altura (o acorde independe da oitava).
 *  2. Testamos cada classe presente como candidata a fundamental.
 *  3. Para cada tipo do catálogo, comparamos os graus esperados com os presentes,
 *     somando pesos: terça e sétima valem muito, quinta justa vale pouco.
 *  4. Notas extras (não previstas na fórmula) descontam pontos.
 *  5. O baixo real define a inversão e dá um pequeno bônus à posição fundamental.
 *
 * Limitação honesta: sem contexto tonal, conjuntos simétricos (diminutos,
 * aumentados) admitem várias leituras igualmente válidas. Nesses casos
 * devolvemos todas e sinalizamos ambiguidade.
 *
 * @param {Array} notes notas grafadas selecionadas (com oitava)
 * @param {{forcedRoot?: object, limit?: number, lang?: string}} opts
 */
export function identifyChords(notes, opts = {}) {
  const { forcedRoot = null, limit = 8 } = opts;
  const sorted = sortByPitch(notes);
  if (sorted.length < 2) return { results: [], warning: 'tooFew', pcs: [] };

  const bass = sorted[0];
  const pcs = [...new Set(sorted.map(pitchClass))].sort((a, b) => a - b);
  const pcSet = new Set(pcs);

  const candidateRoots = forcedRoot
    ? [forcedRoot]
    : sorted.filter((n, i, arr) => arr.findIndex((m) => pitchClass(m) === pitchClass(n)) === i);

  const results = [];
  for (const rootNote of candidateRoots) {
    const rootPc = pitchClass(rootNote);
    for (const type of CHORD_TYPES) {
      const expected = type.formula.map((deg) => {
        const iv = parseDegree(deg);
        return {
          deg,
          iv,
          pc: (((rootPc + intervalSemitones(iv.number, iv.quality)) % 12) + 12) % 12,
          weight: degreeWeight(deg)
        };
      });
      const totalWeight = expected.reduce((s, e) => s + e.weight, 0);
      const matched = expected.filter((e) => pcSet.has(e.pc));
      const missing = expected.filter((e) => !pcSet.has(e.pc));
      // A fundamental precisa estar presente, salvo se o usuário a fixou.
      if (!forcedRoot && !pcSet.has(rootPc)) continue;
      const covered = new Set(expected.map((e) => e.pc));
      const extra = pcs.filter((pc) => !covered.has(pc));

      const matchedWeight = matched.reduce((s, e) => s + e.weight, 0);
      let score = matchedWeight / totalWeight;
      score -= extra.length * 0.30;
      // Pequeno bônus quando o baixo é a própria fundamental.
      if (pitchClass(bass) === rootPc) score += 0.05;
      // Penaliza fórmulas muito maiores do que o conjunto informado.
      if (missing.length > 0) score -= 0.12 * missing.length;
      if (score <= 0.34) continue;

      const inversionIndex = expected.findIndex((e) => e.pc === pitchClass(bass));
      results.push({
        rootNote,
        typeId: type.id,
        type,
        score: Math.max(0, Math.min(1, score)),
        matched: matched.map((e) => e.deg),
        missing: missing.map((e) => e.deg),
        extra,
        inversion: inversionIndex < 0 ? 0 : inversionIndex,
        bass,
        exact: missing.length === 0 && extra.length === 0
      });
    }
  }

  results.sort((a, b) => b.score - a.score || a.type.formula.length - b.type.formula.length);

  // Remove duplicatas (mesma fundamental + mesmo tipo).
  const seen = new Set();
  const unique = results.filter((r) => {
    const key = `${pitchClass(r.rootNote)}:${r.typeId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Todas as leituras exatas entram (é aí que mora a ambiguidade real);
  // das aproximadas mostramos só as duas melhores, senão um simples C7
  // apareceria acompanhado de C9, C7♭9, C7♯9, C7♯11, C7♭13... todas "quase".
  const exacts = unique.filter((r) => r.exact);
  const approx = unique.filter((r) => !r.exact).slice(0, exacts.length ? 2 : limit);
  const top = [...exacts, ...approx].slice(0, limit);
  let warning = null;
  if (!top.length) warning = 'noMatch';
  else if (!top.some((r) => r.exact)) warning = 'approximate';
  else if (top.filter((r) => r.exact).length > 1) warning = 'ambiguous';

  return { results: top, warning, pcs, bass };
}

/**
 * Explica, em texto, por que um resultado foi identificado.
 * @returns {{lines: string[]}}
 */
export function explainResult(result, lang = 'en') {
  const lines = [];
  const rn = noteName(result.rootNote, { lang });
  const pt = lang === 'pt';
  lines.push(pt
    ? `Tomando ${rn} como fundamental, as notas formam os graus ${result.matched.join(', ')}.`
    : `Taking ${rn} as the root, the notes form degrees ${result.matched.join(', ')}.`);
  if (result.missing.length) {
    lines.push(pt
      ? `Faltam os graus ${result.missing.join(', ')} — comum quando a quinta é omitida ou o acorde está incompleto.`
      : `Degrees ${result.missing.join(', ')} are missing — common when the fifth is omitted or the chord is incomplete.`);
  }
  if (result.extra.length) {
    lines.push(pt
      ? `Há ${result.extra.length} nota(s) fora da fórmula, o que reduz a confiança.`
      : `There are ${result.extra.length} note(s) outside the formula, which lowers confidence.`);
  }
  if (result.inversion > 0) {
    lines.push(pt
      ? `O baixo é ${noteName(result.bass, { lang })}, logo o acorde está em ${INVERSION_NAMES[result.inversion].pt}.`
      : `The bass is ${noteName(result.bass, { lang })}, so the chord is in ${INVERSION_NAMES[result.inversion].en}.`);
  } else {
    lines.push(pt ? 'O baixo é a própria fundamental: posição fundamental.' : 'The bass is the root itself: root position.');
  }
  return { lines };
}

/** Intervalos da fundamental até cada nota, para exibição. */
export function chordIntervalTable(chord, lang = 'en') {
  return sortByPitch(chord.notes).map((n) => {
    const iv = intervalBetween(chord.root, n);
    return {
      note: n,
      name: noteName(n, { lang, octave: true }),
      abbr: intervalAbbr(iv, lang),
      full: intervalName(iv, lang),
      semitones: Math.abs(iv.semitones)
    };
  });
}

/** Todas as inversões possíveis de um acorde. */
export function allInversions(chord) {
  const count = chord.notes.length;
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    notes: invertNotes(chord.notes, i),
    name: INVERSION_NAMES[Math.min(i, INVERSION_NAMES.length - 1)]
  }));
}

/** Procura o tipo cujo conjunto de semitons bate exatamente (sem considerar grafia). */
export function typeFromOffsets(offsets) {
  const target = [...new Set(offsets.map((o) => ((o % 12) + 12) % 12))].sort((a, b) => a - b).join(',');
  return CHORD_TYPES.find((t) => [...new Set(typeOffsets(t))].sort((a, b) => a - b).join(',') === target) || null;
}

/** Constrói um acorde a partir de uma cifra simples, ex.: "Am7", "G7", "Dó#m". */
export function parseChordSymbol(text, parseNoteFn) {
  const s = String(text).trim();
  const m = /^([A-Ga-g](?:#|b|♯|♭)?|(?:D[óo]|R[ée]|Mi|F[áa]|Sol|L[áa]|Si)(?:#|b|♯|♭)?)(.*)$/.exec(s);
  if (!m) return null;
  const root = parseNoteFn(m[1]);
  if (!root) return null;
  const suffix = m[2].trim();
  const type = CHORD_TYPES.find((t) => t.symbol.toLowerCase() === suffix.toLowerCase())
    || CHORD_TYPES.find((t) => t.id.toLowerCase() === suffix.toLowerCase());
  if (!type) return null;
  return buildChord(root, type.id);
}
