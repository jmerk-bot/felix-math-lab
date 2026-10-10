// Explore Lab: steppers, operation picker, manipulatives and the number line.
// How big the numbers can go depends on the quest level (js/levels.js), and the
// picture changes with the size of the numbers:
//   + −  ten-frames (to 20) → base-ten blocks (to 999) → place-value chart
//   ×    array (to 10 × 10) → area model
//   ÷    sharing buckets (to 100 ÷ 10) → sharing in big chunks (partial quotients)

import { state, compute, OP_LABEL } from './state.js';
import { levelInfo, fmt } from './levels.js';
import { playChime } from './audio.js';

const $ = (id) => document.getElementById(id);

// Allowed values for A and B under the current operation and level
function limits(op, a) {
  const [aMax, bMax] = levelInfo(state.quest.level).lab[op];
  switch (op) {
    case '÷': return { aMin: 1, aMax, bMin: 1, bMax: Math.min(bMax, Math.max(1, a)), bCap: bMax };
    case '-': return { aMin: 1, aMax, bMin: 0, bMax: Math.min(bMax, a), bCap: bMax };
    default: return { aMin: 1, aMax, bMin: 0, bMax, bCap: bMax };
  }
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Keeps A and B inside the limits for the current operation. B is re-checked
// after A changes, so lowering A can never leave B bigger than it's allowed.
export function clampLab() {
  const lab = state.lab;
  const { aMin, aMax } = limits(lab.op, lab.a);
  lab.a = clamp(lab.a, aMin, aMax);
  const { bMin, bMax } = limits(lab.op, lab.a);
  lab.b = clamp(lab.b, bMin, bMax);
}

export function setLabOp(op) {
  const lab = state.lab;
  lab.op = op;
  if ((op === '×' || op === '÷') && lab.b === 0) lab.b = 1;
  if (op === '÷' && lab.a < lab.b) lab.a = lab.b * 2;
  if (op === '-' && lab.b > lab.a) lab.b = 0;
  clampLab();
  renderLab();
  playChime(4);
}

// delta is ±1 from the simple stepper, or ±1, ±10, ±100… from a digit column.
// A digit step that would go past the limits is ignored rather than clamped,
// so tapping the hundreds ▼ on 50 doesn't jump to 1.
function step(key, delta) {
  const lab = state.lab;
  const lim = limits(lab.op, lab.a);
  const [min, max] = key === 'a' ? [lim.aMin, lim.aMax] : [lim.bMin, lim.bMax];
  const next = lab[key] + delta;
  if ((next < min || next > max) && Math.abs(delta) !== 1) return;
  lab[key] = next;
  clampLab();
  renderLab();
  const value = lab[key];
  // Simple steppers chime the value; digit columns chime that column's digit
  playChime(Math.abs(delta) === 1 && max <= 20 ? value : Math.floor(value / Math.abs(delta)) % 10);
}

export const stepA = (delta) => step('a', delta);
export const stepB = (delta) => step('b', delta);

// Equations get smaller type as the numbers get longer
const sizeFor = (text) => (text.length > 16 ? 'l' : text.length > 11 ? 'm' : '');

export function renderLab() {
  const { a, b, op } = state.lab;
  const result = compute(a, b, op);
  const remainder = op === '÷' && b > 0 ? a % b : 0;

  // Symbolic equation
  $('display-a').textContent = fmt(a);
  $('display-op').textContent = OP_LABEL[op];
  $('display-b').textContent = fmt(b);
  $('display-result').textContent = fmt(result);
  const eq = document.querySelector('.equation-display');
  eq.dataset.size = sizeFor(`${fmt(a)} ${fmt(b)} ${fmt(result)}${remainder ? ` R ${remainder}` : ''}`);

  $('label-a').textContent = op === '÷' ? 'Total (A)' : 'First (A)';
  $('label-b').textContent = op === '÷' ? 'Groups (B)' : 'Second (B)';

  const remBadge = $('display-remainder');
  remBadge.hidden = !(op === '÷' && remainder > 0);
  remBadge.textContent = `R ${fmt(remainder)}`;

  document.querySelectorAll('.op-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === op);
  });

  const lim = limits(op, a);
  $('stepper-a').innerHTML = stepperHtml('a', a, lim.aMax);
  $('stepper-b').innerHTML = stepperHtml('b', b, lim.bCap);

  $('manipulative-card').innerHTML = manipulativeHtml(a, b, op);
  renderNumberLine(a, b, op, result);
}

