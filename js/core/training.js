/**
 * training.js — Gerador de exercícios de treinamento auditivo.
 *
 * Tudo aqui é puro: recebe um sorteador e devolve uma questão pronta
 * (o que tocar, as alternativas, a resposta e a explicação). Nenhuma
 * chamada de áudio ou de DOM, o que torna os exercícios testáveis.
 *
 * Formato da questão:
 * {
 *   id, exercise, level,
 *   prompt:  { pt, en },
 *   play:    { mode: 'sequence'|'chord'|'progression', midis, chords, stepSeconds },
 *   options: [{ id, label: { pt, en } }],
 *   answerId,
 *   explain: { pt, en }
 * }
 */

import { parseNote, toMidi, noteName, midiToNote } from './notes.js';
import { intervalName, intervalAbbr, parseDegree, transposeNote, intervalSemitones } from './intervals.js';
import { buildChord, chordSymbol, CHORD_TYPES } from './chords.js';
import { buildScale, scaleType, SCALE_TYPES } from './scales.js';
import { harmonicField } from './harmony.js';

export const LEVELS = [
  { id: 'easy', names: { pt: 'Fácil', en: 'Easy' } },
  { id: 'medium', names: { pt: 'Médio', en: 'Medium' } },
  { id: 'hard', names: { pt: 'Difícil', en: 'Hard' } }
];

export const EXERCISES = [
  { id: 'note', names: { pt: 'Notas', en: 'Notes' }, desc: { pt: 'Ouça uma nota e diga qual é.', en: 'Hear a note and name it.' } },
  { id: 'interval', names: { pt: 'Intervalos', en: 'Intervals' }, desc: { pt: 'Duas notas em sequência: qual é a distância?', en: 'Two notes in a row: what is the distance?' } },
  { id: 'chordQuality', names: { pt: 'Qualidade do acorde', en: 'Chord quality' }, desc: { pt: 'Maior, menor, diminuto, aumentado, suspenso.', en: 'Major, minor, diminished, augmented, suspended.' } },
  { id: 'seventh', names: { pt: 'Acordes com sétima', en: 'Seventh chords' }, desc: { pt: 'Distinga maj7, m7, 7, meio diminuto e diminuto.', en: 'Tell maj7, m7, 7, half-diminished and diminished apart.' } },
  { id: 'scale', names: { pt: 'Escalas', en: 'Scales' }, desc: { pt: 'Uma escala sobe: qual é?', en: 'A scale goes up: which one?' } },
  { id: 'degree', names: { pt: 'Graus da escala', en: 'Scale degrees' }, desc: { pt: 'Tônica, depois uma nota: que grau é?', en: 'Tonic, then a note: which degree is it?' } },
  { id: 'consonance', names: { pt: 'Consonância', en: 'Consonance' }, desc: { pt: 'Dois sons juntos: liso ou áspero?', en: 'Two sounds together: smooth or rough?' } },
  { id: 'progression', names: { pt: 'Progressões', en: 'Progressions' }, desc: { pt: 'Ouça a sequência e reconheça os graus.', en: 'Hear the sequence and recognise the degrees.' } },
  { id: 'key', names: { pt: 'Tonalidade', en: 'Key' }, desc: { pt: 'Uma cadência curta: qual é a tônica?', en: 'A short cadence: what is the tonic?' } }
];

/** Sorteador determinístico (útil nos testes). */
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickOne = (arr, rng) => arr[Math.floor(rng() * arr.length)];

function shuffle(arr, rng) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Sorteia n elementos distintos, sempre incluindo `must`. */
function sampleWith(must, pool, n, rng) {
  const rest = shuffle(pool.filter((x) => x !== must), rng).slice(0, Math.max(0, n - 1));
  return shuffle([must, ...rest], rng);
}

const ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#', 'Ab', 'Db'];
const EASY_ROOTS = ['C', 'F', 'G', 'D', 'A'];

function rootFor(level, rng) {
  return pickOne(level === 'easy' ? EASY_ROOTS : ROOTS, rng);
}

const bi = (pt, en) => ({ pt, en });

