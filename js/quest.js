// Mystery Quest: generate a problem with one hidden number, check the answer.

import { state, OP_LABEL } from './state.js';
import { playChime, playSuccessChord } from './audio.js';

const $ = (id) => document.getElementById(id);

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

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
  let qa, qb, ans;

  if (op === '+') {
    qa = randInt(2, 9);
    qb = randInt(2, 8);
    ans = qa + qb;
  } else if (op === '-') {
    ans = randInt(1, 8);
    qb = randInt(2, 7);
    qa = ans + qb;
  } else if (op === '×') {
    qa = randInt(2, 6);
    qb = randInt(2, 6);
    ans = qa * qb;
  } else {
    qb = randInt(2, 5);
    // Keep the total at 20 or less so the Lab can show it
    ans = randInt(1, Math.min(5, Math.floor(20 / qb)));
    qa = ans * qb;
  }

  const hideAns = Math.random() > 0.35;
  state.quest.problem = {
    a: qa,
    b: qb,
    op,
    target: ans,
    missing: hideAns ? 'result' : 'b',
    expected: hideAns ? ans : qb
  };
  state.quest.status = 'playing';
  $('quest-input-val').value = '';

  renderQuest();
}

export function renderQuest() {
  const { filters, problem: q, status } = state.quest;

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.classList.toggle('active', filters.includes(pill.dataset.value));
  });

  if (!q) return;

  $('quest-num-a').textContent = q.a;
  $('quest-op-badge').textContent = OP_LABEL[q.op];

  if (q.missing === 'b') {
    $('quest-slot-b').innerHTML = '<span class="mystery-box">?</span>';
    $('quest-slot-result').innerHTML = `<span class="num-target">${q.target}</span>`;
  } else {
    $('quest-slot-b').innerHTML = `<span class="num-b">${q.b}</span>`;
    $('quest-slot-result').innerHTML = '<span class="mystery-box">?</span>';
  }

  const a = `<strong class="num-a">${q.a}</strong>`;
  const target = `<strong class="num-target">${q.target}</strong>`;
  const b = (mystery) => `<strong class="num-b">${q.missing === 'b' ? mystery : q.b}</strong>`;
  const guide = $('quest-guide-text');
  if (q.op === '+') {
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

export function submitQuestAnswer() {
  const input = $('quest-input-val');
  const val = parseInt(input.value, 10);
  if (Number.isNaN(val) || !state.quest.problem) return; // ignore an empty Solve tap

  if (val === state.quest.problem.expected) {
    state.quest.status = 'correct';
    input.blur(); // close the on-screen keyboard so "Next Quest" is visible
    playSuccessChord();
  } else {
    state.quest.status = 'retry';
    playChime(1);
  }
  renderQuest();
}
