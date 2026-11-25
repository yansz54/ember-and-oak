// Ember & Oak — all canvas drawing: the kitchen, the food, the tickets,
// the smoke. One clear job: turn game state into a readable picture.
// Click zones live in LAYOUT so input and drawing never drift apart.

import { MEATS, SIDES, SAUCES, WOODS, clamp } from './data.js';
import { SMOKE_BITTER_LINE } from './smoker.js';

export const W = 1280;
export const H = 720;

export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  muteBtn: { x: 1150, y: 10, w: 52, h: 36 },
  pauseBtn: { x: 1210, y: 10, w: 52, h: 36 },
  orders: { x: 16, y: 68, w: 280, h: 268 },
  smoker: { x: 312, y: 68, w: 348, h: 268 },
  chop: { x: 676, y: 68, w: 264, h: 130 },
  sauces: { x: 956, y: 68, w: 308, h: 130 },
  bins: { x: 16, y: 352, w: 644, h: 184 },
  plate: { x: 676, y: 214, w: 264, h: 122 },
  serve: { x: 956, y: 214, w: 308, h: 122 },
  hint: { x: 16, y: 544, w: 1248, h: 32 },
  hand: { x: 16, y: 584, w: 1248, h: 124 },
};

// Smoke particles drifting up from the smoker (visual only).
const particles = [];
export function spawnSmoke(x, y, n) {
  for (let i = 0; i < n; i++) {
    particles.push({ x: x + (Math.random() - 0.5) * 60, y, r: 6 + Math.random() * 14, vy: 12 + Math.random() * 18, vx: (Math.random() - 0.5) * 8, life: 1 });
  }
  if (particles.length > 120) particles.splice(0, particles.length - 120);
}
export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y -= p.vy * dt; p.x += p.vx * dt; p.life -= dt * 0.35;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, r, fill, stroke) {
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fillStyle = fill || '#f7ead0';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke || '#2b1d16';
  ctx.stroke();
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.font = `${weight || 'bold'} ${size}px Arial, sans-serif`;
  ctx.fillStyle = color || '#2b1d16';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, bg) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg || '#d8c8a8';
  ctx.fill();
  if (frac > 0) {
    rr(ctx, x, y, Math.max(h, w * clamp(frac, 0, 1)), h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

// --- food ------------------------------------------------------------------
export function drawMeat(ctx, x, y, s, meatId, state) {
  const m = MEATS[meatId];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = m.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = m.dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  // grill marks
  ctx.strokeStyle = 'rgba(60,20,8,0.55)';
  ctx.lineWidth = 3;
  for (const dx of [-12, 0, 12]) {
    ctx.beginPath(); ctx.moveTo(dx - 5, -10); ctx.lineTo(dx + 5, 10); ctx.stroke();
  }
  if (state === 'burnt') {
    ctx.fillStyle = 'rgba(20,12,8,0.65)';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2); ctx.fill();
  } else if (state === 'perfect') {
    ctx.fillStyle = 'rgba(255,220,120,0.35)';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawSide(ctx, x, y, s, sideId) {
  const v = SIDES[sideId];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = v.color;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = v.dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = v.dark;
  ctx.beginPath(); ctx.arc(-4, -3, 2.5, 0, Math.PI * 2); ctx.arc(5, 3, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawSauceDrop(ctx, x, y, s, sauceId) {
  const v = SAUCES[sauceId];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = v.color;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(12, 2, 10, 8);
  ctx.quadraticCurveTo(6, 14, 0, 14);
  ctx.quadraticCurveTo(-6, 14, -10, 8);
  ctx.quadraticCurveTo(-12, 2, 0, -14);
  ctx.fill();
  ctx.restore();
}

function drawPlateDish(ctx, x, y, plate) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b8a888'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 34, 21, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#d8c8a8'; ctx.stroke();
  if (plate.meat) drawMeat(ctx, -12, -2, 0.85, plate.meat.id, plate.meat.perfect ? 'perfect' : plate.meat.burnt ? 'burnt' : '');
  if (plate.side) drawSide(ctx, 18, 8, 0.8, plate.side.id);
  if (plate.sauce) drawSauceDrop(ctx, 20, -10, 0.9, plate.sauce.id);
  ctx.restore();
}

// --- screens ----------------------------------------------------------------
function drawTopBar(ctx, G) {
  const r = LAYOUT.topBar;
  ctx.fillStyle = '#1d130c';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  text(ctx, 'EMBER & OAK', 16, 36, 26, '#f0b429');
  text(ctx, 'smokehouse kitchen', 210, 36, 14, '#c8a878');
  if (G.screen === 'playing' || G.screen === 'paused') {
    text(ctx, `DAY ${G.day.day} · ${G.day.name}`, 470, 36, 18, '#f7ead0');
    const t = Math.max(0, Math.ceil(G.timeLeft));
    const mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
    text(ctx, `⏱ ${mm}:${ss}`, 700, 36, 18, t < 30 ? '#ff6a4a' : '#f7ead0');
    text(ctx, `🪙 $${G.kitchen.coins}`, 820, 36, 18, '#ffd76a');
    text(ctx, '♥'.repeat(Math.max(0, G.kitchen.hearts)) + '♡'.repeat(Math.max(0, 3 + G.kitchen.upgrades.heart - G.kitchen.hearts)), 950, 36, 18, '#ff6a7a');
    if (G.kitchen.combo >= 2) text(ctx, `COMBO ×${G.kitchen.combo}`, 1060, 36, 16, '#7ae08a');
  }
  panel(ctx, LAYOUT.muteBtn, G.sound.muted ? '#8a4a2a' : '#f7ead0');
  text(ctx, G.sound.muted ? 'MUTE' : 'SOUND', LAYOUT.muteBtn.x + 26, 34, 11, G.sound.muted ? '#fff' : '#2b1d16', 'bold', 'center');
  panel(ctx, LAYOUT.pauseBtn, '#f7ead0');
  text(ctx, G.screen === 'paused' ? 'RESUME' : 'PAUSE', LAYOUT.pauseBtn.x + 26, 34, 11, '#2b1d16', 'bold', 'center');
}

function drawOrders(ctx, G) {
  const r = LAYOUT.orders;
  panel(ctx, r);
  text(ctx, 'ORDER BOARD', r.x + 12, r.y + 24, 15, '#8a4a2a');
  if (!G.board.tickets.length) {
    text(ctx, 'No orders yet —', r.x + 14, r.y + 60, 13, '#6a5a44');
    text(ctx, 'the lunch crowd', r.x + 14, r.y + 80, 13, '#6a5a44');
    text(ctx, 'is coming.', r.x + 14, r.y + 100, 13, '#6a5a44');
  }
  G.board.tickets.slice(0, 5).forEach((t, i) => {
    const y = r.y + 36 + i * 46;
    const frac = t.patience / t.patienceMax;
    rr(ctx, r.x + 8, y, r.w - 16, 42, 6);
    ctx.fillStyle = t.vip ? '#fff3c8' : '#fffaf0';
    ctx.fill();
    ctx.lineWidth = t.vip ? 2 : 1;
    ctx.strokeStyle = t.vip ? '#c89a12' : '#c8b898';
    ctx.stroke();
    // avatar
    ctx.fillStyle = '#e8a020';
    ctx.beginPath(); ctx.arc(r.x + 28, y + 21, 13, 0, Math.PI * 2); ctx.fill();
    text(ctx, t.customer.slice(0, 1), r.x + 28, y + 26, 14, '#2b1d16', 'bold', 'center');
    text(ctx, `${t.customer}  ·  $${t.payout}`, r.x + 48, y + 16, 12, '#2b1d16');
    text(ctx, `${MEATS[t.meat].name} · ${t.flavor} · ${SIDES[t.side].name} · ${SAUCES[t.sauce].name}`, r.x + 48, y + 32, 11, '#6a5a44');
    bar(ctx, r.x + 48, y + 36, r.w - 64, 4, frac, frac > 0.5 ? '#3fae5a' : frac > 0.25 ? '#e8a020' : '#c22a12');
  });
}

function drawSmoker(ctx, G) {
  const r = LAYOUT.smoker;
  panel(ctx, r);
  text(ctx, 'THE SMOKER', r.x + 12, r.y + 24, 15, '#8a4a2a');
  const gx = r.x + r.w - 92;
  text(ctx, 'SMOKE', gx, r.y + 24, 11, '#6a5a44');
  bar(ctx, gx, r.y + 30, 80, 12, G.smoker.smoke / 100, G.smoker.smoke > SMOKE_BITTER_LINE ? '#c22a12' : '#7a6a8a');
  text(ctx, `${Math.round(G.smoker.smoke)}%`, gx, r.y + 60, 11, G.smoker.smoke > SMOKE_BITTER_LINE ? '#c22a12' : '#6a5a44');
  if (G.smoker.smoke > SMOKE_BITTER_LINE) text(ctx, 'BITTER!', gx, r.y + 76, 11, '#c22a12');
  G.smoker.racks.forEach((rack, i) => {
    const y = r.y + 34 + i * 44;
    rr(ctx, r.x + 10, y, r.w - 108, 38, 6);
    ctx.fillStyle = '#efe0c0';
    ctx.fill();
    ctx.strokeStyle = '#b8a888';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (!rack) {
      text(ctx, `RACK ${i + 1} — empty`, r.x + 20, y + 24, 12, '#8a7a64');
    } else {
      const st = G.smoker.rackState(rack);
      drawMeat(ctx, r.x + 36, y + 20, 0.62, rack.meat, rack.burnt ? 'burnt' : rack.perfect ? 'perfect' : '');
      text(ctx, MEATS[rack.meat].label, r.x + 62, y + 17, 12, '#2b1d16');
      text(ctx, `${rack.flavor}${rack.bitter > 1.5 ? ' · BITTER' : ''}`, r.x + 62, y + 32, 10, rack.bitter > 1.5 ? '#c22a12' : '#6a5a44');
      bar(ctx, r.x + 150, y + 12, 82, 9, st.frac, st.tone);
      text(ctx, st.label, r.x + 150, y + 33, 10, st.tone);
    }
  });
  // wood + vent buttons (same geometry as main.js click zones: 56 wide, step 61)
  const by = r.y + r.h - 42;
  G.day.woods.forEach((w, i) => {
    const bx = r.x + 10 + i * 61;
    const hot = G.smoker.woodCooldown > 0;
    rr(ctx, bx, by, 56, 32, 6);
    ctx.fillStyle = hot ? '#c8b898' : WOODS[w].color;
    ctx.fill();
    text(ctx, `+ ${WOODS[w].label}`, bx + 28, by + 21, 10, '#fff', 'bold', 'center');
  });
  const vx = r.x + r.w - 78;
  rr(ctx, vx, by, 68, 32, 6);
  ctx.fillStyle = G.smoker.ventCooldown > 0 ? '#c8b898' : '#5a7a9a';
  ctx.fill();
  text(ctx, 'VENT', vx + 34, by + 21, 11, '#fff', 'bold', 'center');
}

function drawChop(ctx, G) {
  const r = LAYOUT.chop;
  panel(ctx, r);
  text(ctx, 'CHOPPING BOARD', r.x + 12, r.y + 24, 15, '#8a4a2a');
  const c = G.kitchen.chop;
  if (!c) {
    text(ctx, 'Pick a side below,', r.x + 14, r.y + 56, 13, '#6a5a44');
    text(ctx, 'then chop it here.', r.x + 14, r.y + 76, 13, '#6a5a44');
    text(ctx, 'SPACE or click in the green.', r.x + 14, r.y + 100, 12, '#8a7a64');
    return;
  }
  text(ctx, `${SIDES[c.side].name} — ${c.hits}/${c.need} chops`, r.x + 14, r.y + 52, 13, '#2b1d16');
  const bx = r.x + 14, bw = r.w - 28, by = r.y + 66;
  rr(ctx, bx, by, bw, 22, 6);
  ctx.fillStyle = '#d8c8a8';
  ctx.fill();
  const half = 0.11 + G.kitchen.upgrades.knife * 0.04;
  ctx.fillStyle = '#3fae5a';
  ctx.fillRect(bx + bw * (0.5 - half), by, bw * half * 2, 22);
  ctx.fillStyle = '#2b1d16';
  ctx.fillRect(bx + bw * c.pos - 2, by - 4, 4, 30);
  drawSide(ctx, r.x + r.w - 40, r.y + 100, 0.9, c.side);
}

function drawSauces(ctx, G) {
  const r = LAYOUT.sauces;
  panel(ctx, r);
  text(ctx, 'SAUCE POTS', r.x + 12, r.y + 24, 15, '#8a4a2a');
  G.day.sauces.forEach((s, i) => {
    const x = r.x + 40 + i * 72;
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.ellipse(x, r.y + 92, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = SAUCES[s].color;
    ctx.beginPath(); ctx.ellipse(x, r.y + 88, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
    drawSauceDrop(ctx, x, r.y + 62, 1.1, s);
    text(ctx, `${SAUCES[s].label} · $${SAUCES[s].price}`, x, r.y + 118, 11, '#2b1d16', 'bold', 'center');
  });
}

function drawBins(ctx, G) {
  const r = LAYOUT.bins;
  panel(ctx, r);
  text(ctx, 'INGREDIENT COUNTER — click to pick up', r.x + 12, r.y + 24, 15, '#8a4a2a');
  text(ctx, 'RAW MEAT → SMOKER', r.x + 12, r.y + 48, 11, '#6a5a44');
  G.day.meats.forEach((m, i) => {
    const x = r.x + 46 + i * 104;
    drawMeat(ctx, x, r.y + 74, 0.95, m, '');
    text(ctx, MEATS[m].label, x, r.y + 100, 11, '#2b1d16', 'bold', 'center');
    text(ctx, `${MEATS[m].cook}s smoke`, x, r.y + 114, 10, '#6a5a44', '', 'center');
  });
  text(ctx, 'SIDES → CHOPPING BOARD', r.x + 12, r.y + 132, 11, '#6a5a44');
  G.day.sides.forEach((s, i) => {
    const x = r.x + 46 + i * 104;
    drawSide(ctx, x, r.y + 156, 0.95, s);
    text(ctx, SIDES[s].label, x, r.y + 174, 11, '#2b1d16', 'bold', 'center');
  });
  // hand indicator
  const h = G.kitchen.hand;
  if (h) {
    const hx = r.x + r.w - 90;
    text(ctx, 'IN HAND', hx, r.y + 48, 11, '#8a4a2a', 'bold', 'center');
    if (h.kind === 'raw') drawMeat(ctx, hx, r.y + 84, 0.95, h.id, '');
    if (h.kind === 'side' || h.kind === 'chopped') drawSide(ctx, hx, r.y + 84, 0.95, h.id);
    if (h.kind === 'sauce') drawSauceDrop(ctx, hx, r.y + 84, 1.2, h.id);
    if (h.kind === 'smoked') drawMeat(ctx, hx, r.y + 84, 0.95, h.id, h.perfect ? 'perfect' : h.burnt ? 'burnt' : '');
    text(ctx, h.kind === 'raw' || h.kind === 'smoked' ? MEATS[h.id].label + (h.kind === 'smoked' && h.perfect ? ' ★' : h.kind === 'smoked' && h.burnt ? ' BURNT' : '') : h.kind === 'sauce' ? SAUCES[h.id].label : SIDES[h.id].label, hx, r.y + 116, 11, '#2b1d16', 'bold', 'center');
  }
}

function drawPlateServe(ctx, G) {
  const pr = LAYOUT.plate;
  panel(ctx, pr);
  text(ctx, 'PLATE — click to add from hand', pr.x + 12, pr.y + 24, 13, '#8a4a2a');
  drawPlateDish(ctx, pr.x + 62, pr.y + 76, G.kitchen.plate);
  const slots = [['MEAT', G.kitchen.plate.meat], ['SIDE', G.kitchen.plate.side], ['SAUCE', G.kitchen.plate.sauce]];
  slots.forEach(([label, v], i) => {
    const x = pr.x + 128 + i * 44;
    text(ctx, label, x, pr.y + 52, 9, '#6a5a44', 'bold', 'center');
    text(ctx, v ? '✓' : '·', x, pr.y + 84, 22, v ? '#3fae5a' : '#b8a888', 'bold', 'center');
  });
  text(ctx, G.kitchen.plateReady() ? 'Ready to serve!' : 'Needs meat + side + sauce', pr.x + 12, pr.y + 112, 11, G.kitchen.plateReady() ? '#3fae5a' : '#6a5a44');

  const sr = LAYOUT.serve;
  panel(ctx, sr, G.kitchen.plateReady() ? '#ffe9b0' : '#f7ead0');
  text(ctx, 'SERVING WINDOW', sr.x + 12, sr.y + 24, 13, '#8a4a2a');
  const ready = G.kitchen.plateReady();
  rr(ctx, sr.x + 12, sr.y + 40, sr.w - 24, 44, 8);
  ctx.fillStyle = ready ? '#3fae5a' : '#c8b898';
  ctx.fill();
  text(ctx, 'SERVE  ⏎', sr.x + sr.w / 2, sr.y + 70, 20, '#fff', 'bold', 'center');
  rr(ctx, sr.x + 12, sr.y + 92, sr.w - 24, 22, 6);
  ctx.fillStyle = '#e8d8b8';
  ctx.fill();
  text(ctx, 'TRASH HAND / PLATE  (T)', sr.x + sr.w / 2, sr.y + 108, 11, '#6a5a44', 'bold', 'center');
}

function drawHint(ctx, G) {
  const r = LAYOUT.hint;
  ctx.fillStyle = '#1d130c';
  rr(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  const msg = G.kitchen.flashT > 0 ? G.kitchen.flash : 'Smoke the meat · chop the side · sauce the plate · serve before patience runs out';
  text(ctx, msg, r.x + 14, r.y + 24, 14, G.kitchen.flashT > 0 ? '#ffd76a' : '#e8d8b8');
  text(ctx, '1-6 stations · SPACE chop · W wood · V vent · E serve · P pause · M mute', r.x + r.w - 14, r.y + 24, 12, '#a8906a', '', 'right');
}

function drawHandBar(ctx, G) {
  const r = LAYOUT.hand;
  panel(ctx, r, '#efe0c0');
  text(ctx, 'HOW A PLATE IS BUILT', r.x + 12, r.y + 24, 13, '#8a4a2a');
  const steps = [
    ['1', 'Pick raw meat →', 'smoker rack'],
    ['2', 'Watch doneness —', 'pull at PERFECT'],
    ['3', 'Add wood for flavour ·', 'vent if smoke > 78%'],
    ['4', 'Chop a side ·', 'ladle a sauce'],
    ['5', 'Plate it all ·', 'SERVE the ticket'],
  ];
  steps.forEach(([n, a, b], i) => {
    const x = r.x + 16 + i * 248;
    ctx.fillStyle = '#e8590c';
    ctx.beginPath(); ctx.arc(x + 12, r.y + 52, 13, 0, Math.PI * 2); ctx.fill();
    text(ctx, n, x + 12, r.y + 57, 14, '#fff', 'bold', 'center');
    text(ctx, a, x + 32, r.y + 48, 12, '#2b1d16');
    text(ctx, b, x + 32, r.y + 66, 12, '#6a5a44');
  });
  text(ctx, 'Perfect doneness + matching wood flavour = +40% tip. Three fast serves in a row build a combo.', r.x + 12, r.y + 100, 12, '#6a5a44');
}

// --- full screens ------------------------------------------------------------
export const SHOP_ROWS = { x: 290, y: 110, w: 700, h: 500 };
// Buy-button rects for the shop rows, and the NEXT DAY button, so input
// and drawing use the same numbers.
export function shopRects(count) {
  const P = SHOP_ROWS;
  const buys = [];
  for (let i = 0; i < count; i++) {
    buys.push({ x: P.x + P.w - 150, y: 216 + i * 52 + 6, w: 120, h: 32 });
  }
  return { buys, next: { x: 565, y: 520, w: 150, h: 48 } };
}

function drawShop(ctx, G) {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, W, H);
  const P = SHOP_ROWS;
  panel(ctx, P, '#f7ead0');
  text(ctx, 'BETWEEN DAYS — UPGRADES', 640, 160, 28, '#8a4a2a', 'bold', 'center');
  text(ctx, `Coins in the till: $${G.kitchen.coins} — spend them now, or save for the critic.`, 640, 192, 15, '#2b1d16', '', 'center');
  G.shopItems.forEach((u, i) => {
    const y = 216 + i * 52;
    const owned = G.kitchen.upgrades[u.id];
    const price = G.kitchen.upgradePrice(u);
    const afford = G.kitchen.coins >= price;
    rr(ctx, P.x + 24, y, P.w - 48, 44, 6);
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    ctx.strokeStyle = '#c8b898';
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, `${u.name}${owned ? `  ×${owned}` : ''}`, P.x + 40, y + 28, 15, '#2b1d16');
    text(ctx, u.desc, P.x + 280, y + 28, 13, '#6a5a44');
    const bx = P.x + P.w - 150;
    rr(ctx, bx, y + 6, 120, 32, 6);
    ctx.fillStyle = afford ? '#3fae5a' : '#c8b898';
    ctx.fill();
    text(ctx, `BUY $${price}`, bx + 60, y + 28, 13, '#fff', 'bold', 'center');
  });
  const nx = 640 - 75;
  rr(ctx, nx, 520, 150, 48, 8);
  ctx.fillStyle = '#e8590c';
  ctx.fill();
  text(ctx, 'NEXT DAY', nx + 75, 551, 16, '#fff', 'bold', 'center');
}

// Button rects for overlay() screens, so input and drawing use the same numbers.
export function overlayButtonRects(count) {
  const rects = [];
  for (let i = 0; i < count; i++) {
    rects.push({ x: 640 - (count * 170) / 2 + i * 170 + 10, y: 520, w: 150, h: 48 });
  }
  return rects;
}

function overlay(ctx, title, lines, buttons) {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, W, H);
  panel(ctx, { x: 290, y: 110, w: 700, h: 500 }, '#f7ead0');
  text(ctx, title, 640, 170, 34, '#8a4a2a', 'bold', 'center');
  lines.forEach((l, i) => text(ctx, l.text, 640, 220 + i * 30, l.size || 16, l.color || '#2b1d16', '', 'center'));
  buttons.forEach((b, i) => {
    const bx = 640 - (buttons.length * 170) / 2 + i * 170 + 10;
    rr(ctx, bx, 520, 150, 48, 8);
    ctx.fillStyle = b.primary ? '#e8590c' : '#d8c8a8';
    ctx.fill();
    text(ctx, b.label, bx + 75, 551, 16, b.primary ? '#fff' : '#2b1d16', 'bold', 'center');
  });
}

export function drawGame(ctx, G, dt) {
  // backdrop
  ctx.fillStyle = '#2b1d16';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#33241a';
  for (let y = 0; y < H; y += 46) {
    ctx.fillRect(0, y, W, 2);
  }
  updateParticles(dt);
  drawTopBar(ctx, G);

  if (G.screen === 'title') {
    overlay(ctx, 'EMBER & OAK', [
      { text: 'A smokehouse kitchen. You run the smoker, the board and the plates.', size: 16 },
      { text: 'Smoke meat to PERFECT, match the wood flavour, chop sides,', size: 16 },
      { text: 'sauce the plate, and serve before patience runs out.', size: 16 },
      { text: '7 days. One critic on the last day. No shortcuts.', size: 16, color: '#8a4a2a' },
    ], [{ label: 'START DAY 1', primary: true }, { label: 'HOW TO PLAY' }]);
    return;
  }
  if (G.screen === 'howto') {
    overlay(ctx, 'HOW TO PLAY', [
      { text: '1 · Click a raw meat, then a smoker rack. Doneness climbs with smoke.', size: 15 },
      { text: '2 · Add wood (OAK / HICKORY / APPLE / CHERRY) to flavour the meat.', size: 15 },
      { text: '3 · Smoke over 78% turns meat bitter — VENT it down.', size: 15 },
      { text: '4 · Pull at PERFECT, chop a side (SPACE in the green), ladle sauce.', size: 15 },
      { text: '5 · Plate meat + side + sauce, then SERVE the matching ticket.', size: 15 },
      { text: 'Perfect + matching flavour = +40% tip. Fast serves build combos.', size: 15, color: '#3fae5a' },
    ], [{ label: 'BACK', primary: true }]);
    return;
  }
  if (G.screen === 'intro') {
    const d = G.day;
    overlay(ctx, `DAY ${d.day} — ${d.name.toUpperCase()}`, [
      { text: `Target: $${d.target}  ·  ${d.length}s on the clock  ·  ${d.racks} smoker racks`, size: 16 },
      { text: `Cook with: ${d.meats.map((m) => MEATS[m].name).join(', ')}`, size: 15 },
      { text: `Sides: ${d.sides.map((s) => SIDES[s].name).join(', ')}   Sauces: ${d.sauces.map((s) => SAUCES[s].name).join(', ')}`, size: 15 },
      { text: `Woods: ${d.woods.map((w) => WOODS[w].name).join(', ')}`, size: 15 },
      { text: d.day === 7 ? 'Tonight the food critic walks in. Only perfect plates impress.' : 'Earn the target to keep the doors open.', size: 15, color: '#8a4a2a' },
    ], [{ label: 'OPEN THE KITCHEN', primary: true }]);
    return;
  }
  if (G.screen === 'shop') {
    drawShop(ctx, G);
    return;
  }
  if (G.screen === 'results') {
    const R = G.results;
    overlay(ctx, R.win ? `DAY ${G.day.day} DONE` : 'DAY FAILED', [
      { text: `Earned $${R.earned}  ·  target was $${G.day.target}`, size: 18 },
      { text: `Served ${R.served} plates · ${R.perfect} perfect · ${R.lost} walkouts`, size: 16 },
      { text: R.win ? '★'.repeat(R.stars) + '☆'.repeat(3 - R.stars) : 'The crowd thins. Try the day again.', size: 26, color: '#e8a020' },
    ], R.win
      ? [{ label: G.day.day >= 7 ? 'FINISH' : 'UPGRADES', primary: true }, { label: 'NEXT DAY' }]
      : [{ label: 'RETRY DAY', primary: true }]);
    return;
  }
  if (G.screen === 'gameover') {
    overlay(ctx, 'EMBER & OAK — THE CRITIC SPEAKS', [
      { text: 'Seven days of smoke, and the house still stands.', size: 17 },
      { text: `Final till: $${G.kitchen.coins}  ·  perfect plates: ${G.totalPerfect}`, size: 16 },
      { text: 'Thanks for cooking.', size: 16, color: '#8a4a2a' },
    ], [{ label: 'PLAY AGAIN', primary: true }]);
    return;
  }

  // playing / paused
  if (G.screen === 'paused') {
    overlay(ctx, 'PAUSED', [{ text: 'The smoker waits. The smoke does not.', size: 16 }], [{ label: 'RESUME', primary: true }]);
    return;
  }
  drawOrders(ctx, G);
  drawSmoker(ctx, G);
  drawChop(ctx, G);
  drawSauces(ctx, G);
  drawBins(ctx, G);
  drawPlateServe(ctx, G);
  drawHint(ctx, G);
  drawHandBar(ctx, G);
  // smoke particles over the smoker
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 0.25);
    ctx.fillStyle = '#cfc8c0';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (G.rushBanner > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.rushBanner);
    text(ctx, '🔥 RUSH HOUR! 🔥', 640, 400, 44, '#ff6a4a', 'bold', 'center');
    ctx.restore();
  }
}
