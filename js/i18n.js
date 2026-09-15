/**
 * i18n.js — Textos da interface em português e inglês.
 *
 * Um único dicionário plano: chave → { pt, en }. A função t() devolve o texto
 * no idioma corrente; se a chave não existir, devolve a própria chave (assim
 * um texto faltando fica visível em vez de sumir).
 */

const DICT = {
  appName: { pt: 'Harmonia', en: 'Harmonia' },
  appTagline: {
    pt: 'Teoria musical visual e interativa, com o violão como ponto de partida.',
    en: 'Visual, interactive music theory, starting from the guitar.'
  },
  skipToContent: { pt: 'Ir para o conteúdo', en: 'Skip to content' },

  // Navegação
  'nav.home': { pt: 'Início', en: 'Home' },
  'nav.chords': { pt: 'Acordes', en: 'Chords' },
  'nav.finder': { pt: 'Identificador', en: 'Chord finder' },
  'nav.field': { pt: 'Campo harmônico', en: 'Harmonic field' },
  'nav.interference': { pt: 'Frequências', en: 'Frequencies' },
  'nav.settings': { pt: 'Ajustes', en: 'Settings' },
  'nav.scales': { pt: 'Escalas', en: 'Scales' },
  'nav.intervals': { pt: 'Intervalos', en: 'Intervals' },
  'nav.progressions': { pt: 'Progressões', en: 'Progressions' },
  'nav.transpose': { pt: 'Transposição', en: 'Transpose' },
  'nav.training': { pt: 'Treino', en: 'Training' },
  'nav.guide': { pt: 'Como usar', en: 'How to use' },

  // --- Escalas ---
  'scales.title': { pt: 'Explorador de escalas e modos', en: 'Scale & mode explorer' },
  'scales.lead': {
    pt: 'Uma escala é uma sequência de passos. Mudando os passos muda o clima: a mesma tônica soa alegre no modo lídio e sombria no frígio.',
    en: 'A scale is a sequence of steps. Change the steps and the mood changes: the same tonic sounds bright in Lydian and dark in Phrygian.'
  },
  'scales.steps': { pt: 'Passos', en: 'Steps' },
  'scales.degrees': { pt: 'Graus e notas', en: 'Degrees & notes' },
  'scales.use': { pt: 'Onde se usa', en: 'Where it is used' },
  'scales.chords': { pt: 'Acordes compatíveis', en: 'Chords that fit' },
  'scales.playUp': { pt: 'Subindo', en: 'Ascending' },
  'scales.playDown': { pt: 'Descendo', en: 'Descending' },
  'scales.playThirds': { pt: 'Em terças', en: 'In thirds' },
  'scales.relative': { pt: 'Escalas com as mesmas notas', en: 'Scales with the same notes' },
  'scales.noChords': { pt: 'Esta escala não gera um campo harmônico de sete graus; os acordes abaixo são os que cabem inteiramente nela.', en: 'This scale does not produce a seven-degree harmonic field; the chords below are the ones that fit entirely inside it.' },

  // --- Intervalos ---
  'intervals.title': { pt: 'Calculadora de intervalos', en: 'Interval calculator' },
  'intervals.lead': {
    pt: 'Escolha duas notas e veja a distância entre elas por todos os ângulos: nome, semitons, inversão, frequências e razão.',
    en: 'Pick two notes and see the distance between them from every angle: name, semitones, inversion, frequencies and ratio.'
  },
  'intervals.first': { pt: 'Primeira nota', en: 'First note' },
  'intervals.second': { pt: 'Segunda nota', en: 'Second note' },
  'intervals.name': { pt: 'Nome', en: 'Name' },
  'intervals.classification': { pt: 'Classificação', en: 'Classification' },
  'intervals.simple': { pt: 'simples', en: 'simple' },
  'intervals.compound': { pt: 'composto', en: 'compound' },
  'intervals.inversionOf': { pt: 'Inversão', en: 'Inversion' },
  'intervals.melodicVsHarmonic': {
    pt: 'Melódico é quando as notas soam uma depois da outra; harmônico é quando soam juntas. A distância é a mesma, o efeito não.',
    en: 'Melodic means the notes sound one after the other; harmonic means together. Same distance, different effect.'
  },
  'intervals.ascending': { pt: 'Ascendente', en: 'Ascending' },
  'intervals.descending': { pt: 'Descendente', en: 'Descending' },
  'intervals.together': { pt: 'Simultâneo', en: 'Together' },
  'intervals.swap': { pt: 'Inverter as duas notas', en: 'Swap the two notes' },
  'intervals.quickPick': { pt: 'Escolha rápida', en: 'Quick pick' },

  // --- Progressões ---
  'prog.title': { pt: 'Montador de progressões', en: 'Progression builder' },
  'prog.lead': {
    pt: 'Monte uma sequência de acordes, ouça em laço e veja a função de cada um. As sugestões vêm do movimento harmônico mais comum de cada grau.',
    en: 'Build a chord sequence, loop it, and see what each chord does. Suggestions come from the most common harmonic motion of each degree.'
  },
  'prog.sequence': { pt: 'Sequência', en: 'Sequence' },
  'prog.addFromField': { pt: 'Acrescentar do campo harmônico', en: 'Add from the harmonic field' },
  'prog.empty': { pt: 'A sequência está vazia. Clique num grau abaixo para começar.', en: 'The sequence is empty. Click a degree below to start.' },
  'prog.suggestions': { pt: 'Continuações prováveis', en: 'Likely continuations' },
  'prog.rhythm': { pt: 'Execução', en: 'Playback' },
  'prog.rhythm.block': { pt: 'Bloco', en: 'Block' },
  'prog.rhythm.arpeggio': { pt: 'Arpejado', en: 'Arpeggiated' },
  'prog.rhythm.bass': { pt: 'Baixo e acorde', en: 'Bass then chord' },
  'prog.beats': { pt: 'Tempos por acorde', en: 'Beats per chord' },
  'prog.save': { pt: 'Salvar', en: 'Save' },
  'prog.saved': { pt: 'Progressões salvas', en: 'Saved progressions' },
  'prog.noSaved': { pt: 'Nada salvo ainda. O que você salvar fica neste navegador.', en: 'Nothing saved yet. What you save stays in this browser.' },
  'prog.nameIt': { pt: 'Nome da progressão', en: 'Progression name' },
  'prog.load': { pt: 'Abrir', en: 'Load' },
  'prog.remove': { pt: 'Remover', en: 'Remove' },
  'prog.moveLeft': { pt: 'Mover para a esquerda', en: 'Move left' },
  'prog.moveRight': { pt: 'Mover para a direita', en: 'Move right' },
  'prog.presets': { pt: 'Modelos', en: 'Templates' },

  // --- Transposição ---
  'transpose.title': { pt: 'Transposição', en: 'Transposition' },
  'transpose.lead': {
    pt: 'Transpor é mover tudo pela mesma distância. Aqui a grafia é preservada sempre que possível: Dó maior subindo um tom vira Ré maior, não Dó dobrado sustenido.',
    en: 'Transposing moves everything by the same distance. Spelling is preserved where possible: C major up a tone becomes D major, not something unwritable.'
  },
  'transpose.input': { pt: 'Notas, acordes ou progressão', en: 'Notes, chords or progression' },
  'transpose.inputHint': { pt: 'Separe por espaços. Barras verticais marcam compassos: C | Am7 | F G', en: 'Separate with spaces. Vertical bars mark bars: C | Am7 | F G' },
  'transpose.mode': { pt: 'Modo', en: 'Mode' },
  'transpose.bySemitones': { pt: 'Por semitons', en: 'By semitones' },
  'transpose.byKey': { pt: 'De tonalidade a tonalidade', en: 'From key to key' },
  'transpose.from': { pt: 'De', en: 'From' },
  'transpose.to': { pt: 'Para', en: 'To' },
  'transpose.amount': { pt: 'Semitons', en: 'Semitones' },
  'transpose.original': { pt: 'Original', en: 'Original' },
  'transpose.result': { pt: 'Transposto', en: 'Transposed' },
  'transpose.shift': { pt: 'Deslocamento', en: 'Shift' },
  'transpose.playOriginal': { pt: 'Tocar original', en: 'Play original' },
  'transpose.playResult': { pt: 'Tocar transposto', en: 'Play transposed' },
  'transpose.scaleToo': { pt: 'Escala transposta', en: 'Transposed scale' },
  'transpose.unknown': { pt: 'não reconhecido', en: 'not recognised' },

  // --- Treino auditivo ---
  'training.title': { pt: 'Treinamento auditivo', en: 'Ear training' },
  'training.lead': {
    pt: 'Exercícios sorteados, com áudio, resposta comentada e pontuação guardada só no seu navegador. Erre à vontade: repetir é o método.',
    en: 'Randomly generated exercises with audio, explained answers and a score kept only in your browser. Get it wrong freely: repetition is the method.'
  },
  'training.exercise': { pt: 'Exercício', en: 'Exercise' },
  'training.level': { pt: 'Nível', en: 'Level' },
  'training.replay': { pt: 'Ouvir de novo', en: 'Play again' },
  'training.next': { pt: 'Próxima', en: 'Next' },
  'training.reveal': { pt: 'Mostrar a resposta', en: 'Reveal the answer' },
  'training.correct': { pt: 'Acertou!', en: 'Correct!' },
  'training.wrong': { pt: 'Ainda não. Ouça de novo e tente outra.', en: 'Not yet. Listen again and try another.' },
  'training.revealed': { pt: 'Resposta:', en: 'Answer:' },
  'training.score': { pt: 'Pontuação', en: 'Score' },
  'training.accuracy': { pt: 'Acertos', en: 'Accuracy' },
  'training.recent': { pt: 'Últimas 20', en: 'Last 20' },
  'training.streak': { pt: 'Sequência', en: 'Streak' },
  'training.attempts': { pt: 'Tentativas nesta questão', en: 'Attempts on this question' },
  'training.byExercise': { pt: 'Por exercício', en: 'By exercise' },
  'training.reset': { pt: 'Zerar pontuação', en: 'Reset score' },
  'training.start': { pt: 'Começar', en: 'Start' },
  'training.noHistory': { pt: 'Sem histórico ainda.', en: 'No history yet.' },


  // Home
  'home.title': { pt: 'Entenda a música que você toca', en: 'Understand the music you play' },
  'home.intro': {
    pt: 'Quatro ferramentas conectadas: monte acordes e veja-os na partitura, no braço e no teclado; descubra que acorde um punhado de notas forma; explore o campo harmônico de qualquer tonalidade; e veja, no gráfico, por que alguns intervalos soam lisos e outros ásperos. Tudo funciona no navegador, sem cadastro e sem enviar nada para servidor nenhum.',
    en: 'Four connected tools: build chords and see them on the staff, the fretboard and the keyboard; find out which chord a handful of notes makes; explore the harmonic field of any key; and see, on a graph, why some intervals sound smooth and others rough. Everything runs in the browser, with no sign-up and nothing sent to any server.'
  },
  'home.path': { pt: 'Caminho de estudo sugerido', en: 'Suggested study path' },
  'home.step1': { pt: '1. Comece pelos intervalos', en: '1. Start with intervals' },
  'home.step1.desc': {
    pt: 'Na seção Frequências, compare duas notas e ouça a diferença entre uma quinta justa e um trítono. Intervalo é a unidade básica de tudo o que vem depois.',
    en: 'In Frequencies, compare two notes and hear the difference between a perfect fifth and a tritone. The interval is the basic unit of everything that follows.'
  },
  'home.step2': { pt: '2. Monte acordes', en: '2. Build chords' },
  'home.step2.desc': {
    pt: 'Em Acordes, veja como empilhar terças gera as tríades e as tétrades. Observe a fórmula e ouça cada nota separadamente.',
    en: 'In Chords, see how stacking thirds creates triads and seventh chords. Look at the formula and listen to each note on its own.'
  },
  'home.step3': { pt: '3. Reconheça acordes de ouvido e de olho', en: '3. Recognise chords by ear and by eye' },
  'home.step3.desc': {
    pt: 'No Identificador, escolha notas soltas e veja quantas leituras diferentes elas admitem. Ambiguidade faz parte da música.',
    en: 'In the chord finder, pick loose notes and see how many different readings they allow. Ambiguity is part of music.'
  },
  'home.step4': { pt: '4. Ligue os acordes entre si', en: '4. Connect chords to each other' },
  'home.step4.desc': {
    pt: 'No Campo harmônico, descubra quais acordes nascem de uma tonalidade e como eles costumam se suceder.',
    en: 'In Harmonic field, discover which chords come from a key and how they usually follow one another.'
  },
  'home.open': { pt: 'Abrir', en: 'Open' },
  'home.privacy': { pt: 'Privacidade', en: 'Privacy' },
  'home.privacyText': {
    pt: 'Nada é enviado para servidores. Suas preferências (idioma, tema, afinação, forma de onda) ficam apenas no armazenamento local do seu navegador e podem ser apagadas a qualquer momento nos Ajustes.',
    en: 'Nothing is sent to any server. Your preferences (language, theme, tuning, waveform) live only in your browser\'s local storage and can be cleared at any time in Settings.'
  },

  // Comuns
  root: { pt: 'Fundamental', en: 'Root' },
  chordType: { pt: 'Tipo de acorde', en: 'Chord type' },
  octave: { pt: 'Oitava', en: 'Octave' },
  notes: { pt: 'Notas', en: 'Notes' },
  formula: { pt: 'Fórmula', en: 'Formula' },
  intervals: { pt: 'Intervalos', en: 'Intervals' },
  inversion: { pt: 'Inversão', en: 'Inversion' },
  play: { pt: 'Tocar', en: 'Play' },
  playChord: { pt: 'Tocar acorde', en: 'Play chord' },
  playArpeggio: { pt: 'Arpejar', en: 'Arpeggiate' },
  playNotes: { pt: 'Tocar nota a nota', en: 'Play note by note' },
  stop: { pt: 'Parar', en: 'Stop' },
  staff: { pt: 'Partitura', en: 'Staff' },
  fretboard: { pt: 'Braço da guitarra', en: 'Fretboard' },
  keyboard: { pt: 'Teclado', en: 'Keyboard' },
  clear: { pt: 'Limpar', en: 'Clear' },
  tuning: { pt: 'Afinação', en: 'Tuning' },
  fretRange: { pt: 'Região do braço', en: 'Fret range' },
  showAs: { pt: 'Mostrar como', en: 'Show as' },
  noteNames: { pt: 'Nomes das notas', en: 'Note names' },
  degrees: { pt: 'Graus', en: 'Degrees' },
  enharmonic: { pt: 'Enarmonia', en: 'Enharmonic' },
  switchSpelling: { pt: 'Trocar grafia', en: 'Switch spelling' },
  semitones: { pt: 'semitons', en: 'semitones' },
  frequency: { pt: 'Frequência', en: 'Frequency' },
  ratio: { pt: 'Razão', en: 'Ratio' },
  fingerings: { pt: 'Digitações sugeridas', en: 'Suggested fingerings' },
  noFingerings: {
    pt: 'Nenhuma digitação completa foi encontrada nesta afinação dentro do alcance de quatro casas. Acordes com muitas notas costumam exigir omissões.',
    en: 'No complete fingering was found in this tuning within a four-fret span. Chords with many notes usually require omissions.'
  },
  chordTones: { pt: 'Notas do acorde', en: 'Chord tones' },

  // Biblioteca de acordes
  'chords.title': { pt: 'Biblioteca de acordes', en: 'Chord library' },
  'chords.lead': {
    pt: 'Escolha a fundamental e o tipo. A fórmula mostra quais graus formam o acorde; a partitura, o braço e o teclado mostram as mesmas notas de três ângulos diferentes.',
    en: 'Pick a root and a type. The formula shows which degrees make up the chord; the staff, fretboard and keyboard show the same notes from three different angles.'
  },
  'chords.inversions': { pt: 'Inversões', en: 'Inversions' },
  'chords.rootPosition': { pt: 'Posição fundamental', en: 'Root position' },
  'chords.enharmonicHint': {
    pt: 'Esta fundamental tem grafia alternativa. Trocar não muda o som, só a escrita — e a escrita certa depende da tonalidade.',
    en: 'This root has an alternative spelling. Switching does not change the sound, only the notation — and the right notation depends on the key.'
  },

  // Identificador
  'finder.title': { pt: 'Construtor e identificador de acordes', en: 'Chord builder & finder' },
  'finder.lead': {
    pt: 'Selecione notas no teclado ou nos botões. A partir de três notas o aplicativo procura acordes compatíveis e explica cada leitura.',
    en: 'Select notes on the keyboard or the buttons. From three notes on, the app looks for matching chords and explains each reading.'
  },
  'finder.selected': { pt: 'Notas selecionadas', en: 'Selected notes' },
  'finder.forceRoot': { pt: 'Forçar fundamental', en: 'Force a root' },
  'finder.auto': { pt: 'Automática', en: 'Automatic' },
  'finder.results': { pt: 'Leituras possíveis', en: 'Possible readings' },
  'finder.match': { pt: 'correspondência', en: 'match' },
  'finder.why': { pt: 'Por quê?', en: 'Why?' },
  'finder.simultaneous': { pt: 'Simultâneo', en: 'Simultaneous' },
  'finder.sequence': { pt: 'Em sequência', en: 'In sequence' },
  'finder.empty': {
    pt: 'Escolha ao menos três notas para começar.',
    en: 'Pick at least three notes to get started.'
  },
  'finder.warn.noMatch': {
    pt: 'Este conjunto não corresponde claramente a nenhum acorde do catálogo. Pode ser um agregado, um trecho de escala ou um acorde com notas estranhas ao contexto.',
    en: 'This set does not clearly match any catalogued chord. It may be a cluster, a fragment of a scale, or a chord with notes foreign to the context.'
  },
  'finder.warn.approximate': {
    pt: 'Nenhuma leitura é exata: as sugestões abaixo têm notas faltando ou sobrando. Considere-as aproximações.',
    en: 'No reading is exact: the suggestions below have missing or extra notes. Treat them as approximations.'
  },
  'finder.warn.ambiguous': {
    pt: 'Mais de uma leitura é exata. Sem contexto tonal, todas são legítimas — o baixo e a tonalidade da música é que decidem.',
    en: 'More than one reading is exact. Without tonal context all of them are legitimate — the bass and the key of the piece decide.'
  },
  'finder.warn.tooFew': { pt: 'Selecione mais notas.', en: 'Select more notes.' },
  'finder.exact': { pt: 'exata', en: 'exact' },
  'finder.missing': { pt: 'faltando', en: 'missing' },
  'finder.extra': { pt: 'extra', en: 'extra' },

  // Campo harmônico
  'field.title': { pt: 'Campo harmônico', en: 'Harmonic field' },
  'field.lead': {
    pt: 'Empilhando terças sobre cada grau de uma escala nascem os acordes que "pertencem" àquela tonalidade. A função harmônica diz o papel de cada um: repouso, afastamento ou tensão.',
    en: 'Stacking thirds on each degree of a scale produces the chords that "belong" to that key. The harmonic function tells what each one does: rest, departure or tension.'
  },
  'field.key': { pt: 'Tonalidade', en: 'Key' },
  'field.scale': { pt: 'Escala', en: 'Scale' },
  'field.triads': { pt: 'Tríades', en: 'Triads' },
  'field.sevenths': { pt: 'Tétrades (com sétima)', en: 'Seventh chords' },
  'field.scaleNotes': { pt: 'Notas da escala', en: 'Scale notes' },
  'field.stepPattern': { pt: 'Padrão de passos', en: 'Step pattern' },
  'field.function': { pt: 'Função', en: 'Function' },
  'field.progressions': { pt: 'Progressões típicas', en: 'Typical progressions' },
  'field.comesAfter': { pt: 'Costuma vir depois de', en: 'Usually comes after' },
  'field.goesTo': { pt: 'Costuma seguir para', en: 'Usually goes to' },
  'field.substitutes': { pt: 'Substitutos (2+ notas em comum)', en: 'Substitutes (2+ shared notes)' },
  'field.selectDegree': { pt: 'Selecione um grau para ver os detalhes.', en: 'Select a degree to see details.' },
  'field.playProgression': { pt: 'Tocar progressão', en: 'Play progression' },
  'field.loop': { pt: 'Repetir', en: 'Loop' },
  'field.secondaryDominant': { pt: 'Dominante secundário', en: 'Secondary dominant' },

  // Interferência
  'interf.title': { pt: 'Interferência entre frequências', en: 'Frequency interference' },
  'interf.lead': {
    pt: 'Dois sons soando juntos se somam. Quando as frequências têm razão simples, a onda resultante se repete depressa e ouvimos algo "liso". Quando a razão é complexa, aparecem batimentos e aspereza.',
    en: 'Two sounds played together add up. When the frequencies have a simple ratio, the resulting wave repeats quickly and we hear something smooth. When the ratio is complex, beating and roughness appear.'
  },
  'interf.noteA': { pt: 'Nota A', en: 'Note A' },
  'interf.noteB': { pt: 'Nota B', en: 'Note B' },
  'interf.manual': { pt: 'Frequência manual (Hz)', en: 'Manual frequency (Hz)' },
  'interf.beat': { pt: 'Batimento', en: 'Beat' },
  'interf.beatFormula': { pt: 'f_batimento = |f₁ − f₂|', en: 'f_beat = |f₁ − f₂|' },
  'interf.window': { pt: 'Janela temporal', en: 'Time window' },
  'interf.zoom': { pt: 'Zoom', en: 'Zoom' },
  'interf.resolution': { pt: 'Resolução', en: 'Resolution' },
  'interf.view': { pt: 'Visualização', en: 'View' },
  'interf.view.waves': { pt: 'Ondas separadas', en: 'Separate waves' },
  'interf.view.sum': { pt: 'Soma', en: 'Sum' },
  'interf.view.envelope': { pt: 'Soma + envoltória', en: 'Sum + envelope' },
  'interf.view.all': { pt: 'Tudo', en: 'Everything' },
  'interf.consonance': { pt: 'Tendência', en: 'Tendency' },
  'interf.moreConsonant': { pt: 'mais consonante', en: 'more consonant' },
  'interf.moreDissonant': { pt: 'mais dissonante', en: 'more dissonant' },
  'interf.intermediate': { pt: 'intermediária', en: 'intermediate' },
  'interf.nearest': { pt: 'Intervalo mais próximo', en: 'Nearest interval' },
  'interf.temperament': { pt: 'Afinação', en: 'Tuning system' },
  'interf.equal': { pt: 'Temperada igual', en: 'Equal temperament' },
  'interf.just': { pt: 'Justa', en: 'Just intonation' },
  'interf.holdToHear': { pt: 'Ouvir juntas', en: 'Hear them together' },
  'interf.harmonicSeries': { pt: 'Série harmônica', en: 'Harmonic series' },
  'interf.beatsVisible': { pt: 'Envoltória de batimento', en: 'Beat envelope' },
  'interf.beatWindow': { pt: 'janela de', en: 'window of' },
  'interf.beatTooFast': {
    pt: 'Acima de cerca de 20 Hz a diferença deixa de ser ouvida como pulsação e passa a ser percebida como aspereza (e, mais adiante, como um terceiro som grave). O gráfico continua correto, mas a janela precisa ser curtíssima para caber um ciclo.',
    en: 'Above roughly 20 Hz the difference stops being heard as a pulsation and becomes roughness (and further up, a low third sound). The graph is still correct, but the window has to be extremely short to fit one cycle.'
  },
  'interf.caveat': {
    pt: 'Consonância e dissonância não são categorias rígidas. O modelo aqui mede apenas a aspereza acústica entre dois sons com harmônicos simples. Na música real, timbre, registro, dinâmica, contexto tonal e cultura mudam completamente a percepção: o trítono é instável no coral de Bach e é apenas colorido no blues.',
    en: 'Consonance and dissonance are not rigid categories. The model here measures only the acoustic roughness between two sounds with simple harmonics. In real music, timbre, register, dynamics, tonal context and culture change perception completely: the tritone is unstable in a Bach chorale and merely colourful in the blues.'
  },

  // Glossário de intervalos (seção didática)
  'gloss.title': { pt: 'Guia rápido', en: 'Quick guide' },
  'gloss.unison': { pt: 'Uníssono (1:1)', en: 'Unison (1:1)' },
  'gloss.unison.d': { pt: 'Mesma frequência: as ondas coincidem e não há batimento. Se houver pequena diferença, ouvimos a afinação "batendo".', en: 'Same frequency: the waves coincide and there is no beating. A small difference makes the tuning "beat".' },
  'gloss.octave': { pt: 'Oitava (2:1)', en: 'Octave (2:1)' },
  'gloss.octave.d': { pt: 'A frequência dobra. Todos os harmônicos do som agudo já existem no grave — por isso soam como "a mesma nota".', en: 'The frequency doubles. Every harmonic of the upper note already exists in the lower one — hence they sound like "the same note".' },
  'gloss.fifth': { pt: 'Quinta justa (3:2)', en: 'Perfect fifth (3:2)' },
  'gloss.fifth.d': { pt: 'Razão muito simples: a onda combinada se repete a cada duas voltas. Base da harmonia ocidental e do círculo das quintas.', en: 'A very simple ratio: the combined wave repeats every two turns. The basis of Western harmony and the circle of fifths.' },
  'gloss.fourth': { pt: 'Quarta justa (4:3)', en: 'Perfect fourth (4:3)' },
  'gloss.fourth.d': { pt: 'Inversão da quinta. Consonante, mas historicamente tratada como dissonância quando aparece sobre o baixo.', en: 'Inversion of the fifth. Consonant, but historically treated as a dissonance when it sits above the bass.' },
  'gloss.M3': { pt: 'Terça maior (5:4)', en: 'Major third (5:4)' },
  'gloss.M3.d': { pt: 'Define o acorde maior. No temperamento igual fica 14 cents mais alta que a terça justa — dá para ouvir os batimentos.', en: 'Defines the major chord. In equal temperament it is 14 cents sharper than the just third — the beating is audible.' },
  'gloss.m3': { pt: 'Terça menor (6:5)', en: 'Minor third (6:5)' },
  'gloss.m3.d': { pt: 'Define o acorde menor. Razão um pouco mais complexa que a terça maior.', en: 'Defines the minor chord. A slightly more complex ratio than the major third.' },
  'gloss.tritone': { pt: 'Trítono (45:32 ou 7:5)', en: 'Tritone (45:32 or 7:5)' },
  'gloss.tritone.d': { pt: 'Divide a oitava ao meio. Razão complexa, muita aspereza; é o motor do acorde dominante.', en: 'Divides the octave in half. A complex ratio with much roughness; it is the engine of the dominant chord.' },
  'gloss.beats': { pt: 'Batimentos', en: 'Beats' },
  'gloss.beats.d': { pt: 'Duas frequências próximas produzem uma pulsação de amplitude a |f₁−f₂| vezes por segundo. Afinadores de ouvido usam exatamente isso.', en: 'Two nearby frequencies produce an amplitude pulsation |f₁−f₂| times per second. Tuning by ear relies precisely on this.' },
  'gloss.series': { pt: 'Série harmônica', en: 'Harmonic series' },
  'gloss.series.d': { pt: 'Um som real contém múltiplos inteiros da fundamental. Os primeiros harmônicos desenham a oitava, a quinta e a terça maior — a origem física dos acordes.', en: 'A real sound contains integer multiples of the fundamental. The first harmonics spell the octave, the fifth and the major third — the physical origin of chords.' },
  'gloss.consonance': { pt: 'Consonância e dissonância', en: 'Consonance and dissonance' },
  'gloss.consonance.d': { pt: 'Consonância é o que soa estável e dissonância o que pede continuação. A fronteira mudou muito ao longo da história e varia entre culturas.', en: 'Consonance is what sounds stable, dissonance what asks to continue. The border has shifted a lot over history and varies between cultures.' },

  // Ajustes
  'settings.title': { pt: 'Ajustes', en: 'Settings' },
  'settings.language': { pt: 'Idioma', en: 'Language' },
  'settings.theme': { pt: 'Tema', en: 'Theme' },
  'settings.theme.light': { pt: 'Claro', en: 'Light' },
  'settings.theme.dark': { pt: 'Escuro', en: 'Dark' },
  'settings.theme.auto': { pt: 'Do sistema', en: 'System' },
  'settings.notation': { pt: 'Nomes das notas', en: 'Note names' },
  'settings.notation.pt': { pt: 'Dó Ré Mi', en: 'Dó Ré Mi' },
  'settings.notation.en': { pt: 'C D E', en: 'C D E' },
  'settings.waveform': { pt: 'Forma de onda', en: 'Waveform' },
  'settings.volume': { pt: 'Volume', en: 'Volume' },
  'settings.tempo': { pt: 'Andamento (BPM)', en: 'Tempo (BPM)' },
  'settings.a4': { pt: 'Referência do Lá4 (Hz)', en: 'A4 reference (Hz)' },
  'settings.reset': { pt: 'Apagar dados salvos', en: 'Clear saved data' },
  'settings.resetDone': { pt: 'Dados locais apagados.', en: 'Local data cleared.' },
  'settings.audioNote': {
    pt: 'O som é gerado por osciladores simples. É útil para comparar alturas, mas não reproduz o timbre de um instrumento real — um violão tem dezenas de parciais, ruído de ataque e ressonância de corpo.',
    en: 'The sound comes from simple oscillators. It is useful for comparing pitches, but it does not reproduce the timbre of a real instrument — a guitar has dozens of partials, attack noise and body resonance.'
  },
  'settings.storageNote': {
    pt: 'Preferências e progresso ficam no armazenamento local do navegador (localStorage). Nada sai do seu dispositivo.',
    en: 'Preferences and progress live in the browser\'s local storage. Nothing leaves your device.'
  }
};

let current = 'pt';
const listeners = new Set();

export function setLang(lang) {
  current = lang === 'en' ? 'en' : 'pt';
  document.documentElement.lang = current === 'pt' ? 'pt-BR' : 'en';
  listeners.forEach((fn) => fn(current));
}

export function getLang() { return current; }

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Texto traduzido. */
export function t(key) {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[current] || entry.pt;
}

/** Escolhe o campo certo de um objeto { pt, en }. */
export function pick(obj) {
  if (!obj) return '';
  return obj[current] || obj.pt || obj.en || '';
}

export { DICT };
