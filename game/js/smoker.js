// Ember & Oak — the smoker: racks, doneness windows, smoke level, wood, vent.
// This is the game's original mechanic: smoke is a resource you steer.
// High smoke cooks faster and tags flavour, but smoke held above the bitter
// line turns meat bitter. Every rack's meat is cooked by the same smoke.

import { MEATS, WOODS, clamp } from './data.js';

export const SMOKE_BITTER_LINE = 78; // smoke above this starts adding bitterness
export const SMOKE_DECAY = 1.6;      // smoke points lost per second (before gauge upgrade)

export class Smoker {
  constructor(rackCount) {
    this.racks = [];
    for (let i = 0; i < rackCount; i++) this.racks.push(null);
    this.smoke = 18;
    this.ventCooldown = 0;
    this.woodCooldown = 0;
    this.gaugeUpgrade = false;
    this.bitterFlash = 0;
  }

  setRacks(n) {
    while (this.racks.length < n) this.racks.push(null);
    while (this.racks.length > n) {
      if (this.racks[this.racks.length - 1]) return false;
      this.racks.pop();
    }
    return true;
  }

  emptyRack() {
    for (let i = 0; i < this.racks.length; i++) if (!this.racks[i]) return i;
    return -1;
  }

  loadMeat(meatId) {
    const i = this.emptyRack();
    if (i < 0) return -1;
    const m = MEATS[meatId];
    this.racks[i] = {
      meat: meatId, age: 0, flavor: 'oak', bitter: 0,
      done: false, burnt: false, perfect: false,
    };
    return i;
  }

  pullMeat(i) {
    const r = this.racks[i];
    if (!r) return null;
    this.racks[i] = null;
    return r;
  }

  addWood(woodId) {
    if (this.woodCooldown > 0) return false;
    const w = WOODS[woodId];
    if (!w) return false;
    this.smoke = clamp(this.smoke + w.smoke, 0, 100);
    for (const r of this.racks) if (r) r.flavor = w.flavor;
    this.woodCooldown = 1.2;
    return true;
  }

  openVent() {
    if (this.ventCooldown > 0) return false;
    this.smoke = clamp(this.smoke - 30, 0, 100);
    this.ventCooldown = 2.5;
    return true;
  }

  // Doneness advances with smoke: still air cooks slow, thick smoke fast.
  update(dt) {
    const decay = SMOKE_DECAY * (this.gaugeUpgrade ? 0.6 : 1);
    this.smoke = clamp(this.smoke - decay * dt, 0, 100);
    if (this.woodCooldown > 0) this.woodCooldown -= dt;
    if (this.ventCooldown > 0) this.ventCooldown -= dt;
    if (this.bitterFlash > 0) this.bitterFlash -= dt;
    const rate = 0.45 + this.smoke / 100;
    for (const r of this.racks) {
      if (!r) continue;
      const m = MEATS[r.meat];
      r.age += dt * rate;
      const [lo, hi] = m.perfect;
      r.perfect = r.age >= lo && r.age <= hi;
      if (r.age > hi + 16) r.burnt = true;
      if (this.smoke > SMOKE_BITTER_LINE) {
        r.bitter += dt * (this.smoke - SMOKE_BITTER_LINE) / 22;
        if (r.bitter > 0.4) this.bitterFlash = 0.4;
      }
    }
  }

  // 0..1 doneness for the bar, plus a state label for the rack card.
  rackState(r) {
    if (!r) return null;
    const m = MEATS[r.meat];
    const [lo, hi] = m.perfect;
    const frac = clamp(r.age / m.cook, 0, 1);
    if (r.burnt) return { frac, label: 'BURNT', tone: '#3a3a3a' };
    if (r.perfect) return { frac, label: 'PERFECT', tone: '#3fae5a' };
    if (r.age < lo) return { frac, label: 'SMOKING…', tone: '#d98a2b' };
    return { frac, label: 'OVERDONE', tone: '#c22a12' };
  }
}
