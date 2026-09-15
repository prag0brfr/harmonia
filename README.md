# Harmonia — teoria musical visual e interativa

Aplicativo web estático para estudar teoria musical tendo o violão como ponto
de partida. Roda inteiramente no navegador: **sem backend, sem cadastro, sem
envio de dados** e sem dependências de terceiros — apenas HTML, CSS,
JavaScript puro, SVG, Canvas e a Web Audio API.

Interface bilíngue (português / inglês), com escolha independente entre os
nomes de nota em solfejo latino (Dó Ré Mi) e notação internacional (C D E).

---

## 1. Objetivo

Ajudar iniciantes e estudantes a:

- entender notas, intervalos, escalas e acordes;
- visualizar as relações entre frequências e ouvir por que certos intervalos
  soam "lisos" e outros "ásperos";
- identificar acordes a partir de um conjunto de notas, com as ambiguidades
  explicitadas em vez de escondidas;
- compreender campos harmônicos e funções harmônicas;
- ver as mesmas notas em três representações (partitura, braço da guitarra e
  teclado de piano), para perceber que são apenas mapas diferentes do mesmo som.

A ênfase é **didática e honesta**: quando a análise automática é ambígua ou
aproximada, o aplicativo diz isso.

---

## 2. Funcionalidades

Nove ferramentas, cada uma numa tela própria montada em colunas para caber
inteira numa tela de computador sem rolagem.

| Ferramenta | O que faz |
|---|---|
| **Biblioteca de acordes** | 35 tipos de acorde, de tríades a alterados; notas, fórmula, intervalos e frequências; inversões; partitura, braço, teclado e digitações sugeridas; reprodução em bloco, arpejo ou nota a nota; troca de grafia enarmônica |
| **Construtor e identificador** | Seleção de notas no teclado virtual ou por botões; identificação com pontuação de correspondência, inversão detectada pelo baixo, explicação do raciocínio e aviso de ambiguidade |
| **Explorador de escalas** | 18 escalas e modos; fórmula, graus, padrão de passos e aplicação; acordes do campo harmônico (ou os que cabem na escala, quando ela não gera sete graus); reprodução subindo, descendo e em terças; braço e teclado |
| **Calculadora de intervalos** | Nome, abreviação, semitons, classificação simples/composta, inversão, frequências, razão simplificada e desvio em cents da afinação justa; reprodução ascendente, descendente e simultânea; partitura, braço e teclado |
| **Campo harmônico** | Dez escalas de sete graus; tríades ou tétrades; grau, qualidade, fórmula e função harmônica; acordes que precedem e sucedem; substitutos; dominante secundário; onze progressões-modelo tocáveis em laço |
| **Montador de progressões** | Sequência montada a partir dos graus (mais dominantes secundários), com reordenação e remoção; execução em bloco, arpejada ou com baixo; andamento e tempos por acorde; laço; sugestões de continuação; modelos prontos; salvamento no navegador |
| **Transposição** | Notas, cifras e progressões inteiras, por semitons ou de tonalidade a tonalidade, preservando a grafia; original e resultado lado a lado, ambos tocáveis; escala transposta com partitura |
| **Treinamento auditivo** | Nove tipos de exercício (notas, intervalos, qualidade do acorde, sétimas, escalas, graus, consonância, progressões e tonalidade) em três níveis, com áudio, múltiplas tentativas, resposta comentada, pontuação e evolução guardadas localmente |
| **Interferência entre frequências** | Duas notas ou frequências manuais; formas de onda, soma e envoltória em Canvas com zoom, janela temporal e resolução ajustáveis; frequência de batimento, razão simplificada, intervalo temperado mais próximo em cents, estimativa de consonância (Plomp–Levelt/Sethares), série harmônica e um guia rápido de conceitos |
| **Áudio** | Osciladores senoidal, triangular, quadrado e dente de serra, com envoltória ADSR, volume, andamento, referência do Lá4 ajustável (392–466 Hz) e parada imediata |
| **Ajustes** (botão ⚙) | Idioma, notação das notas, tema claro/escuro/automático, afinação do violão, som e limpeza dos dados locais |

