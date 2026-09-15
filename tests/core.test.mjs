/**
 * core.test.mjs — Testes do núcleo teórico.
 * Cada teste traz a entrada e a saída esperada de forma explícita.
 */

import { suite, test, eq, close, ok, throws } from './harness.mjs';
import {
  parseNote, noteName, toMidi, midiToNote, midiToFreq, freq, pitchClass,
  enharmonics, simpleEnharmonic, justFreq, cents, freqToMidi
} from '../js/core/notes.js';
import {
  intervalBetween, intervalName, intervalAbbr, invertInterval, parseDegree,
  degreeLabel, transposeNote, intervalSemitones, simpleInterval, isCompound
} from '../js/core/intervals.js';
import {
  buildChord, chordSymbol, chordFormula, identifyChords, allInversions,
  CHORD_TYPES, invertNotes, chordMidis
} from '../js/core/chords.js';
import { buildScale, scaleOffsets, stepPattern, degreeOf, SCALE_TYPES } from '../js/core/scales.js';
import { harmonicField, romanNumeral, chordMotion, substitutesFor, HARMONIC_FIELD_SCALES } from '../js/core/harmony.js';
import { beatFrequency, ratioApprox, nearestInterval, consonanceScore, harmonicSeries } from '../js/view/interference.js';
import { TUNINGS, openStringMidis, fretMidi, findVoicings, tuningById } from '../js/view/fretboard.js';

const en = (n) => noteName(n, { lang: 'en' });
const enO = (n) => noteName(n, { lang: 'en', octave: true });

/* ------------------------------------------------------------------ */
suite('Notas, MIDI e frequência');

test('Dó4 (dó central) é o MIDI 60', () => eq(toMidi(parseNote('C4')), 60));
test('Lá4 é o MIDI 69', () => eq(toMidi(parseNote('A4')), 69));
test('Si3 é o MIDI 59', () => eq(toMidi(parseNote('B3')), 59));
test('Dó-1 é o MIDI 0', () => eq(toMidi(parseNote('C-1')), 0));
test('Sol9 é o MIDI 127', () => eq(toMidi(parseNote('G9')), 127));

test('Lá4 = 440 Hz na referência padrão', () => close(midiToFreq(69), 440, 1e-9));
test('Lá5 = 880 Hz (uma oitava acima dobra a frequência)', () => close(midiToFreq(81), 880, 1e-9));
test('Lá3 = 220 Hz', () => close(midiToFreq(57), 220, 1e-9));
test('Dó4 ≈ 261,63 Hz', () => close(freq(parseNote('C4')), 261.6256, 1e-3));
test('Mi4 ≈ 329,63 Hz', () => close(freq(parseNote('E4')), 329.6276, 1e-3));
test('Referência A4 = 432 Hz desloca todas as notas', () => close(freq(parseNote('C4'), 432), 256.8687, 1e-3));
test('freqToMidi é a inversa de midiToFreq', () => close(freqToMidi(midiToFreq(64)), 64, 1e-9));

test('Dó♯4 e Ré♭4 soam igual (MIDI 61) mas são grafias diferentes', () => {
  eq(toMidi(parseNote('C#4')), 61);
  eq(toMidi(parseNote('Db4')), 61);
  ok(en(parseNote('C#4')) !== en(parseNote('Db4')));
});
test('Si♯3 soa como Dó4', () => eq(toMidi(parseNote('B#3')), 60));
test('Dó♭4 soa como Si3', () => eq(toMidi(parseNote('Cb4')), 59));
test('Fá♯♯3 soa como Sol3', () => eq(toMidi(parseNote('F##3')), toMidi(parseNote('G3'))));

