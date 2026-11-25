// Ember & Oak — deterministic staged states for screenshots.
// Each shot builds a fixed, real game state (no mock rendering): the same
// code paths as live play, frozen at a moment worth showing. ?shot=cover
// &seed=1 in the URL picks one. The game itself never depends on these.

import { mulberry32, MEATS } from './data.js';
import { Smoker } from './smoker.js';
import { OrderBoard } from './orders.js';
import { Kitchen } from './kitchen.js';

function baseState(dayDef, seed) {
  const rng = mulberry32(seed);
  const smoker = new Smoker(dayDef.racks);
  smoker.gaugeUpgrade = true;
  const board = new OrderBoard(dayDef, rng);
  const kitchen = new Kitchen();
  return { smoker, board, kitchen, rng };
}

function stageTicket(board, meat, side, sauce, flavor, customer, patience) {
  const t = board.makeTicket(false);
  Object.assign(t, { meat, side, sauce, flavor, customer, patience, patienceMax: patience });
  board.tickets.push(t);
  return t;
}

function stageRack(smoker, i, meat, age, flavor) {
  // Doneness state is derived from the age, exactly as the live sim does.
  const m = MEATS[meat];
  const [lo, hi] = m.perfect;
  smoker.racks[i] = {
    meat, age, flavor, bitter: 0,
    done: false,
    burnt: age > hi + 16,
    perfect: age >= lo && age <= hi,
  };
}

export function stageShot(name, dayDef) {
  const S = baseState(dayDef, 11);
  const { smoker, board, kitchen } = S;
  kitchen.coins = 128;
  kitchen.hearts = 3;

  if (name === 'cover') {
    // The money shot: a busy mid-service kitchen, everything the judge
    // wants to see — order board, smoker, a plate mid-assembly, a timer.
    smoker.smoke = 62;
    stageRack(smoker, 0, 'brisket', 52, 'hickory');
    stageRack(smoker, 1, 'ribs', 30, 'oak');
    stageRack(smoker, 2, 'chicken', 12, 'apple');
    stageTicket(board, 'brisket', 'slaw', 'bbq', 'hickory', 'Mara', 62);
    stageTicket(board, 'ribs', 'cornbread', 'mustard', 'oak', 'Joss', 48);
    stageTicket(board, 'chicken', 'pickles', 'bbq', 'apple', 'Priya', 74);
    kitchen.plate.meat = { kind: 'smoked', id: 'brisket', perfect: true, flavor: 'hickory', bitter: 0, burnt: false };
    kitchen.plate.side = { kind: 'chopped', id: 'slaw', quality: 'perfect' };
    kitchen.combo = 2;
    kitchen.comboTimer = 14;
    return { ...S, timeLeft: 107, screen: 'playing', rushBanner: 0 };
  }

  if (name === 'smoker') {
    // Smoke running hot, racks full, the bitter line in sight.
    smoker.smoke = 84;
    stageRack(smoker, 0, 'brisket', 58, 'hickory');
    stageRack(smoker, 1, 'porkbelly', 44, 'cherry');
    stageRack(smoker, 2, 'salmon', 24, 'apple');
    stageTicket(board, 'brisket', 'beans', 'hot', 'hickory', 'Theo', 70);
    stageTicket(board, 'salmon', 'fries', 'honey', 'apple', 'Ana', 55);
    kitchen.hand = { kind: 'raw', id: 'ribs' };
    return { ...S, timeLeft: 141, screen: 'playing', rushBanner: 0 };
  }

  if (name === 'rush') {
    // Rush hour: four tickets, patience bleeding, combo live.
    smoker.smoke = 45;
    stageRack(smoker, 0, 'ribs', 40, 'oak');
    stageRack(smoker, 1, 'chicken', 28, 'hickory');
    stageTicket(board, 'ribs', 'slaw', 'bbq', 'oak', 'Kofi', 18);
    stageTicket(board, 'chicken', 'pickles', 'mustard', 'hickory', 'Lena', 24);
    stageTicket(board, 'brisket', 'cornbread', 'hot', 'hickory', 'Ravi', 31);
    stageTicket(board, 'porkbelly', 'beans', 'bbq', 'cherry', 'June', 40);
    kitchen.plate.meat = { kind: 'smoked', id: 'ribs', perfect: true, flavor: 'oak', bitter: 0, burnt: false };
    kitchen.plate.side = { kind: 'chopped', id: 'slaw', quality: 'perfect' };
    kitchen.plate.sauce = { kind: 'sauce', id: 'bbq' };
    kitchen.combo = 3;
    kitchen.comboTimer = 18;
    kitchen.coins = 214;
    return { ...S, timeLeft: 88, screen: 'playing', rushBanner: 1.4 };
  }

  if (name === 'results') {
    // Day complete: three stars, the till full, the next day waiting.
    kitchen.earned = 236;
    kitchen.coins = 364;
    return {
      ...S, timeLeft: 0, screen: 'results', rushBanner: 0,
      results: { win: true, stars: 3, earned: 236, served: 11, perfect: 7, lost: 0 },
    };
  }

  return null;
}