/* ------------------------------------------------------------------ *
 *  Exercícios
 * ------------------------------------------------------------------ */

const INTERVAL_POOL = {
  easy: ['P1', 'M3', 'P5', 'P8'],
  medium: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'M6', 'm7', 'P8'],
  hard: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
};

const CHORD_POOL = {
  easy: ['maj', 'min'],
  medium: ['maj', 'min', 'dim', 'aug'],
  hard: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4']
};

const SEVENTH_POOL = {
  easy: ['maj7', '7'],
  medium: ['maj7', 'm7', '7'],
  hard: ['maj7', 'm7', '7', 'm7b5', 'dim7']
};

const SCALE_POOL = {
  easy: ['major', 'naturalMinor'],
  medium: ['major', 'naturalMinor', 'harmonicMinor', 'pentaMajor', 'pentaMinor'],
  hard: ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor', 'pentaMajor', 'pentaMinor', 'dorian', 'mixolydian', 'lydian', 'blues', 'wholeTone']
};

const PROGRESSION_POOL = {
  easy: [[0, 3, 4, 0], [0, 4, 0]],
  medium: [[0, 3, 4, 0], [0, 4, 5, 3], [1, 4, 0], [5, 3, 0, 4]],
  hard: [[0, 3, 4, 0], [0, 4, 5, 3], [1, 4, 0], [5, 3, 0, 4], [0, 5, 1, 4], [0, 2, 3, 4]]
};

const ROMAN_LABEL = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

function intervalFromKey(key) {
  const quality = key.slice(0, key.length - 1);
  const number = parseInt(key.slice(-1), 10);
  return { number, quality };
}

function makeNoteQuestion(level, rng, nl) {
  const pool = level === 'easy'
    ? ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const answer = pickOne(pool, rng);
  const octave = level === 'hard' ? pickOne([3, 4, 5], rng) : 4;
  const midi = toMidi(parseNote(`${answer}${octave}`));
  const count = level === 'easy' ? 4 : 6;
  const options = sampleWith(answer, pool, count, rng).map((id) => ({
    id, label: bi(noteName(parseNote(id), { lang: nl }), noteName(parseNote(id), { lang: nl }))
  }));
  const name = noteName(parseNote(answer), { lang: nl });
  return {
    exercise: 'note', level,
    prompt: bi('Que nota é esta?', 'Which note is this?'),
    play: { mode: 'sequence', midis: [midi], stepSeconds: 1.2 },
    options, answerId: answer,
    explain: bi(
      `É ${name}${level === 'hard' ? ` na oitava ${octave}` : ''}. Compare com o Dó de referência se precisar de um ponto de apoio.`,
      `It is ${name}${level === 'hard' ? ` in octave ${octave}` : ''}. Compare it with a reference C if you need an anchor.`
    )
  };
}

function makeIntervalQuestion(level, rng, nl) {
  const pool = INTERVAL_POOL[level];
  const answer = pickOne(pool, rng);
  const iv = intervalFromKey(answer);
  const rootText = rootFor(level, rng);
  const low = parseNote(`${rootText}3`);
  const descending = level === 'hard' && rng() < 0.35;
  const high = transposeNote(low, iv, 1);
  const midis = descending ? [toMidi(high), toMidi(low)] : [toMidi(low), toMidi(high)];
  const options = sampleWith(answer, pool, Math.min(pool.length, level === 'easy' ? 4 : 6), rng)
    .map((id) => ({ id, label: bi(intervalName(intervalFromKey(id), 'pt'), intervalName(intervalFromKey(id), 'en')) }));
  const semis = intervalSemitones(iv.number, iv.quality);
  return {
    exercise: 'interval', level,
    prompt: descending
      ? bi('Duas notas descendo. Que intervalo é?', 'Two notes going down. Which interval is it?')
      : bi('Duas notas subindo. Que intervalo é?', 'Two notes going up. Which interval is it?'),
    play: { mode: 'sequence', midis, stepSeconds: 0.75 },
    options, answerId: answer,
    explain: bi(
      `${noteName(low, { lang: nl })} → ${noteName(high, { lang: nl })} são ${semis} semitons: ${intervalName(iv, 'pt')} (${intervalAbbr(iv, 'pt')}).`,
      `${noteName(low, { lang: nl })} → ${noteName(high, { lang: nl })} is ${semis} semitones: ${intervalName(iv, 'en')} (${intervalAbbr(iv, 'en')}).`
    )
  };
}

