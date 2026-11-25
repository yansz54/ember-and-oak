// Ember & Oak — boot, game loop, input and the screen state machine.
// One clear job: own the state and route clicks and keys to the kitchen.

import { DAYS, UPGRADES, MEATS, SIDES, SAUCES, WOODS, mulberry32, clamp } from './data.js';
import { Smoker } from './smoker.js';
import { OrderBoard } from './orders.js';
import { Kitchen } from './kitchen.js';
import { SoundFX } from './audio.js';
import { drawGame, LAYOUT, W, H, spawnSmoke, overlayButtonRects, shopRects } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const fallback = document.getElementById('fallback');
if (fallback) fallback.style.display = 'none';
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seedParam = parseInt(params.get('seed') || '1', 10) || 1;

const G = {
  screen: 'title',
  dayIdx: 0,
  day: DAYS[0],
  smoker: null,
  board: null,
  kitchen: new Kitchen(),
  sound: new SoundFX(),
  timeLeft: 0,
  results: null,
  totalPerfect: 0,
  rushBanner: 0,
  selectedWood: 0,
  shopItems: UPGRADES,
  frozen: false,
};

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function toLogical(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (W / rect.width),
    y: (e.clientY - rect.top) * (H / rect.height),
  };
}

function startDay(idx) {
  const def = DAYS[idx];
  const day = { ...def, patience: def.patience * G.kitchen.patienceMul() };
  G.dayIdx = idx;
  G.day = day;
  G.rng = mulberry32(1000 + idx * 77 + seedParam);
  G.smoker = new Smoker(G.kitchen.rackCount(day.racks));
  G.smoker.gaugeUpgrade = G.kitchen.upgrades.gauge > 0;
  G.board = new OrderBoard(day, G.rng);
  G.kitchen.resetDay(G.kitchen.heartsForDay(3));
  G.timeLeft = day.length;
  G.rushBanner = 0;
  G.screen = 'playing';
  G.sound.startSizzle();
}

function endDay(win) {
  const k = G.kitchen;
  const earned = k.earned;
  const stars = !win ? 0 : earned >= G.day.target * 1.5 ? 3 : earned >= G.day.target * 1.25 ? 2 : 1;
  G.results = {
    win, stars, earned,
    served: G.board.served, perfect: k.perfectServes, lost: G.board.lost,
  };
  G.totalPerfect += k.perfectServes;
  G.sound.stopSizzle();
  G.screen = 'results';
}

function update(dt) {
  if (G.screen !== 'playing' || G.frozen) return;
  G.timeLeft -= dt;
  G.smoker.update(dt);
  const ev = G.board.update(dt, G.timeLeft);
  if (ev === 'rush') {
    G.rushBanner = 2.5;
    G.sound.rush();
    G.kitchen.say('RUSH HOUR — three tickets at once!');
  } else if (ev === 'lost') {
    const hearts = G.kitchen.loseHeart();
    G.sound.leave();
    G.kitchen.say('A customer walked out!');
    if (hearts <= 0) { endDay(false); return; }
  }
  G.kitchen.update(dt);
  if (G.rushBanner > 0) G.rushBanner -= dt;
  G.sound.setSizzleLevel(G.smoker.smoke / 100);
  if (G.smoker.smoke > 35 && Math.random() < dt * 6) {
    spawnSmoke(LAYOUT.smoker.x + 90 + Math.random() * 160, LAYOUT.smoker.y + 30, 1);
  }
  if (G.timeLeft <= 0) {
    endDay(G.kitchen.earned >= G.day.target);
  }
}