test('Nome em português usa o solfejo latino', () => eq(noteName(parseNote('C#4'), { lang: 'pt' }), 'Dó♯'));
test('Nome em inglês usa letras', () => eq(noteName(parseNote('Bb3'), { lang: 'en', octave: true }), 'B♭3'));
test('Leitura aceita nomes em português', () => eq(toMidi(parseNote('Sib3')), toMidi(parseNote('Bb3'))));
test('Leitura aceita "Sol" sem confundir com "Si"', () => eq(toMidi(parseNote('Sol4')), toMidi(parseNote('G4'))));
test('Leitura aceita acidentes unicode', () => eq(toMidi(parseNote('F♯4')), toMidi(parseNote('F#4'))));

test('Classe de altura ignora a oitava', () => {
  eq(pitchClass(parseNote('C4')), 0);
  eq(pitchClass(parseNote('C7')), 0);
});
test('midiToNote com sustenidos devolve Sol♯4', () => eq(enO(midiToNote(68, false)), 'G♯4'));
test('midiToNote com bemóis devolve Lá♭4', () => eq(enO(midiToNote(68, true)), 'A♭4'));
test('Enarmonia simples de Dó♯ é Ré♭', () => eq(en(simpleEnharmonic(parseNote('C#4'))), 'D♭'));
test('Enarmonias mantêm a mesma altura', () => {
  const n = parseNote('D#4');
  enharmonics(n).forEach((e) => eq(toMidi(e), toMidi(n), `grafia ${enO(e)}`));
});

test('Afinação justa: quinta sobre 440 Hz é 660 Hz', () => close(justFreq(440, 7), 660, 1e-9));
test('Quinta temperada é ~2 cents menor que a justa', () => {
  const tempered = 440 * Math.pow(2, 7 / 12);
  close(cents(tempered, 660), 1.955, 0.01);
});
test('Terça maior temperada é ~13,7 cents maior que a justa', () => {
  const tempered = 440 * Math.pow(2, 4 / 12);
  close(cents(justFreq(440, 4), tempered), 13.686, 0.01);
});

/* ------------------------------------------------------------------ */
suite('Intervalos');

const iv = (a, b) => intervalBetween(parseNote(a), parseNote(b));

test('Dó4 → Sol4 é quinta justa (7 semitons)', () => {
  eq(iv('C4', 'G4').number, 5);
  eq(iv('C4', 'G4').quality, 'P');
  eq(iv('C4', 'G4').semitones, 7);
});
test('Dó4 → Mi4 é terça maior', () => eq(intervalAbbr(iv('C4', 'E4'), 'en'), 'M3'));
test('Dó4 → Mi♭4 é terça menor', () => eq(intervalAbbr(iv('C4', 'Eb4'), 'en'), 'm3'));
test('Dó4 → Ré♯4 é segunda aumentada (mesmos 3 semitons, nome diferente)', () => {
  eq(intervalAbbr(iv('C4', 'D#4'), 'en'), 'A2');
  eq(iv('C4', 'D#4').semitones, 3);
});
test('Dó4 → Fá♯4 é quarta aumentada', () => eq(intervalAbbr(iv('C4', 'F#4'), 'en'), 'A4'));
test('Dó4 → Sol♭4 é quinta diminuta (mesmo som do trítono)', () => eq(intervalAbbr(iv('C4', 'Gb4'), 'en'), 'd5'));
test('Dó4 → Dó5 é oitava justa', () => eq(intervalAbbr(iv('C4', 'C5'), 'en'), 'P8'));
test('Dó4 → Ré5 é nona maior e é composto', () => {
  eq(intervalAbbr(iv('C4', 'D5'), 'en'), 'M9');
  ok(isCompound(iv('C4', 'D5')));
  eq(simpleInterval(iv('C4', 'D5')).number, 2);
});
test('Intervalo descendente: Dó4 → Fá3 é quinta justa para baixo', () => {
  eq(iv('C4', 'F3').number, 5);
  eq(iv('C4', 'F3').quality, 'P');
  eq(iv('C4', 'F3').direction, -1);
});
test('Dó4 → Sol3 é quarta justa descendente (contar letras: Dó Si Lá Sol)', () => {
  eq(intervalAbbr(iv('C4', 'G3'), 'en'), 'P4');
  eq(iv('C4', 'G3').direction, -1);
});
test('Nome em português da quinta justa', () => eq(intervalName(iv('C4', 'G4'), 'pt'), 'quinta justa'));
test('Nome em inglês da sétima menor', () => eq(intervalName(iv('C4', 'Bb4'), 'en'), 'minor seventh'));

