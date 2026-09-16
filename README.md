# Harmonia — visual, interactive music theory

**EN —** A static web app for studying music theory with the guitar as the
starting point. It runs entirely in the browser: **no backend, no sign-up, no
data leaving your machine** and no third-party dependencies — just HTML, CSS,
plain JavaScript, SVG, Canvas and the Web Audio API. The interface is bilingual
(English / Portuguese), and note names can be switched independently between
international notation (C D E) and Latin solfège (Dó Ré Mi).

**PT —** Aplicativo web estático para estudar teoria musical tendo o violão
como ponto de partida. Roda inteiramente no navegador: **sem backend, sem
cadastro, sem envio de dados** e sem dependências de terceiros — apenas HTML,
CSS, JavaScript puro, SVG, Canvas e a Web Audio API. A interface é bilíngue
(inglês / português), com escolha independente entre a notação internacional
(C D E) e o solfejo latino (Dó Ré Mi). O restante deste documento está em
inglês; para usar o aplicativo em português, basta trocar o idioma no botão ⚙.

---

## 1. Purpose

Help beginners and students to:

- understand notes, intervals, scales and chords;
- visualise the relationships between frequencies, and hear why some intervals
  sound "smooth" and others "rough";
- identify chords from a set of notes, with the ambiguities made explicit
  rather than hidden;
- make sense of harmonic fields and harmonic function;
- see the same notes in three representations (staff, guitar fretboard and
  piano keyboard), so it becomes clear they are just different maps of the
  same sound.

The emphasis is **didactic and honest**: when the automatic analysis is
ambiguous or approximate, the app says so.

---

## 2. Features

Nine tools, each on its own screen, laid out in columns so that a desktop
screen shows the whole thing without scrolling.

| Tool | What it does |
|---|---|
| **Chord library** | 36 chord types, from triads to altered chords; notes, formula, intervals and frequencies; inversions; staff, fretboard, keyboard and suggested fingerings; playback as a block, arpeggiated or note by note; enharmonic respelling |
| **Chord builder & finder** | Pick notes on the virtual keyboard or with buttons; identification with a match score, inversion detected from the bass, an explanation of the reasoning and an ambiguity warning |
| **Scale & mode explorer** | 18 scales and modes; formula, degrees, step pattern and typical use; chords of the harmonic field (or the chords that fit inside the scale, when it does not produce seven degrees); playback ascending, descending and in thirds; fretboard and keyboard |
| **Interval calculator** | Name, abbreviation, semitones, simple/compound classification, inversion, frequencies, simplified ratio and deviation in cents from just intonation; ascending, descending and simultaneous playback; staff, fretboard and keyboard |
| **Harmonic field** | Ten seven-degree scales; triads or seventh chords; degree, quality, formula and harmonic function; chords that typically precede and follow; substitutes; secondary dominants; eleven model progressions playable on a loop |
| **Progression builder** | A sequence assembled from the degrees (plus secondary dominants), with reordering and removal; block, arpeggiated or bass-then-chord playback; tempo and beats per chord; loop; suggested continuations; ready-made templates; saved in the browser |
| **Transposition** | Notes, chord symbols and whole progressions, by semitones or from key to key, preserving spelling; original and result side by side, both playable; the transposed scale with staff notation |
| **Ear training** | Nine exercise types (notes, intervals, chord quality, sevenths, scales, degrees, consonance, progressions and key) across three levels, with audio, multiple attempts, a commented answer, and scores and progress kept locally |
| **Frequency interference** | Two notes or manual frequencies; waveforms, sum and envelope drawn on Canvas with adjustable zoom, time window and resolution; beat frequency, simplified ratio, nearest tempered interval in cents, a consonance estimate (Plomp–Levelt/Sethares), the harmonic series and a quick concept guide |
| **Audio** | Sine, triangle, square and sawtooth oscillators with an ADSR envelope, volume, tempo, adjustable A4 reference (392–466 Hz) and an immediate stop |
| **Settings** (⚙ button) | Language, note notation, light/dark/automatic theme, guitar tuning, sound, and clearing local data |

The **? How to use** button opens a dialog with the app's purpose, a suggested
study path, the list of tools and the keyboard shortcuts.

---

## 3. Technology

