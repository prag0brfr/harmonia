/**
 * state.js — Estado global mínimo (preferências) e barramento de eventos.
 * Mantemos isto propositalmente simples: um objeto e uma lista de ouvintes.
 */

import { readAll, write, clearAll, DEFAULTS } from './storage.js';
import { setLang } from './i18n.js';
import { audio } from './audio/audio.js';

export const state = readAll();

const listeners = new Set();

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(key) {
  listeners.forEach((fn) => fn(key, state));
}

/** Altera uma preferência, grava e avisa a interface. */
export function setSetting(key, value) {
  state[key] = value;
  write(key, value);
  applySideEffects(key, value);
  emit(key);
}

/** Aplica efeitos imediatos de cada preferência. */
export function applySideEffects(key, value) {
  switch (key) {
    case 'lang': setLang(value); break;
    case 'theme': applyTheme(value); break;
    case 'waveform': audio.setWaveform(value); break;
    case 'volume': audio.setVolume(value); break;
    case 'tempo': audio.setTempo(value); break;
    case 'a4': audio.setA4(value); break;
    default: break;
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

/** Idioma usado para NOMES DE NOTA (independe do idioma da interface). */
export function noteLang() {
  return state.notation === 'en' ? 'en' : 'pt';
}

/** Aplica todas as preferências de uma vez (na inicialização). */
export function applyAll() {
  Object.keys(DEFAULTS).forEach((k) => applySideEffects(k, state[k]));
}

/** Restaura os padrões e apaga o armazenamento. */
export function resetAll() {
  clearAll();
  Object.assign(state, DEFAULTS);
  applyAll();
  emit('*');
}
