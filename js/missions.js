// The rocket journey's path: destinations (one per level) and missions (one
// concept each, one rocket each), in teaching order.
//
// Each mission's gen(tier) makes a quest for its concept:
//   tier 0 = easier numbers (first piece of a rocket, or after a struggle)
//   tier 1 = typical
//   tier 2 = stretch (last piece, when it's going well), often with the ? in the middle
// Every quest must fit its destination level's Lab limits (js/levels.js), so
// "Test in the Lab" can show it. Check with the mission test loop after edits.

export const DESTINATIONS = [
  { id: 'moon', name: 'the Moon', short: 'Moon', level: 1 },
  { id: 'mars', name: 'Mars', short: 'Mars', level: 2 },
  { id: 'jupiter', name: 'Jupiter', short: 'Jupiter', level: 3 },
  { id: 'saturn', name: 'Saturn', short: 'Saturn', level: 4 },
  { id: 'deep', name: 'deep space', short: 'Deep space', level: 5 }
];

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const chance = (p) => Math.random() < p;

// A quest. missing: 'result' hides the answer, 'b' hides the second number.
const q = (a, op, b, target, missing = 'result') => ({ a, b, op, target, missing });
const add = (a, b, missing) => q(a, '+', b, a + b, missing);
const sub = (a, b, missing) => q(a, '-', b, a - b, missing);
const mul = (a, b, missing) => q(a, '×', b, a * b, missing);
const div = (b, ans, missing) => q(ans * b, '÷', b, ans, missing);
// Typical tier: mostly the answer hidden; stretch: mostly the middle number
const usualMissing = (tier) => (tier === 2 ? (chance(0.6) ? 'b' : 'result') : tier === 1 && chance(0.25) ? 'b' : 'result');

// Two numbers whose ones digits need a trade when added (27 + 15)
function carryPair(aMin, aMax, bMin, bMax, total) {
  for (;;) {
    const a = randInt(aMin, aMax), b = randInt(bMin, bMax);
    if (a % 10 + b % 10 >= 10 && a + b <= total) return [a, b];
  }
}

// a − b where the ones need breaking a ten (52 − 27)
function borrowPair(aMin, aMax, bMin, bMax) {
  for (;;) {
    const a = randInt(aMin, aMax), b = randInt(bMin, Math.min(bMax, a - 1));
    if (a % 10 < b % 10) return [a, b];
  }
}

