#!/usr/bin/env node
// Records the spelling words and spoken feedback (js/words.js) and the rocket
// journey's lines (js/voice.js) with the macOS `say` voice, as small AAC files
// in audio/words, audio/phrases and audio/voice.
//
//   node scripts/make-audio.mjs            record anything missing
//   node scripts/make-audio.mjs --force    re-record everything
//   node scripts/make-audio.mjs fox duck   re-record just these words
//
// After recording, listen to new words. If one sounds off, try a different
// spelling of the text to speak in SAY_AS below.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORDS, PHRASES, wordAudio, phraseAudio } from '../js/words.js';
import { VOICE, voiceAudio } from '../js/voice.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEAKER = 'Samantha';
const WORD_RATE = 130; // words per minute; slow and clear for single words
const PHRASE_RATE = 175;

// Override what the voice says for a word, if its default reading is unclear
const SAY_AS = {};

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

const tmp = mkdtempSync(join(tmpdir(), 'make-audio-'));
let made = 0;

function record(text, rate, outPath) {
  const out = join(ROOT, outPath);
  mkdirSync(dirname(out), { recursive: true });
  const aiff = join(tmp, 'clip.aiff');
  execFileSync('say', ['-v', SPEAKER, '-r', String(rate), '-o', aiff, text]);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', aiff, out]);
  made++;
  console.log(`recorded ${outPath}  "${text}"`);
}

try {
  for (const { word } of WORDS) {
    const path = wordAudio(word);
    const wanted = only.length ? only.includes(word) : force || !existsSync(join(ROOT, path));
    if (wanted) record(SAY_AS[word] ?? `${word}.`, WORD_RATE, path);
  }
  if (!only.length) {
    for (const phrase of Object.values(PHRASES).flat()) {
      const path = phraseAudio(phrase.id);
      if (force || !existsSync(join(ROOT, path))) record(phrase.text, PHRASE_RATE, path);
    }
    for (const line of VOICE) {
      const path = voiceAudio(line.id);
      if (force || !existsSync(join(ROOT, path))) record(line.text, PHRASE_RATE, path);
    }
  }
  console.log(made ? `\n${made} clip(s) recorded.` : 'Nothing to record. Use --force to re-record.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
