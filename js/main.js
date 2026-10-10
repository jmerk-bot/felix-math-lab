// Entry point: wires up buttons, moves between Home, Math (Explore / Mystery
// Quest), Words (spelling) and the Hangar, runs the rocket journey's flow,
// and boots the app.

import { state, loadState, saveState, SPELL_EVERY } from './state.js';
import { playChime } from './audio.js';
import { clampLab, renderLab, setLabOp, stepA, stepB } from './lab.js';
import { generateNewQuest, pressKey, renderQuest, renderQuestBanner, setLevel, toggleQuestFilter } from './quest.js';
import { buildKeyboard, pressTile, renderSpell, sayWord, startWord, toggleLevel } from './spell.js';
import { closeSettings, initSettings, renderSettings, settingsOpen } from './settings.js';
import * as J from './journey.js';
import * as UI from './journey-ui.js';
import { initPwa } from './pwa.js';

const $ = (id) => document.getElementById(id);

const TITLES = { home: "Felix's Lab", lab: "Felix's Math Lab", quest: "Felix's Math Lab", spell: "Felix's Word Lab", hangar: "Felix's Hangar" };
const MATH_VIEWS = ['lab', 'quest'];
let questSeen = false; // the Lab banner waits until Felix has seen this session's quest

function switchMode(newMode, { boot = false } = {}) {
  state.mode = newMode;
  if (MATH_VIEWS.includes(newMode)) state.mathView = newMode;
  if (newMode === 'quest') questSeen = true;
  document.body.dataset.mode = newMode;

  $('view-home').hidden = newMode !== 'home';
  $('view-lab').hidden = newMode !== 'lab';
  $('view-quest').hidden = newMode !== 'quest';
  $('view-spell').hidden = newMode !== 'spell';
  $('view-hangar').hidden = newMode !== 'hangar';

  // A math break (from Words) hides the Explore / Quest tabs, like a word break
  const mathBreak = newMode === 'quest' && state.quest.returnTo === 'spell';
  $('app-title').textContent = TITLES[newMode];
  $('home-btn').hidden = newMode === 'home';
  $('settings-btn').hidden = newMode !== 'home';
  $('math-tabs').hidden = !MATH_VIEWS.includes(newMode) || mathBreak;
  $('tab-lab').classList.toggle('active', newMode === 'lab');
  $('tab-quest').classList.toggle('active', newMode === 'quest');

  // Remind Felix of the quest he's working on while he's in the Lab
  const q = state.quest.problem;
  renderQuestBanner(questSeen && newMode === 'lab' && !!q && state.quest.status !== 'correct');

  if (newMode === 'quest' && !q) generateNewQuest();
  if (newMode === 'hangar') UI.renderHangar();
  UI.renderJourney();
  if (!boot) playChime(3);
}

function sendQuestToLab() {
  const q = state.quest.problem;
  if (!q) return;

  state.lab.op = q.op;
  state.lab.a = q.a;
  // Do NOT solve it: set b to baseline (0 or 1) so Felix tests and discovers it
  state.lab.b = (q.op === '×' || q.op === '÷') ? 1 : 0;
  clampLab();

  renderLab();
  switchMode('lab');
}

// ---------- Flow between quests and words ----------

function startWordBreak() {
  switchMode('spell');
  startWord('quest');
}

function startMathBreak() {
  state.quest.returnTo = 'spell';
  generateNewQuest();
  switchMode('quest');
  UI.say('math-break');
}

// After a quest: Skip on an unsolved quest just swaps it. After a solved one:
// a finished rocket goes to its paint job; a math break returns to Words;
// otherwise a word break when it's due, or the next quest.
function nextQuest() {
  const q = state.quest;
  if (!J.journeyOn()) {
    if (q.status === 'correct' && q.solvedSinceSpelling >= SPELL_EVERY) startWordBreak();
    else generateNewQuest();
    return;
  }
  if (q.status !== 'correct') {
    generateNewQuest();
    return;
  }
  const fromWords = q.returnTo === 'spell';
  q.returnTo = null;
  if (state.journey.pendingComplete) startCompletion(fromWords ? 'spell' : 'quest');
  else if (fromWords) resume('spell');
  else if (J.needsWordBreak()) startWordBreak();
  else generateNewQuest();
}

function pickWords() {
  const spell = state.spell;
  switchMode('spell');
  if (J.journeyOn() && state.journey.pendingComplete) {
    startCompletion('spell');
  } else if (!spell.word || spell.status === 'correct') {
    startWord(null);
  } else {
    // Pick up the unfinished word, as a regular word now
    spell.returnTo = null;
    renderSpell();
    sayWord();
  }
}

function pickMath() {
  switchMode(state.mathView);
  if (!J.journeyOn() || state.mathView !== 'quest') return;
  if (state.journey.pendingComplete) startCompletion('quest');
  else if (state.quest.status === 'correct') nextQuest(); // don't come back to a finished quest
}

function afterWord() {
  const fromQuest = state.spell.returnTo === 'quest';
  state.spell.returnTo = null;
  if (!J.journeyOn()) {
    if (fromQuest) resume('quest');
    else startWord(null);
    return;
  }
  if (state.journey.pendingComplete) startCompletion(fromQuest ? 'quest' : 'spell');
  else if (fromQuest) resume('quest');
  else if (J.needsMathBreak()) startMathBreak();
  else startWord(null);
}