function chordLabel(id) {
  const type = CHORD_TYPES.find((t) => t.id === id);
  return bi(type.names.pt, type.names.en);
}

function makeChordQuestion(level, rng, nl, poolMap, exercise) {
  const pool = poolMap[level];
  const answer = pickOne(pool, rng);
  const rootText = rootFor(level, rng);
  const root = parseNote(`${rootText}3`);
  const inversion = level === 'hard' ? Math.floor(rng() * 2) : 0;
  const chord = buildChord(root, answer, { inversion });
  const options = sampleWith(answer, pool, Math.min(pool.length, 5), rng).map((id) => ({ id, label: chordLabel(id) }));
  const plain = buildChord(root, answer);
  return {
    exercise, level,
    prompt: bi('Que acorde é este?', 'Which chord is this?'),
    play: { mode: 'chord', midis: chord.notes.map(toMidi), stepSeconds: 0 },
    options, answerId: answer,
    explain: bi(
      `É ${chordSymbol(plain, { lang: nl })} — ${plain.notes.map((n) => noteName(n, { lang: nl })).join(' ')} (fórmula ${plain.degrees.join(' ')})${inversion ? `, tocado invertido` : ''}. A terça é o que decide entre maior e menor; a sétima dá a cor.`,
      `It is ${chordSymbol(plain, { lang: nl })} — ${plain.notes.map((n) => noteName(n, { lang: nl })).join(' ')} (formula ${plain.degrees.join(' ')})${inversion ? `, played inverted` : ''}. The third decides major vs minor; the seventh adds the colour.`
    )
  };
}

function makeScaleQuestion(level, rng, nl) {
  const pool = SCALE_POOL[level];
  const answer = pickOne(pool, rng);
  const rootText = rootFor(level, rng);
  const scale = buildScale(parseNote(`${rootText}4`), answer);
  const midis = scale.notes.map(toMidi);
  midis.push(midis[0] + 12);
  const options = sampleWith(answer, pool, Math.min(pool.length, 5), rng)
    .map((id) => ({ id, label: bi(scaleType(id).names.pt, scaleType(id).names.en) }));
  return {
    exercise: 'scale', level,
    prompt: bi('Que escala está tocando?', 'Which scale is playing?'),
    play: { mode: 'sequence', midis, stepSeconds: 0.32 },
    options, answerId: answer,
    explain: bi(
      `${scaleType(answer).names.pt} de ${noteName(scale.tonic, { lang: nl })}: ${scale.notes.map((n) => noteName(n, { lang: nl })).join(' ')}. Graus: ${scale.degrees.join(' ')}.`,
      `${scaleType(answer).names.en} on ${noteName(scale.tonic, { lang: nl })}: ${scale.notes.map((n) => noteName(n, { lang: nl })).join(' ')}. Degrees: ${scale.degrees.join(' ')}.`
    )
  };
}