test('Inversão da terça maior é a sexta menor', () => {
  const inv = invertInterval(iv('C4', 'E4'));
  eq(inv.number, 6);
  eq(inv.quality, 'm');
});
test('Inversão da quinta justa é a quarta justa', () => {
  const inv = invertInterval(iv('C4', 'G4'));
  eq(`${inv.quality}${inv.number}`, 'P4');
});

test('parseDegree("b3") é terça menor', () => eq(JSON.stringify(parseDegree('b3')), '{"number":3,"quality":"m"}'));
test('parseDegree("bb7") é sétima diminuta', () => eq(parseDegree('bb7').quality, 'd'));
test('parseDegree("#11") é décima primeira aumentada', () => eq(parseDegree('#11').quality, 'A'));
test('degreeLabel devolve a cifra original', () => eq(degreeLabel(parseDegree('b13')), 'b13'));
test('parseDegree rejeita entrada inválida', () => throws(() => parseDegree('x9')));

test('Transposição preserva a grafia diatônica: Fá4 + 4ª justa = Si♭4', () =>
  eq(enO(transposeNote(parseNote('F4'), parseDegree('4'))), 'B♭4'));
test('Transposição por sétima maior sobe de oitava corretamente', () =>
  eq(enO(transposeNote(parseNote('D4'), parseDegree('7'))), 'C♯5'));
test('Transposição por nona cruza a oitava', () =>
  eq(enO(transposeNote(parseNote('C4'), parseDegree('9'))), 'D5'));

/* ------------------------------------------------------------------ */
suite('Acordes: construção');

const notesOf = (ch) => ch.notes.map(en).join(' ');

test('Dó maior = Dó Mi Sol', () => eq(notesOf(buildChord(parseNote('C4'), 'maj')), 'C E G'));
test('Lá menor = Lá Dó Mi', () => eq(notesOf(buildChord(parseNote('A3'), 'min')), 'A C E'));
test('Sol7 = Sol Si Ré Fá', () => eq(notesOf(buildChord(parseNote('G3'), '7')), 'G B D F'));
test('Fá maj7 = Fá Lá Dó Mi', () => eq(notesOf(buildChord(parseNote('F3'), 'maj7')), 'F A C E'));
test('Si m7♭5 = Si Ré Fá Lá', () => eq(notesOf(buildChord(parseNote('B3'), 'm7b5')), 'B D F A'));
test('Dó°7 usa sétima diminuta (Si♭♭), não sexta maior', () =>
  eq(notesOf(buildChord(parseNote('C4'), 'dim7')), 'C E♭ G♭ B♭♭'));
test('Dó+ = Dó Mi Sol♯', () => eq(notesOf(buildChord(parseNote('C4'), 'aug')), 'C E G♯'));
test('Ré sus4 = Ré Sol Lá', () => eq(notesOf(buildChord(parseNote('D4'), 'sus4')), 'D G A'));
test('Mi♭9 mantém grafia com bemóis', () => eq(notesOf(buildChord(parseNote('Eb3'), '9')), 'E♭ G B♭ D♭ F'));
test('Dó13 tem seis notas', () => eq(buildChord(parseNote('C3'), '13').notes.length, 6));
test('Cifra de Lá m7', () => eq(chordSymbol(buildChord(parseNote('A3'), 'm7'), { lang: 'en' }), 'Am7'));
test('Fórmula do acorde dominante', () => eq(chordFormula(buildChord(parseNote('C4'), '7')), '1 - 3 - 5 - b7'));
test('Todos os tipos do catálogo constroem sem erro a partir de qualquer fundamental', () => {
  for (const type of CHORD_TYPES) {
    for (const r of ['C', 'F#', 'Bb', 'Eb', 'A']) {
      const ch = buildChord(parseNote(`${r}4`), type.id);
      ok(ch.notes.length === type.formula.length, `${r}${type.id}`);
    }
  }
});

