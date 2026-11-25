// Ember & Oak — the kitchen: the player's hand, the plate, the chop
// minigame, serving, coins, combos and hearts. One clear job: the rules
// of play; drawing lives in render.js, the smoker in smoker.js.

import { SIDES, clamp } from './data.js';
import { OrderBoard } from './orders.js';

export class Kitchen {
  constructor() {
    this.hand = null; // {kind:'meat'|'side'|'sauce'|'chopped', id, ...}
    this.plate = { meat: null, side: null, sauce: null };
    this.chop = null; // {side, pos, dir, hits, need}
    this.coins = 0;
    this.earned = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.hearts = 3;
    this.upgrades = { rack: 0, knife: 0, calm: 0, gauge: 0, heart: 0 };
    this.trashCount = 0;
    this.perfectServes = 0;
    this.flash = '';
    this.flashT = 0;
  }

  resetDay(hearts) {
    this.hand = null;
    this.plate = { meat: null, side: null, sauce: null };
    this.chop = null;
    this.combo = 0;
    this.comboTimer = 0;
    this.hearts = hearts;
    this.earned = 0;
    this.trashCount = 0;
    this.perfectServes = 0;
  }

  say(msg) { this.flash = msg; this.flashT = 2.2; }

  update(dt) {
    if (this.flashT > 0) this.flashT -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.chop) {
      const speed = 1.5 + this.chop.hits * 0.25;
      this.chop.pos += this.chop.dir * speed * dt;
      if (this.chop.pos > 1) { this.chop.pos = 1; this.chop.dir = -1; }
      if (this.chop.pos < 0) { this.chop.pos = 0; this.chop.dir = 1; }
    }
  }

  // --- hand ---------------------------------------------------------------
  takeMeat(meatId) {
    if (this.hand) return false;
    this.hand = { kind: 'raw', id: meatId };
    return true;
  }

  takeSide(sideId) {
    if (this.hand) return false;
    this.hand = { kind: 'side', id: sideId };
    return true;
  }

  takeSauce(sauceId) {
    if (this.hand) return false;
    this.hand = { kind: 'sauce', id: sauceId };
    return true;
  }

  clearHand() { this.hand = null; }

  // --- chopping -----------------------------------------------------------
  startChop(sideId) {
    if (this.chop) return false;
    const s = SIDES[sideId];
    this.chop = { side: sideId, pos: 0, dir: 1, hits: 0, need: s.chop };
    this.hand = null; // the side leaves the hand for the board
    return true;
  }

  // The timing bar: green centre is a perfect chop. Knife upgrades widen it.
  chopHit() {
    if (!this.chop) return null;
    const half = 0.11 + this.upgrades.knife * 0.04;
    const d = Math.abs(this.chop.pos - 0.5);
    if (d <= half) {
      this.chop.hits += 1;
      if (this.chop.hits >= this.chop.need) {
        const side = this.chop.side;
        this.chop = null;
        this.hand = { kind: 'chopped', id: side, quality: 'perfect' };
        return 'perfect';
      }
      return 'good';
    }
    return 'miss';
  }

  cancelChop() { this.chop = null; }

  // --- plating ------------------------------------------------------------
  plateHand() {
    if (!this.hand) return null;
    const h = this.hand;
    if (h.kind === 'smoked' && !this.plate.meat) { this.plate.meat = h; this.hand = null; return 'meat'; }
    if (h.kind === 'chopped' && !this.plate.side) { this.plate.side = h; this.hand = null; return 'side'; }
    if (h.kind === 'sauce' && !this.plate.sauce) { this.plate.sauce = h; this.hand = null; return 'sauce'; }
    return null;
  }

  clearPlate() {
    this.plate = { meat: null, side: null, sauce: null };
  }

  plateReady() {
    return !!(this.plate.meat && this.plate.side && this.plate.sauce);
  }

  // --- serving ------------------------------------------------------------
  serve(board) {
    if (!this.plateReady()) return { ok: false, why: 'Plate needs meat + side + sauce.' };
    const m = board.bestMatch(this.plate);
    if (!m) return { ok: false, why: 'No ticket wants this plate.' };
    const ticket = m.ticket;
    const pay = Math.round(ticket.payout * m.score);
    const tip = m.score >= 1.5 ? Math.round(ticket.payout * 0.4) : 0;
    const comboBonus = this.combo >= 2 ? Math.round(pay * 0.15 * this.combo) : 0;
    const total = pay + tip + comboBonus;
    this.coins += total;
    this.earned += total;
    this.combo += 1;
    this.comboTimer = 20;
    if (m.score >= 1.5) this.perfectServes += 1;
    board.remove(ticket.id);
    this.clearPlate();
    return { ok: true, total, pay, tip, comboBonus, customer: ticket.customer, score: m.score };
  }

  trashHand(smoker) {
    if (!this.hand) return false;
    this.hand = null;
    this.trashCount += 1;
    return true;
  }

  loseHeart() {
    this.hearts -= 1;
    this.combo = 0;
    return this.hearts;
  }

  // --- upgrades -----------------------------------------------------------
  upgradePrice(u) {
    const base = { rack: 45, knife: 30, calm: 35, gauge: 25, heart: 50 }[u.id];
    return base + this.upgrades[u.id] * 20;
  }

  buyUpgrade(u) {
    const price = this.upgradePrice(u);
    if (this.coins < price) return false;
    this.coins -= price;
    this.upgrades[u.id] += 1;
    return true;
  }

  heartsForDay(base) { return base + this.upgrades.heart; }
  patienceMul() { return 1 + this.upgrades.calm * 0.25; }
  rackCount(base) { return base + this.upgrades.rack; }
}
