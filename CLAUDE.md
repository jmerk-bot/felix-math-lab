# Felix's Math Lab

Visual arithmetic and phonics-spelling PWA for a young learner, installed on an Android tablet and hosted on GitHub Pages at https://jmerk-bot.github.io/felix-math-lab/. See README.md for the layout and install steps. Personal context about the learner is in CLAUDE.local.md (gitignored, since this repo is public).

## Shared origin: keep storage names unique

A sibling copy, `addy-math-lab` (in `~/code/addy-math-lab`), is also served from `https://jmerk-bot.github.io`, so the two apps share localStorage and Cache Storage. This app uses the `STORAGE_KEY` `math-lab:v1` (`js/state.js`) and caches named `math-lab-<version>` (`sw.js`). The other app's names start with `addy-math-lab`. The service worker deletes only old caches whose names start with `math-lab-`. Never broaden that cleanup, or this app could wipe the other app's offline copy on a shared device.

## How the app is organized

- It always opens on **Home**, which offers **Words** (spelling, `js/spell.js`), **Math** (Explore `js/lab.js` / Mystery Quest `js/quest.js`; Math opens on Mystery Quest by default) and the **Hangar**. `state.mode` is `'home' | 'lab' | 'quest' | 'spell' | 'hangar'`. The header title follows the mode, and a home button shows everywhere except Home.
- Mystery Quest is normally the **rocket journey** (below). With the journey switched off in grown-up settings ("classic quests"), quests come from the level and the operation buttons, and a word break comes after every `SPELL_EVERY` (3) solved quests.

## Rocket journey

- Files: `js/missions.js` (5 destinations = levels, 23 missions = concepts, each with `gen(tier)`), `js/rockets.js` (SVG rocket kit, 5 families, paint pots), `js/journey.js` (logic, no DOM), `js/journey-ui.js` (build rail, banner, hangar, overlays), `js/voice.js` (spoken lines). State lives in `state.journey` and is saved with everything else; `loadJourney()` validates it field by field because the hangar is precious.
- **Flight:** a piece needs 4 things with at least one math quest and one word. In Math that's 3 quests + a word break; in Words, 3 words + a **math break** (`quest.returnTo = 'spell'`, tabs hidden). Mixed modes count too. A 4th of one kind isn't added until the other kind is in.
- Pieces per rocket: Moon 4, Mars 5, Jupiter 5, Saturn 6, Deep space 6. A finished rocket gets a paint job (Felix picks body and trim), a countdown launch, and a spot in the hangar (tap to replay).
- **Difficulty:** tier 0 for a rocket's first piece, tier 2 on the last piece when first tries are 80%+, otherwise tier 1; one tier easier right after a quest that took 2+ tries. From mission 4, the 3rd quest of each flight reviews one of the previous 6 missions. Only the current mission's quests count toward first tries.
- **Moving on:** a rocket with 70%+ first tries moves to the next mission; otherwise a practice rocket on the same mission (at most 2, then move on). Finishing a destination's last mission sets `ready`: the banner "Ready to move on! Ask Dad for the keys to the rocket." shows, and Felix keeps flying laps of that destination. 🔑 Keys asks a typical quest from the next destination's first mission (one step up, not a leap); the right answer unlocks it and raises the level. A half-built rocket is refitted to the new destination's family.
- Every mission quest must fit its own level's Lab limits **and every later level's** (review rounds happen later). After editing missions, check with a loop over all missions × tiers × levels.
- New spoken lines go in `js/voice.js`, then run `node scripts/make-audio.mjs`. Rockets are drawn from parts in `rockets.js`; unbuilt pieces show as dashed blueprint outlines (`.bp`).

## Levels (Mystery Quest and the Lab)

- Five levels in `js/levels.js`: 1 early 2nd grade, 2 2nd, 3 3rd, 4 4th, 5 5th, whole numbers only. The level is a **grown-up setting**, not something Felix changes: hold the gear on Home for 3 seconds to open settings (`js/settings.js`). A tap does nothing. (It used to be a meter beside the quest, but he kept setting it too high and stopped enjoying the game.) It's saved as `state.quest.level` (default 1). In the journey the level is the destination: changing it moves the journey to that destination's first mission, and Dad's keys raise it.
- Each level defines its quest generator (`numbers()`), its Lab limits (`lab: { op: [A max, B max] }`) and `maxDigits` for the number pad. Every quest a level makes must fit inside that level's Lab limits, so "Test in the Lab" can always show it. When changing a generator, re-check with a loop over thousands of `makeProblem()` calls.
- The Lab picks its picture by number size: + and − ten-frames (to 20), base-ten blocks (to 999), place-value chart (above); × arrays (to 10 × 10), area model (above); ÷ sharing buckets (to 100 ÷ 10), sharing in big chunks / partial quotients (above). The number line's range grows to fit (20, 50, 100, 200, 500, …).
- Lab controls: a simple − / + stepper when the range is 20 or less, otherwise one ▲▼ column per place value. A digit step that would go past the limit is ignored, not clamped.
- Numbers of 1,000 and up show with commas (`fmt()`), and equations shrink their type as the numbers get longer (`data-size`).
- Fractions and decimals (grades 4–5) are planned as the next round: new question types, an answer pad and Lab pictures.

