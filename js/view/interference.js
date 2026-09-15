/**
 * interference.js — Interferência entre duas frequências.
 *
 * Duas senoides somadas produzem:
 *   y(t) = sin(2π f1 t) + sin(2π f2 t)
 *        = 2 · cos(2π · (f1−f2)/2 · t) · sin(2π · (f1+f2)/2 · t)
 * ou seja, uma onda na frequência média modulada por uma envoltória que
 * oscila em (f1−f2)/2. Como o ouvido percebe os dois picos da envoltória por
 * ciclo, a frequência de BATIMENTO audível é |f1 − f2|.
 */

/** Frequência de batimento em hertz. */
export function beatFrequency(f1, f2) {
  return Math.abs(f1 - f2);
}

/**
 * Aproxima a razão f2/f1 por uma fração simples, usando frações contínuas.
 * @returns {{num:number, den:number, error:number}}
 */
export function ratioApprox(f1, f2, maxDen = 64, tolerance = 0.012) {
  const x = f2 / f1;
  let bestNum = 1;
  let bestDen = 1;
  let bestErr = Infinity;
  for (let den = 1; den <= maxDen; den += 1) {
    const num = Math.round(x * den);
    if (num < 1) continue;
    const err = Math.abs(num / den - x) / x;
    if (err < bestErr - 1e-12) {
      bestErr = err;
      bestNum = num;
      bestDen = den;
      if (err < tolerance) break;
    }
  }
  const g = gcd(bestNum, bestDen);
  return { num: bestNum / g, den: bestDen / g, error: bestErr };
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

/**
 * Dissonância sensorial estimada pelo modelo de Plomp & Levelt na formulação
 * de Sethares. Somamos a aspereza entre os primeiros harmônicos de cada som.
 *
 * O resultado é RELATIVO: serve para comparar intervalos entre si, não para
 * afirmar que um intervalo é "objetivamente" consonante.
 *
 * @param {number} f1 @param {number} f2
 * @param {number} partials número de harmônicos considerados
 * @returns {number} aspereza (0 = liso)
 */
export function roughness(f1, f2, partials = 6) {
  const a = 3.5;
  const b = 5.75;
  const dStar = 0.24;
  const s1 = 0.0207;
  const s2 = 18.96;
  let total = 0;
  for (let i = 1; i <= partials; i += 1) {
    for (let j = 1; j <= partials; j += 1) {
      const fa = f1 * i;
      const fb = f2 * j;
      const amp = (1 / i) * (1 / j);          // espectro de 1/n, como cordas
      const fmin = Math.min(fa, fb);
      const diff = Math.abs(fa - fb);
      const s = dStar / (s1 * fmin + s2);
      total += amp * (Math.exp(-a * s * diff) - Math.exp(-b * s * diff));
    }
  }
  return total;
}

/**
 * Consonância estimada: 0 (muito áspero) a 1 (muito liso).
 * Normalizamos pela aspereza do uníssono/oitava como referência.
 */
export function consonanceScore(f1, f2) {
  const r = roughness(f1, f2);
  const ref = roughness(f1, f1 * 2);   // oitava: quase sem aspereza
  const worst = roughness(f1, f1 * Math.pow(2, 1 / 12)); // 2ª menor: muito áspera
  const clamped = Math.max(0, Math.min(1, (worst - r) / Math.max(1e-9, worst - ref)));
  return clamped;
}

/** Intervalos de referência, com razão justa e caráter usual. */
export const REFERENCE_INTERVALS = [
  { semitones: 0, ratio: [1, 1], key: 'unison', names: { pt: 'Uníssono', en: 'Unison' } },
  { semitones: 1, ratio: [16, 15], key: 'm2', names: { pt: 'Segunda menor', en: 'Minor 2nd' } },
  { semitones: 2, ratio: [9, 8], key: 'M2', names: { pt: 'Segunda maior', en: 'Major 2nd' } },
  { semitones: 3, ratio: [6, 5], key: 'm3', names: { pt: 'Terça menor', en: 'Minor 3rd' } },
  { semitones: 4, ratio: [5, 4], key: 'M3', names: { pt: 'Terça maior', en: 'Major 3rd' } },
  { semitones: 5, ratio: [4, 3], key: 'P4', names: { pt: 'Quarta justa', en: 'Perfect 4th' } },
  { semitones: 6, ratio: [45, 32], key: 'tritone', names: { pt: 'Trítono', en: 'Tritone' } },
  { semitones: 7, ratio: [3, 2], key: 'P5', names: { pt: 'Quinta justa', en: 'Perfect 5th' } },
  { semitones: 8, ratio: [8, 5], key: 'm6', names: { pt: 'Sexta menor', en: 'Minor 6th' } },
  { semitones: 9, ratio: [5, 3], key: 'M6', names: { pt: 'Sexta maior', en: 'Major 6th' } },
  { semitones: 10, ratio: [16, 9], key: 'm7', names: { pt: 'Sétima menor', en: 'Minor 7th' } },
  { semitones: 11, ratio: [15, 8], key: 'M7', names: { pt: 'Sétima maior', en: 'Major 7th' } },
  { semitones: 12, ratio: [2, 1], key: 'octave', names: { pt: 'Oitava', en: 'Octave' } }
];

/** Intervalo temperado mais próximo da relação entre duas frequências. */
export function nearestInterval(f1, f2) {
  const semis = 12 * Math.log2(Math.max(f1, f2) / Math.min(f1, f2));
  const octaves = Math.floor(semis / 12);
  const within = semis - octaves * 12;
  const idx = Math.round(within);
  const ref = REFERENCE_INTERVALS[Math.min(12, idx)];
  const centsOff = (within - idx) * 100;
  return { ref, octaves, semitones: semis, centsOff };
}

/** Série harmônica de uma fundamental. */
export function harmonicSeries(f0, count = 8) {
  return Array.from({ length: count }, (_, i) => ({ n: i + 1, freq: f0 * (i + 1) }));
}

/* ------------------------------------------------------------------ *
 *  DESENHO
 * ------------------------------------------------------------------ */

/**
 * Desenha as ondas num canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts
 *   f1, f2       — frequências
 *   windowMs     — janela temporal em milissegundos
 *   mode         — 'waves' | 'sum' | 'envelope' | 'all'
 *   resolution   — pontos por pixel (1 = normal, 2 = mais fino)
 *   colors       — { wave1, wave2, sum, envelope, grid, axis }
 */
export function drawInterference(canvas, opts = {}) {
  const {
    f1 = 440, f2 = 440, windowMs = 40, mode = 'all', resolution = 1,
    colors = {}, showGrid = true
  } = opts;

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 600;
  const cssH = canvas.clientHeight || 220;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const c = {
    wave1: '#4f9cf9', wave2: '#f59e42', sum: '#22c55e', envelope: '#e0679b',
    grid: 'rgba(128,128,128,0.18)', axis: 'rgba(128,128,128,0.45)', ...colors
  };

  const T = windowMs / 1000;
  const steps = Math.max(200, Math.floor(cssW * resolution));
  const midY = cssH / 2;
  const ampSingle = mode === 'waves' ? cssH * 0.2 : cssH * 0.14;
  const ampSum = cssH * 0.2;

  if (showGrid) {
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    const divisions = 10;
    for (let i = 0; i <= divisions; i += 1) {
      const x = (i / divisions) * cssW;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cssH); ctx.stroke();
    }
    ctx.strokeStyle = c.axis;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(cssW, midY); ctx.stroke();
  }

  const plot = (fn, color, width, dashed = false) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dashed ? [5, 4] : []);
    for (let i = 0; i <= steps; i += 1) {
      const t = (i / steps) * T;
      const x = (i / steps) * cssW;
      const y = fn(t);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const showWaves = mode === 'waves' || mode === 'all';
  const showSum = mode === 'sum' || mode === 'all' || mode === 'envelope';
  const showEnv = mode === 'envelope' || mode === 'all';

  if (showWaves) {
    const offset = mode === 'all' ? cssH * 0.24 : 0;
    plot((t) => midY - offset - ampSingle * Math.sin(2 * Math.PI * f1 * t), c.wave1, 1.6);
    plot((t) => midY - offset - ampSingle * Math.sin(2 * Math.PI * f2 * t), c.wave2, 1.6);
  }
  if (showSum) {
    const offset = mode === 'all' ? -cssH * 0.18 : 0;
    plot((t) => midY - offset - (ampSum / 2) * (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)), c.sum, 1.8);
    if (showEnv) {
      // Envoltória ±2·cos(2π·(f1−f2)/2·t)
      const envAmp = ampSum;
      plot((t) => midY - offset - (envAmp / 2) * 2 * Math.abs(Math.cos(Math.PI * (f1 - f2) * t)), c.envelope, 1.4, true);
      plot((t) => midY - offset + (envAmp / 2) * 2 * Math.abs(Math.cos(Math.PI * (f1 - f2) * t)), c.envelope, 1.4, true);
    }
  }

  return { cssW, cssH, windowMs };
}

