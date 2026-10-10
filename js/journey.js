// Rocket journey logic: which quest comes next, flights and pieces, finishing
// a rocket, the move-on rule and Dad's keys. No DOM here (see journey-ui.js).
//
// A flight is 4 things toward the next piece, with at least one math quest and
// one word. In Math that's 3 quests + a word break; in Words, 3 words + a
// math break; mixing modes mid-flight also works.

import { state } from './state.js';
import { MISSIONS, DESTINATIONS, destinationOf, missionsIn, firstMissionOf, missionProblem, keysProblem } from './missions.js';
import { FAMILIES } from './rockets.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const MOVE_ON_RATE = 0.7; // first-try share needed to go to the next mission
const MAX_PRACTICE = 2; // practice rockets on one mission before moving on anyway

export const journeyOn = () => state.journey.on;
export const currentMission = () => MISSIONS[state.journey.mission];
export const currentDestination = () => destinationOf(currentMission());
export const missionNumber = () => state.journey.mission + 1;

const rate = ({ rounds, firstTry }) => (rounds ? firstTry / rounds : 1);

export function currentRocket() {
  const j = state.journey;
  if (!j.rocket) {
    const family = currentMission().dest;
    const fam = FAMILIES[family];
    const variant = j.hangar.filter((r) => r.family === family).length % fam.names.length;
    j.rocket = { family, variant, earned: 0, total: fam.build.length, colors: [...fam.palettes[variant % fam.palettes.length]] };
  }
  return j.rocket;
}

const counts = () => {
  const math = state.journey.flight.filter((k) => k === 'math').length;
  return { math, word: state.journey.flight.length - math };
};
export const needsWordBreak = () => { const c = counts(); return c.math >= 3 && c.word === 0; };
export const needsMathBreak = () => { const c = counts(); return c.word >= 3 && c.math === 0; };

// The next Mystery Quest
export function nextJourneyProblem() {
  const j = state.journey;
  const mission = currentMission();

  // Destination finished (waiting for Dad's keys): victory laps of its missions
  if (j.ready) return { ...missionProblem(pick(missionsIn(mission.dest)), 1), lap: true };

  // From mission 4 on, the third quest of a flight reviews a recent earlier mission
  if (counts().math === 2 && j.mission >= 3) {
    const earlier = MISSIONS.slice(Math.max(0, j.mission - 6), j.mission);
    return { ...missionProblem(pick(earlier), 1), review: true };
  }

  // Easier numbers for a rocket's first piece, a stretch on the last piece when
  // it's going well, and one step easier right after a quest that took 2+ tries
  const rocket = currentRocket();
  let tier = 1;
  if (rocket.earned === 0) tier = 0;
  else if (rocket.earned === rocket.total - 1 && rate(j.tries) >= 0.8) tier = 2;
  if (j.stepDown) tier = Math.max(0, tier - 1);
  return missionProblem(mission, tier);
}

// A solved quest. Returns { part, complete } when it finished a piece.
export function recordMath(problem, misses) {
  const j = state.journey;
  j.stepDown = misses >= 2;
  if (problem.mission === currentMission().id && !problem.review && !problem.lap) {
    j.tries.rounds++;
    if (misses === 0) j.tries.firstTry++;
    const s = (j.stats[problem.mission] ||= { rounds: 0, firstTry: 0, rockets: 0 });
    s.rounds++;
    if (misses === 0) s.firstTry++;
  }
  return addToFlight('math');
}

// A spelled word. Returns { part, complete } when it finished a piece.
export const recordWord = () => addToFlight('word');

function addToFlight(kind) {
  const j = state.journey;
  const c = counts();
  // Keep the 3-to-1 rhythm: no 4th of one kind until the other kind is in
  if (kind === 'math' ? c.math >= 3 && c.word === 0 : c.word >= 3 && c.math === 0) return null;
  j.flight.push(kind);
  if (j.flight.length < 4 || !j.flight.includes('math') || !j.flight.includes('word')) return null;

  j.flight = [];
  const rocket = currentRocket();
  rocket.earned = Math.min(rocket.total, rocket.earned + 1);
  const complete = rocket.earned >= rocket.total;
  if (complete) j.pendingComplete = true;
  return { part: FAMILIES[rocket.family].build[rocket.earned - 1], complete };
}

export function paintRocket(role, color) {
  const rocket = currentRocket();
  rocket.colors[role === 'trim' ? 1 : 0] = color;
}

// After the launch: the rocket joins the hangar and the next mission is chosen.
// Returns 'next', 'practice', 'ready' (destination done: Dad's keys), or 'lap'.
export function finishRocket() {
  const j = state.journey;
  const rocket = currentRocket();
  const mission = currentMission();
  j.hangar.push({ family: rocket.family, variant: rocket.variant, colors: [...rocket.colors], mission: mission.id, practice: j.practice > 0 || j.ready });
  (j.stats[mission.id] ||= { rounds: 0, firstTry: 0, rockets: 0 }).rockets++;

  let outcome;
  if (j.ready) {
    outcome = 'lap';
  } else if (rate(j.tries) >= MOVE_ON_RATE || j.practice >= MAX_PRACTICE) {
    j.practice = 0;
    const next = MISSIONS[j.mission + 1];
    if (next && next.dest === mission.dest) {
      j.mission++;
      outcome = 'next';
    } else {
      j.ready = true; // last mission of this destination (or of the whole journey)
      outcome = 'ready';
    }
  } else {
    j.practice++;
    outcome = 'practice';
  }

  j.rocket = null;
  j.tries = { rounds: 0, firstTry: 0 };
  j.stepDown = false;
  j.pendingComplete = false;
  return outcome;
}

// A half-built rocket follows Felix to a new destination: it becomes that
// destination's kind of rocket and keeps the pieces already built.
function refitRocket() {
  const j = state.journey;
  const family = currentMission().dest;
  if (!j.rocket || j.rocket.family === family) return;
  const earned = j.rocket.earned;
  j.rocket = null;
  const rocket = currentRocket();
  rocket.earned = Math.min(earned, rocket.total - 1);
}

// Dad's keys: is there a next destination, and what's the question?
export const nextDestination = () => DESTINATIONS.find((d) => d.level === currentDestination().level + 1) || null;
export const canAskForKeys = () => state.journey.on && state.journey.ready && !!nextDestination();
export const makeKeysProblem = () => keysProblem(currentDestination().level);

// The keys worked: fly on to the next destination (the level goes up with it)
export function unlockNextDestination() {
  const dest = nextDestination();
  if (!dest) return null;
  const j = state.journey;
  j.mission = firstMissionOf(dest.level);
  j.ready = false;
  j.practice = 0;
  j.tries = { rounds: 0, firstTry: 0 };
  state.quest.level = dest.level;
  refitRocket();
  return dest;
}

// The grown-up level setting moves the journey to that destination's first mission
export function setJourneyLevel(level) {
  const j = state.journey;
  const start = firstMissionOf(level);
  if (start === -1 || destinationOf(MISSIONS[j.mission]).level === level) return;
  j.mission = start;
  j.ready = false;
  j.practice = 0;
  j.tries = { rounds: 0, firstTry: 0 };
  refitRocket();
}