// --- input -------------------------------------------------------------------
function clickPlaying(x, y) {
  const K = G.kitchen;
  const S = G.smoker;
  if (inRect(x, y, LAYOUT.muteBtn)) { G.sound.toggleMute(); return; }
  if (inRect(x, y, LAYOUT.pauseBtn)) { G.screen = 'paused'; return; }

  // Wood buttons + vent (same geometry as render.js drawSmoker: 56 wide, step 61).
  const by = LAYOUT.smoker.y + LAYOUT.smoker.h - 42;
  for (let i = 0; i < G.day.woods.length; i++) {
    const bx = LAYOUT.smoker.x + 10 + i * 61;
    if (inRect(x, y, { x: bx, y: by, w: 56, h: 32 })) {
      G.selectedWood = i;
      if (S.addWood(G.day.woods[i])) { G.sound.wood(); K.say(`Added ${WOODS[G.day.woods[i]].name} — smoke up, flavour set.`); }
      return;
    }
  }
  if (inRect(x, y, { x: LAYOUT.smoker.x + LAYOUT.smoker.w - 78, y: by, w: 68, h: 32 })) {
    if (S.openVent()) { G.sound.vent(); K.say('Vented — smoke dropping.'); }
    return;
  }

  // Smoker racks.
  for (let i = 0; i < S.racks.length; i++) {
    const ry = LAYOUT.smoker.y + 34 + i * 44;
    const rr = { x: LAYOUT.smoker.x + 10, y: ry, w: LAYOUT.smoker.w - 108, h: 38 };
    if (!inRect(x, y, rr)) continue;
    const rack = S.racks[i];
    if (!rack && K.hand && K.hand.kind === 'raw') {
      if (S.loadMeat(K.hand.id) >= 0) { K.clearHand(); G.sound.place(); }
      return;
    }
    if (rack && !K.hand) {
      const pulled = S.pullMeat(i);
      if (pulled) {
        K.hand = { kind: 'smoked', id: pulled.meat, perfect: pulled.perfect, flavor: pulled.flavor, bitter: pulled.bitter, burnt: pulled.burnt };
        G.sound.pickup();
        if (pulled.burnt) K.say('Burnt! Trash it (T) — never serve it.');
        else if (pulled.perfect) K.say(`${MEATS[pulled.meat].name} pulled at PERFECT.`);
      }
      return;
    }
    return;
  }

  // Chopping board.
  if (inRect(x, y, LAYOUT.chop)) {
    if (K.chop) {
      const r = K.chopHit();
      if (r === 'perfect') { G.sound.chopPerfect(); K.say('Perfect chop!'); }
      else if (r === 'good') G.sound.chop();
      else if (r === 'miss') G.sound.error();
      return;
    }
    if (K.hand && K.hand.kind === 'side') {
      if (K.startChop(K.hand.id)) { K.clearHand(); G.sound.chop(); }
      return;
    }
    return;
  }

  // Sauce pots.
  for (let i = 0; i < G.day.sauces.length; i++) {
    const px = LAYOUT.sauces.x + 10 + i * 72;
    if (inRect(x, y, { x: px, y: LAYOUT.sauces.y + 40, w: 60, h: 80 })) {
      if (K.takeSauce(G.day.sauces[i])) G.sound.pickup();
      return;
    }
  }

  // Ingredient bins: raw meat row, then side row.
  const B = LAYOUT.bins;
  for (let i = 0; i < G.day.meats.length; i++) {
    const bx = B.x + 46 + i * 104;
    if (inRect(x, y, { x: bx - 40, y: B.y + 50, w: 80, h: 66 })) {
      if (K.takeMeat(G.day.meats[i])) G.sound.pickup();
      return;
    }
  }
  for (let i = 0; i < G.day.sides.length; i++) {
    const bx = B.x + 46 + i * 104;
    if (inRect(x, y, { x: bx - 40, y: B.y + 138, w: 80, h: 48 })) {
      if (K.takeSide(G.day.sides[i])) G.sound.pickup();
      return;
    }
  }

  // Plate: add whatever is in hand.
  if (inRect(x, y, LAYOUT.plate)) {
    const r = K.plateHand();
    if (r) G.sound.place();
    else if (K.hand) { G.sound.error(); K.say('That does not go on the plate here.'); }
    return;
  }

  // Serving window: SERVE button, then TRASH strip.
  const SR = LAYOUT.serve;
  if (inRect(x, y, { x: SR.x + 12, y: SR.y + 40, w: SR.w - 24, h: 44 })) {
    const res = K.serve(G.board);
    if (res.ok) {
      G.sound.serve();
      G.sound.coin();
      K.say(`Served ${res.customer} — $${res.total}${res.tip ? ` (tip $${res.tip})` : ''}${res.comboBonus ? ` combo +$${res.comboBonus}` : ''}`);
    } else {
      G.sound.error();
      K.say(res.why);
    }
    return;
  }
  if (inRect(x, y, { x: SR.x + 12, y: SR.y + 92, w: SR.w - 24, h: 22 })) {
    if (K.hand) { K.trashHand(); G.sound.error(); K.say('Trashed.'); }
    else if (K.plateReady() || K.plate.meat || K.plate.side || K.plate.sauce) { K.clearPlate(); G.sound.error(); K.say('Plate cleared.'); }
    return;
  }
}

function clickOverlay(x, y, count, fn) {
  const rects = overlayButtonRects(count);
  for (let i = 0; i < rects.length; i++) {
    if (inRect(x, y, rects[i])) { fn(i); return true; }
  }
  return false;
}