## Spelling words

- Words, tiles and spoken feedback live in `js/words.js`. Only words spelled the way they sound at the current stage: short vowels, digraphs (sh, ch, th, wh, ck) and blends. **No silent e**, vowel teams, r-controlled vowels or irregular words (e.g. "wolf") until the user says that stage is reached.
- Each word lists its `sounds`, one per sound box, and every sound must be a keyboard tile (digraphs are one tile). The list validates itself on load and logs a console error on a mismatch.
- Pictures are emoji. Use emoji from 2020 or earlier so Android shows them, and avoid two words with the same emoji.
- After adding words, run `node scripts/make-audio.mjs` (macOS only: uses `say -v Samantha` and `afconvert`) to record `audio/words/<word>.m4a`. Audio isn't in `APP_SHELL`: `js/pwa.js` sends `ALL_AUDIO` to the service worker, which caches it for offline use.
- Clips play through Web Audio (`playClips()` in `js/audio.js`), not `<audio>` elements, so there are no partial responses to cache.
- Checking a word keeps the right boxes (locked green) and clears the wrong ones. After two misses, empty boxes show a faint hint, so a word can always be finished. Words that took that long come back a couple of words later.
- Tile colors are consistent everywhere: vowels yellow, consonants white, digraphs teal.

## Conventions

- No build step, no dependencies, no frameworks. Plain HTML, CSS and ES modules. Keep it that way unless asked.
- Every path must be **relative** (`./sw.js`, `css/styles.css`), because the site is served from `/felix-math-lab/`, not the domain root.
- Buttons declare `data-action` (and optionally `data-value`). Handlers live in the `actions` map in `js/main.js`, and state is saved after every action.
- Rendering is state-driven: change `state`, then call `renderLab()` / `renderQuest()`.
- Show or hide elements with the `hidden` attribute. CSS has `[hidden] { display: none !important; }`.
- Subtraction is stored as `'-'` but always displayed via `OP_LABEL` (`−`).
- Color coding is part of the teaching and should stay consistent: blue = A / first number, amber = B / second number, green = target/answer, rose = taken away, indigo = UI accent.
- `playChime(step)` plays step `step` of an ascending C-major pentatonic scale from C4 (bigger numbers sound higher, without wrapping). Steppers pass the value itself.
- Never show a quest's hidden number anywhere while the quest is open: not in the quest view, the Problem Guide, or the Lab banner (`renderQuestBanner()`). When the answer is the mystery, ask for it ("How many altogether?").
- Tap targets are at least 44px, and main controls 48–60px. Don't shrink buttons below that.
- Font is Atkinson Hyperlegible Next, self-hosted in `fonts/` (variable weight 200–800, so weight 900 renders as 800). Use it for numbers too, not monospace.
- Quest answers come from the on-screen number pad (`pressKey()` in `js/quest.js`), which fills the mystery box directly, up to the level's `maxDigits` (never the length of the actual answer). Don't add `<input>` fields: the Android keyboard pushes the layout around. Digits chime their own pentatonic note.
- The app runs fullscreen (`"display": "fullscreen"` in the manifest). `js/pwa.js` also requests fullscreen on tap for copies installed before that change.
- Lab limits come from the current level (`limits()` in `js/lab.js` reads `LEVELS[level].lab`). See Levels above.

## When adding files

Add any new file the app loads to `APP_SHELL` in `sw.js`, or it won't be cached for offline use (spelling audio is the exception, see above). A missing file in `APP_SHELL` makes the service worker install fail, so double-check the paths.

## Testing

- Serve locally: `python3 -m http.server 8765` from the repo root, then open http://127.0.0.1:8765.
- The Claude desktop browser pane can't register service workers. Test the UI there, but test offline and update behavior in headless Google Chrome (e.g. a small script using the DevTools protocol with `--remote-debugging-port`).
- Test at tablet size (768×1024, and landscape) because that's where it runs.

## Deploying

Committing and pushing to `main` deploys (`.github/workflows/deploy.yml`). The workflow copies the site to `_site/`, replaces `__APP_VERSION__` in `sw.js` and `js/version.js` with `YYYY.MM.DD-HHMM-<sha>`, and writes `version.json`. Never hard-code a version. Check the run with `gh run list --limit 1` / `gh run watch`.
