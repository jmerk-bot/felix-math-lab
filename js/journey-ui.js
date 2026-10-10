// Rocket journey screens: the build rail beside quests and words, the
// "ask Dad for the keys" banner, the hangar, and the overlays (paint job,
// launch, mission briefing, practice flight, rocket keys).

import { state, OP_LABEL } from './state.js';
import { MISSIONS, DESTINATIONS, destinationOf, missionsIn, missionProblem } from './missions.js';
import { FAMILIES, PAINTS, rocketSvg } from './rockets.js';
import { voiceAudio } from './voice.js';
import { playClips, playTick, playRumble } from './audio.js';
import { fmt } from './levels.js';
import { manipulativeHtml } from './lab.js';
import * as J from './journey.js';

const $ = (id) => document.getElementById(id);

export const say = (...ids) => playClips(...ids.map(voiceAudio));
export const pieceClip = (award) => (award ? voiceAudio(`part-${award.part}`) : null);
const nameOf = (r) => FAMILIES[r.family].names[r.variant % FAMILIES[r.family].names.length];
const missionById = (id) => MISSIONS.find((m) => m.id === id) || MISSIONS[0];

// ---------- Build rail, banner, home strip ----------

export function renderJourney({ snap = null } = {}) {
  const on = J.journeyOn();
  document.body.classList.toggle('journey', on);
  document.querySelectorAll('.build-rail').forEach((rail) => { rail.hidden = !on; });
  $('journey-banner').hidden = !J.canAskForKeys();
  $('home-hangar').hidden = !on;
  if (!on) return;

  const r = J.currentRocket();
  const dest = J.currentDestination();
  const lights = [0, 1, 2, 3].map((i) => {
    const kind = state.journey.flight[i];
    return kind ? `<span class="light ${kind}">${kind === 'math' ? '+' : 'a'}</span>` : '<span class="light"></span>';
  }).join('');
  const rail = `
    <span class="planet ${dest.id}" aria-label="${dest.short}"></span>
    <div class="rail-rocket ${snap ? 'sparkle' : ''}">${rocketSvg(r.family, { earned: r.earned, colors: r.colors, snap })}</div>
    <div class="lights" aria-label="Progress to the next piece">${lights}</div>
  `;
  document.querySelectorAll('.build-rail').forEach((el) => { el.innerHTML = rail; });

  $('home-hangar').innerHTML = `
    <span class="home-hangar-rocket">${rocketSvg(r.family, { earned: r.earned, colors: r.colors })}</span>
    <span class="home-hangar-text">
      <span class="home-label">Hangar</span>
      <span class="home-hangar-count">🚀 ${state.journey.hangar.length}</span>
    </span>
  `;
}

// ---------- Hangar ----------

export function renderHangar({ highlightLast = false, showContinue = false } = {}) {
  const j = state.journey;
  const reached = J.currentDestination().level;
  $('hangar-list').innerHTML = DESTINATIONS.map((d) => {
    const rockets = j.hangar.map((r, i) => ({ r, i })).filter(({ r }) => destinationOf(missionById(r.mission)).id === d.id);
    const done = new Set(rockets.map(({ r }) => r.mission));
    const ahead = missionsIn(d.id).filter((m) => !done.has(m.id)).length;
    const launched = rockets.map(({ r, i }) => `
      <button class="hangar-rocket ${highlightLast && i === j.hangar.length - 1 ? 'new' : ''}" data-action="relaunch" data-value="${i}" aria-label="Launch ${nameOf(r)} again">
        ${rocketSvg(r.family, { colors: r.colors })}
        <span class="hangar-name">${nameOf(r)}</span>
      </button>`).join('');
    const ghosts = `<span class="hangar-ghost">${rocketSvg(d.id, { earned: 0 })}</span>`.repeat(ahead);
    return `
      <section class="hangar-dest ${d.level > reached ? 'locked' : ''}">
        <div class="hangar-head"><span class="planet ${d.id}"></span><span>${d.short}</span></div>
        <div class="hangar-row">${launched}${ghosts}</div>
      </section>`;
  }).join('');
  $('hangar-continue').hidden = !showContinue;
}

// ---------- Overlays ----------

function openOverlay(html, kind) {
  const o = $('journey-overlay');
  o.className = `journey-overlay ${kind}`;
  o.innerHTML = html;
  o.hidden = false;
}

export function closeOverlay() {
  const o = $('journey-overlay');
  o.hidden = true;
  o.innerHTML = '';
}

export const overlayOpen = () => !$('journey-overlay').hidden;

// Paint job: pick body and trim colors, then launch
export function openPaint() {
  const r = J.currentRocket();
  const pots = (role, current) => PAINTS.map((c) => `
    <button class="swatch ${current === c ? 'on' : ''}" style="background:${c}" data-action="paint" data-value="${role}:${c}" aria-label="${role} color"></button>`).join('');
  openOverlay(`
    <section class="card j-card paint-card">
      <h2 class="j-title">Rocket complete!</h2>
      <div class="paint-layout">
        <div class="paint-preview">${rocketSvg(r.family, { colors: r.colors })}</div>
        <div class="paint-pots">
          <span class="paint-label">Body</span>
          <div class="swatches">${pots('main', r.colors[0])}</div>
          <span class="paint-label">Trim</span>
          <div class="swatches">${pots('trim', r.colors[1])}</div>
        </div>
      </div>
      <button class="next-quest-btn launch-btn" data-action="launch">Launch! 🚀</button>
    </section>`, 'paint');
}

export function paint(value) {
  const [role, color] = value.split(':');
  J.paintRocket(role, color);
  playTick();
  openPaint();
}