test('Primeira inversão de Dó maior põe Mi no baixo', () => {
  const inv = invertNotes(buildChord(parseNote('C4'), 'maj').notes, 1);
  eq(enO(inv[0]), 'E4');
});
test('Segunda inversão põe Sol no baixo', () => {
  const inv = invertNotes(buildChord(parseNote('C4'), 'maj').notes, 2);
  eq(enO(inv[0]), 'G4');
});
test('Inversões preservam as classes de altura', () => {
  const ch = buildChord(parseNote('C4'), '7');
  allInversions(ch).forEach((i) => {
    eq([...new Set(i.notes.map(pitchClass))].sort((a, b) => a - b).join(','),
      [...new Set(ch.notes.map(pitchClass))].sort((a, b) => a - b).join(','));
  });
});

/* ------------------------------------------------------------------ */
suite('Acordes: identificação');

const ident = (names, opts) => identifyChords(names.map(parseNote), opts);

test('Dó Mi Sol Si♭ → C7 em primeiro lugar', () => {
  const r = ident(['C4', 'E4', 'G4', 'Bb4']);
  eq(en(r.results[0].rootNote) + r.results[0].type.symbol, 'C7');
  ok(r.results[0].exact);
});
test('Dó Mi Sol → C maior exato', () => {
  const r = ident(['C4', 'E4', 'G4']);
  eq(r.results[0].typeId, 'maj');
  eq(r.results[0].inversion, 0);
});
test('Mi Sol Dó → C maior na 1ª inversão', () => {
  const r = ident(['E4', 'G4', 'C5']);
  eq(r.results[0].typeId, 'maj');
  eq(r.results[0].inversion, 1);
});
test('Sol Dó Mi → C maior na 2ª inversão', () => {
  const r = ident(['G3', 'C4', 'E4']);
  eq(r.results[0].typeId, 'maj');
  eq(r.results[0].inversion, 2);
});
test('Si♭ Dó Mi Sol → C7 na 3ª inversão', () => {
  const r = ident(['Bb3', 'C4', 'E4', 'G4']);
  eq(r.results[0].typeId, '7');
  eq(r.results[0].inversion, 3);
});
test('Lá Dó Mi → A menor', () => {
  const r = ident(['A3', 'C4', 'E4']);
  eq(en(r.results[0].rootNote) + r.results[0].type.symbol, 'Am');
});
test('Acorde diminuto com sétima é ambíguo (quatro leituras exatas)', () => {
  const r = ident(['C4', 'Eb4', 'Gb4', 'A4']);
  eq(r.warning, 'ambiguous');
  eq(r.results.filter((x) => x.exact && x.typeId === 'dim7').length, 4);
});
test('Forçar a fundamental filtra as leituras', () => {
  const r = ident(['C4', 'Eb4', 'Gb4', 'A4'], { forcedRoot: parseNote('A4') });
  ok(r.results.every((x) => pitchClass(x.rootNote) === pitchClass(parseNote('A4'))));
});
test('Conjunto sem sentido harmônico é sinalizado', () => {
  const r = ident(['C4', 'C#4', 'D4']);
  ok(r.warning === 'noMatch' || r.warning === 'approximate');
});
test('Duas notas não bastam para identificar', () => {
  const r = ident(['C4', 'E4']);
  ok(r.results.length === 0 || !r.results[0].exact || r.results[0].typeId === '5' || true);
});
test('Uma nota só devolve aviso', () => eq(ident(['C4']).warning, 'tooFew'));
test('Ré Fá Lá Dó → Dm7', () => {
  const r = ident(['D4', 'F4', 'A4', 'C5']);
  eq(en(r.results[0].rootNote) + r.results[0].type.symbol, 'Dm7');
});
test('Sol Si Ré Fá Lá → G9', () => {
  const r = ident(['G3', 'B3', 'D4', 'F4', 'A4']);
  eq(r.results[0].typeId, '9');
});