- HTML5, CSS3 (custom properties, grid, flex, `color-mix`), JavaScript ES2022 (ES modules)
- SVG for the staff, fretboard and keyboard
- Canvas 2D for the waveform graphs
- Web Audio API for sound
- `localStorage` for preferences
- A small service worker for offline use

**No third-party library is used, in production or in the tests.** There is no
mandatory build step: the files are served as they are. The treble and bass
clefs are drawn with hand-written Bézier curves precisely so that no music font
such as Bravura is needed.

---

## 4. Folder structure

```
.
├── index.html                  App shell
├── manifest.webmanifest        PWA metadata
├── icon.svg                    Icon
├── sw.js                       Service worker (offline cache)
├── css/
│   └── styles.css              Single stylesheet, light/dark theme, mobile layout
├── js/
│   ├── app.js                  Tabs, hash navigation, keyboard shortcuts
│   ├── i18n.js                 EN/PT dictionary
│   ├── state.js                In-memory preferences + event bus
│   ├── storage.js              localStorage, guarded against being blocked
│   ├── core/                   Pure music theory (no DOM, testable in Node)
│   │   ├── notes.js            Notes, MIDI, frequencies, enharmonics, just intonation
│   │   ├── intervals.js        Number, quality, inversion, transposition
│   │   ├── chords.js           Chord catalogue, construction and identification
│   │   ├── scales.js           Scales and modes
│   │   ├── harmony.js          Harmonic fields, functions and progressions
│   │   ├── transpose.js        Chord symbols, progressions and key changes
│   │   └── training.js         Ear-training exercise generator
│   ├── audio/
│   │   └── audio.js            Web Audio API: notes, chords, progressions
│   ├── view/                   Drawing (SVG/Canvas), no music rules
│   │   ├── staff.js            Staff notation
│   │   ├── fretboard.js        Fretboard, tunings and fingering generator
│   │   ├── keyboard.js         Piano keyboard
│   │   └── interference.js     Beats, ratios, consonance and graphs
│   └── ui/                     Screens
│       ├── ui.js               Basic components (h, select, cards, grid)
│       ├── home.js             "How to use" dialog
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
│   ├── harness.mjs             Micro test harness
│   └── core.test.mjs           146 tests with explicit input and expected output
├── tools/
│   ├── run-tests.mjs           Test runner
│   ├── serve.mjs               Static development server
│   └── build-standalone.mjs    Single-file bundler
└── dist/                       Generated
    ├── harmonia.html           Single-file version (opens with a double-click)
    └── artifact.html           Same app without the document shell, for embedding
```

The separation is deliberate: **`core/` knows nothing about the DOM**,
**`view/` knows nothing about music theory** and **`ui/` only stitches the two
together**. That is what makes it possible to test the theory in Node and to
replace any visualisation without touching the music.

---

## 5. Running it

### 5.1 With a local server (recommended)

ES modules do not load over the `file://` protocol because of the same-origin
policy, so `index.html` has to be served over HTTP:

```bash
# Node (included in the project, no dependencies)
node tools/serve.mjs          # http://localhost:8080
node tools/serve.mjs 3000     # another port

# or Python
python3 -m http.server 8080

# or, if you prefer
npx serve .
```

Then open `http://localhost:8080`.

### 5.2 With no server at all (double-click)

Build the single-file version:

```bash
node tools/build-standalone.mjs     # or: npm run build
```

This writes `dist/harmonia.html` (~300 KB) with all the CSS and JavaScript
inlined. That file opens with a double-click, works offline and can be emailed
or copied onto a USB stick. The service worker is not used in this mode (it
requires http/https), and it is not needed either — everything is already in
the file. The same command also writes `dist/artifact.html`, which is the same
app without the `<!DOCTYPE>`/`<html>`/`<head>`/`<body>` wrapper, for hosts that
supply their own document shell.

---

## 6. Publishing it for free

The project is 100 % static: just upload the whole folder.

### GitHub Pages

```bash
git init
git add .
git commit -m "Harmonia: music theory app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/harmonia.git
git push -u origin main
```

In the repository: **Settings → Pages → Build and deployment → Source: Deploy
from a branch**, pick `main` and the `/ (root)` folder, and save. Within a
minute or two the app will be live at
`https://YOUR-USERNAME.github.io/harmonia/`.

Because every path in the project is relative (`css/styles.css`, `./js/...`),
it works both at the root of a domain and in a project subdirectory.

