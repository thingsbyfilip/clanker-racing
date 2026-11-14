# AI test scripts

These scripts run real races in Node with no browser, using the game's own scripts. The game does not load this folder, and the scripts do not change any game files.

## Running

From this folder, with Node installed:

```
node t9.js medium
```

A race takes a few seconds; a script that covers every level takes several minutes. The scripts print to the screen; to keep a result, redirect it into `out/` (ignored by git), e.g. `node t9.js medium > out/t9_medium.out`. Results repeat exactly on unchanged code, so any result can be made again; they move when game settings or levels change.

## Files

| File | What it is |
|---|---|
| `h.js` | The harness. `boot(search)` loads every script listed in `index.html` plus the inline game code into a Node `vm`, with stubbed DOM and GL. `search` is the URL query, e.g. `?level=carrier&diff=medium`. `run(ctx,code)` runs code inside the game's global scope. |
| `probe.js` | The measuring code, loaded into the game's scope by `boot`. The functions below come from it. |
| `cutprobe.js` | `cutTest(level,w)`: AI-only quality report for `cutCorners`: time, hits, respawns, gates missed, off-road. |
| `lgprobe.js` | Low gravity (`js/ailowg.js`) and general AI measuring: `lgTest(level,diff,tweak)` (AI-only race: damage by cause, wrecks with place, car and lap, airtime, off-road share), `lgTrace` (one car's state every 0.1 s over a stretch), `lgCaps` (where the speed caps bind), `botRun` (the racing-line bot, optionally braking for the caps). |
| `reactprobe.js` | Reaction delay: `rxTest` (lgTest plus steering weave and reversals), `rxKick` (AI-only race with a shove and/or spin every 3 s). Loaded after `lgprobe.js`. |
| `t6.js` | Checks of `?ai` and `?opponents` through the real `frame` loop, plus a regression check on the AI and bot times: `node t6.js`. |
| `t9.js` | Every track with `cutCorners` off and on at one difficulty: `node t9.js medium [w]`. |
| `t11.js` | Real races (rubber band and aggression on) with the racing-line bot, `cutCorners` off and on: `node t11.js medium`. |
| `t12.js` | `lgTest` on chosen levels: `node t12.js medium titan,mars,moon`. |
| `t13.js` | AI time (no rubber band) against the racing-line bot alone, per level: `node t13.js <diff> [levels] [tweak json]`. |
| `t14.js`, `t15.js` | AI against the plain and the cap-aware bot: alone (`t14`) and in real races (`t15`): `node t14.js <diff> <levels>`. |
| `t16.js` | `rxTest` on every level: `node t16.js medium all '[{"reaction":0}]'`. |
| `t17.js` | `rxKick`: `node t17.js medium all '[{"reaction":0},{}]' 4 0.5` (shove m/s, spin rad). |
| `t18.js` | Real races against the racing-line bot, with car contacts: `node t18.js hard all '[{"reaction":0},{}]'`. |
| `tdiff.js` | Difficulty rows and the level's `LEVEL_AI_MULTIPLIERS` adjustments on and off; per config an AI-only race and a real race against the racing-line bot: `node tdiff.js <level> [configs]`. |
| `tlai.js` | AI-only times for one level and difficulty under a list of tweaks, `LEVEL_AI_MULTIPLIERS` off: `node tlai.js carrier medium '[{},{"cutCorners":1}]'`. |
| `trace.js` | `lgTrace` from the command line: `node trace.js <level> <diff> <s0> <s1> [car] [tweak json] [lap]`. |
| `q.js` | Runs a snippet file in the game's scope: `node q.js <level> <file>`. |

## Main functions in `probe.js`

| Function | What it does |
|---|---|
| `trackStats()` | Length, width, grades and corner share of the loaded level. |
| `probeRace(o)` | A full race against the AI, with telemetry. `o.bot` is `'expert'` or pursuit; `o.kc` is the corner speed factor. |
| `aiOnly(level,tweak)` | AI times with the player frozen and non-colliding. `tweak` overrides `DIFF` fields for that run. |
| `solo(level,o)` | The bot alone on the road. |
| `soloHits(level,kc)` | Lists each wall hit: place, speed and grade. |
| `offLine(level,lat,offMul)` | Holds the car at a lateral offset for a lap, to measure the off-road penalty. |
| `aiRoute(level)` | The AI's real distance per lap, centre offset and off-road share by grade. |
| `nitroUse(level)` | Nitro seconds and bursts, and what blocks a burst while the tank is ready. |
| `aiLooseNitro(level)` | AI times with `clearRun` reduced to its jump check. |
| `lineRacing`, `lineEdge`, `lineSpeeds` | Build a smoothed racing line or a crude edge-hugging line, and the corner speeds along it. |
| `routeRun(level,o,withAI)` | Drives a line, alone or in a real race. |

## How it works, and its limits

- A tweak only resets the keys the difficulty table has: a key that is not in `DIFFICULTIES` stays set for the later runs of the same process, so give such keys in every tweak or run one tweak per process.
- `aiOnly` turns the rubber band and aggression off only if `tweak` says so; for the AI's own pace use `{behindBoost:0,aheadSlow:0,aggression:0}`.
- Tests that change `clearRun` or `stepCar` swap the function in the game's scope for that run and then restore it.
- All drivers are rule-based bots, so none of them shows what a skilled human could do. `lineEdge` is too crude to judge a human's edge-hugging style, and it does nothing on tracks without a bend slow enough to trigger it.