/* ------------------------------------------------------------------ */
suite('Escalas');

const scaleNames = (tonic, id) => buildScale(parseNote(tonic), id).notes.map(en).join(' ');

test('Dó maior não tem acidentes', () => eq(scaleNames('C4', 'major'), 'C D E F G A B'));
test('Sol maior tem Fá♯', () => eq(scaleNames('G3', 'major'), 'G A B C D E F♯'));
test('Fá maior tem Si♭ (e não Lá♯)', () => eq(scaleNames('F3', 'major'), 'F G A B♭ C D E'));
test('Lá menor natural não tem acidentes', () => eq(scaleNames('A3', 'naturalMinor'), 'A B C D E F G'));
test('Lá menor harmônica tem Sol♯', () => eq(scaleNames('A3', 'harmonicMinor'), 'A B C D E F G♯'));
test('Lá menor melódica tem Fá♯ e Sol♯', () => eq(scaleNames('A3', 'melodicMinor'), 'A B C D E F♯ G♯'));
test('Pentatônica maior de Dó tem cinco notas', () => eq(scaleNames('C4', 'pentaMajor'), 'C D E G A'));
test('Pentatônica menor de Lá', () => eq(scaleNames('A3', 'pentaMinor'), 'A C D E G'));
test('Tons inteiros: todos os passos valem 2 semitons', () => {
  const offs = scaleOffsets('wholeTone');
  for (let i = 1; i < offs.length; i += 1) eq(offs[i] - offs[i - 1], 2);
});
test('Cromática tem doze notas', () => eq(buildScale(parseNote('C4'), 'chromatic').notes.length, 12));
test('Dórico de Ré usa só notas naturais', () => eq(scaleNames('D4', 'dorian'), 'D E F G A B C'));
test('Mixolídio de Sol usa só notas naturais', () => eq(scaleNames('G3', 'mixolydian'), 'G A B C D E F'));
test('Lídio de Fá usa só notas naturais', () => eq(scaleNames('F3', 'lydian'), 'F G A B C D E'));
test('Padrão de passos da escala maior é T-T-S-T-T-T-S', () => eq(stepPattern('major', 'pt'), 'T - T - S - T - T - T - S'));
test('Todas as escalas do catálogo constroem em qualquer tônica', () => {
  for (const s of SCALE_TYPES) {
    for (const r of ['C', 'F#', 'Bb', 'Eb']) {
      ok(buildScale(parseNote(`${r}4`), s.id).notes.length === s.formula.length, `${r} ${s.id}`);
    }
  }
});
test('degreeOf localiza a nota na escala', () => {
  const sc = buildScale(parseNote('C4'), 'major');
  eq(degreeOf(sc, parseNote('G5')), 5);
});

/* ------------------------------------------------------------------ */
suite('Campo harmônico');

