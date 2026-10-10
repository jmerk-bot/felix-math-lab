# Felix's Math Lab

A visual, hands-on learning app with two sides, picked on the home screen:

- **Math:** a Lab for exploring +, −, × and ÷ with pictures (ten-frames, base-ten blocks, place-value charts, arrays, area models, equal sharing and a number line), plus "Mystery Quest" problems with one hidden number at five levels, from early 2nd grade to 5th grade.
- **Words:** phonics spelling. Hear a word, see its picture, and build it from letter tiles in sound boxes (one box per sound, with digraphs like "sh" as single tiles). A spelling word also comes up after every few math quests.

It's a Progressive Web App (PWA). Install it once on a tablet and it opens full-screen from the home screen, works offline, and updates itself whenever a new version is pushed.

**Live app:** https://jmerk-bot.github.io/felix-math-lab/

## Install on an Android tablet

1. Open the live app link in **Chrome** on the tablet.
2. Tap the **⋮** menu → **Add to home screen** → **Install**. (Chrome may also show an "Install app" banner.)
3. Open it from the **Math Lab** icon on the home screen.

## How updates reach the tablet

- Pushing to `main` deploys automatically through GitHub Actions (`.github/workflows/deploy.yml`) in about a minute.
- When the app opens, or comes back to the foreground, it checks for a newer version and reloads itself. The Lab settings and any unsolved quest are saved and come back after the reload.
- The version number is in tiny text at the bottom of the screen. Use it to check which version the tablet is running.
- Offline, the app runs from the last version it downloaded.

## Run it locally

No build step and no dependencies. Serve the folder and open it in a browser:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. The footer shows `dev` locally.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | Page markup. Buttons use `data-action` / `data-value` instead of inline handlers. |
| `css/styles.css` | All styles. Colors are CSS variables at the top. |
| `js/settings.js` | Grown-up settings (hold the gear on Home): math level. |
| `js/main.js` | Entry point: wires buttons, moves between Home, Words and Math (and the word breaks), boots the app. |
| `js/lab.js` | Explore Lab: steppers, and the pictures for each number size (ten-frames to area models), number line. |
| `js/quest.js` | Mystery Quest: rendering, level meter, number pad, answer checking. |
| `js/levels.js` | The five levels: quest generators, Lab limits and answer lengths. |
| `js/state.js` | Shared state, `compute()`, `SPELL_EVERY`, and save/restore via `localStorage`. |
| `js/spell.js` | Words: sound boxes, tile keyboard, checking and hints. |
| `js/words.js` | Spelling word lists, letter tiles and spoken feedback phrases. |
| `audio/` | Recorded words and phrases (`.m4a`), made by `scripts/make-audio.mjs`. |
| `js/audio.js` | Web Audio tones (an ascending pentatonic scale, success chord, tile taps) and speech clip playback. |
| `js/pwa.js` | Service worker registration and the update check. |
| `js/version.js` | Version placeholder, stamped at deploy time. |
| `sw.js` | Service worker: network-first with offline fallback. |
| `manifest.webmanifest` | App name, colors, icons. |
| `fonts/` | Atkinson Hyperlegible Next (latin subset, variable weight), served from the app so it works offline. License in `fonts/OFL.txt`. |
| `icons/` | `icon.svg` / `icon-maskable.svg` sources plus rendered PNGs. |
| `scripts/make-icons.sh` | Re-renders the PNG icons from the SVGs (needs Google Chrome). |
| `scripts/make-audio.mjs` | Records spelling words and phrases with the macOS voice (`node scripts/make-audio.mjs`). |

## Grown-up settings

Hold the gear (top right of the Home screen) for 3 seconds to open the settings. A quick tap does nothing, so the level can't be changed by accident. The math level (early 2nd grade to 5th grade) is set there.

## Making changes

- **Adding spelling words:** add them to `js/words.js`, then run `node scripts/make-audio.mjs` on a Mac to record them. Listen to the new clips before deploying.
- **How often spelling comes up in Math:** `SPELL_EVERY` in `js/state.js`.
- **Adding a new file the app loads** (a new JS module, image, sound, font): also add it to `APP_SHELL` in `sw.js` so it's available offline.
- **Changing the icon:** edit `icons/icon.svg` and `icons/icon-maskable.svg`, then run `scripts/make-icons.sh`. Android caches home-screen icons, so the tablet may keep the old icon until the app is reinstalled.
- **Changing the name or colors on the home screen:** edit `manifest.webmanifest`.
- Leave the `__APP_VERSION__` placeholders in `sw.js` and `js/version.js` alone. The deploy workflow fills them in.