O botão **? Como usar** abre um diálogo com o objetivo do aplicativo, o caminho
de estudo sugerido, a lista de ferramentas e os atalhos de teclado.

---

## 3. Tecnologias

- HTML5, CSS3 (variáveis, grid, flex, `color-mix`), JavaScript ES2022 (módulos ES)
- SVG para partitura, braço e teclado
- Canvas 2D para os gráficos de onda
- Web Audio API para o som
- `localStorage` para preferências
- Service worker simples para funcionamento offline

**Nenhuma biblioteca de terceiros é usada, nem em produção nem nos testes.**
Não há etapa de compilação obrigatória: os arquivos são servidos como estão.
As claves de sol e de fá da partitura são desenhadas com curvas de Bézier
próprias, justamente para não depender de fontes musicais como a Bravura.

---

## 4. Estrutura de pastas

```
.
├── index.html                  Casca da aplicação
├── manifest.webmanifest        Metadados do PWA
├── icon.svg                    Ícone
├── sw.js                       Service worker (cache offline)
├── css/
│   └── styles.css              Folha de estilos única, com tema claro/escuro
├── js/
│   ├── app.js                  Abas, navegação por hash, atalhos de teclado
│   ├── i18n.js                 Dicionário PT/EN
│   ├── state.js                Preferências em memória + barramento de eventos
│   ├── storage.js              localStorage protegido contra bloqueio
│   ├── core/                   Teoria musical pura (sem DOM, testável no Node)
│   │   ├── notes.js            Notas, MIDI, frequências, enarmonia, afinação justa
│   │   ├── intervals.js        Número, qualidade, inversão, transposição
│   │   ├── chords.js           Catálogo, construção e identificação de acordes
│   │   ├── scales.js           Escalas e modos
│   │   ├── harmony.js          Campos harmônicos, funções e progressões
│   │   ├── transpose.js        Cifras, progressões e mudança de tonalidade
│   │   └── training.js         Gerador de exercícios auditivos
│   ├── audio/
│   │   └── audio.js            Web Audio API: notas, acordes, progressões
│   ├── view/                   Desenho (SVG/Canvas), sem regra musical
│   │   ├── staff.js            Partitura
│   │   ├── fretboard.js        Braço, afinações e gerador de digitações
│   │   ├── keyboard.js         Teclado de piano
│   │   └── interference.js     Batimento, razões, consonância e gráficos
│   └── ui/                     Telas
│       ├── ui.js               Componentes básicos (h, select, cartões, grade)
│       ├── home.js             Diálogo "Como usar"
│       ├── chordLibrary.js
│       ├── chordFinder.js
│       ├── scales.js
│       ├── intervals.js
│       ├── harmonicField.js
│       ├── progressions.js
│       ├── transpose.js
│       ├── earTraining.js
│       ├── interferenceView.js
│       └── settings.js
├── tests/
│   ├── harness.mjs             Micro-arcabouço de testes
│   └── core.test.mjs           146 testes com entrada e saída esperadas
├── tools/
│   ├── run-tests.mjs           Executor dos testes
│   ├── serve.mjs               Servidor estático de desenvolvimento
│   └── build-standalone.mjs    Empacotador para arquivo único
└── dist/
    └── harmonia.html           Versão de arquivo único (gerada)
```

A separação é deliberada: **`core/` não conhece o DOM**, **`view/` não conhece
regra musical** e **`ui/` só costura os dois**. É isso que permite testar a
teoria no Node e trocar qualquer visualização sem tocar na música.

---

## 5. Como executar

### 5.1 Com um servidor local (recomendado)

Módulos ES não carregam pelo protocolo `file://` por causa da política de
mesma origem, então o `index.html` precisa ser servido por HTTP:

```bash
# Node (incluído no projeto, sem dependências)
node tools/serve.mjs          # http://localhost:8080
node tools/serve.mjs 3000     # outra porta

# ou Python
python3 -m http.server 8080

# ou, se preferir
npx serve .
```

Depois abra `http://localhost:8080`.

### 5.2 Sem servidor nenhum (duplo clique)

Gere a versão de arquivo único:

```bash
node tools/build-standalone.mjs
```

Isso cria `dist/harmonia.html` (~200 KB) com todo o CSS e JavaScript embutidos.
Esse arquivo abre com duplo clique, funciona offline e pode ser enviado por
e-mail ou copiado para um pendrive. O service worker não é usado nesse modo
(ele exige http/https), mas também não faz falta: já está tudo no arquivo.

---

## 6. Como publicar de graça

O projeto é 100 % estático: basta subir a pasta inteira.

### GitHub Pages

```bash
git init
git add .
git commit -m "Harmonia: aplicativo de teoria musical"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/harmonia.git
git push -u origin main
```

No repositório: **Settings → Pages → Build and deployment → Source: Deploy from
a branch**, escolha `main` e a pasta `/ (root)` e salve. Em um ou dois minutos
o app estará em `https://SEU-USUARIO.github.io/harmonia/`.

Como todos os caminhos do projeto são relativos (`css/styles.css`, `./js/...`),
ele funciona tanto na raiz do domínio quanto em um subdiretório de projeto.

### Netlify

- **Pelo site:** arraste a pasta do projeto para <https://app.netlify.com/drop>.
- **Pelo Git:** conecte o repositório; em *Build command* deixe vazio e em
  *Publish directory* use `.`.
- **Pelo terminal:** `npx netlify-cli deploy --dir=. --prod`

### Cloudflare Pages

No painel: **Workers & Pages → Create → Pages → Connect to Git**. Em
*Framework preset* escolha **None**, deixe o *Build command* vazio e use `/`
como *Build output directory*.

Qualquer outra hospedagem estática (Vercel, Surge, Firebase Hosting, um
diretório no Apache) funciona do mesmo jeito. Só garanta que o servidor envie
os `.js` com `Content-Type: text/javascript`, senão os módulos não carregam.

---

## 7. Testes

```bash
node tools/run-tests.mjs     # ou: npm test
```

São 146 testes sobre o núcleo teórico, escritos com entrada e saída explícitas.
Exemplos do que é verificado:

| Entrada | Saída esperada |
|---|---|
| `toMidi(parseNote('C4'))` | `60` |
| `midiToFreq(69)` | `440` Hz |
| `freq(parseNote('C4'))` | `261,6256` Hz |
| `intervalBetween(C4, D#4)` | 2ª aumentada (3 semitons) — e **não** 3ª menor |
| `buildChord(C4, 'dim7')` | `Dó Mi♭ Sol♭ Si♭♭` (sétima diminuta, não sexta maior) |
| `buildScale(F3, 'major')` | `Fá Sol Lá Si♭ Dó Ré Mi` (com Si♭, nunca Lá♯) |
| `identifyChords([E4, G4, C5])` | `C` maior, 1ª inversão |
| `identifyChords([D4, F4, A4, C5])` | `Dm7` **e** `F6` — ambiguidade sinalizada |
| `harmonicField(C4, 'major')` | `I ii iii IV V vi vii°` |
| `openStringMidis(padrão)` | `[40, 45, 50, 55, 59, 64]` |
| `fretMidi(padrão, corda 1, casa 12)` | `76` (Mi5) |
| `beatFrequency(440, 443)` | `3` Hz |
| `ratioApprox(440, 660)` | `3 : 2` |
| `consonanceScore(quinta)` | maior que a do trítono |
| `intervalForKeyChange(C, F#)` | 4ª aumentada — e **não** 5ª diminuta |
| `transposeLine('C \| Am7 F G7/B', C→E♭)` | `E♭ \| Cm7 A♭ B♭7/D` |
| `transposeChordToken('Cmaj7(#11)', C→D)` | `Dmaj7(#11)` — sufixo fora do catálogo é preservado |
| `makeQuestion(exercício, nível)` | resposta sempre presente entre as alternativas, alturas audíveis, explicação nos dois idiomas |