// Countdown, ignition, liftoff. `hangarMessage` adds the "added to your
// hangar" ending for a new rocket (not for replays from the hangar).
export function launch(rocket, { hangarMessage = true, onDone } = {}) {
  openOverlay(`
    <div class="launch-scene">
      <div class="launch-stars"></div>
      <div class="countdown" id="countdown"></div>
      <div class="launch-rocket">${rocketSvg(rocket.family, { colors: rocket.colors, flame: true })}</div>
      <div class="launch-pad"></div>
      <div class="launch-smoke"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="launch-msg" id="launch-msg" hidden>Added to your hangar!</div>
    </div>`, 'launch');

  const scene = document.querySelector('.launch-scene');
  const count = (n) => {
    const el = $('countdown');
    el.textContent = n;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  };
  const timeline = [
    [0, () => { count('3'); say('count-3'); }],
    [1000, () => { count('2'); say('count-2'); }],
    [2000, () => { count('1'); say('count-1'); }],
    [3000, () => { count(''); scene.classList.add('ignite'); say('blast-off'); playRumble(3.4); }],
    [3800, () => scene.classList.add('liftoff')],
    [hangarMessage ? 6000 : 6400, () => {
      if (!hangarMessage) return;
      $('launch-msg').hidden = false;
      say('to-hangar');
    }],
    [hangarMessage ? 7600 : 6600, () => { closeOverlay(); onDone?.(); }]
  ];
  timeline.forEach(([t, fn]) => setTimeout(() => { if (overlayOpen()) fn(); }, t));
}

// Mission briefing: the concept, one worked example with its Lab picture,
// and the spoken mission line
export function openBriefing({ kicker = null, intro = [] } = {}) {
  const m = J.currentMission();
  const d = J.currentDestination();
  const ex = missionProblem(m, 0);
  openOverlay(`
    <section class="card j-card briefing-card">
      <div class="briefing-top">
        <span class="planet big ${d.id}"></span>
        <div>
          <div class="briefing-kicker">${kicker || `${d.short} · Mission ${J.missionNumber()}`}</div>
          <h2 class="j-title">${m.name}</h2>
        </div>
      </div>
      <div class="briefing-eq">
        <span class="num-a">${fmt(ex.a)}</span><span class="op-symbol">${OP_LABEL[ex.op]}</span><span class="num-b">${fmt(ex.b)}</span><span class="equals">=</span><span class="num-target">${fmt(ex.target)}</span>
      </div>
      <div class="briefing-picture">${manipulativeHtml(ex.a, ex.b, ex.op)}</div>
      <button class="next-quest-btn" data-action="briefing-go">Let's go 🚀</button>
    </section>`, 'briefing');
  say(...intro, `mission-${m.id}`);
}

// Practice flight: same mission, brand new rocket
export function openPractice() {
  const m = J.currentMission();
  const r = J.currentRocket();
  openOverlay(`
    <section class="card j-card practice-card">
      <div class="practice-rocket">${rocketSvg(r.family, { earned: 0 })}</div>
      <div class="briefing-kicker">Practice flight</div>
      <h2 class="j-title">${m.name}</h2>
      <button class="next-quest-btn" data-action="briefing-go">Let's go 🚀</button>
    </section>`, 'briefing');
  say('practice');
}

// ---------- Rocket keys (Dad's question) ----------

let keys = null; // { problem, entry }

export function openKeys() {
  keys = { problem: J.makeKeysProblem(), entry: '' };
  renderKeys();
}

function renderKeys(status = '') {
  const p = keys.problem;
  const dest = J.nextDestination();
  const key = (v, label = v, cls = '') => `<button class="key ${cls}" data-action="keys-key" data-value="${v}">${label}</button>`;
  const backIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H8.5L3 12l5.5 7H21a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M11.5 9.5l5 5M16.5 9.5l-5 5"/></svg>';
  const solveIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const text = `${fmt(p.a)} ${fmt(p.b)} ${'0'.repeat(String(p.expected).length + 1)}`;
  openOverlay(`
    <section class="card j-card keys-card">
      <div class="briefing-top">
        <span class="keys-icon" aria-hidden="true">🔑</span>
        <div>
          <div class="briefing-kicker">Rocket keys</div>
          <h2 class="j-title">Fly to ${dest.short}</h2>
        </div>
        <span class="planet big ${dest.id}"></span>
      </div>
      <div class="quest-equation keys-eq" data-size="${text.length > 16 ? 'l' : text.length > 11 ? 'm' : ''}">
        <span class="num-a">${fmt(p.a)}</span><span class="op-symbol">${OP_LABEL[p.op]}</span><span class="num-b">${fmt(p.b)}</span><span class="equals">=</span>
        <span class="mystery-box role-target ${keys.entry ? 'filled' : ''} ${status === 'retry' ? 'wiggle' : ''}">${keys.entry ? fmt(keys.entry) : '?'}</span>
      </div>
      <div class="keypad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => key(n)).join('')}
        ${key('back', backIcon, 'key-back')}${key(0)}${key('solve', solveIcon, 'key-solve')}
      </div>
      <button class="skip-btn keys-later" data-action="journey-close">Not now</button>
    </section>`, 'keys');
}

// Returns 'unlocked' when the answer is right
export function pressKeysKey(k) {
  if (!keys) return null;
  if (k === 'solve') {
    if (!keys.entry) return null;
    if (Number(keys.entry) === keys.problem.expected) {
      keys = null;
      return 'unlocked';
    }
    keys.entry = '';
    say('keys-try');
    renderKeys('retry');
    return null;
  }
  if (k === 'back') keys.entry = keys.entry.slice(0, -1);
  else if (keys.entry.length < 6) keys.entry = (keys.entry === '0' ? '' : keys.entry) + k;
  playTick();
  renderKeys();
  return null;
}