export const MISSIONS = [
  // ---------- The Moon (level 1) ----------
  {
    id: 'ten-friends', dest: 'moon', name: 'Ten Friends',
    say: 'Mission: Ten Friends. Find two numbers that make ten.',
    gen: (t) => {
      const a = randInt(1, 9);
      if (t === 0) return add(a, 10 - a);
      if (t === 1) return add(a, 10 - a, 'b');
      return chance(0.5) ? sub(10, a) : add(a, 10 - a, 'b');
    }
  },
  {
    id: 'take-away', dest: 'moon', name: 'Take Away',
    say: 'Mission: Take Away. How many are left?',
    gen: (t) => {
      const a = t === 0 ? randInt(3, 6) : randInt(5, 10);
      return sub(a, randInt(1, a - 1), usualMissing(t));
    }
  },
  {
    id: 'bridge-ten', dest: 'moon', name: 'Bridge the Ten',
    say: 'Mission: Bridge the Ten. Fill up ten, then keep going.',
    gen: (t) => {
      const a = t === 0 ? randInt(8, 9) : randInt(6, 9);
      const b = t === 0 ? randInt(11 - a, 5) : randInt(11 - a, 9);
      return add(a, b, usualMissing(t));
    }
  },
  {
    id: 'back-over-ten', dest: 'moon', name: 'Back Over Ten',
    say: 'Mission: Back Over Ten. Take away, back past ten.',
    gen: (t) => {
      const a = t === 0 ? randInt(11, 13) : randInt(11, 18);
      const b = randInt(a - 9, t === 0 ? Math.min(a - 9 + 2, 9) : 9);
      return sub(a, b, usualMissing(t));
    }
  },
  {
    id: 'equal-groups', dest: 'moon', name: 'Equal Groups',
    say: 'Mission: Equal Groups. Rows that are all the same.',
    gen: (t) => {
      if (t === 0) return chance(0.5) ? mul(2, randInt(1, 5)) : mul(randInt(1, 5), 2);
      if (t === 1) return mul(randInt(2, 5), randInt(2, 5), usualMissing(t));
      return mul(randInt(2, 6), randInt(2, 6), usualMissing(t));
    }
  },
  {
    id: 'fair-shares', dest: 'moon', name: 'Fair Shares',
    say: 'Mission: Fair Shares. Share so everyone gets the same.',
    gen: (t) => {
      if (t === 0) return div(2, randInt(1, 5));
      const b = randInt(2, 5);
      return div(b, randInt(1, Math.floor(20 / b)), usualMissing(t));
    }
  },

  // ---------- Mars (level 2) ----------
  {
    id: 'tens-jumps', dest: 'mars', name: 'Tens Jumps',
    say: 'Mission: Tens Jumps. Jump by tens.',
    gen: (t) => {
      if (t === 0) { const a = 10 * randInt(1, 7); return add(a, 10 * randInt(1, 9 - a / 10)); }
      const a = randInt(11, 69), tens = 10 * randInt(1, Math.min(3, Math.floor((99 - a) / 10)));
      return chance(0.5) ? add(a, tens, usualMissing(t)) : sub(a + tens, tens, usualMissing(t));
    }
  },
  {
    id: 'carry-ten', dest: 'mars', name: 'Carry the Ten',
    say: 'Mission: Carry the Ten. Ten ones make a ten.',
    gen: (t) => {
      const [a, b] = t === 0 ? carryPair(12, 89, 3, 9, 99) : carryPair(12, 79, 12, 79, 99);
      return add(a, b, usualMissing(t));
    }
  },
  {
    id: 'break-ten', dest: 'mars', name: 'Break a Ten',
    say: 'Mission: Break a Ten. Trade a ten for ten ones.',
    gen: (t) => {
      const [a, b] = t === 0 ? borrowPair(21, 99, 3, 9) : borrowPair(30, 99, 12, 89);
      return sub(a, b, usualMissing(t));
    }
  },
  {
    id: 'skip-counting', dest: 'mars', name: 'Skip Counting',
    say: 'Mission: Skip Counting. Count by twos, fives and tens.',
    gen: (t) => {
      const f = t === 0 ? pick([2, 10]) : pick([2, 5, 10]);
      const n = t === 0 ? randInt(1, 5) : randInt(1, 10);
      return chance(0.5) ? mul(f, n, usualMissing(t)) : mul(n, f, usualMissing(t));
    }
  },
  {
    id: 'share-2-5-10', dest: 'mars', name: 'Share by 2, 5 and 10',
    say: 'Mission: Share by two, five and ten.',
    gen: (t) => div(t === 0 ? pick([2, 10]) : pick([2, 5, 10]), randInt(1, t === 0 ? 5 : 10), usualMissing(t))
  },

  // ---------- Jupiter (level 3) ----------
  {
    id: 'hundreds', dest: 'jupiter', name: 'Hundreds',
    say: 'Mission: Hundreds. Add and take away big numbers.',
    gen: (t) => {
      if (t === 0) {
        const a = 100 * randInt(1, 6) + 10 * randInt(0, 4), b = 100 * randInt(1, 2) + 10 * randInt(0, 4);
        return chance(0.5) ? add(a, b) : sub(a + b, b);
      }
      const a = randInt(120, 799), b = randInt(15, 999 - a);
      return chance(0.5) ? add(a, b, usualMissing(t)) : sub(a + b, b, usualMissing(t));
    }
  },
  {
    id: 'tables-1', dest: 'jupiter', name: 'Times Tables: 3s, 4s and 6s',
    say: 'Mission: Times Tables. Threes, fours and sixes.',
    gen: (t) => {
      const f = pick([3, 4, 6]), n = randInt(t === 0 ? 1 : 2, t === 0 ? 5 : 10);
      return chance(0.5) ? mul(f, n, usualMissing(t)) : mul(n, f, usualMissing(t));
    }
  },
  {
    id: 'tables-2', dest: 'jupiter', name: 'Times Tables: 7s, 8s and 9s',
    say: 'Mission: Times Tables. Sevens, eights and nines.',
    gen: (t) => {
      const f = pick([7, 8, 9]), n = randInt(t === 0 ? 1 : 2, t === 0 ? 5 : 10);
      return chance(0.5) ? mul(f, n, usualMissing(t)) : mul(n, f, usualMissing(t));
    }
  },
  {
    id: 'times-tens', dest: 'jupiter', name: 'Times Tens',
    say: 'Mission: Times Tens. Like six times four, but with tens.',
    gen: (t) => {
      const a = randInt(2, t === 0 ? 5 : 9), b = 10 * randInt(1, t === 0 ? 5 : 9);
      return chance(0.5) ? mul(a, b, usualMissing(t)) : mul(b, a, usualMissing(t));
    }
  },
  {
    id: 'division-facts', dest: 'jupiter', name: 'Division Facts',
    say: 'Mission: Division Facts. Times tables, backwards.',
    gen: (t) => div(randInt(2, t === 0 ? 5 : 10), randInt(2, 10), usualMissing(t))
  },

  // ---------- Saturn (level 4) ----------
  {
    id: 'thousands', dest: 'saturn', name: 'Thousands',
    say: 'Mission: Thousands. Line up the places.',
    gen: (t) => {
      const a = randInt(1000, t === 0 ? 4999 : 8999), b = randInt(t === 0 ? 100 : 500, Math.min(t === 0 ? 999 : 9999 - a, 9999 - a));
      return chance(0.5) ? add(a, b, usualMissing(t)) : sub(a + b, b, usualMissing(t));
    }
  },
  {
    id: 'big-times', dest: 'saturn', name: 'Big Times',
    say: 'Mission: Big Times. Split the big number into parts.',
    gen: (t) => (t === 0
      ? mul(10 * randInt(10, 50), randInt(2, 5))
      : mul(randInt(100, 999), randInt(2, 9), usualMissing(t)))
  },
  {
    id: 'double-digits', dest: 'saturn', name: 'Double Digits',
    say: 'Mission: Double Digits. Two numbers, four parts.',
    gen: (t) => (t === 0
      ? mul(randInt(11, 20), randInt(11, 20))
      : mul(randInt(11, 99), randInt(11, 99), usualMissing(t)))
  },
  {
    id: 'big-shares', dest: 'saturn', name: 'Big Shares',
    say: 'Mission: Big Shares. Share in big chunks.',
    gen: (t) => {
      const b = t === 0 ? randInt(2, 5) : randInt(2, 9);
      return div(b, randInt(Math.max(20, Math.ceil(100 / b)), Math.floor(999 / b)), usualMissing(t));
    }
  },

  // ---------- Deep space (level 5) ----------
  {
    id: 'ten-thousands', dest: 'deep', name: 'Ten-Thousands',
    say: 'Mission: Ten Thousands. The biggest numbers yet.',
    gen: (t) => {
      const a = randInt(10000, t === 0 ? 49999 : 89999), b = randInt(1000, Math.min(t === 0 ? 9999 : 99999 - a, 99999 - a));
      return chance(0.5) ? add(a, b, usualMissing(t)) : sub(a + b, b, usualMissing(t));
    }
  },
  {
    id: 'mega-times', dest: 'deep', name: 'Mega Times',
    say: 'Mission: Mega Times. Six parts to add up.',
    gen: (t) => (t === 0
      ? mul(randInt(100, 300), randInt(11, 20))
      : mul(randInt(100, 999), randInt(11, 99), usualMissing(t)))
  },
  {
    id: 'mega-shares', dest: 'deep', name: 'Mega Shares',
    say: 'Mission: Mega Shares. Share thousands into groups.',
    gen: (t) => {
      const b = t === 0 ? randInt(11, 20) : randInt(11, 99);
      return div(b, randInt(Math.max(10, Math.ceil(1000 / b)), Math.floor(9999 / b)), usualMissing(t));
    }
  }
];

export const missionIndex = (id) => MISSIONS.findIndex((m) => m.id === id);
export const destinationOf = (mission) => DESTINATIONS.find((d) => d.id === mission.dest);
export const missionsIn = (destId) => MISSIONS.filter((m) => m.dest === destId);
export const firstMissionOf = (level) => MISSIONS.findIndex((m) => destinationOf(m).level === level);

// A quest for a mission, tagged with where it came from
export function missionProblem(mission, tier) {
  const p = mission.gen(tier);
  return { ...p, expected: p.missing === 'b' ? p.b : p.target, mission: mission.id, tier };
}

// Dad's rocket-keys question: a typical quest from the next destination's
// first mission. One step up, not a leap, so Felix can picture solving it soon.
export function keysProblem(level) {
  const next = firstMissionOf(level + 1);
  if (next === -1) return null;
  const p = MISSIONS[next].gen(1);
  return { ...p, missing: 'result', expected: p.target, mission: MISSIONS[next].id, keys: true };
}
