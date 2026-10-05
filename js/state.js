// App state, shared helpers, and saving/restoring between launches.

import { LEVELS } from './words.js';

export const OPS = ['+', '-', '×', '÷'];

// In Math, a spelling word comes up after this many solved Mystery Quests
export const SPELL_EVERY = 3;

// Subtraction is stored as '-' but shown with a proper minus sign.
export const OP_LABEL = { '+': '+', '-': '−', '×': '×', '÷': '÷' };

export const state = {
  mode: 'home', // 'home', 'lab', 'quest' or 'spell'
  mathView: 'lab', // where "Math" on the home screen goes: 'lab' or 'quest'
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
    solvedSinceSpelling: 0
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
        solvedSinceSpelling: quest.solvedSinceSpelling
      },
      spell: {
        levels: spell.levels
      }
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

  const solved = saved.quest?.solvedSinceSpelling;
  if (Number.isInteger(solved) && solved >= 0) state.quest.solvedSinceSpelling = solved;

  const levels = saved.spell?.levels;
  if (Array.isArray(levels)) {
    const valid = LEVELS.map(l => l.id).filter(id => levels.includes(id));
    if (valid.length) state.spell.levels = valid;
  }
}

function isValidProblem(p) {
  return !!p
    && OPS.includes(p.op)
    && ['a', 'b', 'target', 'expected'].every(k => Number.isInteger(p[k]))
    && (p.missing === 'b' || p.missing === 'result');
}
