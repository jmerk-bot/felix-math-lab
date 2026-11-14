// Optional 3-minute CrunchLabs video break after earning a rocket piece (or
// finishing a classic quest loop). Plays inside a kid-safe overlay that blocks
// external YouTube links, remembers the exact timestamp in the current episode,
// and closes back to the Lab automatically when the 3:00 timer finishes.

import { state, saveState } from './state.js';
import { playChime, playClips, stopClips } from './audio.js';
import { voiceAudio } from './voice.js';

const $ = (id) => document.getElementById(id);

export const CRUNCH_SECONDS = 180; // 3 minutes per earned break

// Full-length 16:9 episodes from https://www.youtube.com/@CrunchLabs
export const CRUNCH_VIDEOS = [
  { id: 'mvtPrx57G64', title: 'What Stops a 400 MPH Golf Ball?' },
  { id: '4fvkgAJiBQI', title: 'I Engineered the First-Ever Human Car Wash' },
  { id: 'vr_ADr-XrR4', title: 'Can Anything Survive My Crunchinator?' },
  { id: 'iSbLf1iOcZQ', title: 'Water Experiments That Look Like Magic' },
  { id: '9QldsLTaQHo', title: 'Animals vs Engineers' },
  { id: 'QMFrtyT5a2k', title: 'Making Impossible Items Float' },
  { id: 'rSgvY33JRt4', title: 'Engineers vs GIANT Egg Drop' },
  { id: 'e4icPIRX9nc', title: 'Revealing 5 Secret Magic Tricks With Science 2.0' },
  { id: '1ekU0_GPi-g', title: 'Engineers vs Thanksgiving Dinner' },
  { id: 'f8-uvmL58nE', title: 'This Is What 400 MPH Looks Like' },
  { id: 'UssG5h_ZoCk', title: 'The Secret To Being More Creative w/ Mark Rober' },
  { id: 'c0EJY15IYc8', title: 'Build Your Own Dream Treehouse' },
  { id: '3sbYbckT1VY', title: 'Engineers vs Pumpkin Carving 2.0' },
  { id: 'J0zxk-bAnL4', title: 'Destroying Camp CrunchLabs!' },
  { id: 'oUIk1KLFXOY', title: 'Filling My Warehouse w/ 10,000+ Balloons!' },
  { id: 'xqedO-SoLeA', title: 'Testing Zero Gravity!' },
  { id: 'UvCAhz9kmP8', title: 'Air Cannon Destruction w/ The Muppets!' },
  { id: 'efovc4SiXic', title: 'Ultimate Nerf Gun Battle w/ Zach King!' },
  { id: 'Hwuw3sJAJdY', title: 'Extreme Laser Maze!' },
  { id: 'EomJuxTeRm4', title: 'Epic Fire Experiments!' },
  { id: 'nHPEHFsjJe4', title: 'Velcro Suit Mini Games!' },
  { id: 'nBfK04-QPpg', title: 'Engineers vs Almost Impossible Tasks' },
  { id: '02k8vRi5f_I', title: 'Revealing 5 Secret Magic Tricks With Science' },
  { id: '16LuvR2CARA', title: "Inside Disney's Secret Engineering Lab" },
  { id: 'YLXxXxddR2E', title: "World's Largest Nerf Crossbow!" },
  { id: 'cBlDLW5pv-s', title: 'Engineers vs Food Robots' },
  { id: 'lv6R9TexjCQ', title: 'Engineers vs Extreme Hide & Seek' },
  { id: 'gynd5ZIzBjU', title: 'Engineer vs Pro Chef - Gingerbread House Contest' },
  { id: 'ltJswDvMgY8', title: 'Mark Rober Ultimate Mini Game Battle' },
  { id: 'ekUbBot8tDA', title: '5 Easy At-Home Science Experiments w/ Mark Rober' },
  { id: 'ZViWWpA2AFk', title: 'Engineers vs Pumpkin Carving' },
  { id: 'D3s14gpmea4', title: 'Mark Rober Reacts to Kids Genius Inventions' },
  { id: '86H4NwOnASE', title: 'Fake Mark Rober Prank (FIRST Championship)' },
  { id: '8_nChhKhx0U', title: 'Camp CrunchLabs Finale!' },
  { id: 'ZE_2UXsGYOM', title: 'Giant Ping Pong Explosions!' },
  { id: 'J-nHYkgd0fM', title: 'Liquid Nitrogen Explosions!' },
  { id: 'wxSkpngdQ5U', title: 'Ultimate Slime Obstacle Course!' },
  { id: 'lsY99bDMXKA', title: 'Vacuum Cannon Explosions!' },
  { id: 'xKlUXwVEIo0', title: '4,000 Mouse Trap Chain Reaction' },
  { id: 'QLHMY7F2Zd4', title: 'Surfing on 3,500,000 Airsoft BBs' },
  { id: 'g_N5y66m6tQ', title: '60 Second Mini Game Challenge' },
  { id: 't4GJ0KzoGRI', title: 'Turning Kids Drawings Into Real Toys' },
  { id: '1j1kAuqePJo', title: 'How To Build Your Own Desktop Turret Robot!' },
  { id: 'yi29dbPnu28', title: 'Arduino 101 - Crash Course w/ Mark Rober' },
  { id: 'n4biw_1ReQ0', title: "World's Largest Toy Catapult" },
  { id: 'zlqfrcJ-BY4', title: 'Building REAL LIFE Mario Karts At CrunchLabs' },
  { id: '0CPGc0vgYfM', title: '$10,000 Tennis Ball Cannon Challenge' },
  { id: '2iwkqyzwWs4', title: 'Platinum Ticket Winner CrunchLabs Tour!' },
  { id: 'bDQSJRTeoHk', title: 'MrBeast Pranked by Mark Rober at CrunchLabs' },
  { id: 'r5KEP4KOLZQ', title: "I Made My Own Video Game - Let's Build a Rocket!" },
  { id: 'HY5A_Y6l6Sg', title: 'Build a Rocket VS Mark Rober' },
  { id: 'mdiOpFQWxvA', title: 'Greatest Surprise Ever…' },
  { id: '0KCbuMevzIQ', title: 'Mark Rober Extreme Gymnastics Challenge' },
  { id: 'idAhSEDN0Zk', title: "Invisible Laser Trap Pranks YouTube's CEO" },
  { id: '3Jc6DAxyh4M', title: 'Frisbee Challenge - CrunchLabs Cup' },
  { id: '1juBcTQYWOc', title: 'Camp CrunchLabs Mega Build!' },
  { id: 'NrOM3H6O1XA', title: 'Gummy Bear Flame Volcano!' },
  { id: 'E9xR-tslE0U', title: 'Giant Whoosh Cannon!' },
  { id: 'Ysg3KPR4Uco', title: 'Giant Smoke Rings!' },
  { id: '30Jcgooj0oY', title: 'Fire Extinguisher Hovercraft!' },
  { id: 'oM3Rm9Lr7Ho', title: 'Human Glue Trap!' },
  { id: 'HLemKJnetm8', title: 'Laser Explosions!' },
  { id: '38E6mMIYbzw', title: 'Rainbow Fireballs!' },
  { id: '8jtyWrV2NCo', title: '1,071 Explosions in 10 Seconds!' },
  { id: 'bhLaAnRQ_XU', title: 'Billiard Ball Snake!' },
  { id: 'LZxHd0_J2aQ', title: 'Ping Pong Explosions!' },
  { id: 'rpNtNOAtGbU', title: 'Lego Explosions!' },
  { id: 'gKYvnjiK2xs', title: 'Battle Royale - CrunchLabs Cup' },
  { id: 'jsYP1SLRzSI', title: 'How to Levitate Household Objects' },
  { id: 'Pdt4m13EweA', title: 'Go-Kart Race - CrunchLabs Cup' },
  { id: 'NafMsMCfErk', title: "World's Largest Coin Spinner" },
  { id: 'o7SFgrWl524', title: "World's Largest Frisbee Launcher" },
  { id: 'szDbBAcP12M', title: "World's Longest Hot Wheels Track" },
  { id: 'Nw6ry2apRAQ', title: 'This Disc Launcher Gives You Superpowers!' }
];

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