// The picture for a op b, chosen by the size of the numbers. Also used by the
// rocket journey's mission briefings.
export function manipulativeHtml(a, b, op) {
  const result = compute(a, b, op);
  if (op === '+' || op === '-') {
    if (Math.max(a, b, result) <= 20) return tenFramesHtml(a, b, op, result);
    if (Math.max(a, b, result) < 1000) return blocksHtml(a, b, op, result);
    return placeValueHtml(a, b, op, result);
  }
  if (op === '×') return a <= 10 && b <= 10 ? arrayHtml(a, b) : areaModelHtml(a, b);
  return a <= 100 && b <= 10 ? sharingHtml(a, b, b > 0 ? a % b : 0) : chunksHtml(a, b);
}

// ---------- Steppers ----------

const chevron = (up) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}"/></svg>`;

// Small ranges get the simple − value + stepper. Bigger ranges get one column
// per place value (1, 10, 100, …), each with its own ▲ and ▼.
function stepperHtml(key, value, max) {
  const color = key === 'a' ? 'num-a' : 'num-b';
  if (max <= 20) {
    return `
      <button class="stepper-btn" data-action="step-${key}" data-value="-1" aria-label="One less">-</button>
      <span class="stepper-val ${color}">${value}</span>
      <button class="stepper-btn" data-action="step-${key}" data-value="1" aria-label="One more">+</button>
    `;
  }
  const places = String(max).length;
  let cols = '';
  for (let p = places - 1; p >= 0; p--) {
    const place = 10 ** p;
    const digit = Math.floor(value / place) % 10;
    const leading = value < place && place > 1; // a zero in front of the number
    cols += `
      <div class="digit-col">
        <button class="digit-btn" data-action="step-${key}" data-value="${place}" aria-label="Add ${fmt(place)}">${chevron(true)}</button>
        <span class="digit ${color} ${leading ? 'leading' : ''}">${digit}</span>
        <button class="digit-btn" data-action="step-${key}" data-value="-${place}" aria-label="Take away ${fmt(place)}">${chevron(false)}</button>
        <span class="digit-place">${fmt(place)}</span>
      </div>
      ${p === 3 ? '<span class="digit-comma">,</span>' : ''}
    `;
  }
  return `<div class="digit-stepper">${cols}</div>`;
}

// ---------- + and − ----------

// Two ten-frames covering positions 1–20.
// Addition: A blue circles, then B amber diamonds (filling the first frame to ten first).
// Subtraction: the circles that remain, then the ones taken away crossed out.
function tenFramesHtml(a, b, op, result) {
  const tokenAt = (p) => {
    if (op === '-') {
      if (p <= result) return '<div class="token-blue-circle"></div>';
      if (p <= a) return '<div class="token-subtracted">✕</div>';
      return '';
    }
    if (p <= a) return '<div class="token-blue-circle"></div>';
    if (p <= a + b) return '<div class="token-amber-diamond"></div>';
    return '';
  };

  let f1Slots = '';
  let f2Slots = '';
  for (let i = 1; i <= 10; i++) {
    f1Slots += `<div class="slot">${tokenAt(i)}</div>`;
    f2Slots += `<div class="slot">${tokenAt(i + 10)}</div>`;
  }

  const splitTag = (op === '+' && a + b > 10 && a < 10)
    ? `<span class="split-badge">10-Split: ${b} is ${10 - a} + ${b - (10 - a)}</span>`
    : '';

  return `
    <div class="card-header-bar">
      <span>TEN-FRAME 1 (1 – 10)</span>
      ${splitTag}
      <span>TEN-FRAME 2 (11 – 20)</span>
    </div>
    <div class="ten-frames-container">
      <div class="ten-frame">${f1Slots}</div>
      <div class="ten-frame">${f2Slots}</div>
    </div>
  `;
}