canvas.addEventListener('click', (e) => {
  const { x, y } = toLogical(e);
  G.sound.ensure();
  if (G.screen === 'title') {
    clickOverlay(x, y, 2, (i) => { G.sound.click(); G.screen = i === 0 ? 'intro' : 'howto'; });
  } else if (G.screen === 'howto') {
    clickOverlay(x, y, 1, () => { G.sound.click(); G.screen = 'title'; });
  } else if (G.screen === 'intro') {
    clickOverlay(x, y, 1, () => { G.sound.click(); startDay(G.dayIdx); });
  } else if (G.screen === 'playing') {
    clickPlaying(x, y);
  } else if (G.screen === 'paused') {
    clickOverlay(x, y, 1, () => { G.sound.click(); G.screen = 'playing'; });
  } else if (G.screen === 'shop') {
    const { buys, next } = shopRects(G.shopItems.length);
    for (let i = 0; i < buys.length; i++) {
      if (inRect(x, y, buys[i])) {
        if (G.kitchen.buyUpgrade(G.shopItems[i])) { G.sound.coin(); }
        else { G.sound.error(); }
        return;
      }
    }
    if (inRect(x, y, next)) { G.sound.click(); G.dayIdx += 1; G.screen = 'intro'; G.day = DAYS[G.dayIdx]; }
  } else if (G.screen === 'results') {
    const R = G.results;
    const n = R.win ? 2 : 1;
    clickOverlay(x, y, n, (i) => {
      G.sound.click();
      if (!R.win) { startDay(G.dayIdx); return; }
      if (i === 0) {
        if (G.day.day >= 7) { G.screen = 'gameover'; return; }
        G.screen = 'shop';
      } else {
        G.dayIdx += 1;
        if (G.dayIdx >= DAYS.length) { G.screen = 'gameover'; return; }
        G.screen = 'intro';
        G.day = DAYS[G.dayIdx];
      }
    });
  } else if (G.screen === 'gameover') {
    clickOverlay(x, y, 1, () => {
      G.sound.click();
      G.kitchen = new Kitchen();
      G.totalPerfect = 0;
      G.dayIdx = 0;
      G.day = DAYS[0];
      G.screen = 'intro';
    });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === 'm') { G.sound.toggleMute(); return; }
  if (G.screen === 'playing') {
    if (k === ' ') { e.preventDefault(); if (G.kitchen.chop) { const r = G.kitchen.chopHit(); if (r === 'perfect') G.sound.chopPerfect(); else if (r === 'good') G.sound.chop(); else if (r === 'miss') G.sound.error(); } return; }
    if (k === 'p' || k === 'escape') { G.screen = 'paused'; return; }
    if (k === 'w') {
      const w = G.day.woods[G.selectedWood];
      if (G.smoker.addWood(w)) { G.sound.wood(); G.kitchen.say(`Added ${WOODS[w].name} — smoke up, flavour set.`); }
      return;
    }
    if (k === 'v') { if (G.smoker.openVent()) { G.sound.vent(); G.kitchen.say('Vented — smoke dropping.'); } return; }
    if (k === 'e') {
      const res = G.kitchen.serve(G.board);
      if (res.ok) { G.sound.serve(); G.sound.coin(); G.kitchen.say(`Served ${res.customer} — $${res.total}`); }
      else { G.sound.error(); G.kitchen.say(res.why); }
      return;
    }
    if (k === 't') {
      if (G.kitchen.hand) { G.kitchen.trashHand(); G.sound.error(); G.kitchen.say('Trashed.'); }
      else { G.kitchen.clearPlate(); G.kitchen.say('Plate cleared.'); }
      return;
    }
    if (['1', '2', '3', '4'].includes(k)) {
      const i = parseInt(k, 10) - 1;
      if (i < G.day.woods.length) G.selectedWood = i;
    }
  } else if (G.screen === 'paused' && (k === 'p' || k === 'escape' || k === ' ')) {
    G.screen = 'playing';
  } else if (G.screen === 'title' && k === 'enter') {
    G.screen = 'intro';
  }
});

// --- loop --------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    update(dt);
    drawGame(ctx, G, dt);
  } catch (err) {
    // One bad frame must never freeze the kitchen: log it and keep going.
    console.error('frame error:', err);
  }
  requestAnimationFrame(frame);
}

// --- screenshot staging --------------------------------------------------------
if (shotName) {
  const dayDef = DAYS[2]; // day 3: most ingredients unlocked, reads richest
  const staged = stageShot(shotName, dayDef);
  if (staged) {
    G.day = { ...dayDef, patience: dayDef.patience };
    G.dayIdx = 2;
    G.smoker = staged.smoker;
    G.board = staged.board;
    G.kitchen = staged.kitchen;
    G.timeLeft = staged.timeLeft;
    G.screen = staged.screen;
    G.rushBanner = staged.rushBanner || 0;
    G.results = staged.results || null;
    G.frozen = true;
  }
}

window.__game = G;
requestAnimationFrame(frame);