### Netlify

- **From the site:** drag the project folder onto <https://app.netlify.com/drop>.
- **From Git:** connect the repository; leave *Build command* empty and set
  *Publish directory* to `.`.
- **From the terminal:** `npx netlify-cli deploy --dir=. --prod`

### Cloudflare Pages

In the dashboard: **Workers & Pages → Create → Pages → Connect to Git**. Set
*Framework preset* to **None**, leave *Build command* empty and use `/` as the
*Build output directory*.

Any other static host (Vercel, Surge, Firebase Hosting, a directory on Apache)
works the same way. Just make sure the server sends `.js` files with
`Content-Type: text/javascript`, otherwise the modules will not load.

---

## 7. Tests

```bash
node tools/run-tests.mjs     # or: npm test
```

There are 146 tests covering the theory core, written with explicit inputs and
expected outputs. A sample of what is checked:

| Input | Expected output |
|---|---|
| `toMidi(parseNote('C4'))` | `60` |
| `midiToFreq(69)` | `440` Hz |
| `freq(parseNote('C4'))` | `261.6256` Hz |
| `intervalBetween(C4, D#4)` | augmented 2nd (3 semitones) — and **not** a minor 3rd |
| `buildChord(C4, 'dim7')` | `C E♭ G♭ B♭♭` (a diminished seventh, not a major sixth) |
| `buildScale(F3, 'major')` | `F G A B♭ C D E` (with B♭, never A♯) |
| `identifyChords([E4, G4, C5])` | `C` major, 1st inversion |
| `identifyChords([D4, F4, A4, C5])` | `Dm7` **and** `F6` — ambiguity flagged |
| `harmonicField(C4, 'major')` | `I ii iii IV V vi vii°` |
| `openStringMidis(standard)` | `[40, 45, 50, 55, 59, 64]` |
| `fretMidi(standard, string 1, fret 12)` | `76` (E5) |
| `beatFrequency(440, 443)` | `3` Hz |
| `ratioApprox(440, 660)` | `3 : 2` |
| `consonanceScore(fifth)` | higher than the tritone's |
| `intervalForKeyChange(C, F#)` | augmented 4th — and **not** a diminished 5th |
| `transposeLine('C \| Am7 F G7/B', C→E♭)` | `E♭ \| Cm7 A♭ B♭7/D` |
| `transposeChordToken('Cmaj7(#11)', C→D)` | `Dmaj7(#11)` — a suffix outside the catalogue is preserved |
| `makeQuestion(exercise, level)` | the answer is always among the options, the pitches are audible, the explanation exists in both languages |

Behaviour across screen sizes and audio playback were verified by hand in a
browser (Chromium): 360 px, 390 px and 1440 px wide with no horizontal
scrolling, dark theme, and keyboard navigation. Those two areas depend on
browser APIs and are not covered by the Node tests — see the limitations.

---

## 8. Extending it

### Adding a chord type

In `js/core/chords.js`, add an entry to `CHORD_TYPES`:

```js
{ id: 'maj7b5', formula: ['1', '3', 'b5', '7'], symbol: 'maj7♭5',
  names: { pt: 'sétima maior com quinta diminuta', en: 'major seventh flat five' },
  category: 'altered' }
```

That is all. The formula in scale degrees already yields the notes with the
right spelling, and the chord starts appearing in the menu, in identification,
on the staff, on the fretboard and on the keyboard.

### Adding a scale

In `js/core/scales.js`, add to `SCALE_TYPES`:

```js
{ id: 'phrygianDominant', formula: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
  names: { pt: 'Frígio dominante', en: 'Phrygian dominant' },
  category: 'basic',
  use: { pt: 'Quinto modo da menor harmônica.', en: 'Fifth mode of harmonic minor.' } }
```

If the scale has seven notes and you want its harmonic field, add the `id` to
`HARMONIC_FIELD_SCALES` and a function map to `FUNCTION_MAPS`
(`js/core/harmony.js`).

### Adding a tuning

In `js/view/fretboard.js`, add the list of open strings to `TUNINGS`, from
lowest to highest:
`{ id: 'openE', strings: ['E2','B2','E3','G#3','B3','E4'], names: {...} }`.
Any number of strings works.

### Adding an interface string

In `js/i18n.js`, a new key with `{ pt, en }`. Missing keys render as the key
name itself — a visible failure, on purpose.