// Hundreds flats, tens rods and ones cubes. Rows: A, B (or the part taken
// away), and the answer. A badge points out when a trade is needed.
function blocksHtml(a, b, op, result) {
  const blocks = (n, kind) => {
    const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    const ones = o ? `<span class="b10-ones">${'<span class="b10-one"></span>'.repeat(o)}</span>` : '';
    return `<div class="b10-blocks ${kind}">${'<span class="b10-flat"></span>'.repeat(h)}${'<span class="b10-rod"></span>'.repeat(t)}${ones}${n === 0 ? '<span class="b10-zero">0</span>' : ''}</div>`;
  };

  let trade = '';
  if (op === '+') {
    if (a % 10 + b % 10 >= 10) trade = 'Trade 10 ones for 1 ten';
    else if (Math.floor(a / 10) % 10 + Math.floor(b / 10) % 10 >= 10) trade = 'Trade 10 tens for 1 hundred';
  } else {
    if (a % 10 < b % 10) trade = 'Break 1 ten into 10 ones';
    else if (Math.floor(a / 10) % 10 < Math.floor(b / 10) % 10) trade = 'Break 1 hundred into 10 tens';
  }

  const row = (label, cls, n, kind) => `
    <div class="b10-row">
      <span class="b10-label ${cls}">${label}</span>
      ${blocks(n, kind)}
    </div>`;

  return `
    <div class="card-header-bar">
      <span>BASE-TEN BLOCKS</span>
      ${trade ? `<span class="split-badge">${trade}</span>` : ''}
    </div>
    <div class="b10-legend"><span class="b10-flat mini"></span>100 <span class="b10-rod mini"></span>10 <span class="b10-one"></span>1</div>
    ${row(fmt(a), 'num-a', a, 'kind-a')}
    ${op === '+' ? row(`+ ${fmt(b)}`, 'num-b', b, 'kind-b') : row(`− ${fmt(b)}`, 'num-take', b, 'kind-take')}
    ${row(`= ${fmt(result)}`, 'num-target', result, 'kind-result')}
  `;
}

// Column addition/subtraction lined up by place value, with the carries
// (or regrouped columns) marked above.
function placeValueHtml(a, b, op, result) {
  const places = String(Math.max(a, b, result)).length;
  const digitsOf = (n) => String(n).padStart(places, ' ').split('');

  // marks[i] for column i (left to right): a carried 1, or a regrouped column
  const marks = Array(places).fill('');
  let carry = 0;
  for (let p = 0; p < places; p++) {
    const i = places - 1 - p;
    const da = Math.floor(a / 10 ** p) % 10, db = Math.floor(b / 10 ** p) % 10;
    if (op === '+') {
      carry = da + db + carry >= 10 ? 1 : 0;
      if (carry && i > 0) marks[i - 1] = '1';
    } else {
      const borrow = da - carry < db;
      if (borrow) marks[i] = '10';
      carry = borrow ? 1 : 0;
    }
  }

  const cells = (list, cls) => list.map((d) => `<span class="pv-cell ${cls}">${d.trim()}</span>`).join('');
  const heads = Array.from({ length: places }, (_, k) => fmt(10 ** (places - 1 - k)));

  return `
    <div class="card-header-bar">
      <span>PLACE VALUE: LINE UP THE PLACES</span>
      ${marks.some(Boolean) ? `<span class="split-badge">${op === '+' ? 'Carry the 1s' : 'Regroup the marked places'}</span>` : ''}
    </div>
    <div class="pv-chart" style="grid-template-columns: 36px repeat(${places}, minmax(0, 1fr));">
      <span></span>${heads.map((h) => `<span class="pv-head">${h}</span>`).join('')}
      <span></span>${marks.map((m) => `<span class="pv-mark ${op === '+' ? 'carry' : 'regroup'}">${m}</span>`).join('')}
      <span></span>${cells(digitsOf(a), 'num-a')}
      <span class="pv-op num-b">${OP_LABEL[op]}</span>${cells(digitsOf(b), 'num-b')}
      <span class="pv-line"></span>
      <span class="pv-op equals">=</span>${cells(digitsOf(result), 'num-target')}
    </div>
  `;
}

