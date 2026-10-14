// Grown-up settings. The gear on Home opens them only after a 3-second hold
// (a ring fills while holding), so Felix can't change the level by accident.
// A quick tap does nothing.

import { state } from './state.js';
import { LEVELS } from './levels.js';
import { DESTINATIONS } from './missions.js';
import { cloudStatus, onCloudStatus, setCloudToken, clearCloudToken, syncWithCloud } from './cloud.js';

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

  $('cloud-token')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveCloudSettings();
    }
  });
  onCloudStatus(() => {
    if (settingsOpen()) renderCloudStatus();
  });
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
  const mode = state.journey.on ? 'on' : 'off';
  $('settings-journey').innerHTML = [['on', '🚀 Rocket journey'], ['off', 'Classic quests']].map(([value, label]) => `
    <button class="settings-level ${value === mode ? 'active' : ''}" data-action="settings-journey" data-value="${value}">${label}</button>
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
  const input = $('cloud-token');
  if (input) input.value = '';
  clearCloudToken();
  renderCloudStatus();
}
