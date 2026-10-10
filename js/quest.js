// Mystery Quest: generate a problem with one hidden number, check the answer.

import { state, OP_LABEL } from './state.js';
import { makeProblem, levelInfo, fmt } from './levels.js';
import { playChime, playSuccessChord } from './audio.js';

const $ = (id) => document.getElementById(id);

export function toggleQuestFilter(op) {
  let f = state.quest.filters;
  if (f.includes(op)) {
    if (f.length === 1) return; // Keep at least one
    f = f.filter(x => x !== op);
  } else {
    f = [...f, op];
  }
  state.quest.filters = f;

  if (state.quest.problem && !f.includes(state.quest.problem.op)) {
    generateNewQuest();
  } else {
    renderQuest();
  }
}

export function generateNewQuest() {
  const pool = state.quest.filters.length ? state.quest.filters : ['+'];
  const op = pool[Math.floor(Math.random() * pool.length)];
  state.quest.problem = makeProblem(op, state.quest.level);
  state.quest.status = 'playing';
  state.quest.entry = '';
  state.quest.replaceOnType = false;

  renderQuest();
}

// Set the level (from grown-up settings). A quest in progress is swapped for
// one at the new level; a solved one stays until "Next Quest".
export function setLevel(level) {
  const quest = state.quest;
  quest.level = levelInfo(level).id;
  playChime(quest.level * 2);
  if (quest.status === 'correct') renderQuest();
  else generateNewQuest();
}

// Equations get smaller type as the numbers get longer
const sizeFor = (text) => (text.length > 16 ? 'l' : text.length > 11 ? 'm' : '');

export function renderQuest() {
  const { filters, problem: q, status, entry, level } = state.quest;

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.classList.toggle('active', filters.includes(pill.dataset.value));
  });

  if (!q) return;

  $('quest-num-a').textContent = fmt(q.a);
  $('quest-op-badge').textContent = OP_LABEL[q.op];
  const shown = q.missing === 'b' ? [q.a, q.target] : [q.a, q.b];
  document.querySelector('.quest-equation').dataset.size =
    sizeFor(`${shown.map(fmt).join(' ')} ${'0'.repeat(levelInfo(level).maxDigits)}`);

  // The mystery box shows what Felix has typed on the number pad, in the
  // color of the number it stands for (amber for B, green for the answer)
  const role = q.missing === 'b' ? 'role-b' : 'role-target';
  const fill = status === 'correct' ? 'correct' : entry ? 'filled' : '';
  const box = `<span class="mystery-box ${role} ${fill}">${entry ? fmt(entry) : '?'}</span>`;

  if (q.missing === 'b') {
    $('quest-slot-b').innerHTML = box;
    $('quest-slot-result').innerHTML = `<span class="num-target">${fmt(q.target)}</span>`;
  } else {
    $('quest-slot-b').innerHTML = `<span class="num-b">${fmt(q.b)}</span>`;
    $('quest-slot-result').innerHTML = box;
  }

  const a = `<strong class="num-a">${fmt(q.a)}</strong>`;
  const target = `<strong class="num-target">${fmt(q.target)}</strong>`;
  const b = (mystery) => `<strong class="num-b">${q.missing === 'b' ? mystery : fmt(q.b)}</strong>`;
  const guide = $('quest-guide-text');
  if (q.missing === 'result') {
    // The answer is the mystery here, so the guide asks for it instead of naming it
    const green = (text) => `<strong class="num-target">${text}</strong>`;
    if (q.op === '+') guide.innerHTML = `Start with ${a} and add ${b()}. ${green('How many altogether?')}`;
    else if (q.op === '-') guide.innerHTML = `Start with ${a} and take away ${b()}. ${green('How many are left?')}`;
    else if (q.op === '×') guide.innerHTML = `A grid of ${a} rows of ${b()}. ${green('How many in total?')}`;
    else guide.innerHTML = `Share ${a} into ${b()} equal groups. ${green('How many in each group?')}`;
  } else if (q.op === '+') {
    guide.innerHTML = `Start with ${a} and add ${b('a mystery amount')} to make ${target}.`;
  } else if (q.op === '-') {
    guide.innerHTML = `Start with ${a} and remove ${b('a mystery amount')} until ${target} remain.`;
  } else if (q.op === '×') {
    guide.innerHTML = `A grid of ${a} rows of ${b('mystery units')} to reach ${target} total.`;
  } else {
    guide.innerHTML = `Divide ${a} into ${b('mystery groups')} equally.`;
  }

  const solved = status === 'correct';
  $('quest-active-controls').hidden = solved;
  $('quest-solved-controls').hidden = !solved;

  const tag = $('quest-tag-status');
  tag.hidden = status === 'playing';
  tag.className = `quest-tag ${status}`;
  tag.textContent = solved ? 'Brilliant! Match found! ⭐' : 'Almost! Test in Lab 👇';
}

