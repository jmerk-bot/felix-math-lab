# Felix's Math Lab

Visual arithmetic PWA for a young learner, installed on an Android tablet and hosted on GitHub Pages at https://jmerk-bot.github.io/felix-math-lab/. See README.md for the layout and install steps. Personal context about the learner is in CLAUDE.local.md (gitignored, since this repo is public).

## Conventions

- No build step, no dependencies, no frameworks. Plain HTML, CSS and ES modules. Keep it that way unless asked.
- Every path must be **relative** (`./sw.js`, `css/styles.css`), because the site is served from `/felix-math-lab/`, not the domain root.
- Buttons declare `data-action` (and optionally `data-value`). Handlers live in the `actions` map in `js/main.js`, and state is saved after every action.
- Rendering is state-driven: change `state`, then call `renderLab()` / `renderQuest()`.
- Show or hide elements with the `hidden` attribute. CSS has `[hidden] { display: none !important; }`.
- Subtraction is stored as `'-'` but always displayed via `OP_LABEL` (`−`).
- Color coding is part of the teaching and should stay consistent: blue = A / first number, amber = B / second number, green = target/answer, rose = taken away, indigo = UI accent.
- `playChime(step)` plays step `step` of an ascending C-major pentatonic scale from C4 (bigger numbers sound higher, without wrapping). Steppers pass the value itself.
- Lab limits per operation are in `limits()` in `js/lab.js`. Quests must stay within those limits so "Test in the Lab" can show them. A − B and A ÷ B go up to 20.

## When adding files

Add any new file the app loads to `APP_SHELL` in `sw.js`, or it won't be cached for offline use. A missing file in `APP_SHELL` makes the service worker install fail, so double-check the paths.

## Testing

- Serve locally: `python3 -m http.server 8765` from the repo root, then open http://127.0.0.1:8765.
- The Claude desktop browser pane can't register service workers. Test the UI there, but test offline and update behavior in headless Google Chrome (e.g. a small script using the DevTools protocol with `--remote-debugging-port`).
- Test at tablet size (768×1024, and landscape) because that's where it runs.

## Deploying

Committing and pushing to `main` deploys (`.github/workflows/deploy.yml`). The workflow copies the site to `_site/`, replaces `__APP_VERSION__` in `sw.js` and `js/version.js` with `YYYY.MM.DD-HHMM-<sha>`, and writes `version.json`. Never hard-code a version. Check the run with `gh run list --limit 1` / `gh run watch`.
