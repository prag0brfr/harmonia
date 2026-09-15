/**
 * run-tests.mjs — Executor de testes.
 * Uso: node tools/run-tests.mjs      (ou: npm test)
 */

import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const testsDir = join(here, '..', 'tests');

const files = (await readdir(testsDir)).filter((f) => f.endsWith('.test.mjs')).sort();
for (const f of files) {
  await import(pathToFileURL(join(testsDir, f)).href);
}

const { report } = await import(pathToFileURL(join(testsDir, 'harness.mjs')).href);
const failed = report();
process.exit(failed > 0 ? 1 : 0);
