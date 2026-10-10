// App state, shared helpers, and saving/restoring between launches.

import { LEVELS } from './words.js';
import { MISSIONS, firstMissionOf } from './missions.js';
import { FAMILIES } from './rockets.js';

export const OPS = ['+', '-', '×', '÷'];

// In Math, a spelling word comes up after this many solved Mystery Quests
export const SPELL_EVERY = 3;

// Subtraction is stored as '-' but shown with a proper minus sign.
export const OP_LABEL = { '+': '+', '-': '−', '×': '×', '÷': '÷' };

export const state = {
  mode: 'home', // 'home', 'lab', 'quest' or 'spell'
  mathView: 'quest', // where "Math" on the home screen goes: 'lab' or 'quest'
  lab: {
    a: 6,
    b: 3,
    op: '+'
  },
  quest: {
    filters: [...OPS],
    problem: null,
    status: 'playing', // 'playing', 'correct', 'retry'
    entry: '', // digits typed on the number pad
    replaceOnType: false, // after a miss, the next digit starts a fresh answer
    solvedSinceSpelling: 0,
    level: 1, // 1 (early 2nd grade) to 5 (5th grade), see js/levels.js
    misses: 0, // wrong answers on this quest (0 = solved on the first try)
    returnTo: null // 'spell' when this quest is a math break from Words
  },
  spell: {
    levels: LEVELS.map(l => l.id),
    word: null, // entry from WORDS
    boxes: [], // one tile (or null) per sound box
    locked: [], // boxes confirmed correct by a check
    attempts: 0,
    status: 'playing', // 'playing', 'correct', 'retry'
    queue: [], // upcoming words (shuffled)
    returnTo: null // 'quest' when this word interrupted Math
  },
  // The rocket journey (js/journey.js): missions in order, one rocket each
  journey: {
    on: true, // off = classic Mystery Quest (grown-up setting)
    mission: 0, // index into MISSIONS
    rocket: null, // in progress: { family, variant, earned, total, colors }
    flight: [], // 'math' / 'word' done toward the next piece (a piece needs 4, with both kinds)
    tries: { rounds: 0, firstTry: 0 }, // this rocket's mission quests
    practice: 0, // practice rockets in a row on this mission
    stepDown: false, // the last quest took 2+ tries: next one a little easier
    ready: false, // finished this destination: banner until Dad's keys
    pendingComplete: false, // a finished rocket waiting for its paint job and launch
    hangar: [], // launched rockets: { family, variant, colors, mission, practice }
    stats: {} // per mission: { rounds, firstTry, rockets }
  }
};

export function compute(a, b, op) {
  switch (op) {
    case '+': return a + b;
    case '-': return Math.max(0, a - b);
    case '×': return a * b;
    case '÷': return b === 0 ? 0 : Math.floor(a / b);
    default: return 0;
  }
}

// ---------- Persistence ----------
// The tablet may close the app in the background, so the Lab settings, quest
// filters, an unsolved quest, spelling levels and the spelling countdown are
// kept in localStorage and restored on launch. The app always opens on Home.

const STORAGE_KEY = 'math-lab:v1';

export function saveState() {
  try {
    const { mathView, lab, quest, spell } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mathView,
      lab,
      quest: {
        filters: quest.filters,
        problem: quest.status === 'correct' ? null : quest.problem,
        solvedSinceSpelling: quest.solvedSinceSpelling,
        level: quest.level
      },
      spell: {
        levels: spell.levels
      },
      journey: state.journey
    }));
  } catch (e) {}
}

export function loadState() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    return;
  }
  if (!saved || typeof saved !== 'object') return;

  const mathView = saved.mathView ?? saved.mode; // older saves stored `mode`
  if (mathView === 'lab' || mathView === 'quest') state.mathView = mathView;

  const lab = saved.lab;
  if (lab && OPS.includes(lab.op) && Number.isInteger(lab.a) && Number.isInteger(lab.b)) {
    state.lab = { a: lab.a, b: lab.b, op: lab.op };
  }

  const filters = saved.quest?.filters;
  if (Array.isArray(filters)) {
    const valid = OPS.filter(op => filters.includes(op));
    if (valid.length) state.quest.filters = valid;
  }

  const problem = saved.quest?.problem;
  if (isValidProblem(problem) && state.quest.filters.includes(problem.op)) {
    state.quest.problem = problem;
  }

  const level = saved.quest?.level;
  if (Number.isInteger(level) && level >= 1 && level <= 5) state.quest.level = level;

  const solved = saved.quest?.solvedSinceSpelling;
  if (Number.isInteger(solved) && solved >= 0) state.quest.solvedSinceSpelling = solved;

  const levels = saved.spell?.levels;
  if (Array.isArray(levels)) {
    const valid = LEVELS.map(l => l.id).filter(id => levels.includes(id));
    if (valid.length) state.spell.levels = valid;
  }

  loadJourney(saved.journey);
  // First launch with the journey: start at the level the grown-up already chose
  if (!saved.journey) state.journey.mission = Math.max(0, firstMissionOf(state.quest.level));
}

// Journey progress is precious (a hangar full of rockets), so it's checked
// field by field and anything malformed falls back to its default.
function loadJourney(saved) {
  if (!saved || typeof saved !== 'object') return;
  const j = state.journey;
  const isRocket = (r) => r && FAMILIES[r.family] && Number.isInteger(r.variant) && Array.isArray(r.colors);
  if (typeof saved.on === 'boolean') j.on = saved.on;
  if (Number.isInteger(saved.mission) && saved.mission >= 0 && saved.mission < MISSIONS.length) j.mission = saved.mission;
  if (isRocket(saved.rocket) && Number.isInteger(saved.rocket.earned)) {
    const total = FAMILIES[saved.rocket.family].build.length;
    j.rocket = { ...saved.rocket, total, earned: Math.max(0, Math.min(total, saved.rocket.earned)) };
  }
  if (Array.isArray(saved.flight)) j.flight = saved.flight.filter((k) => k === 'math' || k === 'word').slice(0, 4);
  if (saved.tries && Number.isInteger(saved.tries.rounds) && Number.isInteger(saved.tries.firstTry)) j.tries = saved.tries;
  if (Number.isInteger(saved.practice)) j.practice = saved.practice;
  j.stepDown = saved.stepDown === true;
  j.ready = saved.ready === true;
  j.pendingComplete = saved.pendingComplete === true && !!j.rocket && j.rocket.earned >= j.rocket.total;
  if (Array.isArray(saved.hangar)) j.hangar = saved.hangar.filter(isRocket);
  if (saved.stats && typeof saved.stats === 'object') j.stats = saved.stats;
}

function isValidProblem(p) {
  return !!p
    && OPS.includes(p.op)
    && ['a', 'b', 'target', 'expected'].every(k => Number.isInteger(p[k]))
    && (p.missing === 'b' || p.missing === 'result');
}
