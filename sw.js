/**
 * sw.js — Service worker mínimo para funcionamento offline.
 *
 * Estratégia: "cache first, rede como reserva". Na primeira visita guardamos
 * os arquivos do aplicativo; depois disso ele abre sem conexão. Ao publicar
 * uma versão nova, basta trocar CACHE_NAME para invalidar o cache antigo.
 */

const CACHE_NAME = 'harmonia-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './css/styles.css',
  './js/app.js',
  './js/i18n.js',
  './js/state.js',
  './js/storage.js',
  './js/core/notes.js',
  './js/core/intervals.js',
  './js/core/chords.js',
  './js/core/scales.js',
  './js/core/harmony.js',
  './js/core/transpose.js',
  './js/core/training.js',
  './js/audio/audio.js',
  './js/view/staff.js',
  './js/view/fretboard.js',
  './js/view/keyboard.js',
  './js/view/interference.js',
  './js/ui/ui.js',
  './js/ui/home.js',
  './js/ui/chordLibrary.js',
  './js/ui/chordFinder.js',
  './js/ui/scales.js',
  './js/ui/intervals.js',
  './js/ui/harmonicField.js',
  './js/ui/progressions.js',
  './js/ui/transpose.js',
  './js/ui/earTraining.js',
  './js/ui/interferenceView.js',
  './js/ui/settings.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => { /* se algum arquivo falhar, seguimos sem cache */ })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
