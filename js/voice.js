// Spoken lines for the rocket journey, recorded by scripts/make-audio.mjs into
// audio/voice/<id>.m4a. Felix hears what matters instead of reading it.

import { MISSIONS, DESTINATIONS } from './missions.js';
import { PART_LABELS } from './rockets.js';

export const VOICE = [
  { id: 'count-3', text: 'Three.' },
  { id: 'count-2', text: 'Two.' },
  { id: 'count-1', text: 'One.' },
  { id: 'blast-off', text: 'Blast off!' },
  { id: 'to-hangar', text: 'Added to your hangar!' },
  { id: 'rocket-done', text: 'Rocket complete! Pick your colors.' },
  { id: 'ready', text: 'Ready to move on! Ask Dad for the keys to the rocket.' },
  { id: 'keys-ok', text: 'You got the keys!' },
  { id: 'keys-try', text: 'Not yet. Try again!' },
  { id: 'practice', text: 'Practice flight! Same mission, brand new rocket.' },
  { id: 'word-break', text: 'Word break!' },
  { id: 'math-break', text: 'Math break!' },
  ...DESTINATIONS.slice(1).map((d) => ({ id: `next-${d.id}`, text: `Next stop: ${d.name}!` })),
  ...Object.entries(PART_LABELS).map(([id, label]) => ({ id: `part-${id}`, text: `You built the ${label}!` })),
  ...MISSIONS.map((m) => ({ id: `mission-${m.id}`, text: m.say }))
];

export const voiceAudio = (id) => `audio/voice/${id}.m4a`;
export const VOICE_AUDIO = VOICE.map((v) => voiceAudio(v.id));
