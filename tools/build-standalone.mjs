/**
 * build-standalone.mjs — Gera dist/harmonia.html: um único arquivo HTML que
 * abre com duplo clique, sem servidor (o protocolo file:// bloqueia módulos
 * ES por causa da política de mesma origem).
 *
 * Como funciona: cada módulo vira uma função imediata que devolve seus
 * exports, e os "import" são reescritos como desestruturação desses objetos.
 * É um empacotador minúsculo (≈120 linhas) que substitui um bundler externo.
 *
 * Uso: node tools/build-standalone.mjs
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, posix } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, '..');

/** Ordem de avaliação: um módulo só aparece depois de suas dependências. */
const MODULES = [
  'js/i18n.js',
  'js/storage.js',
  'js/core/notes.js',
  'js/core/intervals.js',
  'js/core/chords.js',
  'js/core/scales.js',
  'js/core/harmony.js',
  'js/core/transpose.js',
  'js/core/training.js',
  'js/audio/audio.js',
  'js/state.js',
  'js/view/staff.js',
  'js/view/fretboard.js',
  'js/view/keyboard.js',
  'js/view/interference.js',
  'js/ui/ui.js',
  'js/ui/home.js',
  'js/ui/chordLibrary.js',
  'js/ui/chordFinder.js',
  'js/ui/scales.js',
  'js/ui/intervals.js',
  'js/ui/harmonicField.js',
  'js/ui/progressions.js',
  'js/ui/transpose.js',
  'js/ui/earTraining.js',
  'js/ui/interferenceView.js',
  'js/ui/settings.js',
  'js/app.js'
];

/**
 * Nome da variável de um módulo. Usamos o caminho inteiro, e não só o nome do
 * arquivo: existem core/scales.js e ui/scales.js, e o basename colidiria.
 */
const varOf = (path) => `__m_${path.replace(/\.js$/, '').replace(/[^\w]/g, '_')}`;

/** Resolve um "./x.js" relativo ao módulo que importa. */
const resolveSpec = (fromPath, spec) => posix.normalize(posix.join(posix.dirname(fromPath), spec));

/** Reescreve um módulo ES em uma função imediata que devolve seus exports. */
function transform(source, path) {
  const exports = [];
  let code = source;

  // import { a, b as c } from './x.js';   /   import * as ns from './x.js';
  code = code.replace(/^import\s+([^;]+?)\s+from\s+['"]([^'"]+)['"];?\s*$/gm, (all, clause, spec) => {
    const dep = varOf(resolveSpec(path, spec));
    const star = /^\*\s+as\s+(\w+)$/.exec(clause.trim());
    if (star) return `const ${star[1]} = ${dep};`;
    const braced = /^\{([\s\S]*)\}$/.exec(clause.trim());
    if (braced) {
      const parts = braced[1].split(',').map((s) => s.trim()).filter(Boolean)
        .map((s) => {
          const m = /^(\w+)\s+as\s+(\w+)$/.exec(s);
          return m ? `${m[1]}: ${m[2]}` : s;
        });
      return `const { ${parts.join(', ')} } = ${dep};`;
    }
    return `const ${clause.trim()} = ${dep}.default;`;
  });

  // export { a, b as c };
  code = code.replace(/^export\s*\{([^}]*)\};?\s*$/gm, (all, list) => {
    list.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
      const m = /^(\w+)\s+as\s+(\w+)$/.exec(s);
      if (m) exports.push([m[2], m[1]]);
      else exports.push([s, s]);
    });
    return '';
  });

  // export function f / export const x / export class C / export let
  code = code.replace(/^export\s+(async\s+)?(function|const|let|var|class)\s+(\w+)/gm, (all, asyncKw, kind, name) => {
    exports.push([name, name]);
    return `${asyncKw || ''}${kind} ${name}`;
  });

  if (/^export\s/m.test(code)) {
    throw new Error(`Forma de export não suportada em ${path}`);
  }

  const assigns = exports.map(([outer, inner]) => `  __e.${outer} = ${inner};`).join('\n');
  return `const ${varOf(path)} = (() => {\n  const __e = {};\n${code}\n${assigns}\n  return __e;\n})();`;
}

const css = await readFile(join(rootDir, 'css', 'styles.css'), 'utf8');

const chunks = [];
for (const path of MODULES) {
  const src = await readFile(join(rootDir, path), 'utf8');
  chunks.push(`/* ===== ${path} ===== */\n${transform(src, path)}`);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="description" content="Music theory learning app: chords, harmonic field, staff notation, guitar fretboard and frequency interference.">
  <meta name="color-scheme" content="light dark">
  <title>Harmonia — visual music theory</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>♫</text></svg>">
  <style>
${css}
  </style>
</head>
<body>
  <div id="app">
    <noscript><p style="padding:2rem;font-family:system-ui">This app needs JavaScript. / Este aplicativo precisa de JavaScript.</p></noscript>
  </div>
  <script>
(function () {
'use strict';
${chunks.join('\n\n')}
})();
  </script>
</body>
</html>
`;

/* Versão para publicar como artefato: a plataforma já fornece o esqueleto
   do documento, então entram só o título, o estilo e o conteúdo. */
const artifact = `<title>Harmonia</title>
<style>
${css}
</style>
<div id="app">
  <noscript><p style="padding:2rem;font-family:system-ui">This app needs JavaScript. / Este aplicativo precisa de JavaScript.</p></noscript>
</div>
<script>
(function () {
'use strict';
${chunks.join('\n\n')}
})();
</script>
`;

await mkdir(join(rootDir, 'dist'), { recursive: true });
await writeFile(join(rootDir, 'dist', 'harmonia.html'), html, 'utf8');
await writeFile(join(rootDir, 'dist', 'artifact.html'), artifact, 'utf8');
console.log(`dist/harmonia.html gerado (${(html.length / 1024).toFixed(0)} KB).`);
console.log(`dist/artifact.html gerado (${(artifact.length / 1024).toFixed(0)} KB).`);