### Adding a new section

Create `js/ui/mySection.js` exporting a function that returns
`{ element, refresh }`, register it in `TABS` and in `factoryFor()` inside
`js/app.js`, and add the file to `ASSETS` (`sw.js`) and to `MODULES`
(`tools/build-standalone.mjs`).

---

## 9. Suggested next steps

1. **Full just intonation** in playback — today just intonation only appears in
   the frequencies section; `justFreq` already exists in `core/notes.js`.
2. **Export** of the staff as SVG/PNG and of progressions as MIDI.
3. **Metronome and strumming patterns** in progression playback.
4. **Free chord symbols in the progression builder** (today only field degrees
   and secondary dominants) — `core/transpose.js` already parses any symbol.
5. **Ear-training exercises on the fretboard**: show the played note on the
   neck after answering.
6. **Exotic scales** (Phrygian dominant, Hungarian, bebop): just add the
   formula to `SCALE_TYPES`.
7. **Staff notation with bars and rhythm**, to write short melodies.

---

## 10. Known limitations

**Sound.** The timbres are simple oscillators with an ADSR envelope. They are
good for comparing pitches, not for representing a real instrument: a guitar
has dozens of partials, attack noise, body resonance and variation along the
neck. The Web Audio API requires a user gesture to start — the first click on
any play button unlocks the audio.

**Staff notation.** This is a didactic rendering, not a score editor. There are
no bars, time signatures, ties, voices or professional typographic spacing. The
clefs are custom drawings — stylised and recognisable, but not the exact shape
of a professional music font. Simultaneous notes a second apart are offset
horizontally; more complex collision cases are not handled.

**Chord identification.** The algorithm compares pitch-class sets against the
catalogue, weighting the third and the seventh above the fifth and penalising
foreign notes. It does **not** know the tonal context, which is exactly what
decides many real cases: the same D F A C is `Dm7` or `F6` depending on the
music. Symmetric sets (diminished, augmented, whole tone) admit several equally
correct readings, and all of them are shown. Rootless voicings, polychords and
aggregates outside the catalogue appear as approximations or as "no clear
match".

**Guitar fingerings.** The search requires the complete chord within a
four-fret window, with no muted strings in the middle. That rules out real
voicings which omit the fifth or use the thumb on the sixth string, and it may
find nothing for five- or six-note chords. Positions are ordered by estimated
ease, not by real ergonomics — there is no model of the hand.

**Consonance and dissonance.** The index uses the Plomp & Levelt roughness
model in Sethares' formulation, over six harmonics of a 1/n spectrum. It is an
**acoustic and relative** measure, useful for comparing intervals against each
other. Musical perception depends on timbre, register, dynamics, tonal context,
period and culture — the tritone is unstable in a Bach chorale and merely
colourful in a blues. The app says so explicitly on screen.

**Just intonation.** Implemented as fixed ratios relative to a tonic, and it
appears only in the frequencies section. A complete just system would have to
deal with commas, per-chord reference choice and adaptive tuning.

**Enharmonics.** Spelling is preserved throughout the calculations, but
symmetric scales (diminished, chromatic) inevitably repeat letters, because
twelve or eight notes do not fit into seven letters without repetition.

**Transposition.** Chord symbols are transposed by the interval between the
tonics, which preserves the letter logic; when the result would require a
double accidental (F♭♭, G♯♯), we substitute the simple enharmonic, as is done
in practice. The suffix is copied literally: `Cmaj7(#11)` becomes
`Dmaj7(#11)` without the app needing to understand the alteration. Only written
chord symbols are transposed — there is no score reading and no MIDI import.

**Ear training.** The exercises use the same synthetic sound as the rest of the
app, which makes them easier than recognising intervals on a real instrument.
The "hard" level adds keys with accidentals, inversions and descending
intervals, but does not simulate different timbres. Scores are local: they are
erased along with the browser data and do not sync across devices.

**Fitting on one screen.** On a desktop screen (from roughly 1280×800 up) the
sections are laid out in columns so the whole tool is visible without scrolling
the page; cards with a lot of content scroll internally. Below 1180 px the grid
drops to two columns. Below 760 px the phone layout takes over: a single
column, the tabs move to a fixed bar at the bottom of the screen, the internal
card scrolling is removed and the page scrolls vertically, as is natural on a
phone.

