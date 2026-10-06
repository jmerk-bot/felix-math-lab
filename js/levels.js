// Difficulty levels for Mystery Quest and the Lab, from early 2nd grade (1)
// to 5th grade (5). Whole numbers only.
//
// `lab` is how far each Lab control can go at that level ([A max, B max]).
// Every quest a level makes must fit inside its own Lab limits, so
// "Test in the Lab" can always show it. `maxDigits` is the longest answer
// the number pad needs at that level.

export const LEVELS = [
  {
    id: 1, grade: 'Early 2nd grade', maxDigits: 2,
    lab: { '+': [10, 10], '-': [20, 20], '×': [6, 6], '÷': [20, 20] }
  },
  {
    id: 2, grade: '2nd grade', maxDigits: 3,
    lab: { '+': [100, 100], '-': [100, 100], '×': [10, 10], '÷': [100, 10] }
  },
  {
    id: 3, grade: '3rd grade', maxDigits: 3,
    lab: { '+': [1000, 1000], '-': [1000, 1000], '×': [100, 100], '÷': [100, 10] }
  },
  {
    id: 4, grade: '4th grade', maxDigits: 4,
    lab: { '+': [9999, 9999], '-': [9999, 9999], '×': [999, 99], '÷': [999, 9] }
  },
  {
    id: 5, grade: '5th grade', maxDigits: 5,
    lab: { '+': [99999, 99999], '-': [99999, 99999], '×': [999, 99], '÷': [9999, 99] }
  }
];

export const levelInfo = (level) => LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1];

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const either = (x, y) => (Math.random() < 0.5 ? [x, y] : [y, x]);

// Returns [a, b, answer] for `op` at `level`
function numbers(op, level) {
  switch (`${level}${op}`) {
    // 1 — early 2nd grade: facts within 20, small equal groups
    case '1+': { const a = randInt(2, 9), b = randInt(2, 9); return [a, b, a + b]; }
    case '1-': { const ans = randInt(1, 9), b = randInt(2, 9); return [ans + b, b, ans]; }
    case '1×': { const a = randInt(2, 5), b = randInt(2, 5); return [a, b, a * b]; }
    case '1÷': { const b = randInt(2, 5), ans = randInt(1, Math.min(5, Math.floor(20 / b))); return [ans * b, b, ans]; }

    // 2 — 2nd grade: within 100, facts for 2s, 5s and 10s
    case '2+': { const a = randInt(11, 89), b = randInt(3, 99 - a); return [a, b, a + b]; }
    case '2-': { const a = randInt(20, 99), b = randInt(3, a - 1); return [a, b, a - b]; }
    case '2×': { const [a, b] = either(pick([2, 5, 10]), randInt(1, 10)); return [a, b, a * b]; }
    case '2÷': { const b = pick([2, 5, 10]), ans = randInt(1, 10); return [ans * b, b, ans]; }

    // 3 — 3rd grade: within 1,000, all facts to 10 × 10, times tens
    case '3+': { const a = randInt(100, 899), b = randInt(10, 999 - a); return [a, b, a + b]; }
    case '3-': { const a = randInt(100, 999), b = randInt(10, a - 1); return [a, b, a - b]; }
    case '3×': {
      const [a, b] = Math.random() < 0.5
        ? [randInt(2, 10), randInt(2, 10)]
        : either(randInt(2, 9), 10 * randInt(1, 9));
      return [a, b, a * b];
    }
    case '3÷': { const b = randInt(2, 10), ans = randInt(2, 10); return [ans * b, b, ans]; }

    // 4 — 4th grade: within 10,000, 3-digit × 1-digit, 2-digit × 2-digit, 3-digit ÷ 1-digit
    case '4+': { const a = randInt(1000, 8999), b = randInt(100, 9999 - a); return [a, b, a + b]; }
    case '4-': { const a = randInt(1000, 9999), b = randInt(100, a - 1); return [a, b, a - b]; }
    case '4×': {
      const [a, b] = Math.random() < 0.5 ? [randInt(100, 999), randInt(2, 9)] : [randInt(11, 99), randInt(11, 99)];
      return [a, b, a * b];
    }
    case '4÷': {
      const b = randInt(2, 9), ans = randInt(Math.ceil(100 / b), Math.floor(999 / b));
      return [ans * b, b, ans];
    }

    // 5 — 5th grade: within 100,000, 3-digit × 2-digit, 4-digit ÷ 2-digit
    case '5+': { const a = randInt(10000, 89999), b = randInt(1000, 99999 - a); return [a, b, a + b]; }
    case '5-': { const a = randInt(10000, 99999), b = randInt(1000, a - 1); return [a, b, a - b]; }
    case '5×': { const a = randInt(100, 999), b = randInt(11, 99); return [a, b, a * b]; }
    case '5÷': {
      const b = randInt(11, 99), ans = randInt(Math.max(10, Math.ceil(1000 / b)), Math.floor(9999 / b));
      return [ans * b, b, ans];
    }
    default: return [2, 2, 4];
  }
}

// A quest: a op b = target, with either the answer or B hidden
export function makeProblem(op, level) {
  const [a, b, target] = numbers(op, levelInfo(level).id);
  const hideAnswer = Math.random() > 0.35;
  return {
    a,
    b,
    op,
    target,
    missing: hideAnswer ? 'result' : 'b',
    expected: hideAnswer ? target : b
  };
}

// 4382 → "4,382"
export const fmt = (n) => Number(n).toLocaleString('en-US');
