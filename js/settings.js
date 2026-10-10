// Grown-up settings. The gear on Home opens them only after a 3-second hold
// (a ring fills while holding), so Felix can't change the level by accident.
// A quick tap does nothing.

import { state } from './state.js';
import { LEVELS } from './levels.js';

const $ = (id) => document.getElementById(id);
const HOLD_MS = 3000;

export function initSettings() {
  const btn = $('settings-btn');
  let timer = null;

  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    btn.classList.remove('holding');
  };
  btn.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    btn.classList.add('holding');
    timer = setTimeout(() => {
      cancel();
      openSettings();
    }, HOLD_MS);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => btn.addEventListener(type, cancel));
  btn.addEventListener('contextmenu', (event) => event.preventDefault());
}

export const settingsOpen = () => !$('settings').hidden;

export function openSettings() {
  renderSettings();
  $('settings').hidden = false;
}

export function closeSettings() {
  $('settings').hidden = true;
}

export function renderSettings() {
  $('settings-levels').innerHTML = LEVELS.map((l) => `
    <button class="settings-level ${l.id === state.quest.level ? 'active' : ''}" data-action="settings-level" data-value="${l.id}">
      <span class="settings-level-num">${l.id}</span>
      <span class="settings-level-grade">${l.grade}</span>
    </button>
  `).join('');
}