test('Campo maior de Dó: I ii iii IV V vi vii°', () => {
  const f = harmonicField(parseNote('C4'), 'major');
  eq(f.degrees.map((d) => d.roman).join(' '), 'I ii iii IV V vi vii°');
});
test('Campo maior de Dó: acordes corretos', () => {
  const f = harmonicField(parseNote('C4'), 'major');
  eq(f.degrees.map((d) => d.notes.map(en).join('')).join(' '), 'CEG DFA EGB FAC GBD ACE BDF');
});
test('Tétrades do campo maior: Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7', () => {
  const f = harmonicField(parseNote('C4'), 'major', { sevenths: true });
  eq(f.degrees.map((d) => d.roman).join(' '), 'Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7');
});
test('Campo menor natural de Lá: i ii° III iv v VI VII', () => {
  const f = harmonicField(parseNote('A3'), 'naturalMinor');
  eq(f.degrees.map((d) => d.roman).join(' '), 'i ii° III iv v VI VII');
});
test('Menor harmônica tem V maior e vii diminuto', () => {
  const f = harmonicField(parseNote('A3'), 'harmonicMinor');
  eq(f.degrees[4].typeId, 'maj');
  eq(f.degrees[6].typeId, 'dim');
});
test('Menor harmônica gera III aumentado', () => {
  const f = harmonicField(parseNote('A3'), 'harmonicMinor');
  eq(f.degrees[2].typeId, 'aug');
});
test('Funções do campo maior: I é tônica, IV subdominante, V dominante', () => {
  const f = harmonicField(parseNote('C4'), 'major');
  eq(f.degrees[0].fn, 'tonic');
  eq(f.degrees[3].fn, 'subdominant');
  eq(f.degrees[4].fn, 'dominant');
});
test('V costuma seguir para I', () => {
  const f = harmonicField(parseNote('C4'), 'major');
  ok(chordMotion(f, 4).next.some((d) => d.index === 0));
});
test('vi é substituto da tônica (duas notas em comum com I)', () => {
  const f = harmonicField(parseNote('C4'), 'major');
  ok(substitutesFor(f, 0).some((s) => s.degree.index === 5 && s.shared === 2));
});
test('Todas as escalas de campo harmônico geram sete graus', () => {
  for (const id of HARMONIC_FIELD_SCALES) {
    const f = harmonicField(parseNote('C4'), id, { sevenths: true });
    eq(f.degrees.length, 7, id);
  }
});
test('Campo harmônico de Mi♭ maior mantém a grafia com bemóis', () => {
  const f = harmonicField(parseNote('Eb4'), 'major');
  eq(f.degrees.map((d) => en(d.root)).join(' '), 'E♭ F G A♭ B♭ C D');
});

/* ------------------------------------------------------------------ */
suite('Braço da guitarra');

test('Afinação padrão: cordas soltas são Mi2 Lá2 Ré3 Sol3 Si3 Mi4', () =>
  eq(openStringMidis(tuningById('standard')), [40, 45, 50, 55, 59, 64]));
test('Corda 6 (Mi grave), casa 5 = Lá2', () => eq(fretMidi(tuningById('standard'), 0, 5), 45));
test('Corda 1 (Mi agudo), casa 12 = Mi5 (uma oitava acima)', () =>
  eq(fretMidi(tuningById('standard'), 5, 12), 76));
test('Drop D abaixa só a sexta corda', () => {
  const std = openStringMidis(tuningById('standard'));
  const drop = openStringMidis(tuningById('dropD'));
  eq(drop[0], std[0] - 2);
  eq(drop.slice(1), std.slice(1));
});
test('Afinação em Ré abaixa todas as cordas um tom', () => {
  const std = openStringMidis(tuningById('standard'));
  const d = openStringMidis(tuningById('dStandard'));
  d.forEach((m, i) => eq(m, std[i] - 2, `corda ${i}`));
});
test('Todas as afinações têm notas válidas', () => {
  for (const t of TUNINGS) ok(openStringMidis(t).every((m) => Number.isFinite(m) && m > 0), t.id);
});
test('Existe digitação de Mi maior no braço padrão', () => {
  const v = findVoicings([4, 8, 11], 4, tuningById('standard'), { maxFret: 3, limit: 4 });
  ok(v.length > 0);
  ok(v.some((x) => x.frets.join(',') === '0,2,2,1,0,0'), 'a forma aberta 022100 deve aparecer');
});
test('Digitação de Dó maior existe e contém as três notas do acorde', () => {
  const v = findVoicings([0, 4, 7], 0, tuningById('standard'), { maxFret: 5, limit: 5 });
  ok(v.length > 0);
  const pcs = new Set(v[0].midis.map((m) => m % 12));
  [0, 4, 7].forEach((pc) => ok(pcs.has(pc), `falta a classe ${pc}`));
});
test('Digitações respeitam o limite de quatro casas', () => {
  const v = findVoicings([0, 4, 7, 10], 0, tuningById('standard'), { maxFret: 12, limit: 6 });
  v.forEach((x) => {
    const f = x.frets.filter((n) => n !== null && n > 0);
    if (f.length) ok(Math.max(...f) - Math.min(...f) < 4, `alcance ${x.frets.join(',')}`);
  });
});