O comportamento em diferentes tamanhos de tela e a reprodução de áudio foram
verificados manualmente em navegador (Chromium), incluindo 390 px de largura
sem rolagem horizontal, tema escuro e navegação por teclado. Esses dois pontos
dependem de APIs do navegador e não são cobertos pelos testes em Node — veja as
limitações.

---

## 8. Como estender

### Adicionar um tipo de acorde

Em `js/core/chords.js`, acrescente uma entrada em `CHORD_TYPES`:

```js
{ id: 'maj7b5', formula: ['1', '3', 'b5', '7'], symbol: 'maj7♭5',
  names: { pt: 'sétima maior com quinta diminuta', en: 'major seventh flat five' },
  category: 'altered' }
```

Só isso. A fórmula em graus já dá as notas com a grafia certa, e o acorde passa
a aparecer no menu, na identificação, na partitura, no braço e no teclado.

### Adicionar uma escala

Em `js/core/scales.js`, acrescente a `SCALE_TYPES`:

```js
{ id: 'phrygianDominant', formula: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
  names: { pt: 'Frígio dominante', en: 'Phrygian dominant' },
  category: 'basic',
  use: { pt: 'Quinto modo da menor harmônica.', en: 'Fifth mode of harmonic minor.' } }
```

Se a escala tiver sete notas e você quiser o campo harmônico dela, inclua o
`id` em `HARMONIC_FIELD_SCALES` e um mapa de funções em `FUNCTION_MAPS`
(`js/core/harmony.js`).

### Adicionar uma afinação

Em `js/view/fretboard.js`, acrescente a `TUNINGS` a lista de cordas soltas, da
mais grave para a mais aguda: `{ id: 'openE', strings: ['E2','B2','E3','G#3','B3','E4'], names: {...} }`.
Qualquer número de cordas funciona.

### Adicionar um texto de interface

Em `js/i18n.js`, uma chave nova com `{ pt, en }`. Chaves ausentes aparecem como
o próprio nome da chave — falha visível, de propósito.

### Adicionar uma seção nova

Crie `js/ui/minhaSecao.js` exportando uma função que devolve
`{ element, refresh }`, registre-a em `TABS` e em `factoryFor()` dentro de
`js/app.js`, e inclua o arquivo em `ASSETS` (`sw.js`) e em `MODULES`
(`tools/build-standalone.mjs`).

---

## 9. Próximos passos sugeridos

1. **Modo justo completo** na reprodução — hoje a afinação justa aparece só na
   seção de frequências; `justFreq` já existe em `core/notes.js`.
2. **Exportação** da partitura em SVG/PNG e das progressões em MIDI.
3. **Metrônomo e padrões rítmicos** de levada na reprodução de progressões.
4. **Cifras livres no montador de progressões** (hoje só graus do campo e
   dominantes secundários) — `core/transpose.js` já lê qualquer cifra.
5. **Exercícios auditivos com o braço do violão**: mostrar a nota tocada no
   braço depois de responder.
6. **Escalas exóticas** (frígio dominante, húngara, bebop): basta acrescentar
   a fórmula em `SCALE_TYPES`.
7. **Partitura com compassos e ritmo**, para escrever melodias curtas.

---

## 10. Limitações conhecidas

**Som.** Os timbres são osciladores simples com envoltória ADSR. Servem para
comparar alturas, não para representar um instrumento real: um violão tem
dezenas de parciais, ruído de ataque, ressonância de corpo e variação por
região do braço. A Web Audio API exige um gesto do usuário para iniciar — o
primeiro clique em qualquer botão de tocar destrava o áudio.

