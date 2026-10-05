// Web Audio: synth tones (chimes, celebration chord, tile taps) and recorded
// speech clips (spelling words and feedback, from audio/).

let audioCtx = null;

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// C major pentatonic (C D E G A), as semitones above C.
const PENTATONIC = [0, 2, 4, 7, 9];
const BASE_FREQ = 261.63; // C4

// Frequency of note `step` on the pentatonic scale, starting at C4 and climbing
// through the octaves without wrapping: 0 = C4, 5 = C5, 10 = C6, 20 = C8.
function pentatonicFreq(step) {
  const octave = Math.floor(step / PENTATONIC.length);
  const semitones = octave * 12 + PENTATONIC[step % PENTATONIC.length];
  return BASE_FREQ * 2 ** (semitones / 12);
}

function playTone(freq, delay = 0, level = 0.2) {
  try {
    const ac = ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t = ac.currentTime + delay;
    // Soften notes above C6 so the top of the scale doesn't get shrill
    const peak = level * Math.min(1, Math.sqrt(1046.5 / freq));

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  } catch (e) {}
}

// Plays note `step` of the ascending pentatonic scale (bigger number, higher note).
export function playChime(step = 0) {
  playTone(pentatonicFreq(Math.max(0, Math.round(step))));
}

export function playSuccessChord() {
  [261.63, 329.63, 392.0, 523.25].forEach((f, i) => playTone(f, i * 0.08));
}

// A soft, neutral tap for the letter tiles
export function playTick() {
  playTone(659.25, 0, 0.08);
}

// ---------- Speech clips ----------
// Clips are fetched and decoded with Web Audio rather than played through an
// <audio> element, which avoids range requests the service worker can't cache.

const buffers = new Map();
let current = null; // the clip playing now, so a new one can cut it off
let sequence = 0;

async function loadClip(url) {
  if (!buffers.has(url)) {
    buffers.set(url, fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => ctx().decodeAudioData(data))
      .catch((e) => { buffers.delete(url); throw e; }));
  }
  return buffers.get(url);
}

function playBuffer(buffer) {
  return new Promise((resolve) => {
    const source = ctx().createBufferSource();
    source.buffer = buffer;
    source.connect(ctx().destination);
    source.onended = () => resolve();
    current = source;
    source.start();
  });
}

export function stopClips() {
  sequence++;
  try { current?.stop(); } catch (e) {}
  current = null;
}

// Plays clips one after another, stopping anything already playing.
// Missing or undecodable clips are skipped.
export async function playClips(...urls) {
  stopClips();
  const mine = sequence;
  for (const url of urls) {
    try {
      const buffer = await loadClip(url);
      if (mine !== sequence) return;
      await playBuffer(buffer);
      if (mine !== sequence) return;
    } catch (e) {}
  }
}

// Fetch and decode clips ahead of time so the first play has no delay
export function preloadClips(urls) {
  urls.forEach((url) => loadClip(url).catch(() => {}));
}