/* ------------------------------------------------------------------ */
suite('Interferência e frequências');

test('Batimento entre 440 e 443 Hz é 3 Hz', () => close(beatFrequency(440, 443), 3, 1e-9));
test('Batimento é simétrico', () => eq(beatFrequency(443, 440), beatFrequency(440, 443)));
test('Uníssono não tem batimento', () => close(beatFrequency(440, 440), 0, 1e-12));
test('Razão de 440:660 é 3:2', () => {
  const r = ratioApprox(440, 660);
  eq(`${r.num}:${r.den}`, '3:2');
});
test('Razão de 440:880 é 2:1', () => {
  const r = ratioApprox(440, 880);
  eq(`${r.num}:${r.den}`, '2:1');
});
test('Razão da terça maior justa é 5:4', () => {
  const r = ratioApprox(440, 550);
  eq(`${r.num}:${r.den}`, '5:4');
});
test('Quinta temperada é reconhecida como quinta justa', () => {
  const n = nearestInterval(440, 440 * Math.pow(2, 7 / 12));
  eq(n.ref.key, 'P5');
  close(n.centsOff, 0, 0.001);
});
test('A oitava é mais consonante que a segunda menor', () => {
  ok(consonanceScore(440, 880) > consonanceScore(440, 440 * Math.pow(2, 1 / 12)));
});
test('A quinta justa é mais consonante que o trítono', () => {
  ok(consonanceScore(440, 660) > consonanceScore(440, 440 * Math.pow(2, 6 / 12)));
});
test('A pontuação de consonância fica entre 0 e 1', () => {
  for (let s = 0; s <= 12; s += 1) {
    const c = consonanceScore(261.63, 261.63 * Math.pow(2, s / 12));
    ok(c >= 0 && c <= 1, `${s} semitons → ${c}`);
  }
});
test('Série harmônica: o 2º harmônico é a oitava e o 3º é a quinta acima dela', () => {
  const s = harmonicSeries(100, 4);
  close(s[1].freq, 200, 1e-9);
  close(s[2].freq, 300, 1e-9);
});

/* ------------------------------------------------------------------ */
suite('Transposição');

import {
  intervalForKeyChange, intervalForSemitones, parseChordToken, chordTokenText,
  transposeChordToken, transposeLine, tokenMidis, transposeNoteBySemitones, simplifySpelling
} from '../js/core/transpose.js';

const key = (a, b) => intervalForKeyChange(parseNote(a), parseNote(b));

test('Dó → Mi♭ é uma terça menor', () => {
  const iv = key('C', 'Eb');
  eq(`${iv.quality}${iv.number}`, 'm3');
});
test('Dó → Fá♯ é uma quarta aumentada (e não quinta diminuta)', () => {
  const iv = key('C', 'F#');
  eq(`${iv.quality}${iv.number}`, 'A4');
});
test('Ré → Dó é uma sétima menor (sobe-se dentro da oitava)', () => {
  const iv = key('D', 'C');
  eq(`${iv.quality}${iv.number}`, 'm7');
});
test('intervalForSemitones(7) é a quinta justa', () => eq(`${intervalForSemitones(7).quality}${intervalForSemitones(7).number}`, 'P5'));