**Partitura.** É uma renderização didática, não um editor de música. Não há
compassos, fórmula de compasso, ligaduras, vozes ou espaçamento tipográfico
profissional. As claves são desenhos próprios, estilizados e reconhecíveis, mas
não têm a forma exata de uma fonte musical profissional. Notas simultâneas a
uma segunda de distância são deslocadas horizontalmente; casos mais complexos
de colisão não são tratados.

**Identificação de acordes.** O algoritmo compara conjuntos de classes de
altura com o catálogo, pesando a terça e a sétima acima da quinta e penalizando
notas estranhas. Ele **não** conhece o contexto tonal, que é justamente o que
decide muitos casos reais: o mesmo Ré Fá Lá Dó é `Dm7` ou `F6` conforme a
música. Conjuntos simétricos (diminutos, aumentados, tons inteiros) admitem
várias leituras igualmente corretas, e todas são mostradas. Acordes rootless,
poliacordes e agregados fora do catálogo aparecem como aproximações ou como
"sem correspondência clara".

**Digitações do violão.** A busca exige o acorde completo dentro de uma janela
de quatro casas, sem cordas abafadas no meio. Isso exclui digitações reais que
omitem a quinta ou usam polegar na sexta corda, e pode não achar nada para
acordes de cinco ou seis notas. As posições são ordenadas por facilidade
estimada, não por ergonomia real — não há modelo de dedos.

**Consonância e dissonância.** O índice usa o modelo de aspereza de
Plomp & Levelt na formulação de Sethares, sobre seis harmônicos de espectro
1/n. É uma medida **acústica e relativa**, útil para comparar intervalos entre
si. Percepção musical depende de timbre, registro, dinâmica, contexto tonal,
época e cultura — o trítono é instável num coral de Bach e é apenas colorido
num blues. O aplicativo diz isso explicitamente na tela.

**Afinação justa.** Está implementada como razões fixas relativas a uma tônica,
e aparece apenas na seção de frequências. Um sistema justo completo precisaria
tratar comas, escolha de referência por acorde e afinação adaptativa.

**Enarmonia.** A grafia é preservada nos cálculos, mas as escalas simétricas
(diminutas, cromática) inevitavelmente repetem letras, porque doze ou oito
notas não cabem em sete letras sem repetição.

**Transposição.** As cifras são transpostas pelo intervalo entre as tônicas, o
que preserva a lógica de letras; quando o resultado exigiria acidente duplo
(Fá♭♭, Sol♯♯), trocamos pela enarmonia simples, como se faz na prática. O
sufixo da cifra é copiado literalmente: `Cmaj7(#11)` vira `Dmaj7(#11)` sem que
o aplicativo precise entender a alteração. Só transpomos o que estiver escrito
em cifras — não há leitura de partitura nem de arquivos MIDI.

**Treinamento auditivo.** Os exercícios usam o mesmo som sintético do resto do
aplicativo, o que os torna mais fáceis do que reconhecer intervalos num
instrumento real. O nível "difícil" acrescenta tonalidades com acidentes,
inversões e intervalos descendentes, mas não simula timbres diferentes. A
pontuação é local: apaga junto com os dados do navegador e não sincroniza
entre dispositivos.

**Caber numa tela.** As seções foram montadas em colunas para caber numa tela
de computador (a partir de cerca de 1280×800) sem rolagem da página: cartões
com muito conteúdo rolam por dentro. Em telas menores que 1180 px a grade cai
para duas colunas e, abaixo de 760 px, para uma só — aí a rolagem vertical
volta, como é natural no celular.

**Armadura de clave.** Coberta para as tonalidades do círculo das quintas até
sete acidentes; modos gregos usam a armadura da relativa maior/menor
correspondente e não indicam as alterações modais.

**Navegadores.** Requer suporte a módulos ES, `color-mix()` em CSS e Web Audio
API — ou seja, versões recentes de Chrome, Edge, Firefox e Safari. Em janela
anônima ou com armazenamento bloqueado, o aplicativo funciona normalmente, mas
não guarda as preferências (e avisa sobre isso nos Ajustes).

---

## 11. Privacidade