function makeDegreeQuestion(level, rng, nl) {
  const rootText = rootFor(level, rng);
  const scaleId = level === 'easy' ? 'major' : pickOne(['major', 'naturalMinor'], rng);
  const scale = buildScale(parseNote(`${rootText}4`), scaleId);
  const maxDegree = level === 'easy' ? 5 : 7;
  const index = Math.floor(rng() * maxDegree);
  const answer = String(index + 1);
  const tonicChord = buildChord(scale.tonic, scaleId === 'major' ? 'maj' : 'min');
  const target = scale.notes[index];
  const pool = Array.from({ length: maxDegree }, (_, i) => String(i + 1));
  const options = pool.map((id) => ({ id, label: bi(`${id}º grau`, `degree ${id}`) }));
  return {
    exercise: 'degree', level,
    prompt: bi('Tocamos a tônica e depois uma nota. Que grau é ela?', 'We play the tonic, then a note. Which degree is it?'),
    play: {
      mode: 'sequence',
      midis: [...tonicChord.notes.map(toMidi), toMidi(target)],
      chordFirst: tonicChord.notes.map(toMidi),
      stepSeconds: 0.5
    },
    options, answerId: answer,
    explain: bi(
      `A tônica é ${noteName(scale.tonic, { lang: nl })} e a nota tocada é ${noteName(target, { lang: nl })}: ${answer}º grau (${scale.degrees[index]}).`,
      `The tonic is ${noteName(scale.tonic, { lang: nl })} and the note played is ${noteName(target, { lang: nl })}: degree ${answer} (${scale.degrees[index]}).`
    )
  };
}

function makeConsonanceQuestion(level, rng, nl) {
  const consonant = ['P1', 'P5', 'P8', 'M3', 'm3', 'M6'];
  const dissonant = ['m2', 'M7', 'A4', 'M2', 'm7'];
  const isConsonant = rng() < 0.5;
  const key = pickOne(isConsonant ? consonant : dissonant, rng);
  const iv = intervalFromKey(key);
  const low = parseNote(`${rootFor(level, rng)}3`);
  const high = transposeNote(low, iv, 1);
  const answer = isConsonant ? 'consonant' : 'dissonant';
  return {
    exercise: 'consonance', level,
    prompt: bi('Estes dois sons juntos soam mais lisos ou mais ásperos?', 'Do these two sounds together feel smoother or rougher?'),
    play: { mode: 'chord', midis: [toMidi(low), toMidi(high)], stepSeconds: 0 },
    options: [
      { id: 'consonant', label: bi('Mais liso (consonante)', 'Smoother (consonant)') },
      { id: 'dissonant', label: bi('Mais áspero (dissonante)', 'Rougher (dissonant)') }
    ],
    answerId: answer,
    explain: bi(
      `Era ${intervalName(iv, 'pt')} (${intervalAbbr(iv, 'pt')}). ${isConsonant ? 'Razão de frequências simples, poucos batimentos entre harmônicos.' : 'Razão complexa: os harmônicos ficam perto demais e produzem aspereza.'} Lembre que isso é tendência acústica, não regra musical.`,
      `It was a ${intervalName(iv, 'en')} (${intervalAbbr(iv, 'en')}). ${isConsonant ? 'Simple frequency ratio, little beating between harmonics.' : 'Complex ratio: the harmonics land too close and produce roughness.'} Remember this is an acoustic tendency, not a musical rule.`
    )
  };
}

function makeProgressionQuestion(level, rng, nl) {
  const pool = PROGRESSION_POOL[level];
  const answerDegrees = pickOne(pool, rng);
  const rootText = rootFor(level, rng);
  const field = harmonicField(parseNote(`${rootText}3`), 'major');
  const chords = answerDegrees.map((i) => field.degrees[i].notes.map(toMidi));
  const key = answerDegrees.join('-');
  const options = sampleWith(key, pool.map((p) => p.join('-')), Math.min(pool.length, 4), rng)
    .map((id) => {
      const label = id.split('-').map((i) => ROMAN_LABEL[Number(i)]).join(' – ');
      return { id, label: bi(label, label) };
    });
  const names = answerDegrees.map((i) => chordSymbol(field.degrees[i].chord, { lang: nl })).join(' – ');
  return {
    exercise: 'progression', level,
    prompt: bi('Que sequência de graus você ouviu?', 'Which sequence of degrees did you hear?'),
    play: { mode: 'progression', chords, beatsPerChord: 2 },
    options, answerId: key,
    explain: bi(
      `Em ${noteName(field.tonic, { lang: nl })} maior era ${names} — ou seja, ${answerDegrees.map((i) => ROMAN_LABEL[i]).join(' – ')}. Ouça o baixo: ele desenha o movimento dos graus.`,
      `In ${noteName(field.tonic, { lang: nl })} major it was ${names} — that is, ${answerDegrees.map((i) => ROMAN_LABEL[i]).join(' – ')}. Listen to the bass: it traces the degree movement.`
    )
  };
}