// Reminder banner shown in the Lab while a quest is open. It repeats the quest
// with the ? still hidden (never the answer) plus a hint for using the Lab.
export function renderQuestBanner(show) {
  const banner = $('lab-quest-banner');
  banner.hidden = !show;
  if (!show) return;

  const q = state.quest.problem;
  const mystery = '<span class="mini-mystery">?</span>';
  const b = q.missing === 'b' ? mystery : `<span class="num-b">${fmt(q.b)}</span>`;
  const result = q.missing === 'result' ? mystery : `<span class="num-target">${fmt(q.target)}</span>`;
  $('banner-equation').innerHTML =
    `<span class="num-a">${fmt(q.a)}</span><span class="op-symbol">${OP_LABEL[q.op]}</span>${b}<span class="equals">=</span>${result}`;

  const amber = (text) => `<strong class="num-b">${text}</strong>`;
  const green = (text) => `<strong class="num-target">${text}</strong>`;
  let hint;
  if (q.missing === 'b') {
    hint = q.op === '÷'
      ? `Change the ${amber('groups')} until each group gets ${green(fmt(q.target))}.`
      : `Change the ${amber('second number')} until you get ${green(fmt(q.target))}.`;
  } else {
    hint = q.op === '÷'
      ? `Make ${amber(`${fmt(q.b)} groups`)}, then look at the answer.`
      : `Make the ${amber('second number')} ${amber(fmt(q.b))}, then look at the answer.`;
  }
  $('banner-hint').innerHTML = hint;
}

// Number pad: key is '0'–'9', 'back' or 'solve'
export function pressKey(key) {
  const quest = state.quest;
  if (!quest.problem || quest.status === 'correct') return;

  if (key === 'solve') {
    submitQuestAnswer();
    return;
  }

  if (key === 'back') {
    if (!quest.entry) return;
    quest.entry = quest.entry.slice(0, -1);
    quest.replaceOnType = false;
    playChime(0);
  } else {
    if (quest.replaceOnType || quest.entry === '0') quest.entry = '';
    quest.replaceOnType = false;
    // As many digits as the level's biggest answer (never the length of this one)
    if (quest.entry.length >= levelInfo(quest.level).maxDigits) return;
    quest.entry += key;
    playChime(Number(key));
  }
  renderQuest();
}

function submitQuestAnswer() {
  const quest = state.quest;
  if (!quest.entry) return; // ignore an empty Solve tap

  if (parseInt(quest.entry, 10) === quest.problem.expected) {
    quest.status = 'correct';
    quest.solvedSinceSpelling++;
    playSuccessChord();
    renderQuest();
  } else {
    quest.status = 'retry';
    quest.replaceOnType = true; // keep the guess on screen until the next digit
    playChime(1);
    renderQuest();
    document.querySelector('.quest-equation .mystery-box')?.classList.add('wiggle');
  }
}