export function grantCrunchBreak() {
  if (state.crunch.enabled) state.crunch.available = true;
}

export function dismissCrunchBreak() {
  state.crunch.available = false;
}

// On the final piece of a rocket, wait until after Paint & Launch so the reward
// appears in the Hangar instead of interrupting liftoff.
export function canOfferCrunch() {
  return state.crunch.enabled
    && state.crunch.available
    && !(state.journey.on && state.journey.pendingComplete)
    && isOnline();
}

function currentVideo() {
  const idx = CRUNCH_VIDEOS.findIndex((v) => v.id === state.crunch.videoId);
  if (idx !== -1) return CRUNCH_VIDEOS[idx];
  state.crunch.videoId = CRUNCH_VIDEOS[0].id;
  state.crunch.position = 0;
  return CRUNCH_VIDEOS[0];
}

function advanceVideo() {
  const idx = CRUNCH_VIDEOS.findIndex((v) => v.id === state.crunch.videoId);
  const next = CRUNCH_VIDEOS[(idx + 1) % CRUNCH_VIDEOS.length];
  state.crunch.videoId = next.id;
  state.crunch.position = 0;
  return next;
}

// ---------- YouTube IFrame API loader ----------

let apiPromise = null;

function ensureYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      apiPromise = null;
      reject(new Error('YouTube API timeout'));
    }, 8000);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      prev?.();
      resolve(window.YT);
    };

    if (!document.querySelector('script[data-crunch-yt]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.crunchYt = '1';
      script.onerror = () => {
        clearTimeout(timeout);
        apiPromise = null;
        script.remove();
        reject(new Error('YouTube API failed'));
      };
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

// Warm the YouTube script softly after boot so opening the player runs right
// inside Felix's tap gesture (allows immediate unmuted playback on Android).
export function initCrunch() {
  if (typeof document === 'undefined') return;
  if (state.crunch.enabled && isOnline()) {
    setTimeout(() => {
      if (state.crunch.enabled && isOnline()) ensureYouTubeApi().catch(() => {});
    }, 1500);
  }
  window.addEventListener('online', () => {
    if (state.crunch.enabled) ensureYouTubeApi().catch(() => {});
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && crunchOpen()) {
      pauseCrunch();
      syncPosition();
      saveState({ touch: false });
    }
  });
}

// ---------- Active break session ----------

let session = null; // { player, timerId, remainingMs, lastTick, playing, lastSavedAt, errors, onDone }

export const crunchOpen = () => {
  const el = $('crunch-overlay');
  return !!el && !el.hidden;
};

function formatTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function syncPosition() {
  if (!session?.player?.getCurrentTime) return;
  try {
    const t = session.player.getCurrentTime();
    const dur = session.player.getDuration?.() || 0;
    if (Number.isFinite(t) && t >= 0) {
      // If right at the very end of the video, queue up the next episode for next time
      if (dur > 30 && dur - t < 5) {
        advanceVideo();
      } else {
        state.crunch.position = Math.floor(t);
      }
    }
  } catch (e) {}
}

function updateChrome() {
  if (!session) return;
  const timerEl = $('crunch-timer');
  const barEl = $('crunch-bar-fill');
  const shieldEl = $('crunch-shield');
  const toggleBtn = $('crunch-toggle-btn');

  if (timerEl) {
    timerEl.textContent = formatTime(session.remainingMs);
    timerEl.classList.toggle('ending', session.remainingMs <= 15_000);
  }
  if (barEl) {
    const pct = Math.max(0, Math.min(100, (session.remainingMs / (CRUNCH_SECONDS * 1000)) * 100));
    barEl.style.width = `${pct}%`;
  }
  if (shieldEl) {
    shieldEl.classList.toggle('playing', session.playing);
  }
  if (toggleBtn) {
    toggleBtn.textContent = session.playing ? '⏸ Pause' : '▶ Play';
  }
}

function showOfflineNotice() {
  const offlineEl = $('crunch-offline');
  if (offlineEl) offlineEl.hidden = false;
}

function mountPlayer(YT, video) {
  if (!session || !crunchOpen()) return;
  const playerVars = {
    autoplay: 1,
    controls: 0,
    disablekb: 1,
    fs: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    playsinline: 1,
    rel: 0,
    start: Math.max(0, Math.floor(state.crunch.position || 0))
  };
  if (location.protocol.startsWith('http')) {
    playerVars.origin = location.origin;
  }

  session.player = new YT.Player('crunch-player', {
    host: 'https://www.youtube-nocookie.com',
    videoId: video.id,
    width: '100%',
    height: '100%',
    playerVars,
    events: {
      onReady: (event) => {
        if (!session) return;
        try { event.target.playVideo(); } catch (e) {}
      },
      onStateChange: (event) => {
        if (!session) return;
        const S = YT.PlayerState;
        if (event.data === S.PLAYING) {
          session.playing = true;
          session.lastTick = performance.now();
          session.errors = 0;
          const offlineEl = $('crunch-offline');
          if (offlineEl) offlineEl.hidden = true;
          updateChrome();
        } else if (event.data === S.PAUSED || event.data === S.CUED) {
          syncPosition();
          session.playing = false;
          updateChrome();
        } else if (event.data === S.BUFFERING) {
          session.playing = false;
        } else if (event.data === S.ENDED) {
          session.playing = false;
          nextCrunchVideo();
        }
      },
      onError: () => {
        if (!session) return;
        session.playing = false;
        session.errors++;
        if (session.errors < 5 && isOnline()) {
          nextCrunchVideo();
        } else {
          showOfflineNotice();
        }
      }
    }
  });
}

export function openCrunch({ onDone = null } = {}) {
  closeCrunch({ silent: true });
  state.crunch.available = false;
  stopClips();

  const video = currentVideo();
  const overlay = $('crunch-overlay');
  overlay.innerHTML = `
    <section class="card crunch-card" role="dialog" aria-modal="true" aria-label="CrunchLabs video break">
      <div class="crunch-top">
        <div class="crunch-title-wrap">
          <span class="crunch-badge">⚙️ CRUNCHLABS</span>
          <span id="crunch-title" class="crunch-title">${escapeHtml(video.title)}</span>
        </div>
        <div id="crunch-timer" class="crunch-timer">3:00</div>
      </div>
      <div class="crunch-bar-track" aria-hidden="true">
        <div id="crunch-bar-fill" class="crunch-bar-fill"></div>
      </div>
      <div class="crunch-stage">
        <div id="crunch-player"></div>
        <button id="crunch-shield" class="crunch-shield" data-action="crunch-toggle" aria-label="Play or pause video">
          <span class="crunch-play-badge" aria-hidden="true">▶</span>
        </button>
        <div id="crunch-offline" class="crunch-offline" hidden>
          <p>CrunchLabs needs Wi-Fi right now.</p>
        </div>
      </div>
      <div class="crunch-controls">
        <button id="crunch-toggle-btn" class="crunch-ctrl-btn" data-action="crunch-toggle">▶ Play</button>
        <button class="crunch-ctrl-btn" data-action="crunch-next">Next Video ⏭</button>
        <button class="next-quest-btn crunch-done-btn" data-action="crunch-close">Back to Lab 🚀</button>
      </div>
    </section>
  `;
  overlay.hidden = false;

  session = {
    player: null,
    timerId: null,
    remainingMs: CRUNCH_SECONDS * 1000,
    lastTick: performance.now(),
    playing: false,
    lastSavedAt: Date.now(),
    errors: 0,
    onDone
  };
  updateChrome();

  session.timerId = setInterval(() => {
    if (!session) return;
    const now = performance.now();
    const dt = Math.min(1000, Math.max(0, now - session.lastTick));
    session.lastTick = now;

    if (session.playing && !document.hidden) {
      session.remainingMs -= dt;
      syncPosition();
      if (Date.now() - session.lastSavedAt >= 5000) {
        session.lastSavedAt = Date.now();
        saveState({ touch: false });
      }
      updateChrome();
      if (session.remainingMs <= 0) {
        closeCrunch({ timerDone: true });
      }
    }
  }, 250);

  if (window.YT?.Player) {
    mountPlayer(window.YT, video);
  } else {
    ensureYouTubeApi()
      .then((YT) => mountPlayer(YT, video))
      .catch(() => showOfflineNotice());
  }
}

export function toggleCrunchPlay() {
  if (!session?.player) return;
  try {
    const stateCode = session.player.getPlayerState?.();
    if (stateCode === 1) {
      session.player.pauseVideo();
    } else {
      session.player.playVideo();
    }
  } catch (e) {}
}

function pauseCrunch() {
  try { session?.player?.pauseVideo?.(); } catch (e) {}
}

export function nextCrunchVideo() {
  const next = advanceVideo();
  const titleEl = $('crunch-title');
  if (titleEl) titleEl.textContent = next.title;
  const offlineEl = $('crunch-offline');
  if (offlineEl) offlineEl.hidden = true;
  if (session?.player?.loadVideoById) {
    try {
      session.player.loadVideoById({ videoId: next.id, startSeconds: 0 });
    } catch (e) {}
  }
}

export function closeCrunch({ timerDone = false, silent = false } = {}) {
  const overlay = $('crunch-overlay');
  const active = session;
  session = null;

  if (active) {
    clearInterval(active.timerId);
    if (active.player) {
      try {
        const t = active.player.getCurrentTime?.();
        const dur = active.player.getDuration?.() || 0;
        if (Number.isFinite(t) && t >= 0) {
          if (dur > 30 && dur - t < 5) advanceVideo();
          else state.crunch.position = Math.floor(t);
        }
      } catch (e) {}
      try { active.player.destroy?.(); } catch (e) {}
    }
  }

  if (overlay) {
    overlay.hidden = true;
    overlay.innerHTML = '';
  }

  if (!silent && active) {
    if (timerDone) playClips(voiceAudio('crunch-done'));
    else playChime(4);
    active.onDone?.();
    saveState();
  }
}