Não há conta, cadastro, telemetria, cookie ou chamada de rede para terceiros.
O único armazenamento é o `localStorage` do próprio navegador, com as chaves
prefixadas por `harmonia:`, e guarda apenas idioma, tema, notação, forma de
onda, volume, andamento, referência do Lá4 e afinação escolhida. O botão
**Apagar dados salvos**, nos Ajustes, remove tudo. Depois do primeiro
carregamento, o service worker permite usar o aplicativo offline.

---

## 12. Decisões técnicas

**Fórmulas em graus, não em semitons.** Um acorde é `['1','3','5','b7']` e uma
escala é `['1','2','b3','4','5','b6','7']`. Guardar semitons seria mais simples
e produziria enarmonias erradas: Fá maior sairia com Lá♯ em vez de Si♭, e o
Dó diminuto com sétima sairia com Lá em vez de Si♭♭. O grau carrega, junto com
a distância, a **letra** que a nota deve ter.

**Sem framework.** O aplicativo tem poucas telas e muito desenho. Um framework
traria peso, uma etapa de build e uma dependência a manter, sem resolver o
problema difícil, que é musical e gráfico. A função `h()` em `js/ui/ui.js` tem
trinta linhas e cobre tudo o que é preciso.

**Redesenho completo por seção.** Cada seção se redesenha inteira a cada
mudança. Com estas quantidades de elementos é instantâneo, e evita a classe de
bugs mais chata de interface manual: estado espalhado entre nós do DOM.

**Módulos ES em vez de um bundle.** O código fica legível no navegador, sem
build. Como `file://` não aceita módulos, o empacotador próprio
(`tools/build-standalone.mjs`, ~120 linhas) gera a versão de arquivo único
quando ela é necessária.

**Pesos na identificação de acordes.** Terça e sétima definem a qualidade;
a quinta justa é a nota mais dispensável (pesa 0,45); extensões pesam 0,65. Sem
essa hierarquia, um Dó maior sem quinta seria rejeitado e um Dó com nona
ganharia de um Dó7 legítimo.

**Claves desenhadas à mão.** Os glifos musicais Unicode (U+1D11E) dependem de
fontes que muitos sistemas não têm, e embutir uma fonte musical acrescentaria
centenas de kilobytes e uma licença a respeitar. Curvas de Bézier resolvem com
alguns bytes e aparência idêntica em qualquer lugar.

**Teste em Node, não em navegador.** Como `core/` não toca no DOM, os testes
rodam com `node tools/run-tests.mjs` em menos de um segundo, sem instalar nada.

**Layout em grade de doze colunas.** Cada seção declara quantas colunas cada
cartão ocupa (`span-3`, `span-5`, `span-12`…) e a folha de estilos reduz para
seis e depois para uma coluna conforme a tela encolhe. Cartões com muito
conteúdo recebem um limite de altura e rolam por dentro, o que mantém a página
inteira visível sem sacrificar informação.

**Exercícios auditivos separados do áudio.** `core/training.js` só decide *o
que* tocar, quais alternativas oferecer e por quê; quem toca é a tela. Com um
sorteador semeado (`makeRng`), a mesma semente gera sempre a mesma questão —
é assim que os testes verificam todos os exercícios em todos os níveis.

---

## 13. Atalhos de teclado

| Tecla | Ação |
|---|---|
| `1` … `9` | Alterna entre as nove ferramentas |
| `,` | Abre os ajustes |
| `?` | Abre o diálogo "Como usar" |
| `Esc` | Interrompe o som imediatamente |
| `Tab` / `Shift+Tab` | Percorre os controles |
| `Enter` / `Espaço` | Aciona notas no braço e no teclado |

Todos os controles gráficos têm rótulo acessível; o braço e o teclado expõem
cada nota como botão com `aria-label` descrevendo nota, corda e casa.

---

## 14. Licença

MIT — veja [LICENSE](LICENSE). Use, modifique e publique à vontade, inclusive
para fins comerciais, mantendo o aviso de copyright.
