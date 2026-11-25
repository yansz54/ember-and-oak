# Ember & Oak — Smokehouse Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![make.fun rank](https://make.fun/badge/best-cooking-game-20261125-0137/yansz54/ember-and-oak/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard)
[![make.fun reward](https://make.fun/badge/best-cooking-game-20261125-0137/yansz54/ember-and-oak/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty. You run a smokehouse kitchen: smoke meat to PERFECT, match the wood flavour, chop sides, sauce the plate, and serve before patience runs out.

## The one mechanic: smoke management

Every meat smokes on a rack with its own doneness window (perfect zone, then overdone, then burnt). Smoke level 0–100 steers cooking speed — and every wood you add (oak, hickory, apple, cherry) stamps its flavour on every meat on the racks. Push smoke above 78 and the meat turns bitter and cannot be served. Vent to bring it down. Perfect doneness + matching wood flavour = a +40% tip.

## Play

- **Order board** (left): tickets with customer, meat + wood flavour + side + sauce, payout, and a patience bar. A rush wave drops 3 tickets at once mid-day.
- **Smoker** (centre): 2–4 racks, wood buttons, vent. Pull meat in its perfect window.
- **Chopping board**: a timing minigame — hit the moving marker in the green zone 3 times for a perfect chop. Upgrades widen the zone.
- **Sauce pots**: ladle the sauce each ticket asks for.
- **Plate & serving window**: meat + side + sauce, then SERVE. Fast serves in a row build a combo; walkouts cost one of 3 hearts.

**Progression:** 7 days (First Smoke → Bird Day → The Smoke Ring → Slow Burn → Friday Night → The Pitmaster → The Critic), each with its own target, new meats/sides/sauces/woods, and a Day 7 VIP critic. Between days, an upgrade shop: Extra Rack, Sharp Knife, Calm Service, Smoke Gauge, Extra Heart.

## Controls

Mouse first (click stations), keyboard: **SPACE** chop · **W** wood · **V** vent · **E** serve · **T** trash · **P** pause · **M** mute · **1–4** select wood. Sound is synthesized WebAudio — no audio files.

## Run it

Serve `game/` from any static server and open `game/index.html` in a desktop browser. No network, no build step, no libraries — plain ES modules and canvas, all art drawn in code.

```sh
# hand the entry in (writes game/, screenshots/, dossier.json to /output)
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

See [METHOD.md](METHOD.md) for the build, the references it was built against, and the playtest record.