// ---------- × ----------

function arrayHtml(a, b) {
  let cells = '';
  for (let i = 1; i <= a * b; i++) {
    cells += `<div class="matrix-cell">${i}</div>`;
  }
  const small = a > 6 || b > 6 ? 'small' : '';
  return `
    <div class="card-header-bar">
      <span>MULTIPLICATION ARRAY: ${a} ROWS × ${b} COLUMNS</span>
      <span class="array-total">Total: ${a * b}</span>
    </div>
    <div class="matrix-wrapper">
      <div class="matrix-grid ${small}" style="grid-template-rows: repeat(${a}, 1fr); grid-template-columns: repeat(${b}, 1fr);">
        ${cells}
      </div>
    </div>
  `;
}

// 325 → [300, 20, 5]; zeros are skipped (305 → [300, 5])
function placeParts(n) {
  const parts = [];
  for (let place = 10 ** (String(n).length - 1); place >= 1; place /= 10) {
    const part = Math.floor(n / place) % 10 * place;
    if (part) parts.push(part);
  }
  return parts.length ? parts : [0];
}

// Area model: split A (rows) and B (columns) by place value, multiply each
// pair, then add the parts.
function areaModelHtml(a, b) {
  const rows = placeParts(a), cols = placeParts(b);
  const partials = rows.flatMap((r) => cols.map((c) => r * c));
  const colSizes = cols.map((c) => `minmax(64px, ${Math.max(c / b, 0.12).toFixed(3)}fr)`).join(' ');
  const rowSize = (r) => Math.round(Math.max(52, Math.min(130, (r / a) * 180)));

  let grid = `<span></span>${cols.map((c) => `<span class="area-head num-b">${fmt(c)}</span>`).join('')}`;
  rows.forEach((r) => {
    grid += `<span class="area-side num-a">${fmt(r)}</span>`;
    grid += cols.map((c) => `<span class="area-cell" style="min-height: ${rowSize(r)}px">${fmt(r * c)}</span>`).join('');
  });

  return `
    <div class="card-header-bar">
      <span>AREA MODEL: ${fmt(a)} × ${fmt(b)}</span>
      <span class="array-total">Total: ${fmt(a * b)}</span>
    </div>
    <div class="area-grid" style="grid-template-columns: auto ${colSizes};">${grid}</div>
    <div class="area-sum">${partials.map(fmt).join(' + ')} = <strong class="num-target">${fmt(a * b)}</strong></div>
  `;
}

// ---------- ÷ ----------

function sharingHtml(a, b, remainder) {
  const perGroup = Math.floor(a / b);
  let buckets = '';
  for (let g = 1; g <= b; g++) {
    buckets += `
      <div class="bucket">
        <span class="bucket-title">GROUP ${g}</span>
        <div class="bucket-items">${'<div class="share-dot"></div>'.repeat(perGroup)}</div>
      </div>
    `;
  }

  const remHtml = remainder > 0
    ? `
      <div class="remainder-row">
        <strong>Leftover:</strong>
        <div class="leftover-dots">${'<div class="leftover-dot"></div>'.repeat(remainder)}</div>
      </div>
    `
    : '';

  return `
    <div class="card-header-bar">
      <span>EQUAL SHARING: ${a} DIVIDED INTO ${b} GROUPS</span>
      <span class="each-gets">Each gets: ${perGroup}</span>
    </div>
    <div class="buckets-grid" style="grid-template-columns: repeat(${Math.min(b, 5)}, 1fr);">
      ${buckets}
    </div>
    ${remHtml}
  `;
}

