/**
 * harness.mjs — Micro-arcabouço de testes, sem dependências.
 *
 * Uso:
 *   import { suite, test, eq, close, ok } from './harness.mjs';
 *   suite('notas');
 *   test('Dó4 é MIDI 60', () => eq(toMidi(parseNote('C4')), 60));
 */

const results = [];
let currentSuite = 'geral';

export function suite(name) { currentSuite = name; }

export function test(name, fn) {
  try {
    fn();
    results.push({ suite: currentSuite, name, ok: true });
  } catch (err) {
    results.push({ suite: currentSuite, name, ok: false, error: err.message });
  }
}

class AssertionError extends Error {}

/** Igualdade estrita com mensagem legível. */
export function eq(actual, expected, message = '') {
  const a = format(actual);
  const b = format(expected);
  if (a !== b) throw new AssertionError(`${message ? `${message}: ` : ''}esperado ${b}, obtido ${a}`);
}

/** Igualdade numérica com tolerância (para frequências). */
export function close(actual, expected, tolerance = 1e-6, message = '') {
  if (!Number.isFinite(actual)) throw new AssertionError(`${message}: valor não numérico (${actual})`);
  if (Math.abs(actual - expected) > tolerance) {
    throw new AssertionError(`${message ? `${message}: ` : ''}esperado ${expected} ± ${tolerance}, obtido ${actual}`);
  }
}

export function ok(value, message = 'esperado verdadeiro') {
  if (!value) throw new AssertionError(message);
}

export function throws(fn, message = 'esperava uma exceção') {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) throw new AssertionError(message);
}

function format(v) {
  if (Array.isArray(v)) return `[${v.map(format).join(', ')}]`;
  if (v && typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function report() {
  const bySuite = new Map();
  for (const r of results) {
    if (!bySuite.has(r.suite)) bySuite.set(r.suite, []);
    bySuite.get(r.suite).push(r);
  }
  let failed = 0;
  for (const [name, list] of bySuite) {
    const bad = list.filter((r) => !r.ok);
    failed += bad.length;
    console.log(`\n▸ ${name}  (${list.length - bad.length}/${list.length})`);
    for (const r of list) {
      if (r.ok) console.log(`   ✓ ${r.name}`);
      else console.log(`   ✗ ${r.name}\n       ${r.error}`);
    }
  }
  const total = results.length;
  console.log(`\n${total - failed}/${total} testes passaram.`);
  return failed;
}
