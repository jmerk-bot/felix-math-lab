// Web Audio: synth tones (chimes, celebration chord, tile taps) and recorded
// speech clips (spelling words and feedback, from audio/).

let audioCtx = null;
let currentRumble = null;

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
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

// Crisp mission-control telemetry ping during 3-2-1 launch countdown
export function playLaunchPing(step = 0) {
  const f = pentatonicFreq(5 + step);
  playTone(f, 0, 0.16);
  playTone(f * 1.5, 0.04, 0.08);
}

// Rocket liftoff: multi-layered sub-bass engine throb, roaring crackle, and
// high-altitude supersonic whoosh that swells and fades into orbit.
export function playRumble(seconds = 3.8) {
  try {
    try { currentRumble?.stop(); } catch (e) {}
    const ac = ctx();
    const t = ac.currentTime;
    const length = Math.floor(ac.sampleRate * seconds);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    // Layer 1: Roaring filtered rocket exhaust noise
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1.8;
    const noiseGain = ac.createGain();
    filter.frequency.setValueAtTime(130, t);
    filter.frequency.exponentialRampToValueAtTime(1350, t + seconds * 0.55);
    filter.frequency.exponentialRampToValueAtTime(420, t + seconds);
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.42, t + 0.35);
    noiseGain.gain.setValueAtTime(0.42, t + seconds * 0.55);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ac.destination);

    // Layer 2: Deep pulsing sub-bass thrust (56Hz -> 40Hz with 18Hz flutter)
    const sub = ac.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(58, t);
    sub.frequency.linearRampToValueAtTime(42, t + seconds * 0.8);
    const subFilter = ac.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = 115;
    const subGain = ac.createGain();
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.28, t + 0.25);
    subGain.gain.setValueAtTime(0.24, t + seconds * 0.55);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 18;
    const lfoDepth = ac.createGain();
    lfoDepth.gain.value = 0.08;
    lfo.connect(lfoDepth);
    lfoDepth.connect(subGain.gain);
    sub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ac.destination);

    // Layer 3: Supersonic atmospheric whoosh on liftoff
    const whoosh = ac.createBufferSource();
    whoosh.buffer = buffer;
    const band = ac.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.2;
    band.frequency.setValueAtTime(320, t + 0.6);
    band.frequency.exponentialRampToValueAtTime(2200, t + seconds * 0.65);
    const whooshGain = ac.createGain();
    whooshGain.gain.setValueAtTime(0.001, t);
    whooshGain.gain.setValueAtTime(0.001, t + 0.55);
    whooshGain.gain.exponentialRampToValueAtTime(0.2, t + 1.3);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    whoosh.connect(band);
    band.connect(whooshGain);
    whooshGain.connect(ac.destination);

    const handle = {
      stop() {
        [noise, sub, lfo, whoosh].forEach((n) => { try { n.stop(); } catch (e) {} });
      }
    };
    currentRumble = handle;
    noise.onended = () => { if (currentRumble === handle) currentRumble = null; };
    [noise, sub, lfo, whoosh].forEach((n) => {
      n.start(t);
      n.stop(t + seconds);
    });
  } catch (e) {}
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
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
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
  try { currentRumble?.stop(); } catch (e) {}
  current = null;
  currentRumble = null;
}

// Plays clips one after another, stopping anything already playing.
// Missing or undecodable clips are skipped.
export async function playClips(...urls) {
  stopClips();
  const mine = sequence;
  for (const url of urls.filter(Boolean)) {
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