// Back to playing in `mode` ('quest' or 'spell') with something new
function resume(mode) {
  if (mode === 'spell') {
    switchMode('spell');
    startWord(null);
  } else {
    generateNewQuest();
    switchMode('quest');
  }
}

// ---------- A finished rocket: paint, launch, hangar, next mission ----------

let flow = { resume: 'quest', outcome: null };

function startCompletion(resumeMode) {
  flow = { resume: resumeMode, outcome: null };
  UI.openPaint();
  UI.say('rocket-done');
}

function launchNewRocket() {
  const rocket = { ...J.currentRocket() };
  UI.launch(rocket, {
    onDone: () => {
      flow.outcome = J.finishRocket();
      saveState();
      switchMode('hangar');
      UI.renderHangar({ highlightLast: true, showContinue: true });
    }
  });
}

// "Next rocket" in the hangar: brief the next mission, or a practice flight,
// or (destination finished) the banner to ask Dad for the keys
function continueJourney() {
  const outcome = flow.outcome;
  flow.outcome = null;
  if (outcome === 'next') {
    UI.openBriefing();
  } else if (outcome === 'practice') {
    UI.openPractice();
  } else {
    if (outcome === 'ready' && J.canAskForKeys()) UI.say('ready');
    resume(flow.resume);
  }
}

function briefingDone() {
  UI.closeOverlay();
  if (state.mode === 'hangar') resume(flow.resume);
  else if (state.mode === 'quest' && state.quest.status !== 'correct') generateNewQuest();
}

function keysKey(value) {
  if (UI.pressKeysKey(value) !== 'unlocked') return;
  const dest = J.unlockNextDestination();
  clampLab();
  renderLab();
  UI.renderJourney();
  if (state.mode === 'quest' && state.quest.status !== 'correct') generateNewQuest();
  UI.openBriefing({ kicker: `Next stop: ${dest.short}!`, intro: ['keys-ok', `next-${dest.id}`] });
}

function relaunch(index) {
  const rocket = state.journey.hangar[Number(index)];
  if (rocket) UI.launch(rocket, { hangarMessage: false });
}

// ---------- Actions ----------

// Every button declares what it does with data-action (and data-value).
const actions = {
  'home': () => switchMode('home'),
  'pick-math': () => pickMath(),
  'pick-words': () => pickWords(),
  'open-hangar': () => switchMode('hangar'),
  'mode': (value) => switchMode(value),
  'lab-op': (value) => setLabOp(value),
  'step-a': (value) => stepA(Number(value)),
  'step-b': (value) => stepB(Number(value)),
  'quest-filter': (value) => toggleQuestFilter(value),
  'settings-level': (value) => {
    J.setJourneyLevel(Number(value));
    setLevel(Number(value));
    clampLab();
    renderLab();
    renderSettings();
    UI.renderJourney();
  },
  'settings-journey': (value) => {
    state.journey.on = value === 'on';
    if (state.quest.status !== 'correct') generateNewQuest();
    renderQuest();
    renderSettings();
    UI.renderJourney();
  },
  'settings-close': () => closeSettings(),
  'quest-skip': () => nextQuest(),
  'quest-next': () => nextQuest(),
  'quest-to-lab': () => sendQuestToLab(),
  'key': (value) => pressKey(value),
  'spell-key': (value) => pressTile(value),
  'spell-say': () => sayWord(),
  'spell-skip': () => startWord(),
  'spell-next': () => afterWord(),
  'spell-level': (value) => toggleLevel(value),
  'paint': (value) => UI.paint(value),
  'launch': () => launchNewRocket(),
  'hangar-continue': () => continueJourney(),
  'relaunch': (value) => relaunch(value),
  'briefing-go': () => briefingDone(),
  'keys-open': () => UI.openKeys(),
  'keys-key': (value) => keysKey(value),
  'journey-close': () => UI.closeOverlay()
};

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  actions[el.dataset.action]?.(el.dataset.value);
  saveState();
});

// A physical keyboard drives the number pad and letter tiles too (handy when
// testing on a computer). Digraph tiles are tap-only.
document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey || settingsOpen() || UI.overlayOpen()) return;
  const k = event.key;
  if (state.mode === 'quest') {
    const key = /^[0-9]$/.test(k) ? k : k === 'Backspace' ? 'back' : k === 'Enter' ? 'solve' : null;
    if (!key) return;
    event.preventDefault();
    pressKey(key);
  } else if (state.mode === 'spell') {
    const letter = k.toLowerCase();
    const key = /^[a-z]$/.test(letter) ? (letter === 'q' ? 'qu' : letter)
      : k === 'Backspace' ? 'back' : k === 'Enter' ? 'check' : null;
    if (!key) return;
    event.preventDefault();
    pressTile(key);
  } else {
    return;
  }
  saveState();
});

// Boot: always open on Home
loadState();
if (state.journey.on) state.quest.level = J.currentDestination().level;
clampLab();
renderLab();
if (state.quest.problem) renderQuest();
else generateNewQuest();
buildKeyboard();
renderSpell();
initSettings();
switchMode('home', { boot: true });
initPwa();
saveState();
// Ask the browser not to clear the app's storage (the hangar lives there)
navigator.storage?.persist?.().catch(() => {});
