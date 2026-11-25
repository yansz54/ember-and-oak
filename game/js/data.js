// Ember & Oak — game data: meats, sides, sauces, woods, days, upgrades.
// All tuning lives here so the kitchen simulation never hard-codes a number.

export const MEATS = {
  brisket:   { name: 'Brisket',    cook: 62, perfect: [46, 62], price: 14, color: '#8a4b2d', dark: '#5e2f1a', label: 'BRISKET' },
  ribs:      { name: 'Ribs',       cook: 48, perfect: [36, 48], price: 12, color: '#a85a30', dark: '#6e3315', label: 'RIBS' },
  chicken:   { name: 'Chicken',    cook: 36, perfect: [26, 36], price: 10, color: '#d99a4e', dark: '#9c6a28', label: 'CHICKEN' },
  porkbelly: { name: 'Pork Belly', cook: 54, perfect: [40, 54], price: 13, color: '#c47a52', dark: '#7e4526', label: 'PORK BELLY' },
  salmon:    { name: 'Salmon',     cook: 30, perfect: [21, 30], price: 15, color: '#e8805a', dark: '#a84e30', label: 'SALMON' },
};

export const SIDES = {
  slaw:      { name: 'Slaw',      chop: 3, price: 4, color: '#cfe3a0', dark: '#8aa85e', label: 'SLAW' },
  cornbread: { name: 'Cornbread', chop: 2, price: 5, color: '#e8c25e', dark: '#a8822e', label: 'CORNBREAD' },
  pickles:   { name: 'Pickles',   chop: 3, price: 4, color: '#7fb069', dark: '#4c7a3d', label: 'PICKLES' },
  beans:     { name: 'Beans',     chop: 2, price: 5, color: '#7a4a28', dark: '#4c2a14', label: 'BEANS' },
  fries:     { name: 'Fries',     chop: 2, price: 5, color: '#f0c040', dark: '#b08218', label: 'FRIES' },
};

export const SAUCES = {
  bbq:     { name: 'BBQ',     price: 2, color: '#7a2a12', dark: '#4c1808', label: 'BBQ' },
  mustard: { name: 'Mustard', price: 2, color: '#e8b820', dark: '#a88210', label: 'MUSTARD' },
  hot:     { name: 'Hot',     price: 2, color: '#c22a12', dark: '#7e1608', label: 'HOT' },
  honey:   { name: 'Honey',   price: 3, color: '#e8a020', dark: '#a86a08', label: 'HONEY' },
};

export const WOODS = {
  oak:     { name: 'Oak',     flavor: 'oak',     smoke: 22, color: '#9a7a4a', dark: '#6a4e28', label: 'OAK' },
  hickory: { name: 'Hickory', flavor: 'hickory', smoke: 30, color: '#7a4a28', dark: '#4c2a14', label: 'HICKORY' },
  apple:   { name: 'Apple',   flavor: 'apple',   smoke: 16, color: '#c47a6a', dark: '#8a4a3a', label: 'APPLE' },
  cherry:  { name: 'Cherry',  flavor: 'cherry',  smoke: 18, color: '#a03a4a', dark: '#6a2230', label: 'CHERRY' },
};

// One day = one level. Unlocks gate what the player can cook with.
export const DAYS = [
  { day: 1, name: 'First Smoke', length: 170, target: 60,  meats: ['brisket'],                 sides: ['slaw'],                          sauces: ['bbq'],              woods: ['oak'],              racks: 2, spawnGap: [26, 34], patience: 95 },
  { day: 2, name: 'Ribs & Rye',  length: 180, target: 90,  meats: ['brisket', 'ribs'],           sides: ['slaw', 'cornbread'],            sauces: ['bbq'],              woods: ['oak', 'hickory'],    racks: 2, spawnGap: [22, 30], patience: 90 },
  { day: 3, name: 'Bird Day',    length: 190, target: 120, meats: ['brisket', 'ribs', 'chicken'], sides: ['slaw', 'cornbread', 'pickles'], sauces: ['bbq', 'mustard'],   woods: ['oak', 'hickory'],    racks: 3, spawnGap: [19, 27], patience: 85 },
  { day: 4, name: 'Belly Up',    length: 200, target: 150, meats: ['brisket', 'ribs', 'chicken', 'porkbelly'], sides: ['slaw', 'cornbread', 'pickles', 'beans'], sauces: ['bbq', 'mustard', 'hot'], woods: ['oak', 'hickory', 'apple'], racks: 3, spawnGap: [17, 25], patience: 82 },
  { day: 5, name: 'River Catch', length: 210, target: 185, meats: ['brisket', 'ribs', 'chicken', 'porkbelly', 'salmon'], sides: ['slaw', 'cornbread', 'pickles', 'beans', 'fries'], sauces: ['bbq', 'mustard', 'hot'], woods: ['oak', 'hickory', 'apple', 'cherry'], racks: 3, spawnGap: [15, 23], patience: 80 },
  { day: 6, name: 'Rush Week',   length: 220, target: 220, meats: ['brisket', 'ribs', 'chicken', 'porkbelly', 'salmon'], sides: ['slaw', 'cornbread', 'pickles', 'beans', 'fries'], sauces: ['bbq', 'mustard', 'hot', 'honey'], woods: ['oak', 'hickory', 'apple', 'cherry'], racks: 4, spawnGap: [13, 20], patience: 76 },
  { day: 7, name: 'The Critic',  length: 230, target: 260, meats: ['brisket', 'ribs', 'chicken', 'porkbelly', 'salmon'], sides: ['slaw', 'cornbread', 'pickles', 'beans', 'fries'], sauces: ['bbq', 'mustard', 'hot', 'honey'], woods: ['oak', 'hickory', 'apple', 'cherry'], racks: 4, spawnGap: [12, 19], patience: 72 },
];

export const UPGRADES = [
  { id: 'rack',    name: 'Extra Rack',    desc: '+1 smoker rack',            price: 45, once: false },
  { id: 'knife',   name: 'Sharp Knife',   desc: 'Wider chop sweet spot',     price: 30, once: false },
  { id: 'calm',    name: 'Calm Service',  desc: '+25% customer patience',    price: 35, once: false },
  { id: 'gauge',   name: 'Smoke Gauge',   desc: 'Smoke fades 40% slower',    price: 25, once: false },
  { id: 'heart',   name: 'Extra Heart',   desc: '+1 heart every day',        price: 50, once: false },
];

export const CUSTOMERS = [
  'Mara', 'Joss', 'Priya', 'Theo', 'Ana', 'Kofi', 'Lena', 'Ravi',
  'June', 'Omar', 'Suki', 'Hank', 'Nia', 'Ezra', 'Wren', 'Dario',
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