// Sharing in big chunks (partial quotients): give every group as many as
// possible by place value (hundreds, then tens, then ones), take that away,
// and repeat. The chunks add up to the answer.
function chunksHtml(a, b) {
  const steps = [];
  let left = a;
  while (left >= b) {
    const q = Math.floor(left / b);
    const place = 10 ** (String(q).length - 1);
    const chunk = Math.floor(q / place) * place;
    steps.push({ left, chunk, take: chunk * b });
    left -= chunk * b;
  }
  const quotient = steps.reduce((sum, s) => sum + s.chunk, 0);

  const rows = steps.map((s) => `
    <span class="chunk-left num-a">${fmt(s.left)}</span>
    <span class="chunk-take">− <span class="num-b">${fmt(b)}</span> × <strong class="chunk-q">${fmt(s.chunk)}</strong> = ${fmt(s.take)}</span>
  `).join('');

  return `
    <div class="card-header-bar">
      <span>SHARE IN BIG CHUNKS: ${fmt(a)} ÷ ${fmt(b)}</span>
      <span class="each-gets">Each gets: ${fmt(quotient)}</span>
    </div>
    <div class="chunk-grid">
      ${rows}
      <span class="chunk-left ${left ? 'num-b' : 'num-a'}">${fmt(left)}</span>
      <span class="chunk-take">${left ? 'left over' : 'nothing left'}</span>
    </div>
    <div class="area-sum">${steps.map((s) => fmt(s.chunk)).join(' + ') || '0'} = <strong class="num-target">${fmt(quotient)}</strong>${left ? ` <span class="remainder-badge">R ${fmt(left)}</span>` : ''}</div>
  `;
}

// ---------- Number line ----------

// Smallest "nice" range (20, 50, 100, 200, 500, …) that fits the numbers
function niceRange(n) {
  if (n <= 20) return 20;
  for (let base = 10; ; base *= 10) {
    for (const m of [2, 5, 10]) if (n <= m * base) return m * base;
  }
}

function renderNumberLine(a, b, op, result) {
  // Subtraction hops back from A, so its line has to reach A
  const range = niceRange(op === '-' ? a : result);
  const pct = Math.min(100, (result / range) * 100);
  const segment = $('vector-segment');
  segment.style.width = `${pct}%`;
  segment.classList.toggle('multiply', op === '×');

  const hint = $('vector-hint');
  if (op === '+') hint.textContent = `Hop forward +${fmt(b)}`;
  else if (op === '-') hint.textContent = `Hop backward −${fmt(b)}`;
  else if (op === '×') hint.textContent = `${fmt(a)} hops of ${fmt(b)} units`;
  else hint.textContent = `Landing: ${fmt(result)}`;

  // 20 → ticks every 1, labels every 2 (as before); bigger → 10 intervals
  const intervals = range === 20 ? 20 : 10;
  const tick = range / intervals;
  const labelEvery = range === 20 || range >= 10000 ? 2 : 1;
  let ticks = '';
  for (let i = 0; i <= intervals; i++) {
    const val = i * tick;
    const target = val === result ? 'target' : '';
    ticks += `
      <div class="tick-col">
        <div class="tick-line ${target}"></div>
        <span class="tick-label ${target}">${i % labelEvery === 0 ? fmt(val) : ''}</span>
      </div>
    `;
  }
  $('vector-ticks').innerHTML = ticks;

  // A dot marks the result; it gets a label when no tick label already shows it
  const onLabel = result % tick === 0 && (result / tick) % labelEvery === 0;
  const marker = $('vector-marker');
  marker.style.left = `${pct}%`;
  marker.textContent = onLabel ? '' : fmt(result);
}