/**
 * Janela de tempo adequada para enxergar o batimento: mostramos cerca de
 * seis pulsações. Com frequências muito próximas a janela fica longa;
 * com frequências distantes, curtíssima (e aí já não se ouve "batimento",
 * e sim aspereza — ver beatIsAudible).
 */
export function beatWindowSeconds(f1, f2) {
  const beat = beatFrequency(f1, f2);
  if (beat < 0.05) return 4;
  return Math.max(0.03, Math.min(4, 6 / beat));
}

/** Acima de ~20 Hz a diferença deixa de ser ouvida como pulsação. */
export function beatIsAudibleAsPulse(f1, f2) {
  const beat = beatFrequency(f1, f2);
  return beat > 0.05 && beat <= 20;
}

/**
 * Desenha a envoltória de batimento numa janela longa (segundos),
 * onde os batimentos ficam visíveis como pulsações de amplitude.
 */
export function drawBeatEnvelope(canvas, opts = {}) {
  const { f1 = 440, f2 = 443, seconds = 2, colors = {} } = opts;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 600;
  const cssH = canvas.clientHeight || 120;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const c = { envelope: '#e0679b', fill: 'rgba(224,103,155,0.16)', axis: 'rgba(128,128,128,0.45)', ...colors };
  const midY = cssH / 2;
  const amp = cssH * 0.42;
  const beat = Math.abs(f1 - f2);

  ctx.strokeStyle = c.axis;
  ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(cssW, midY); ctx.stroke();

  const env = (t) => Math.abs(Math.cos(Math.PI * beat * t));
  ctx.beginPath();
  for (let x = 0; x <= cssW; x += 1) {
    const t = (x / cssW) * seconds;
    const y = midY - amp * env(t);
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let x = cssW; x >= 0; x -= 1) {
    const t = (x / cssW) * seconds;
    ctx.lineTo(x, midY + amp * env(t));
  }
  ctx.closePath();
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.strokeStyle = c.envelope;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  return { beat, seconds };
}