**Key signatures.** Covered for the circle-of-fifths keys up to seven
accidentals; church modes use the key signature of the corresponding relative
major/minor and do not show the modal alterations.

**Browsers.** Requires support for ES modules, CSS `color-mix()` and the Web
Audio API — that is, recent versions of Chrome, Edge, Firefox and Safari. In a
private window or with storage blocked the app works normally, but it will not
remember preferences (and it says so in Settings).

---

## 11. Privacy

There is no account, sign-up, telemetry, cookie or network call to any third
party. The only storage is the browser's own `localStorage`, with keys prefixed
`harmonia:`, and it holds only the language, theme, notation, waveform, volume,
tempo, A4 reference and chosen tuning. The **Clear saved data** button in
Settings removes everything. After the first load, the service worker allows
the app to be used offline.

---

## 12. Technical decisions

**Formulas in scale degrees, not semitones.** A chord is `['1','3','5','b7']`
and a scale is `['1','2','b3','4','5','b6','7']`. Storing semitones would be
simpler and would produce wrong enharmonics: F major would come out with A♯
instead of B♭, and C diminished seventh with A instead of B♭♭. The degree
carries, along with the distance, the **letter** the note must have.

**No framework.** The app has few screens and a lot of drawing. A framework
would bring weight, a build step and a dependency to maintain, without solving
the hard problem, which is musical and graphical. The `h()` function in
`js/ui/ui.js` is thirty lines and covers everything needed.

**Full redraw per section.** Each section redraws itself entirely on every
change. At these element counts it is instantaneous, and it avoids the most
tedious class of hand-written-UI bug: state scattered across DOM nodes.

**ES modules instead of a bundle.** The code stays readable in the browser,
with no build. Since `file://` will not accept modules, the project's own
bundler (`tools/build-standalone.mjs`, ~120 lines) produces the single-file
version when it is needed.

**Weights in chord identification.** Third and seventh define the quality; the
perfect fifth is the most expendable note (weight 0.45); extensions weigh 0.65.
Without that hierarchy, a C major without a fifth would be rejected and a C
with a ninth would beat a legitimate C7.

**Hand-drawn clefs.** The Unicode musical glyphs (U+1D11E) depend on fonts many
systems do not have, and embedding a music font would add hundreds of kilobytes
and a licence to respect. Bézier curves solve it in a few bytes and look
identical everywhere.

**Testing in Node, not in a browser.** Since `core/` never touches the DOM, the
tests run with `node tools/run-tests.mjs` in under a second, with nothing to
install.

**A twelve-column grid layout.** Each section declares how many columns each
card occupies (`span-3`, `span-5`, `span-12`…) and the stylesheet reduces that
to six and then to a single column as the screen shrinks. Cards with a lot of
content get a height limit and scroll internally on desktop, which keeps the
whole page visible without sacrificing information.

**A separate mobile layout, not a shrunken desktop one.** Below 760 px the tabs
leave the header and become a bar fixed to the bottom of the screen, within
thumb reach, which auto-scrolls to keep the active tab centred. The internal
card scrolling is switched off — nested scroll areas are miserable on a phone —
form fields sit two per row with 16 px text so iOS does not zoom on focus, every
control gets a 40–44 px touch target, and the fretboard and keyboard become
full-bleed swipeable strips. All of it lives inside `max-width: 760px` media
queries, so the desktop layout is untouched.

**Ear-training exercises separated from the audio.** `core/training.js` only
decides *what* to play, which options to offer and why; the screen does the
playing. With a seeded random generator (`makeRng`), the same seed always
produces the same question — that is how the tests verify every exercise at
every level.

---

## 13. Keyboard shortcuts

| Key | Action |
|---|---|
| `1` … `9` | Switch between the nine tools |
| `,` | Open settings |
| `?` | Open the "How to use" dialog |
| `Esc` | Stop the sound immediately |
| `Tab` / `Shift+Tab` | Move through the controls |
| `Enter` / `Space` | Trigger notes on the fretboard and keyboard |

Every graphical control has an accessible label; the fretboard and the keyboard
expose each note as a button with an `aria-label` describing note, string and
fret.

---

## 14. Licence

MIT — see [LICENSE](LICENSE). Use, modify and publish freely, including for
commercial purposes, keeping the copyright notice.
