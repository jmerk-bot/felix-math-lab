// Rocket kit: five rocket families (one per destination), drawn as SVG from
// parts. Pieces Felix hasn't built yet show as dashed blueprint outlines.
//
// Each part is a list of shapes: [z, role, tag, attributes]. z sets the
// drawing order (back to front). Roles pick the color: 'main' and 'trim' are
// the paint job; 'metal', 'glass' and 'panel' are fixed. 'ring' is a trim
// colored outline with no fill.

export const PART_LABELS = {
  body: 'body', nose: 'nose cone', fins: 'fins', engine: 'engine', boosters: 'boosters',
  stage1: 'first stage', stage2: 'second stage', stage3: 'third stage', tower: 'tower',
  engines: 'engines', panels: 'solar panels', ring: 'space ring'
};

// Paint pots for the paint job
export const PAINTS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7', '#ec4899', '#e2e8f0', '#475569'];

const finPair = (l, r) => [[2, 'trim', 'path', { d: l }], [2, 'trim', 'path', { d: r }]];

export const FAMILIES = {
  moon: {
    build: ['body', 'fins', 'engine', 'nose'],
    names: ['Moon Hopper', 'Crater Cruiser', 'Lunar Lark', 'Silver Comet', 'Night Owl', 'Star Pup', 'Moonbeam'],
    palettes: [['#ef4444', '#e2e8f0'], ['#3b82f6', '#facc15'], ['#22c55e', '#f97316'], ['#a855f7', '#e2e8f0'], ['#f97316', '#3b82f6'], ['#14b8a6', '#ec4899'], ['#e2e8f0', '#ef4444']],
    flames: [[50, 168, 12]],
    parts: {
      body: [[4, 'main', 'rect', { x: 34, y: 62, width: 32, height: 92, rx: 8 }], [5, 'glass', 'circle', { cx: 50, cy: 92, r: 7 }]],
      nose: [[6, 'trim', 'path', { d: 'M34 66 C34 46 41 30 50 16 C59 30 66 46 66 66 Z' }]],
      fins: finPair('M34 114 L17 146 L17 160 L34 150 Z', 'M66 114 L83 146 L83 160 L66 150 Z'),
      engine: [[3, 'metal', 'path', { d: 'M40 152 H60 L64 168 H36 Z' }]]
    }
  },
  mars: {
    build: ['body', 'fins', 'engine', 'boosters', 'nose'],
    names: ['Red Rover', 'Dust Devil', 'Mars Hawk', 'Canyon Jet', 'Olympus Climber', 'Rusty Racer'],
    palettes: [['#f97316', '#e2e8f0'], ['#ef4444', '#facc15'], ['#e2e8f0', '#ef4444'], ['#3b82f6', '#f97316'], ['#a855f7', '#22c55e'], ['#475569', '#f97316']],
    flames: [[50, 172, 12], [22, 167, 6], [78, 167, 6]],
    parts: {
      boosters: [
        [1, 'trim', 'rect', { x: 16, y: 98, width: 12, height: 62, rx: 6 }],
        [1, 'trim', 'path', { d: 'M16 104 C16 93 22 86 22 86 C22 86 28 93 28 104 Z' }],
        [1, 'metal', 'path', { d: 'M17 160 H27 L29 167 H15 Z' }],
        [1, 'trim', 'rect', { x: 72, y: 98, width: 12, height: 62, rx: 6 }],
        [1, 'trim', 'path', { d: 'M72 104 C72 93 78 86 78 86 C78 86 84 93 84 104 Z' }],
        [1, 'metal', 'path', { d: 'M73 160 H83 L85 167 H71 Z' }]
      ],
      body: [[4, 'main', 'rect', { x: 36, y: 60, width: 28, height: 98, rx: 8 }], [5, 'glass', 'circle', { cx: 50, cy: 88, r: 6 }], [5, 'glass', 'circle', { cx: 50, cy: 106, r: 4 }]],
      nose: [[6, 'trim', 'path', { d: 'M36 64 C36 44 42 30 50 16 C58 30 64 44 64 64 Z' }]],
      fins: finPair('M36 128 L29 150 L29 160 L36 154 Z', 'M64 128 L71 150 L71 160 L64 154 Z'),
      engine: [[3, 'metal', 'path', { d: 'M41 156 H59 L63 172 H37 Z' }]]
    }
  },
  jupiter: {
    build: ['stage1', 'fins', 'engine', 'stage2', 'nose'],
    names: ['Storm Chaser', 'Big Red Spot', 'Thunder Twin', 'Io Explorer', 'Gas Giant', 'Europa Ranger'],
    palettes: [['#f97316', '#e2e8f0'], ['#e2e8f0', '#ef4444'], ['#facc15', '#3b82f6'], ['#14b8a6', '#facc15'], ['#ef4444', '#475569'], ['#3b82f6', '#e2e8f0']],
    flames: [[50, 175, 15]],
    parts: {
      stage1: [[4, 'main', 'rect', { x: 30, y: 106, width: 40, height: 54, rx: 6 }], [5, 'trim', 'rect', { x: 30, y: 126, width: 40, height: 6 }]],
      stage2: [[4, 'main', 'rect', { x: 36, y: 58, width: 28, height: 50, rx: 6 }], [5, 'metal', 'rect', { x: 33, y: 102, width: 34, height: 8, rx: 2 }], [5, 'glass', 'circle', { cx: 50, cy: 80, r: 6 }]],
      nose: [[6, 'trim', 'path', { d: 'M36 62 C36 44 42 31 50 18 C58 31 64 44 64 62 Z' }]],
      fins: finPair('M30 132 L14 158 L14 170 L30 160 Z', 'M70 132 L86 158 L86 170 L70 160 Z'),
      engine: [[3, 'metal', 'path', { d: 'M38 158 H62 L67 175 H33 Z' }]]
    }
  },
  saturn: {
    build: ['stage1', 'engines', 'fins', 'stage2', 'stage3', 'tower'],
    names: ['Saturn Lifter', 'Ring Runner', 'Titan', 'Cassini', 'Moon Hauler', 'Sky Tower'],
    palettes: [['#e2e8f0', '#3b82f6'], ['#e2e8f0', '#ef4444'], ['#facc15', '#ef4444'], ['#3b82f6', '#e2e8f0'], ['#e2e8f0', '#a855f7'], ['#22c55e', '#e2e8f0']],
    flames: [[40, 177, 7], [50, 177, 7], [60, 177, 7]],
    parts: {
      stage1: [[4, 'main', 'rect', { x: 32, y: 120, width: 36, height: 46, rx: 2 }], [5, 'trim', 'rect', { x: 32, y: 132, width: 36, height: 4 }], [5, 'trim', 'rect', { x: 32, y: 152, width: 36, height: 4 }]],
      stage2: [[4, 'main', 'rect', { x: 35, y: 82, width: 30, height: 40, rx: 2 }], [5, 'trim', 'rect', { x: 35, y: 98, width: 30, height: 4 }]],
      stage3: [[4, 'main', 'rect', { x: 38, y: 54, width: 24, height: 30, rx: 2 }], [5, 'glass', 'circle', { cx: 50, cy: 68, r: 4 }]],
      tower: [[6, 'trim', 'path', { d: 'M38 56 L50 38 L62 56 Z' }], [6, 'metal', 'rect', { x: 48.5, y: 18, width: 3, height: 22 }], [6, 'trim', 'rect', { x: 46, y: 15, width: 8, height: 5, rx: 1 }]],
      fins: finPair('M32 146 L20 168 L32 165 Z', 'M68 146 L80 168 L68 165 Z'),
      engines: [[3, 'metal', 'path', { d: 'M35 165 H45 L47 177 H33 Z' }], [3, 'metal', 'path', { d: 'M45 165 H55 L57 177 H43 Z' }], [3, 'metal', 'path', { d: 'M55 165 H65 L67 177 H53 Z' }]]
    }
  },
  deep: {
    build: ['body', 'engine', 'fins', 'panels', 'ring', 'nose'],
    names: ['Star Voyager', 'Nebula Ninja', 'Comet Tail', 'Galaxy Glider', 'Warp Wolf', 'Pulsar'],
    palettes: [['#a855f7', '#22c55e'], ['#14b8a6', '#ec4899'], ['#e2e8f0', '#14b8a6'], ['#3b82f6', '#facc15'], ['#475569', '#f97316'], ['#ec4899', '#e2e8f0']],
    flames: [[50, 173, 13]],
    parts: {
      panels: [
        [1, 'panel', 'rect', { x: 4, y: 96, width: 28, height: 18, rx: 2 }],
        [1, 'metal', 'rect', { x: 30, y: 103, width: 9, height: 4 }],
        [1, 'panel', 'rect', { x: 68, y: 96, width: 28, height: 18, rx: 2 }],
        [1, 'metal', 'rect', { x: 61, y: 103, width: 9, height: 4 }]
      ],
      ring: [[2, 'ring', 'path', { d: 'M20 126 A30 8 0 0 1 80 126' }], [7, 'ring', 'path', { d: 'M20 126 A30 8 0 0 0 80 126' }]],
      body: [[4, 'main', 'rect', { x: 38, y: 56, width: 24, height: 102, rx: 12 }], [5, 'glass', 'circle', { cx: 50, cy: 82, r: 5 }], [5, 'glass', 'circle', { cx: 50, cy: 98, r: 5 }]],
      nose: [[6, 'trim', 'path', { d: 'M38 66 C38 42 44 26 50 12 C56 26 62 42 62 66 Z' }]],
      fins: finPair('M38 128 L22 156 L22 168 L38 158 Z', 'M62 128 L78 156 L78 168 L62 158 Z'),
      engine: [[3, 'metal', 'path', { d: 'M42 158 H58 L63 173 H37 Z' }]]
    }
  }
};