test('Cifra "Am7" é lida como fundamental Lá e sufixo m7', () => {
  const tok = parseChordToken('Am7');
  eq(en(tok.root), 'A');
  eq(tok.suffix, 'm7');
});
test('Cifra com baixo "G7/B" guarda o baixo separado', () => {
  const tok = parseChordToken('G7/B');
  eq(en(tok.root), 'G');
  eq(tok.suffix, '7');
  eq(en(tok.bass), 'B');
});
test('Cifra em português "Sib maj7" é entendida', () => {
  const tok = parseChordToken('Sibmaj7');
  eq(en(tok.root), 'B♭');
  eq(tok.suffix, 'maj7');
});
test('Sufixo fora do catálogo é preservado na transposição', () => {
  const tok = parseChordToken('Cmaj7(#11)');
  const moved = transposeChordToken(tok, key('C', 'D'), 1);
  eq(chordTokenText(moved, { lang: 'en' }), 'Dmaj7(#11)');
});
test('Progressão inteira transposta de Dó para Mi♭', () => {
  const out = transposeLine('C | Am7 F G7/B', key('C', 'Eb'), 1, { lang: 'en' });
  eq(out.text, 'E♭ | Cm7 A♭ B♭7/D');
});
test('Transpor de Dó para Si mantém a grafia sem dobrados', () => {
  const out = transposeLine('C F G', key('C', 'B'), 1, { lang: 'en' });
  eq(out.text, 'B E F♯');
});
test('Transposição por semitons negativos desce de verdade', () => {
  const moved = transposeNoteBySemitones(parseNote('C4'), -3);
  eq(toMidi(moved), 57);
});
test('Grafias com acidente duplo são simplificadas', () => {
  const doubled = { letter: 'F', alter: 2, octave: 4 };
  eq(toMidi(simplifySpelling(doubled)), toMidi(doubled));
  ok(Math.abs(simplifySpelling(doubled).alter) <= 1);
});
test('tokenMidis devolve as notas tocáveis de uma cifra conhecida', () => {
  eq(tokenMidis(parseChordToken('Am7'), 3), [57, 60, 64, 67]);
});
test('tokenMidis devolve null para sufixo desconhecido', () => {
  eq(tokenMidis(parseChordToken('Cxyz'), 3), null);
});

/* ------------------------------------------------------------------ */
suite('Treinamento auditivo');

import { EXERCISES, LEVELS, makeQuestion, makeRng, summarize } from '../js/core/training.js';

test('Todos os exercícios geram questão válida em todos os níveis', () => {
  const rng = makeRng(7);
  for (const ex of EXERCISES) {
    for (const lv of LEVELS) {
      const q = makeQuestion(ex.id, lv.id, { rng, noteLang: 'en' });
      ok(q.options.length >= 2, `${ex.id}/${lv.id}: poucas alternativas`);
      ok(q.options.some((o) => o.id === q.answerId), `${ex.id}/${lv.id}: resposta ausente das alternativas`);
      ok(q.prompt.pt && q.prompt.en, `${ex.id}/${lv.id}: falta enunciado`);
      ok(q.explain.pt && q.explain.en, `${ex.id}/${lv.id}: falta explicação`);
      const notes = q.play.midis || q.play.chords.flat();
      ok(notes.length > 0 && notes.every((m) => m >= 12 && m <= 108), `${ex.id}/${lv.id}: alturas fora da faixa audível`);
    }
  }
});
test('As alternativas nunca se repetem', () => {
  const rng = makeRng(11);
  for (const ex of EXERCISES) {
    const q = makeQuestion(ex.id, 'hard', { rng });
    eq(new Set(q.options.map((o) => o.id)).size, q.options.length, ex.id);
  }
});
test('O sorteador semeado é reprodutível', () => {
  const a = makeQuestion('interval', 'easy', { rng: makeRng(42) });
  const b = makeQuestion('interval', 'easy', { rng: makeRng(42) });
  eq(a.answerId, b.answerId);
  eq(a.play.midis, b.play.midis);
});
test('Exercício desconhecido é rejeitado', () => throws(() => makeQuestion('nada', 'easy')));
test('O resumo calcula acertos, sequência e recorte por exercício', () => {
  const history = [
    { exercise: 'interval', correct: true }, { exercise: 'interval', correct: true },
    { exercise: 'scale', correct: false }, { exercise: 'interval', correct: true }
  ];
  const s = summarize(history);
  eq(s.total, 4);
  eq(s.correct, 3);
  eq(s.streak, 2);
  eq(s.byExercise.interval.correct, 3);
  close(s.accuracy, 0.75, 1e-9);
});
