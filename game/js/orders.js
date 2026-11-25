// Ember & Oak — the order board: tickets, patience, spawning, rush waves.
// A ticket is a promise: one meat (with doneness + flavour), one side, one sauce.

import { MEATS, SIDES, SAUCES, WOODS, CUSTOMERS, pick, clamp } from './data.js';

let ticketSeq = 0;

export class OrderBoard {
  constructor(day, rng) {
    this.day = day;
    this.rng = rng;
    this.tickets = [];
    this.nextSpawnIn = 4;
    this.rushAt = null;
    this.rushDone = false;
    this.spawned = 0;
    this.served = 0;
    this.lost = 0;
  }

  makeTicket(vip) {
    const d = this.day;
    const meat = pick(this.rng, d.meats);
    const side = pick(this.rng, d.sides);
    const sauce = pick(this.rng, d.sauces);
    const flavor = pick(this.rng, d.woods);
    const patience = d.patience * (vip ? 1.5 : 1);
    const base = MEATS[meat].price + SIDES[side].price + SAUCES[sauce].price;
    return {
      id: ++ticketSeq,
      customer: vip ? 'THE CRITIC' : pick(this.rng, CUSTOMERS),
      meat, side, sauce, flavor,
      patience, patienceMax: patience,
      payout: base + (vip ? 40 : 0),
      vip: !!vip,
      born: 0,
    };
  }

  // How a ticket wants its meat: perfect doneness + the named wood flavour.
  static wants(ticket) {
    return `${MEATS[ticket.meat].name} · ${WOODS[ticket.flavor].flavor} smoke`;
  }

  update(dt, dayTimeLeft) {
    // Rush hour: once per day, at ~55% through, three tickets land at once.
    if (!this.rushDone && dayTimeLeft < this.day.length * 0.45) {
      this.rushDone = true;
      this.rushAt = 0;
      this.spawnTicket(true);
      this.spawnTicket(true);
      return 'rush';
    }
    this.nextSpawnIn -= dt;
    if (this.nextSpawnIn <= 0 && this.tickets.length < 5) {
      this.spawnTicket(false);
      const [lo, hi] = this.day.spawnGap;
      this.nextSpawnIn = lo + this.rng() * (hi - lo);
    }
    for (const t of this.tickets) t.patience -= dt;
    const lost = this.tickets.filter((t) => t.patience <= 0);
    if (lost.length) {
      this.tickets = this.tickets.filter((t) => t.patience > 0);
      this.lost += lost.length;
      return 'lost';
    }
    return null;
  }

  spawnTicket(rush) {
    const vip = this.day.day === 7 && this.spawned === 6 && !this.vipSpawned;
    if (vip) this.vipSpawned = true;
    this.tickets.push(this.makeTicket(vip));
    this.spawned++;
    return this.tickets[this.tickets.length - 1];
  }

  remove(id) {
    const i = this.tickets.findIndex((t) => t.id === id);
    if (i < 0) return null;
    const t = this.tickets.splice(i, 1)[0];
    this.served++;
    return t;
  }

  // Does a finished plate satisfy this ticket? Perfect doneness is required
  // for full pay; a merely edible plate still sells at half price.
  static matchScore(ticket, plate) {
    if (!plate.meat || plate.meat.id !== ticket.meat) return -1;
    if (!plate.side || plate.side.id !== ticket.side) return -1;
    if (!plate.sauce || plate.sauce.id !== ticket.sauce) return -1;
    let score = 1;
    if (!plate.meat.perfect) score = 0.5;
    if (plate.meat.burnt || plate.meat.bitter > 1.5) return -1;
    if (plate.meat.flavor === ticket.flavor) score += 0.5;
    return score;
  }

  bestMatch(plate) {
    let best = null;
    let bestScore = -1;
    for (const t of this.tickets) {
      const s = OrderBoard.matchScore(t, plate);
      if (s > bestScore) { bestScore = s; best = t; }
    }
    return bestScore > 0 ? { ticket: best, score: bestScore } : null;
  }

  patienceFrac(t) { return clamp(t.patience / t.patienceMax, 0, 1); }
}