const FIXED = { metal: '#94a3b8', glass: '#bae6fd', panel: '#1e3a8a' };
const attrs = (a) => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');

// SVG for a rocket. earned = how many pieces are built (in build order);
// flame adds engine flames (for the launch); snap = a part to animate in.
export function rocketSvg(family, { earned = Infinity, colors, flame = false, snap = null, cls = '' } = {}) {
  const fam = FAMILIES[family] || FAMILIES.moon;
  const [main, trim] = colors || fam.palettes[0];
  const fills = { main, trim, ...FIXED };
  const built = new Set(fam.build.slice(0, earned));
  const shapes = [];

  for (const [part, list] of Object.entries(fam.parts)) {
    const on = built.has(part);
    const anim = on && part === snap ? ' snap' : '';
    for (const [z, role, tag, a] of list) {
      let paint;
      if (!on) paint = 'class="bp"';
      else if (role === 'ring') paint = `class="part${anim}" fill="none" stroke="${trim}" stroke-width="4"`;
      else paint = `class="part${anim}" fill="${fills[role]}" stroke="rgba(2,6,23,0.45)" stroke-width="1.2"`;
      shapes.push([z, `<${tag} ${attrs(a)} ${paint}/>`]);
    }
  }

  if (flame) {
    for (const [x, y, w] of fam.flames) {
      shapes.push([0, `<path class="flame" d="M${x - w} ${y} C${x - w * 0.6} ${y + 20} ${x - w * 0.2} ${y + 28} ${x} ${y + 40} C${x + w * 0.2} ${y + 28} ${x + w * 0.6} ${y + 20} ${x + w} ${y} Z" fill="#f97316"/>`]);
      shapes.push([0.5, `<path class="flame inner" d="M${x - w * 0.5} ${y} C${x - w * 0.3} ${y + 12} ${x - w * 0.1} ${y + 18} ${x} ${y + 26} C${x + w * 0.1} ${y + 18} ${x + w * 0.3} ${y + 12} ${x + w * 0.5} ${y} Z" fill="#fde047"/>`]);
    }
  }

  shapes.sort((p, q) => p[0] - q[0]);
  return `<svg class="rocket ${cls}" viewBox="0 0 100 220" aria-hidden="true">${shapes.map((s) => s[1]).join('')}</svg>`;
}