function makeKeyQuestion(level, rng, nl) {
  const pool = level === 'easy' ? EASY_ROOTS : ROOTS;
  const answer = pickOne(pool, rng);
  const minor = level !== 'easy' && rng() < 0.4;
  const field = harmonicField(parseNote(`${answer}3`), minor ? 'naturalMinor' : 'major');
  // Cadência IV – V – I (ou iv – v – i), que fixa o centro tonal.
  const chords = [3, 4, 0].map((i) => field.degrees[i].notes.map(toMidi));
  const options = sampleWith(answer, pool, Math.min(pool.length, level === 'easy' ? 4 : 6), rng)
    .map((id) => ({ id, label: bi(noteName(parseNote(id), { lang: nl }), noteName(parseNote(id), { lang: nl })) }));
  return {
    exercise: 'key', level,
    prompt: bi('Uma cadência curta. Qual é a tônica?', 'A short cadence. What is the tonic?'),
    play: { mode: 'progression', chords, beatsPerChord: 2 },
    options, answerId: answer,
    explain: bi(
      `A cadência era ${chords.length === 3 ? 'IV – V – I' : ''} em ${noteName(field.tonic, { lang: nl })}${minor ? ' menor' : ' maior'}. O último acorde é o repouso: é ele que revela a tônica.`,
      `The cadence was IV – V – I in ${noteName(field.tonic, { lang: nl })}${minor ? ' minor' : ' major'}. The last chord is the point of rest: that is what reveals the tonic.`
    )
  };
}

/**
 * Gera uma questão.
 * @param {string} exercise id de EXERCISES
 * @param {string} level 'easy' | 'medium' | 'hard'
 * @param {{rng?: Function, noteLang?: 'pt'|'en'}} opts
 */
export function makeQuestion(exercise, level = 'easy', opts = {}) {
  const rng = opts.rng || Math.random;
  const nl = opts.noteLang || 'pt';
  let q;
  switch (exercise) {
    case 'note': q = makeNoteQuestion(level, rng, nl); break;
    case 'interval': q = makeIntervalQuestion(level, rng, nl); break;
    case 'chordQuality': q = makeChordQuestion(level, rng, nl, CHORD_POOL, 'chordQuality'); break;
    case 'seventh': q = makeChordQuestion(level, rng, nl, SEVENTH_POOL, 'seventh'); break;
    case 'scale': q = makeScaleQuestion(level, rng, nl); break;
    case 'degree': q = makeDegreeQuestion(level, rng, nl); break;
    case 'consonance': q = makeConsonanceQuestion(level, rng, nl); break;
    case 'progression': q = makeProgressionQuestion(level, rng, nl); break;
    case 'key': q = makeKeyQuestion(level, rng, nl); break;
    default: throw new Error(`Exercício desconhecido: ${exercise}`);
  }
  q.id = `${exercise}-${level}-${Math.floor(rng() * 1e9).toString(36)}`;
  return q;
}

/** Estatísticas acumuladas a partir do histórico salvo. */
export function summarize(history) {
  const total = history.length;
  const correct = history.filter((h) => h.correct).length;
  const byExercise = {};
  for (const h of history) {
    if (!byExercise[h.exercise]) byExercise[h.exercise] = { total: 0, correct: 0 };
    byExercise[h.exercise].total += 1;
    if (h.correct) byExercise[h.exercise].correct += 1;
  }
  const last20 = history.slice(0, 20);
  return {
    total,
    correct,
    accuracy: total ? correct / total : 0,
    recentAccuracy: last20.length ? last20.filter((h) => h.correct).length / last20.length : 0,
    byExercise,
    streak: streakOf(history)
  };
}

/** Sequência de acertos mais recente (o histórico vem do mais novo para o mais velho). */
function streakOf(history) {
  let n = 0;
  for (const h of history) {
    if (!h.correct) break;
    n += 1;
  }
  return n;
}
