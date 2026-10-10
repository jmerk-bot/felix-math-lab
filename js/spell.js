// Spelling: hear a word, see its picture, and build it from letter tiles in
// sound boxes (one box per sound, so digraphs like "sh" fill a single box).

import { state } from './state.js';
import { TILES, LEVELS, WORDS, PHRASES, tileKind, wordAudio, phraseAudio } from './words.js';
import { playTick, playSuccessChord, playClips, preloadClips } from './audio.js';
import { journeyOn, recordWord } from './journey.js';
import { renderJourney, pieceClip } from './journey-ui.js';

const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Words come from a shuffled queue of the chosen levels, so nothing repeats
// until the whole set has been seen. Words that took a few tries come back soon.
function nextFromQueue() {
  const spell = state.spell;
  spell.queue = spell.queue.filter((w) => spell.levels.includes(w.level));
  if (!spell.queue.length) {
    const fresh = shuffle(WORDS.filter((w) => spell.levels.includes(w.level)));
    // Don't start the new round with the word just spelled
    if (fresh.length > 1 && fresh[0].word === spell.word?.word) fresh.push(fresh.shift());
    spell.queue = fresh;
  }
  return spell.queue.shift();
}

// Start a new word. returnTo is 'quest' when the word interrupts Math.
export function startWord(returnTo = state.spell.returnTo) {
  const spell = state.spell;
  const word = nextFromQueue();
  Object.assign(spell, {
    word,
    boxes: word.sounds.map(() => null),
    locked: word.sounds.map(() => false),
    attempts: 0,
    status: 'playing',
    returnTo
  });
  renderSpell();
  preloadClips([wordAudio(word.word)]);
  setTimeout(sayWord, 250);
}

export function sayWord() {
  if (state.spell.word) playClips(wordAudio(state.spell.word.word));
}

export function toggleLevel(id) {
  const spell = state.spell;
  if (spell.levels.includes(id)) {
    if (spell.levels.length === 1) return; // keep at least one
    spell.levels = spell.levels.filter((l) => l !== id);
  } else {
    spell.levels = LEVELS.map((l) => l.id).filter((l) => l === id || spell.levels.includes(l));
  }
  if (spell.word && !spell.levels.includes(spell.word.level) && spell.status !== 'correct') {
    startWord();
  } else {
    renderSpell();
  }
}

// Tile keyboard: key is a tile ('a', 'sh', ...), 'back' or 'check'
export function pressTile(key) {
  const spell = state.spell;
  if (!spell.word || spell.status === 'correct') return;

  if (key === 'check') {
    checkSpelling();
    return;
  }

  if (key === 'back') {
    for (let i = spell.boxes.length - 1; i >= 0; i--) {
      if (spell.boxes[i] !== null && !spell.locked[i]) {
        spell.boxes[i] = null;
        playTick();
        break;
      }
    }
  } else {
    const i = spell.boxes.indexOf(null);
    if (i === -1) {
      nudge('.sound-box'); // every box is full: check or delete
      return;
    }
    spell.boxes[i] = key;
    playTick();
  }
  renderSpell();
}

function checkSpelling() {
  const spell = state.spell;
  if (spell.boxes.includes(null)) {
    nudge('.sound-box.empty'); // show which boxes still need a sound
    return;
  }

  const { sounds } = spell.word;
  spell.boxes.forEach((tile, i) => {
    if (tile === sounds[i]) spell.locked[i] = true;
    else spell.boxes[i] = null; // clear the wrong ones, keep the right ones
  });

  if (spell.locked.every(Boolean)) {
    spell.status = 'correct';
    if (spell.attempts >= 2) spell.queue.splice(2, 0, spell.word); // practice it again soon
    let award = null;
    if (journeyOn()) {
      award = recordWord();
      renderJourney({ snap: award?.part });
    } else {
      state.quest.solvedSinceSpelling = 0;
    }
    playSuccessChord();
    playClips(phraseAudio(pick(PHRASES.praise).id), wordAudio(spell.word.word), pieceClip(award));
    renderSpell();
    $('spell-pic').classList.add('celebrate');
  } else {
    spell.attempts++;
    spell.status = 'retry';
    playClips(phraseAudio(pick(PHRASES.retry).id), wordAudio(spell.word.word));
    renderSpell();
    nudge('.sound-box:not(.locked)');
  }
}

function nudge(selector) {
  document.querySelectorAll(`#spell-boxes ${selector}`).forEach((el) => {
    el.classList.remove('wiggle');
    void el.offsetWidth; // restart the animation
    el.classList.add('wiggle');
  });
}

export function buildKeyboard() {
  const tile = (t) => `<button class="tile tile-${tileKind(t)}" data-action="spell-key" data-value="${t}">${t}</button>`;
  $('spell-keyboard').innerHTML = [
    ...TILES.vowels.map(tile),
    `<button class="tile tile-back wide" data-action="spell-key" data-value="back" aria-label="Delete">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 5H8.5L3 12l5.5 7H21a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M11.5 9.5l5 5M16.5 9.5l-5 5"/>
      </svg>
    </button>`,
    ...TILES.consonants.map(tile),
    ...TILES.digraphs.map(tile),
    `<button class="tile tile-check wide" data-action="spell-key" data-value="check" aria-label="Check">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5"/>
      </svg>
    </button>`
  ].join('');
}

export function renderSpell() {
  const spell = state.spell;
  const bonus = spell.returnTo === 'quest';

  // Level pills (Words mode) or a "word break" chip (when interrupting Math)
  $('spell-levels').hidden = bonus;
  $('spell-bonus').hidden = !bonus;
  document.querySelectorAll('.level-pill').forEach((pill) => {
    pill.classList.toggle('active', spell.levels.includes(pill.dataset.value));
  });

  const tag = $('spell-tag');
  tag.hidden = spell.status === 'playing';
  tag.className = `quest-tag ${spell.status}`;
  tag.textContent = spell.status === 'correct' ? 'Brilliant! ⭐' : 'Almost! Try again';

  if (!spell.word) return;
  const solved = spell.status === 'correct';

  const pic = $('spell-pic');
  pic.textContent = spell.word.pic;
  pic.classList.remove('celebrate');

  // Sound boxes. After two tries, empty boxes show a faint hint of their tile.
  const showHints = spell.attempts >= 2;
  $('spell-boxes').innerHTML = spell.word.sounds.map((sound, i) => {
    const tile = spell.boxes[i];
    if (tile === null) {
      return `<span class="sound-box empty">${showHints ? `<span class="ghost">${sound}</span>` : ''}</span>`;
    }
    const classes = ['sound-box', `tile-${tileKind(tile)}`, spell.locked[i] ? 'locked' : '', solved ? 'correct' : ''];
    return `<span class="${classes.join(' ')}">${tile}</span>`;
  }).join('');

  $('spell-keyboard').hidden = solved;
  $('spell-solved').hidden = !solved;
  $('spell-next').textContent = bonus ? 'Back to Math 🚀' : 'Next Word ➔';
}
