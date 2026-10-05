// Spelling words, letter tiles and spoken feedback.
//
// Every word is spelled the way it sounds: short vowels only, with no silent e,
// vowel teams, r-controlled vowels or other irregular spellings.
// `sounds` lists the tiles in order, one per sound, which is also how many
// sound boxes the word gets. Digraphs (sh, ch, th, wh, ck) are a single tile.
//
// To add a word: add it below with an emoji that Android shows (stick to
// emoji from 2020 or earlier), then run `node scripts/make-audio.mjs` to
// record it into audio/words/<word>.m4a.

export const TILES = {
  vowels: ['a', 'e', 'i', 'o', 'u'],
  consonants: ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'qu', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'],
  digraphs: ['sh', 'ch', 'th', 'wh', 'ck']
};

export function tileKind(tile) {
  if (TILES.vowels.includes(tile)) return 'vowel';
  if (TILES.digraphs.includes(tile)) return 'digraph';
  return 'consonant';
}

// Word groups, in teaching order. The label doubles as an example word.
export const LEVELS = [
  { id: 'cat', label: 'cat', name: 'Short vowels' },
  { id: 'ship', label: 'ship', name: 'Digraphs' },
  { id: 'frog', label: 'frog', name: 'Blends' }
];

// [word, emoji, sounds] — sounds default to one tile per letter
const LISTS = {
  cat: [
    ['cat', '🐱'], ['hat', '🎩'], ['bat', '🦇'], ['rat', '🐀'], ['map', '🗺️'],
    ['van', '🚐'], ['pan', '🍳'], ['cap', '🧢'], ['bag', '👜'],
    ['dog', '🐶'], ['fox', '🦊'], ['box', '📦'], ['log', '🪵'], ['pot', '🍲'], ['ox', '🐂'],
    ['sun', '☀️'], ['bug', '🐛'], ['bus', '🚌'], ['cup', '🥤'], ['nut', '🥜'], ['hut', '🛖'],
    ['pig', '🐷'], ['pin', '📌'], ['six', '6️⃣'],
    ['bed', '🛏️'], ['web', '🕸️'], ['hen', '🐔'], ['pen', '🖊️'], ['ten', '🔟'], ['net', '🥅'], ['leg', '🦵']
  ],
  ship: [
    ['ship', '🚢', 'sh i p'], ['fish', '🐟', 'f i sh'], ['cash', '💵', 'c a sh'],
    ['chick', '🐥', 'ch i ck'], ['check', '✅', 'ch e ck'], ['bath', '🛁', 'b a th'],
    ['duck', '🦆', 'd u ck'], ['sock', '🧦', 's o ck'], ['rock', '🪨', 'r o ck'],
    ['lock', '🔒', 'l o ck'], ['sick', '🤒', 's i ck'], ['pack', '🎒', 'p a ck']
  ],
  frog: [
    ['frog', '🐸'], ['crab', '🦀'], ['drum', '🥁'], ['flag', '🚩'], ['sled', '🛷'],
    ['tent', '⛺'], ['plant', '🌱'], ['hand', '✋'], ['milk', '🥛'], ['stop', '🛑'],
    ['swim', '🏊'], ['gift', '🎁'], ['mask', '😷'], ['clap', '👏'],
    ['truck', '🚚', 't r u ck'], ['clock', '🕐', 'c l o ck'],
    ['brush', '🪥', 'b r u sh'], ['trash', '🗑️', 't r a sh']
  ]
};

export const WORDS = Object.entries(LISTS).flatMap(([level, list]) =>
  list.map(([word, pic, sounds]) => ({
    word,
    pic,
    level,
    sounds: sounds ? sounds.split(' ') : [...word]
  }))
);

// Spoken feedback, recorded by scripts/make-audio.mjs into audio/phrases/<id>.m4a
export const PHRASES = {
  praise: [
    { id: 'great', text: 'Great spelling!' },
    { id: 'got-it', text: 'You got it!' },
    { id: 'awesome', text: 'Awesome!' }
  ],
  retry: [
    { id: 'almost', text: 'Almost! Try again.' },
    { id: 'so-close', text: 'So close! Try again.' }
  ]
};

export const wordAudio = (word) => `audio/words/${word}.m4a`;
export const phraseAudio = (id) => `audio/phrases/${id}.m4a`;

export const ALL_AUDIO = [
  ...WORDS.map((w) => wordAudio(w.word)),
  ...Object.values(PHRASES).flat().map((p) => phraseAudio(p.id))
];

// Catch typos when editing the lists: sounds must spell the word, using real tiles
const ALL_TILES = Object.values(TILES).flat();
for (const w of WORDS) {
  if (w.sounds.join('') !== w.word || !w.sounds.every((s) => ALL_TILES.includes(s))) {
    console.error(`words.js: "${w.word}" has sounds [${w.sounds}] that don't match its spelling or the tiles`);
  }
}
