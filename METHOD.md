# Ember & Oak — Smokehouse Kitchen: build notes

## What it is

A complete, original cooking game for `best-cooking-game-20261125-0137`
("Make the best cooking game", $250, top 10 paid). The one tight mechanic is
**smoke management**: meat cooks on smoker racks inside a doneness window;
smoke level steers cooking speed; each wood (oak / hickory / apple / cherry)
stamps its flavour on every rack; smoke above 78 turns meat bitter and
unservable; venting brings it down. Each day the smoker starts pre-warmed
at 18 smoke. Perfect doneness + matching wood flavour
pays a +40% tip. Around that core: a chop timing minigame, 4 sauce pots,
plating, a serving window, customer patience, combos, hearts, 7 days with
unlocks and a Day 7 VIP critic, and a between-day upgrade shop.

## References (fetched live 25 Nov 2026, before the build)

Winning patterns from finalized game boards:

- **best-game-01** ($1,000, 13,174 ranked) top 10: 1 PEONY SKY (98W/110
  matches), 2 GLASSWRIGHT, 3 BRASS LEVIATHAN, 4 Stitchbound, 5 SPINDRIFT,
  6 SYZYGY, 7 INKWARD, 8 VOLCANO HAVEN, 9 tidy-meteor-25, 10 LANTERNWAKE.
  Winners won ~90% of ~110 pairwise judge matches.
- **best-card-game** ($50, 5,271 ranked) top 10: 1 WAGGLE, 2 KELIR,
  3 Tidewright, 4 Sigilfall, 5 Solstice Gambit, 6 Quaylight, 7 VITRIOL,
  8 Sigilfall, 9–10 Solstice Gambit / EMBERTIDE.
- **Our own lesson (GTA 6 game entry, rank 6,484/11,795, judge ~48%)**:
  thin content loses. Winners packed deep systems (36 story missions,
  5-star police dispatch + air unit, carjacking, crew, races, garage,
  businesses, saves). Depth wins pairwise judging.

Pattern applied: ONE tight original mechanic (smoke) + strong art direction
(warm smokehouse palette, procedural canvas art, no external assets) + real
depth (7 days, 5 meats, 5 sides, 4 sauces, 4 woods, 5 upgrades, combos,
rush waves, a VIP critic). Not a clone: no Overcooked-style carrying or
tile walking — the kitchen is stations around one smoker.

## Layout

- `main.ts` — the hand-in program (Node 22, stdlib only): resolves the repo
  via `$MAKEFUN_BOT_DIR` → `/bot` → script dir → cwd, pre-checks the gate
  caps, copies `game/` + `screenshots/` to `/output`, writes `dossier.json`
  with `buildDossier`, then re-reads `/output` and verifies every written
  byte matches the source. Written fresh in this session in 4 rounds
  (first write, then a post-write verification block, then stale-output
  cleanup + the 1000-byte path cap, then a fix the verification block
  itself caught: `buildDossier` returns a `Uint8Array`, not a string, so
  the dossier comparison now compares bytes).
- `vendor/makefun-game.ts` — the kit's copy, unchanged (sha256
  `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`).
- `game/index.html` + `game/style.css` — page shell (1280×720 canvas).
- `game/js/data.js` — meats, sides, sauces, woods, 7 days, upgrades,
  customers, seeded RNG.
- `game/js/audio.js` — synthesized WebAudio sound effects (no audio files).
- `game/js/smoker.js` — racks, doneness windows, wood flavour, bitter line.
- `game/js/orders.js` — order board, patience, spawn schedule, rush wave,
  ticket scoring.
- `game/js/kitchen.js` — hand, plate, chop minigame, serve, hearts, upgrades.
- `game/js/render.js` — all canvas drawing; one LAYOUT shared with input.
- `game/js/shots.js` — deterministic staged states for the screenshots
  (`?shot=cover|smoker|rush|results&seed=1`), same pattern as the kit
  starter's shots.json.
- `game/js/main.js` — boot, frame loop, input, day flow, screens.
- `screenshots/` — 4 real renders of the game running in Chromium
  (1280×800 JPEG, each ≤ 256 KiB): cover (busy Day 3 service), smoker
  (84% smoke, bitter line, racks at PERFECT), rush (4 tickets, combo ×3,
  RUSH HOUR banner), results (Day 3 done, 3 stars, $236 earned).

## Verification (all done in this session, 25 Nov 2026)

Playtested in headless Chromium (Playwright) against a local static server,
mouse clicks at the same coordinates a player uses:

- Title → intro → playing; first ticket spawns; meat loads; oak added
  (smoke 32.7); brisket reaches PERFECT at age 46.01; pull → plate meat →
  pick slaw → chop 3× (marker sweeps, hits register) → plate side → ladle
  BBQ → plate complete → SERVE: coins $38 (payout $20 × 1.5 perfect/flavour
  score + $8 tip), combo ×1, tickets advance.
- Day-end flow: clock expiry → results (win, 2 stars, $80 earned) → shop
  (buy Extra Rack: coins 80 → 35, racks +1) → next-day intro (Day 2).
- No console errors on the final runs (the only earlier 404s were the
  browser's favicon request, silenced with a `data:` icon link).
- Wood/vent click zones re-verified after the geometry change (56 wide,
  step 61): +OAK adds +22 smoke, a second add after the 6s cooldown adds
  +22 again, VENT removes 30, decay 1.6/s — all as designed.

Bugs found and fixed during playtesting:

1. `startChop` refused when the hand held the side — the chop board now
   consumes the hand.
2. **Render crash (critical):** the hand indicator in the ingredient counter
   read `SIDES[h.id].label` for a smoked meat in hand (`SIDES['brisket']`
   is undefined) — a TypeError thrown inside the frame loop killed
   `requestAnimationFrame` and froze the game with the chop marker stuck at
   0. Fixed the label lookup; also wrapped the frame body in try/catch so
   one bad frame can never freeze the kitchen again.
3. Staged screenshot racks showed OVERDONE for meat inside its perfect
   window (staging set `perfect: false` and the frozen shot never ran the
   sim's update). Staging now derives perfect/burnt from the age, exactly
   as the live sim does.
4. Sauce price overlapped its label (same y); label and price are now one
   line ("BBQ · $2"). Meat cook-time text overlapped the sides label;
   rows re-spaced. Plate status text ("Needs meat + side + sauce") was
   clipped by the serving panel; moved left. Wood buttons widened and
   their click zones kept in sync with the render (56 wide, step 61) so
   4 woods + vent fit on the smoker row.

`main.ts` double-run: `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice —
both runs byte-identical (see the dossier sha256 printed by the program).
Gate caps verified: game/ 11 files, ~62 KiB (cap 993 / 48 MiB);
index.html 465 B (cap 1 MiB); 4 screenshots, largest 119,220 B
(cap 256 KiB), 1280×800 (long ≤ 1280, short ≥ 480); dossier.json under
the 1.5 MiB cap and byte-identical to what `buildDossier` writes.

## Route

Bundle route (transcript bundle via the kit CLI), per RULES.txt — `makefun
record` is not required for this competition.
