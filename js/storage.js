/**
 * storage.js — Persistência local.
 *
 * Só usamos localStorage, e apenas para preferências e progresso. Nada é
 * enviado para servidor. Todo acesso é protegido: em janelas anônimas ou com
 * armazenamento bloqueado, o aplicativo continua funcionando (sem lembrar
 * das escolhas).
 */

const PREFIX = 'harmonia:';

export const DEFAULTS = {
  lang: 'pt',
  theme: 'auto',
  notation: 'pt',       // 'pt' = Dó Ré Mi, 'en' = C D E
  waveform: 'triangle',
  volume: 0.7,
  tempo: 90,
  a4: 440,
  tuning: 'standard',
  preferFlats: false
};

function safeGet(key) {
  try { return window.localStorage.getItem(PREFIX + key); } catch { return null; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(PREFIX + key, value); return true; } catch { return false; }
}
function safeRemove(key) {
  try { window.localStorage.removeItem(PREFIX + key); } catch { /* ignora */ }
}

/** Lê um valor com fallback ao padrão. */
export function read(key) {
  const raw = safeGet(key);
  if (raw === null) return DEFAULTS[key];
  try { return JSON.parse(raw); } catch { return raw; }
}

/** Grava um valor. */
export function write(key, value) {
  return safeSet(key, JSON.stringify(value));
}

/** Todas as preferências, já com padrões preenchidos. */
export function readAll() {
  const out = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) out[key] = read(key);
  return out;
}

/** Apaga tudo o que o aplicativo guardou. */
export function clearAll() {
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    return true;
  } catch { return false; }
}

/** O armazenamento está disponível? */
export function available() {
  try {
    const probe = `${PREFIX}__probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch { return false; }
}

/* Listas nomeadas (progressões salvas, pontuações) ------------------- */

export function readList(name) {
  const v = read(`list:${name}`);
  return Array.isArray(v) ? v : [];
}

export function writeList(name, items) {
  return write(`list:${name}`, items);
}

export function pushItem(name, item, max = 50) {
  const items = readList(name);
  items.unshift(item);
  return writeList(name, items.slice(0, max));
}

export { safeRemove as removeKey };
