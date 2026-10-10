// Entry point: wires up buttons, moves between Home, Math (Explore / Mystery
// Quest) and Words (spelling), and boots the app.

import { state, loadState, saveState, SPELL_EVERY } from './state.js';
import { playChime } from './audio.js';
import { clampLab, renderLab, setLabOp, stepA, stepB } from './lab.js';
import { generateNewQuest, pressKey, renderQuest, renderQuestBanner, setLevel, toggleQuestFilter } from './quest.js';
import { buildKeyboard, pressTile, renderSpell, sayWord, startWord, toggleLevel } from './spell.js';
import { closeSettings, initSettings, renderSettings, settingsOpen } from './settings.js';
import { initPwa } from './pwa.js';

const $ = (id) => document.getElementById(id);

const TITLES = { home: "Felix's Lab", lab: "Felix's Math Lab", quest: "Felix's Math Lab", spell: "Felix's Word Lab" };
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

  $('app-title').textContent = TITLES[newMode];
  $('home-btn').hidden = newMode === 'home';
  $('settings-btn').hidden = newMode !== 'home';
  $('math-tabs').hidden = !MATH_VIEWS.includes(newMode);
  $('tab-lab').classList.toggle('active', newMode === 'lab');
  $('tab-quest').classList.toggle('active', newMode === 'quest');

  // Remind Felix of the quest he's working on while he's in the Lab
  const q = state.quest.problem;
  renderQuestBanner(questSeen && newMode === 'lab' && !!q && state.quest.status !== 'correct');

  if (newMode === 'quest' && !q) {
    generateNewQuest();
  }
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

// After every SPELL_EVERY solved quests, the next one is a spelling word
function nextQuest() {
  if (state.quest.status === 'correct' && state.quest.solvedSinceSpelling >= SPELL_EVERY) {
    switchMode('spell');
    startWord('quest');
  } else {
    generateNewQuest();
  }
}

function pickWords() {
  const spell = state.spell;
  switchMode('spell');
  if (!spell.word || spell.status === 'correct') {
    startWord(null);
  } else {
    // Pick up the unfinished word, as a regular word now
    spell.returnTo = null;
    renderSpell();
    sayWord();
  }
}

function afterWord() {
  if (state.spell.returnTo === 'quest') {
    state.spell.returnTo = null;
    generateNewQuest();
    switchMode('quest');
  } else {
    startWord(null);
  }
}

// Every button declares what it does with data-action (and data-value).
const actions = {
  'home': () => switchMode('home'),
  'pick-math': () => switchMode(state.mathView),
  'pick-words': () => pickWords(),
  'mode': (value) => switchMode(value),
  'lab-op': (value) => setLabOp(value),
  'step-a': (value) => stepA(Number(value)),
  'step-b': (value) => stepB(Number(value)),
  'quest-filter': (value) => toggleQuestFilter(value),
  'settings-level': (value) => { setLevel(Number(value)); clampLab(); renderLab(); renderSettings(); },
  'settings-close': () => closeSettings(),
  'quest-skip': () => nextQuest(),
  'quest-next': () => nextQuest(),
  'quest-to-lab': () => sendQuestToLab(),
  'key': (value) => pressKey(value),
  'spell-key': (value) => pressTile(value),
  'spell-say': () => sayWord(),
  'spell-skip': () => startWord(),
  'spell-next': () => afterWord(),
  'spell-level': (value) => toggleLevel(value)
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
  if (event.metaKey || event.ctrlKey || event.altKey || settingsOpen()) return;
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
