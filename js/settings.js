// Grown-up settings, protected by a 4-digit password on an on-screen keypad
// (masked as dots so digits aren't visible over a shoulder, and without opening
// the tablet's software keyboard).

import { state } from './state.js';
import { LEVELS } from './levels.js';
import { DESTINATIONS } from './missions.js';
import { playChime, playTick, playSuccessChord } from './audio.js';
import { cloudStatus, onCloudStatus, setCloudToken, clearCloudToken, syncWithCloud } from './cloud.js';

const $ = (id) => document.getElementById(id);
const SETTINGS_PIN = '7812';

let unlocked = false;
let pinEntry = '';

export function initSettings() {
  $('cloud-token')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && unlocked) {
      event.preventDefault();
      saveCloudSettings();
    }
  });
  onCloudStatus(() => {
    if (settingsOpen() && unlocked) renderCloudStatus();
  });
}

export const settingsOpen = () => !$('settings').hidden;
export const settingsUnlocked = () => unlocked;

function renderPinDots(error = false) {
  const dotsEl = $('settings-pin-dots');
  if (!dotsEl) return;
  dotsEl.innerHTML = [0, 1, 2, 3].map((i) => {
    const filled = i < pinEntry.length;
    return `<span class="pin-dot ${filled ? 'filled' : ''} ${error ? 'error' : ''}">${filled ? '●' : ''}</span>`;
  }).join('');
  dotsEl.classList.remove('wiggle');
  if (error) {
    void dotsEl.offsetWidth;
    dotsEl.classList.add('wiggle');
  }
}

function syncLockView() {
  $('settings-lock').hidden = unlocked;
  $('settings-body').hidden = !unlocked;
}

export function openSettings() {
  unlocked = false;
  pinEntry = '';
  renderPinDots();
  syncLockView();
  $('settings').hidden = false;
}

export function closeSettings() {
  unlocked = false;
  pinEntry = '';
  $('settings').hidden = true;
}

export function pressSettingsPin(key) {
  if (!settingsOpen() || unlocked) return;

  if (key === 'back') {
    if (!pinEntry) return;
    pinEntry = pinEntry.slice(0, -1);
    playTick();
    renderPinDots();
    return;
  }

  if (key === 'enter') {
    if (pinEntry.length < 4) {
      playChime(1);
      renderPinDots(true);
    }
    return;
  }

  if (!/^[0-9]$/.test(key) || pinEntry.length >= 4) return;
  pinEntry += key;
  playTick();
  renderPinDots();

  if (pinEntry.length === 4) {
    if (pinEntry === SETTINGS_PIN) {
      unlocked = true;
      pinEntry = '';
      playSuccessChord();
      renderSettings();
      syncLockView();
    } else {
      pinEntry = '';
      playChime(1);
      renderPinDots(true);
    }
  }
}

export function renderSettings() {
  const mode = state.journey.on ? 'on' : 'off';
  $('settings-journey').innerHTML = [['on', '🚀 Rocket journey'], ['off', 'Classic quests']].map(([value, label]) => `
    <button class="settings-level ${value === mode ? 'active' : ''}" data-action="settings-journey" data-value="${value}">${label}</button>
  `).join('');
  const crunchMode = state.crunch.enabled ? state.crunch.tier : 'off';
  $('settings-crunch').innerHTML = [
    ['1-2', '🎬 1m / 2m'],
    ['1-3', '🎬 1m / 3m'],
    ['off', 'Off']
  ].map(([value, label]) => `
    <button class="settings-level ${value === crunchMode ? 'active' : ''}" data-action="settings-crunch" data-value="${value}">${label}</button>
  `).join('');
  $('settings-levels').innerHTML = LEVELS.map((l) => `
    <button class="settings-level ${l.id === state.quest.level ? 'active' : ''}" data-action="settings-level" data-value="${l.id}">
      <span class="settings-level-num">${l.id}</span>
      <span class="settings-level-grade">${l.grade} · ${DESTINATIONS[l.id - 1].short}</span>
    </button>
  `).join('');
  renderCloudStatus();
}

export function renderCloudStatus() {
  const info = cloudStatus();
  const input = $('cloud-token');
  const clearBtn = $('cloud-clear');
  const statusEl = $('cloud-status');
  if (!input || !clearBtn || !statusEl) return;

  input.placeholder = info.connected
    ? 'Token saved (paste a new token to replace)'
    : 'GitHub token (ghp_… or github_pat_…)';
  clearBtn.hidden = !info.connected;

  statusEl.className = `cloud-status ${info.state}`;
  if (!info.connected) {
    statusEl.textContent = 'Not connected — progress is saved on this device only.';
    return;
  }
  const time = info.lastSyncAt ? new Date(info.lastSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  const gistTag = info.gistId ? ` · Gist ${info.gistId.slice(0, 7)}` : '';
  if (info.state === 'syncing' || info.state === 'error') {
    statusEl.textContent = info.message;
  } else {
    statusEl.textContent = `Connected${time ? ` · Last synced ${time}` : ''}${gistTag}`;
  }
}

export function saveCloudSettings() {
  if (!unlocked) return;
  const input = $('cloud-token');
  const val = input?.value.trim() || '';
  if (val) {
    input.value = '';
    setCloudToken(val);
  } else if (cloudStatus().connected) {
    syncWithCloud({ restoreIfAhead: true });
  } else {
    input?.focus();
  }
  renderCloudStatus();
}

export function clearCloudSettings() {
  if (!unlocked) return;
  const input = $('cloud-token');
  if (input) input.value = '';
  clearCloudToken();
  renderCloudStatus();
}
