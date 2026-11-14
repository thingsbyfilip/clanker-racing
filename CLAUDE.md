# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Clanker Racing, a retro off-road racer originally inspired by *Big Red Racing* (1996), written in plain JS + hand-written WebGL 1. There is no build step, bundler, package manager, linter or test suite. `summary.md` is the player-facing overview: gameplay, controls, difficulty, and what each level has that the others do not. `README.md` is the brief front page. This file is the technical side.

## Running and debugging

Open `index.html` directly in a browser (`file://` works). Scripts are classic `<script src>` tags, **not ES modules**, because modules are blocked on `file://`. Keep it that way.

Unless mentioned otherwise by the user, assume there is no git repository and keep a copy before large edits. Do not attempt to commit or push anything unless explicitly requested by the user. Line endings differ by file: `js/audio.js`, `js/hud.js`, `js/particles.js`, `js/render.js` and `js/world.js` are CRLF, everything else is LF. Keep each file as it is; a scripted multi-line replacement must match `\r\n` in the CRLF files.

Debug URL params:

- `?level=<id>`: any id in `LEVEL_ORDER`; skips the menus and the locks.
- `?auto`: full throttle; also skips the menu.
- `?at=<0..1>`: start position along the track.
- `?speed=<units/s>`: starting speed.
- `?dmg=<0..1>`: starting damage.
- `?cam=<side distance>`: side camera.
- `?hold`: freeze the simulation and hide the countdown text, for screenshots.
- `?pos=x,z[,yaw]`: put the car anywhere.
- `?chase=<distance behind>,<height above>`: chase camera override, e.g. `chase=140,70` for an aerial view. Combine `?pos=` and `?chase=` to look at scenery from a distance.
- `?look=x,y,z`: the camera looks at that point instead of the car (with `?pos`/`?chase`, to frame scenery).
- `?warm=<seconds>`: a pure-pursuit bot drives the player, with the opponents, for that long before the first frame; for screenshots of traffic and light trails.
- `?diff=exploration|easy|medium|hard`: difficulty, not remembered.
- `?bench=<max seconds>`: runs a whole race headlessly with a bot driving the player and writes a `BENCH {json}` summary (times, damage dealt, wrecks) into a `<pre id=bench>`, readable with `--dump-dom`. `?pace=<speed>`, `?bnitro` and `?expert` choose the bot: a plain pursuit bot, with nitrous, or one that brakes ahead of bends from `cornerProfile`.
- `?opponents=false`: spawns nobody (default true).
- `?ai`: skips the menus and hands the player's car to `aiDrive`, the opponents' driver, for the chosen difficulty, with every opponent rule (`isHuman` false: bonuses, damage factors, nitrous tank, no slowdown from fire). Only the rubber band and aggression are missing, having no player to measure against. Keys only pause. In exploration it borrows easy's settings.
- `?ftest`: a scripted check of the after-finish rules (see Damage).
- `?tut=<1..8>`: shows that tutorial tip for good on any race (with `?hold` too), for screenshots.
- `?cutscene=<level id>[,<seconds>]`: plays that level's cutscene at once (`?cutscene=ending`), from the given time; with `?hold` a still of that moment.
- A finish under `?opponents=false` or `?ai` records nothing. `?warm` and `?bench` keep their own bots.
- `SHOW_COLLIDERS_IN_GAME` (config.js, only with `DEBUG_MODE`): every collision shape drawn see-through at the height it collides (`buildColliderMesh` in mesh.js, uploaded by `loadLevel`, drawn after the cars in `render`): circles orange, walls cyan, boxes magenta, heights set by hand yellow, shapes with no height red to 40 m, the cars' own circles (`CAR_DISCS`) green. Both must be off for a release.

Headless smoke test (checks for JS errors and produces a screenshot), run from the project folder. Chrome needs an absolute `file://` URL (with a relative path it reads the `?` parameters as part of the file name), so build it from the current folder. Git Bash:

```
chrome --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=960,540 --enable-logging=stderr --v=0 --virtual-time-budget=12000 --screenshot=out.png "file:///$(pwd -W)/index.html?level=rome&auto&at=0.3"
```

PowerShell: the same flags, with the URL `"file:///$((Get-Location).Path -replace '\\','/')/index.html?level=rome&auto&at=0.3"`.

Ignore the "GPU stall due to ReadPixels" console messages. SwiftShader is slow on heavy views (big mountains, dense cities, crowded markets): use `?hold` with a small `--virtual-time-budget` (10-50) and allow up to 3 minutes; a budget of 300+ on such a view can make the screenshot never finish. Retry if headless Chrome hangs at start-up. Headless Chrome is also slow on cutscenes: Playwright over a local `python -m http.server` (Playwright refuses `file://`) can seek with `csBegin()` + `csStep(1/60)` in a loop, then `csCamera(); render(); csHud()`.

Balance and AI work: run `?bench` in the Node `vm` harness in `ai_test_script/` (`h.js` loads the real scripts with stubbed DOM and GL, about 5 s per race; `README.md` there lists the scripts) rather than in headless Chrome, which times out on it. Calibrate with one run first. Results repeat exactly on unchanged code.

## Architecture

All scripts share one global scope (top-level `const`/`let`/`function` are visible across files), so there are no imports. Load order in `index.html` matters only for code that runs at load time (e.g. `gl.js` builds car meshes with `Mesh` and `RACER_COLORS` at load); everything else is looked up at call time. Files in load order:

- `index.html`: the markup and CSS of every screen, and the **core gameplay** inline: car state and `stepCar` physics, race and checkpoint rules, the AI opponents (`aiDrive`, `stepAI`, `levelAI`, `spawnAI`), the camera (`cam`; `cam.target`, when set, is the point it looks at instead of the car), `handleEvents`, and the `frame` loop (fixed 1/60 s step). Gameplay changes go here. While `paused`, `frame` skips the simulation and the engine sound and only redraws the last state, so nothing needs to be saved or restored.
- `js/util.js`: matrices (`M4`), clamp/lerp, angles, seeded RNG and value noise (`fbm`, `vnoise`).
- `js/config.js`: every tunable setting and switch, each documented where it is defined: debug switches, version, saving prompts, laps, feature switches, nitrous, menu options, default key bindings, progression, the damage block, `DIFFICULTIES`, `LEVEL_AI_MULTIPLIERS`, cutscene options and the rendering settings at the end. It is the only place that holds their current values.
- `js/save.js`: the saved game (see Saved game and progression).
- `js/world.js`: the shared world arrays (`track`, `GATES`, `JUMPS`, `RIVERS`, `BRIDGES`, `LAKES`, `colliders`, `rects`, `walls`, the `H` height-field and its per-vertex data) and the level build (`buildLevelData` = `buildLevelFeatures` + `buildLevelTerrain`); height queries (`hAt`, `hAtY`, `bridgeDeckAt`, `groundInfo`), `nearestTrack`, `findBridges`, `wallRun`, `inLava`, `waterAt`. `TW`/`HALFW` (road width) are `let`s reset per level: read them at call time, never cache them at load.
- `js/mesh.js`: the `Mesh` builder and the generic builders `loadLevel` calls: terrain (`buildTerrainMesh`), water (`buildWaterMesh`, `clipToMap`), decor, marks and glow, the terrain beyond the map (`buildSkirtMesh`, `buildSkirtTexture`, `buildSkirtWater`), `fitCollisionHeights`, `buildColliderMesh`, `wallWindows`/`dayWindows`.
- `js/level_registry.js`: `LEVELS` and `LEVEL_TABLE`, the single source of the track order and of how many cleared tracks unlock each track (`LEVEL_ORDER` is derived from it). A level left out of the table can still be loaded with `?level`.
- `js/levels/props.js`: the older shared scenery helpers (`bridgeDecor`, `beam`, trees, rocks, ...).
- `js/levels/common.js`: the helpers the newer levels share: track building (`closedSpline`, `filletLoop`), calm stretches for gates and jumps (`calmS`/`calmLayout`, `crossingZones`), scatter (`roadDist`, `clearOfRoad`, `roadside`, `beyondPlayfield`), generic props (`orBox`, `cylY`, `frustum`, `gable`, `strut`, `ball`, `vehicleProp`, `semiTruck`, `ferrisWheel`, `footprint`, `lowGround`, `slopeFrame`/`slopeBox`/`slantPrism`), collision helpers (`wallBox`, `solidCone`, `roadObstacles`), water (`makeRiver`, `makeLake`, `levelRivers`, `riverShape`, `waterDist`), `limitGrade`, puddles (`makePuddles`, `puddleHit`, `drawPuddles`), road furniture (`markStrip`, `barrierRun`, `sharpBends`) and lettering from quads (`wallText`, `pixelText`).
- `js/levels/<id>.js`: one level each, registered as `LEVELS.<id>` (see Building a level). Helpers used by one level live in its own file; a level may reuse another's helpers, since they are all global.
- `js/levels/ending.js`: `LEVELS.ending`, the ending cutscene (a level with a `cutscene` script, not in `LEVEL_TABLE`). All its content (script, props, timings) stays in this file.
- `js/carmodel.js`: the buggy model, shared by the player and the opponents in other colours, and its wheel.
- `js/gl.js`: WebGL setup, shaders (including the skirt shader `skirtProg`), mesh drawing, the car meshes, the low-res framebuffer, and `loadLevel(id)`: `buildLevelData`, then the terrain, decor, water, marks and glow meshes, `bakeFirelight`, `fitCollisionHeights`, the skirt, the minimap, and a level's moving meshes (`dynGL`).
- `js/input.js`: every device turned into actions (see Menus and input); `setTouch`/`isTouch`, `hasMouse`.
- `js/audio.js`: a small synth: engine drone, one-shot beeps and noise effects, the horn `vuvuzela()`, the cutscene voices.
- `js/particles.js`: soft sprite particles and the car and explosion effects that feed them (`explode`). Particles have `to` (end colour) and `hot` (fire: drawn after the smoke, not dimmed at night); `MAXP` caps them.
- `js/render.js`: the per-frame drawing: shadows, the night headlight (`updateHeadlight`), sky, world, cars, and the underwater tint (`drawUnderwater`).
- `js/trails.js`: light trails (`theme.trails`): a ribbon of the newest points behind every car in its own colour, drawn additively, purely visual.
- `js/fx.js`: level effects: fire, smoke, sparks, lasers, firelight (see Level effects).
- `js/aicuts.js`: the opponents' shortcuts (`cutLine`, see Difficulty and the AI).
- `js/ailowg.js`: the opponents' landing speed limits on low-gravity levels (`lowgCaps`).
- `js/hud.js`: the race HUD and the minimap (`buildMinimap`, `renderMinimap(c,S,res)`, also used at a higher `res` for the menu's track preview).
- `js/tutorial.js`: the first played level and its tips (see First played level and tutorial).
- `js/cutscene.js`: the cutscene player (see Cutscenes).
- `js/cookie.js`: the spinning cookie of the save question, a small software rasteriser on its own canvas (`showCookie`).
- `js/flags.js`: `FLAGS`, the vector art beside a track's location in the menu (ISO country codes plus a few regions and symbols; our own art, never emoji).
- `js/menu.js`: every menu screen, `DIFF`, `startLevel`, the credits (`CREDITS`: when a font or other source is added, credit it there).
- `fonts/`: Kanit Bold Italic and Titillium Web, with their licences.
- `ai_test_script/`: the Node harness and the measuring scripts for the AI and the difficulty; the game never loads it.

## Building a level

A level is a data-plus-hooks object `LEVELS.<id>` in `js/levels/<id>.js`. To add one: create the file, add its `<script>` tag in `index.html` (after `common.js`, before `ending.js`), and add `[id, tracks needed to unlock it]` to `LEVEL_TABLE` (its place sets its grid cell; past 24 levels the grid scrolls by itself). A requirement above the number of other tracks can never be met.

How `buildLevelData(id)` uses the object, in order. It **refills the shared world arrays in place**: the rest of the game keeps the same global names whichever level is active, so never reassign them, only mutate them.

1. `trackPts()`: `M` (900) points of a closed loop, the road's centre line (`closedSpline`, `filletLoop` help). The track samples get tangents and `s`, the position along the lap (0..1); `TL` is the lap length. `tw` sets the road width (default 30); the AI's lanes shrink on narrow roads.
2. `layout()`: `{gates:[s,...], jumps:[[s,height,slope length?],...]}` (a shorter slope is steeper). The finish line at `s=0` is added as the last gate. Gates and jumps must sit on calm stretches, never on a bend or in each other's take-off or landing zone (`calmS`/`calmLayout`, `crossingZones`). A level with a raised deck sets `deckAt` here, before the gates get their height.
3. `prepare()` (optional): rivers, lakes, bridges (`findBridges(profile)`) and anything else the terrain needs to know.
4. Terrain: for every vertex of the 176x176 grid (6 m cells, shared by physics and rendering), `base(x,z,roadHeight,d)` (`d`: distance to the road) gives the height and `shape(x,z,h,d,s,k)` (optional) reshapes it (river valleys, flat ground under decks); `rim` raises the map's edge. `profile(s)` is the road height along the lap (add `jumpsSum(s)` for the jumps); cap its grade with `limitGrade` on every road that climbs, because the AI and a human stall above about 0.25.
5. `loadLevel` then builds the meshes: `color(c)` colours each terrain triangle (`c` holds `d`, `s`, the triangle's centre, height, normal, river and bridge flags); `decor(m,rnd)` adds the scenery and pushes its collision shapes; `marks(m)` (road paint, kerbs); `glow(m)` (emissive light pools; built after decor, because lamp positions are collected during decor). `m.em=true` while adding to a `Mesh` marks emissive geometry (lit windows, lamps).
6. `mapBg`/`mapFg` draw the minimap's art under and over the road.

The rest of the object: `id`, `seed` (the decor's RNG), `name`, `sub` (subtitle under the countdown, see `SHOW_LEVEL_SUB`), `go` (replaces the GO! of the race start, not the one after a respawn; one ending in `.wav` also plays `vuvuzela()`), `blurb` (the menu description, see Track select menu), `loc`/`flag` (location line in the menu; an id in `FLAGS`, else the Earth placeholder), `theme` (lighting, fog, sky, sun or moon `body`, ground colours, dust, minimap colours, effects; see Sky and atmosphere), `phys` (the grip and drag table, `g` for gravity), `iceAt(x,z,nt)`, `ai` (see Difficulty and the AI), `ending` (see Cutscenes), and the optional hooks of the sections below.

Rules every level follows:

- Collision: scenery collides through circle `colliders`, box `rects` and line-segment `walls`, pushed by `decor`. Fences and rails must use `wallRun(pts,r,kind,deckY)`, never a row of circles: any spacing leaves a gap a car slips through, and then it is stuck behind the wall. Make a shape's footprint match what reaches the ground (see Collision).
- Ground: stand buildings on the lowest ground under them (`footprint`; `lowGround` for round props) so nothing hangs in the air; `wallWindows` places windows only above the local ground. Parked vehicles follow the slope (`vehicleProp`, `semiTruck`).
- Horizon scenery inside the map's square needs collision too: rings at a radius of 560-650 reach inside it towards the corners. `beyondPlayfield` places things safely outside; `solidCone` gives a horizon hill drawn with `m.cone` a collision of fixed height.
- Flicker: build long boxes end to end as one strip (`beam`), never as touching separate prisms, and never put a flat quad a hair above a coplanar one: both flicker when the camera moves.
- Things lying on the road go into `LV.obstacles` so the AI steers round them (see Surfaces and obstacles).
- Ground-level colliders must never sit under an elevated deck: a car on the deck would hit them.
- Keep the design constraints from the user (end of this file).

## Engine features

### Collision

- A car meets scenery as three circles along its length (`CAR_DISCS`, radius `CAR_R`, in `stepCar`; `DETAILED_CAR_COLLISION`; the alternative is one circle round the centre, which lets the nose sink into walls). Car against car (`racerCollide`) and the AI's planning (`cutBlocked`) use one circle.
- Collision shapes have a height. `fitCollisionHeights` (mesh.js, called by `loadLevel` after decor, marks and glow are built) gives every shape `.y0`/`.y1`, the lowest and highest point of the scenery drawn inside its footprint (grown by `FIT_PAD`); `clearOf` in `stepCar` lets a car pass when it is above `y1` or wholly below `y0` (`CAR_TOP`, the car with its cage), and `cutBlocked` ignores shapes high enough to drive under. So a footprint that crosses a wing or a tail becomes a hole: outline only what reaches the ground (a fuselage, a dinosaur's legs).
- A shape drawn over ground-level geometry (road paint, kerbs) is solid from the ground up, so an elevated obstacle over a road needs fixed heights: `wallRun(pts,r,kind,deckY,y0,y1)` sets them and marks the shape `.fix`, which the fit leaves alone.
- `walls` entries 7 and 8 (`top0`, `top1`) give a wall's top at each end; a car above it passes over (the sides of a raised deck).

### Raised decks and roads over roads

- `LV.deckAt(x,z)` (height or null; must be cheap): solid raised ground that may slope. It feeds `bridgeDeckAt`, so `hAtY`, respawns, checkpoint heights, shadows and particles all follow it. Its sides are `walls` with `top0,top1`; `groundInfo` keeps a car level on it until its centre is over the edge. Pair it with `pavedAt` so the whole top counts as road, and skip road marks under it. To force cars over a section, make it wider than a checkpoint (`HALFW+7`) and put a checkpoint on it.
- `LV.slabAt(x,z)` (height or null; must be cheap): a surface to land on that the road runs under. Read only by `groundInfo`: a car above it lands and drives on it, one below drives under; respawns, checkpoint heights and the camera ignore it.
- A road that crosses itself: each self-crossing is an upper deck (a hand-made `BRIDGES` entry, flat at the deck height) over a lower road, the terrain is held flat under it in `shape`, and the level sets `TRACK_Y` (road height per sample) so `nearestTrack(x,z,y)` picks the road at the car's own height. Gates must stay out of the crossing zones.
- `LV.clipTerrain(x,z)` (null inside the outline, else the nearest point on it; used by `buildTerrainMesh`): ground of any shape with exact edges, finer than the grid; pair it with a `wallRun` rail along the same outline so cars never reach the ground's edge. Such a level gets no skirt. On a flat open deck a road can be cut anywhere, so the inside of the loop needs barriers, and every barrier must end on another barrier, the rail, or right at the road's edge, because a gap reads as a way through.

### Water, rivers and bridges

- `RIVERS` entries are water unless flagged `lava:true` (lava is drawn unlit by the level's own decor; `inLava` sets a car on fire). `LV.lavaPools` (`{x,z,r}`) are round pools draped on the ground. A round lake is a one-point `RIVERS` entry with `lake:true` (`makeLake`), drawn as a disc. `theme.water = [colourA, colourB]` tints the rivers. `makeRiver`/`levelRivers`/`riverShape`/`waterDist` (common.js) build rivers, their water levels and the terrain round them.
- `findBridges(profile)` turns every river/track crossing into a `BRIDGES` entry, and `bridgeDecor`/`beam` (props.js) build the deck.
- An open bridge: the level sets `B.leaf(a)` (deck height above `B.top` at `a` metres along the road from the bridge centre, null over the gap), read by `bridgeDeckAt`, so a raised leaf is a ramp and the gap has no deck. `bridgeDecor` skips it and the level builds it, with a wall across every free end at its own height so a car that falls short cannot climb the end face. A car in the river under an open bridge is not reset: `dunkCheck` (index.html) marks it `dunk` and off the road, and an opponent there takes `AI_OFFTRACK_DAMAGE` at once until it wrecks or gets out; the player uses BACK ON TRACK. Measure the gaps with a cruise-speed test and the AI (`?bench`/harness).
- Seas: `LV.ocean(m)` draws the sea inside the map, `LV.sea` is its level and `LV.seaCol` its colour. Water never leaves the map: `clipToMap` (mesh.js) cuts the rivers and the ocean at `HALF`. Beyond the edge the sea comes only from `buildSkirtWater` (see Terrain beyond the map). Rivers do not continue outside.
- Underwater tint (`drawUnderwater`, render.js; `UNDERWATER_TINT`, 0 is off): drawn last, over everything but the HTML HUD. The near plane is the lens: `waterAt(x,z)` (world.js) finds the water at its middle and corners, and because the near plane and the surface are both flat, the depth is linear across the screen (`uPlane`), so the waterline is an exact straight line that meets the water mesh. Colour: `LV.seaCol` or `THEME.water[0]`, lit like the surface. Lava never counts. Only seas are deep enough for the camera (5.2 above the car) to go under; rivers are about 1.9 deep. To test: `?level=volcanic&hold&pos=-496,-328,0.8` (under), add `&chase=40,9.5` (half under).

### Terrain beyond the map

`EXPAND_TERRAIN_AROUND_LEVEL`: the ground beyond the map, built once per level by `loadLevel`. Cars still stop at `HALF-8`.

- `buildSkirtMesh` (mesh.js) makes square rings out to about 30 km (`SKIRT_RINGS`), positions only; heights come from the map's edge, averaged more widely further out, with land and seabed (below `LV.sea`) kept apart so the seabed never rises through the water.
- `buildSkirtTexture` stores every terrain triangle, lit and after `bakeFirelight`, as one texel (2N x N), with roads and river beds painted out, and the skirt shader (`skirtProg`, gl.js) rebuilds the 6 m triangle grid per pixel from it. The first `SKIRT_BAND` cells mirror the map's edge, so they join it exactly; past that, each irregular patch (`SKIRT_PATCH`) reads from a random whole-cell offset, with no blending, so every triangle is a real one. A level without a sea reads the middle of the map (`SKIRT_INNER`); a sea level stays in the band, because its middle is the island. The skirt has no relief of its own and is drawn before the terrain.
- The far plane is 60000, and fog is clamped per pixel in both shaders, because the outer triangles are huge.
- Water: `buildSkirtWater` puts water in `LV.seaCol` on every skirt triangle reaching below `LV.sea`, the shore being where the skirt's ground crosses it. `LV.seaAt(x,z)` (optional) colours it from the nearest point of the map's edge, so shallows run on along a coast; `LV.oceanFar(m)` (optional) adds what floats out there. A level with `clipTerrain` gets a plain sheet of water to the same distance instead.
- To judge the skirt, park the camera over it (`?pos=1000,0,1.5708&chase=120,420`) and compare with the same view inside the map: a view that also shows the map's rim will blame the skirt for the rim's own streaks.

### Surfaces and obstacles

- Optional hooks for the surface under the car, called every step from `stepCar` (also for the AI), all of which must be cheap: `puddleAt(x,z)` (1 inside a puddle: spray and less grip; `makePuddles`), `softAt(x,z,onTrack,nt)` (1 on soft ground such as sand or mud: slower, less grip, dust colour `theme.dust.soft`), `pavedAt(x,z)` (true: ground off the road that counts as road, so `onTrack` is true there), `shockAt(c)` (from `fxHurt`: true where the ground shocks a car, which works like fire). `theme.spray` colours what wheels throw up from puddles and rivers (default pale water); night levels dim it, so it must read darker than the road there.
- Shortcuts need no race code: progress goes through the checkpoints, so keep gates out of the stretch being cut, and measure a shortcut with a bot rather than by feel, because off-road drag matters far more than `softAt`.
- `LV.obstacles` (`[[track index, lateral offset, half width],...]`, filled by the level's `decor`, e.g. with `roadObstacles(wall,list)`) tells the AI where things lie on the road. The AI, the `?bench` bot and the `?warm` bot all steer round them with `steerRound` (index.html); `obstacleAhead` shortens the AI's lookahead to the obstacle, because a long one aims past it and cuts through it; respawns step sideways out of them (`freeLat`, in `placeCar` and in `placeRacer` when the lane is 0).
- `LV.hitMul` multiplies scenery hit damage on a level.

### Level effects

`js/fx.js`. A level's `decor` registers them (`addFire(x,y,z,r,h,o)`, `addSmoke`, `addSparkSpots`, `addLaser`; the lists are emptied by `buildLevelFeatures`).

- Fire is a status: touching flames or lava, or a lit beam flagged `hurts`, sets `c.burn` for `FIRE_BURN_TIME`, which ends in one `FIRE_HIT_DAMAGE` hit (event `firehit`: a small `explode(c,k)` and FIRE DAMAGE!, or LAVA DAMAGE! and the lava wreck messages when lava lit it), then `c.fireSafe` makes the car flash and immune for `FIRE_IMMUNE_TIME`. Active sparks damage every car on contact (`fxHurt`, from `stepCar`). Smoke is visual only.
- `theme.embers` puts embers in the air; `theme.fireSmoke` is the colour smoke leaves a fire with. Long-lived smoke is capped in `fireParts` so it cannot starve the flames.
- Lasers must never strobe: slow cycle, soft edges (the timing is in config.js).
- `theme.firelight` lights a level from its fires only: an `addFire` with `reach`/`lum` (or `addFireLight`) is a light, `bakeFirelight` multiplies the vertex colours of the terrain, decor and marks in `loadLevel` (so decor is built before marks are baked; emissive geometry is untouched), `carFirelight` sets each car's ambient per frame, `drawFireGlow` adds slow breathing pools near the car.
- `hazStep` runs in every simulation (from `stepAI`), `fxEmit` only where things are drawn (`carFx`).

### Moving meshes

`LV.dynamic()` returns `{name: Mesh}`, uploaded once by `loadLevel` (`dynGL`); `LV.drawDynamic(draw,setPos)` draws them every frame after the decor (`draw(name, matrix, alpha)`; `setPos(name, Float32Array)` replaces the vertex positions first), `LV.drawDynamicGlow(draw)` in the additive night pass (alpha is the strength).

### Sky and atmosphere

Driven by `theme`: lighting (`amb`, `hemi`, `sun`, `light`), fog, the banded sky, `night`, the sun or moon `body`, `body2` (a second sky body; `mode:2` draws the Earth), `stars`, `clouds` (`{col,shade,amt}`: a cumulus bank resting on the horizon, drawn in the sky shader; `clouds.pillars`, a flat list of [bearing, height, width] for exactly three pillars, draws columns of smoke instead), `rain` (drizzle; `rainN` its density, `rainCol` its tint), `trails`, `dust` (`dust.vac`: airless dust with no drag, ballistic under the level's gravity).

### Rendering

Low-res (240 lines, pixelated upscale), flat-shaded vertices, emissive geometry marked with `m.em`. The player's night headlight (`updateHeadlight`, render.js) is draped on the ground while the car drives; in the air it blends over `HEADLIGHT_AIR_GAP` metres of height (`headlightAir`) into a rigid sheet moving with the car, which never sinks below the ground and is drawn after the cars.

### Cutscenes

`js/cutscene.js` only plays a script; a level's `cutscene` holds it: `cars` (keys `[t,x,z,{yaw,rev,ease,jump}]`, no physics: a car starting from rest leaves the way it faces, turns no tighter than about 3.5 m, and stops at a turn back or a change to reverse), `shots`, `lines`, `events`, `fades`, `start`/`update`. `race.state` is `'cutscene'` and `frame` calls `csFrame`; the body has `play cine` (letterbox, no race HUD). On the results screen every clear of a level with `ending:'<id>'` offers WATCH ENDING in place of NEXT TRACK (`startCutscene`); the end, or BACK TO MENU in its pause menu (RESUME and BACK TO MENU only, `setPauseList`; no skip button, by the user's decision), goes straight back to the menu (`csEnd`).

- Lines are typed out in `#cbox` (Kanit name, Titillium line). `CUTSCENE_TEXT_IN_PICTURE` chooses between the box low over the lower letterbox bar and the bottom of the picture just above it (the `inpic` class on `#cine`, set in `csBegin`; the bar height is `--cbar`). `CUTSCENE_TRAILS` decides if the cars leave their light trails (only on a level with `theme.trails`).
- A line's `who` is a key of the script's `speakers`, never the name on screen: the speaker's `name` is shown (rename it there), unless the line has its own optional `name`. A line's box opens with the name alone and starts typing `CS_LINE_PAUSE` seconds later. A speaker's `voice` sounds only while its line is being typed (`CS_CPS`): `'hum'` (`csHum`, a held drone, also silenced by the pause in `frame`) or `'babble'` (`csBlip`, a chirp on every other letter, pitch from the letter and the speaker's `pitch`, rising into a `?`).

## Menus and input

### Menu screens

Flow: intro > track select > race > results > track select; settings opens from the intro or track select, controls from settings or the pause menu (which, with `PAUSE_MENU_CONTROLS`, lists the race controls beside its options, `refreshPauseControls` in hud.js; with `SIMPLIFY_INGAME_UI` the HUD names only nitrous and pause, and says the pause menu has the rest). `uiStack` (menu.js) lists the open screens and `uiTop()` is the one that gets input (null during a race); `openScreen`/`closeScreen`/`closeAll` keep the DOM in step, and `showMenu(i)`/`goIntro()`/`startLevel(id)` change the whole stack. Intro, settings, pause, results and the confirmation dialog are the same component: `setList(name,hostId,items,cancel)`, items `{t,act,change,val,cls}`. Credits is a plain page (`CREDITS`). `.scrn` is a full page on the menu background (`--noise`, set by `paintBackdrop`), `.dimmed` a dim overlay with a `.box`. `USE_MAIN_PAGE` decides if there is an intro at all: without it the game starts on track select, `#mback` reads SETTINGS and `#msettings` reads CREDITS (`leftButton`/`rightButton` hold the two meanings), and cancel on track select does nothing.

### Input

`input.js` turns every device into actions. A binding is a `KeyboardEvent.code` or `Mouse0`..`Mouse4`, two slots per action (`DEFAULT_BINDS`, `BIND_SLOTS`, the list and labels in `ACTIONS`); the race reads only `inp()`, so never read raw keys in gameplay. Menus get navigation words through `uiNav(nav,rep,code)`: `navOf(code)` maps keys, `pollPad` (Gamepad API, standard mapping, polled in `frame`) maps the pad with its own repeat. Key repeats (`rep`) never confirm, cancel or start a race. Arrows, WASD, Enter, Space and Esc always work in menus, so nobody can lock themselves out by rebinding. Confirm and cancel are a separate group (`UI_ACTIONS`): keys only, and they may share keys with driving; within a group a key that is rebound moves and the old slot is cleared. `REFUSED_KEYS` are not bindable. The pad's buttons are fixed (`PAD_LABEL`, shown in the Controls table). `swallow` calls preventDefault for every bound or menu key but leaves Ctrl/Cmd shortcuts to the browser. `HINT_BACK_FIRST` puts the back / resume key first or last in the prompts; on the difficulty bar the `←` back button entry always comes before select difficulty. `hintKey`/`refreshHints` keep all hints and the HUD help in step with the bindings and the device last used.

"Reverse" is the classic brake-then-reverse (`ctl.brk`), "Brake" is the handbrake (`ctl.hb`). Mouse racing (`SAVE.mouseRace`): the cursor's side of the screen steers (`mouseSteer`), left button accelerates, right reverses, both brake, wheel click is nitrous; `#mouseBtns` gives on-screen PAUSE and BACK ON TRACK and `#msteerBar` shows the steering. The `mouserace` class is on `<html>` because `setMode` replaces the body's class.

### Track select menu

`index.html` (the `#menu` markup and CSS, sized in `--u` = 1px at 960x540 so it scales with the window) and `js/menu.js`. This is the desktop layout; see Phones and tablets for the others.

- Layout: a two-column CSS grid, centred as a block (`body.menu #menu`): the title (`#title`, gold gradient header style), the difficulty bar (`#rdiff`: 36 `--u` tall, 280 wide, centred, plain text with no frame or background: `DIFFICULTY: MEDIUM` with an arrow on each side, the arrow with nothing that way greyed out) with BACK (`#mback`) on its left and, with `SETTINGS_IN_TRACK_SELECT`, SETTINGS (`#msettings`) on its right, then one 360 `--u` tall row with the two columns, then the hint row (`#mhint`, hidden on touch screens: `(hover:none)`). `VERSION_ON_TRACK_SELECT` shows the version at the lower right (`#mver`).
- Left column: every track in miniature, 6 columns x 4 rows (`#grid`, built in `buildMenu`). Each cell (70 wide, about 86 `--u` tall) shows the square minimap in the middle with a blurred copy of itself (`.tback`) filling the rest.
- Right column: one framed panel (`#desc`), always the same height as the grid (they share the grid row; keep it that way). Top to bottom: the track number, the name (`fitName` shrinks it to one line and never lets it be bigger than `NAME_REF_LEVEL`'s name would be, so short names do not shout), the location (`#sloc`), the large map preview (`#stage`: all the height left; the minimap at high resolution with the checkpoint gates, as a square in the middle (`.mapbox`, `min(100cqw,100cqh)`) with a blurred copy (`.sback`) filling the sides; slides are built lazily), then `#info`: the numbers (`#sstats`, 2x2) and the description (`#sblurb`, `*word*` is emphasis). Keep a description to about 170 characters: its font follows the panel width (`cqw` of `#info`) so it fits 4 lines, the height of the numbers, and the longest one sets the size on a full 16:9 or squarer screen, so check the longest after writing a longer one.
- Keyboard zones (`zone`, `tracksNav`): LEFT/RIGHT (A/D) go to the previous/next track (also across rows), UP/DOWN (W/S) one row (`moveSel`; they stop at the ends), HOME/END to the first/last track; UP from the top row reaches the difficulty bar, UP again BACK; DOWN comes back. With `DIFFICULTY_NEEDS_SELECT` confirm opens the bar (`diffOpen`), LEFT/RIGHT then change it, confirm or cancel closes it, and while closed LEFT goes to BACK and RIGHT to SETTINGS; without it LEFT/RIGHT change it at once and the row skips the bar. TAB cycles the difficulty from any zone (ignores key repeats), confirm starts the race (a locked track gives a low buzz and a shake instead), cancel goes back.
- Mouse: a click on a miniature selects it, a click on the selected one starts the race; a click on the preview starts the race too (it highlights on hover; not on touch, where a finger on the preview swipes); the wheel over the preview browses; the difficulty bar's arrows change it (they stop at the ends).
- Locked tracks stay selectable: the miniature and the preview turn grey under a lock with the number of tracks needed, and the description becomes the requirement.
- Animation: CSS transitions (`.slide.cur` / `.slide.out`), off with `prefers-reduced-motion`. `MENU_ANIM` makes the preview and description slide when another track is selected; `MENU_THUMB_ANIM` makes the selected miniature grow and its frame fade in (the `anim` class on `#grid`).
- More than 24 tracks (`GRID_ROWS` x `GRID_COLS`) need no other change: `buildGridScroll` puts `.many` on `#menu` and the grid scrolls a row at a time, instantly. Each layout gives only the visible height; in `.many` the cells get shorter so the next row shows, cut and fading out (`GRID_PEEK`, the cue that there is more). Stop r shows rows r..r+3 whole; the last stop's bottom row is level with the panel and the cut row is at the top. The scrollbar (`#gbar`, `#gthumb`) is our own element in the column gap, always visible on touch. A wheel notch over the grid or the rail is one row (`wheelSteps`) and leaves the selection alone; the rail drags by rows; a finger drags the grid (CSS scroll snap); `revealSel` brings the selected row into view from `goTrack` and `showMenu` only, so TAB and other refreshes keep the scroll. To try it, repeat ids in `LEVEL_TABLE`.
- The background is a CSS navy-to-black gradient under a Perlin noise canvas painted once (`paintBackdrop`); keep it faint and static, it must not draw the eye.
- Never call `refreshMenu` during a race: it can rebuild a level's track (`ensureSlide`) in the shared world arrays.

### Fonts and the HUD

Kanit Bold Italic (display: headings, the track name, the big race text; registered in `@font-face` as its own family with one style, so keep `font-weight:400` on it) and Titillium Web (everything else; its digits are all the same width, so the timer and km/h readout do not jitter), loaded with `@font-face` from `fonts/` (works on `file://`), through `--display` / `--body` (`:root` in index.html). `#msg` (countdown, GO!, REKT, finish text; `.long` sets sentences smaller, toggled in `updateHud`; `SHOW_LEVEL_SUB` decides if the level's `sub` shows under the countdown) and `#pos` wear the gold-gradient header style. Never put live-changing numbers in Kanit: its digits have different widths. The HUD scales on windows smaller than 960x540 through `--hu` (1px at that size and above, so larger windows are untouched) and the minimap through `--mm`, in both layouts; the `.simpleui` rules (`SIMPLIFY_INGAME_UI`, the `simpleui` class on `<html>`) hold only what the simplified HUD places differently. On narrow portrait screens the lap and time move under the bars (simplified) or under the speed and level, and the controls help stays beside the bars, wrapped narrower.

### Phones and tablets

The menus work on touch screens; the race does not yet (no touch driving controls and no way to pause by touch). `MOBILE_MENU` switches all of this: without it the `#mobileCss` stylesheet is removed at load and every screen gets the desktop menus. The layouts are media queries in `#mobileCss` in `index.html`, chosen by the window's shape and size (a narrow desktop window gets them too). Each redefines `--u` and rearranges the same elements, so a change to the desktop markup or sizes carries over; check the small sizes afterwards.

- Portrait (`max-aspect-ratio:1/1`): a header row with icon buttons (`headButton` in menu.js holds the text and the icon), difficulty, the track panel, all the miniatures, RACE; tablets get their own `--u`. Short portrait (height up to 700): the map moves beside the numbers.
- Short landscape (height up to 500, or touch and width up to 800): no title and no track number, two columns, the description scrolls inside the panel; up to 600 wide there is no map, only the miniatures; the spinning cookie is hidden.
- Large touch landscape: the desktop layout, with RACE and taller buttons, and the map takes any spare height.
- `#mrace` (RACE, or LOCKED on a locked track) is shown only in these layouts: touch has no hints to explain how to start. `html.touch` (follows the last input: `setTouch`/`isTouch`) hides the focus frame and the hover colours and turns off start-by-second-tap, since a finger double-taps by accident. A swipe over the preview browses the tracks (`SWIPE_MIN`). Settings hides CONTROLS (and with it MOUSE RACING, a row of the controls screen) unless the browser reports a mouse or trackpad (`hasMouse`), on the user's decision; a keyboard cannot be detected. Tap targets are at least 44px, the padding respects the safe areas (`--pad`), and heights use `--vh` (dvh where supported) because of phone browser bars.

## Saved game and progression

- `js/save.js`: one IndexedDB record (database `clanker_racing`; cookies do not work on `file://` in Chrome) with `beaten` (level id > index into `DIFFICULTY_ORDER` of the hardest difficulty cleared), `unlockAll`, `difficulty`, `mouseRace`, `binds`, `consent`. `SAVE` is the live copy; change it, then `saveGame()`. It loads asynchronously (`loadSave`, at most 1.5 s), so the menus wait for it while the debug starts (`?level`, `?auto`) do not. `saveFailed` shows a note in Settings.
- Consent (`COOKIE_WARNING`): the database is neither created nor written until the player says yes. `askSaving(then)` (menu.js) asks once a session and never during a race, at the moments the `COOKIE_WHEN_*`/`COOKIE_AFTER_*` switches choose (after a cleared track: `saveDue`; after settings changed: `settingsKey`, `askOnMenu`). Settings and the race wait for the answer; neither button starts focused (list index -1), so confirm does nothing until one is hovered or chosen with the arrows; a no is not stored, so the next session asks again. A record without `consent` is read but not written until the player agrees.
- DELETE SAVED DATA (settings) clears `beaten` and `unlockAll` and removes the whole database (`deleteSave`), so the question comes again. With no database (the player said no, or was not asked yet) it clears only those two, leaving the controls and the answer; with no progress either the row is the greyed NO DATA SAVED (`deleteItem`; a player who said no gets DELETE PROGRESS and NO PROGRESS SAVED instead). Without `COOKIE_WARNING` it clears those two and keeps the rest. UNLOCK ALL TRACKS exists only with `DEBUG_MODE`.
- Unlocking: `tracksNeeded(i)` reads `LEVEL_TABLE`, `isLocked` compares it with `beatenCount`. A finish at `CLEAR_PLACE` or better clears the track on any difficulty (`recordFinish`, called from the `finish` event in `handleEvents`, so `?bench` writes nothing); the star is bronze, silver or gold for the hardest difficulty. `NEW TRACK(S) UNLOCKED` and, on the clear that completes every track (`won` from `recordFinish`, once only), the congratulations (`#rwin`) appear on the results screen, which opens `RESULTS_DELAY` seconds after the finish. NEXT TRACK (`SUGGEST_NEXT_TRACK`) returns to track select with the next unlocked track selected; it does not start the race.

## Difficulty and the AI

`DIFFICULTIES` in `js/config.js` (exploration/easy/medium/hard, documented field by field there) is the single source of the settings. `DIFF` (menu.js) is the chosen one, picked in the track select menu and kept in the saved game; `?diff=` overrides it. `DIFFICULTY_ORDER` holds only the three that can clear a track, because `SAVE.beaten` stores an index into it (never reorder it); the bar and TAB use `DIFFICULTY_MENU`, which adds exploration in front.

- `levelAI` (index.html) builds `AID`, the opponents' settings, at every `startRace`: the difficulty, times the entries of `LEVEL_AI_MULTIPLIERS` the level lists in `LV.ai` (each `{field: multiplier}`, the same for every difficulty and tuned against Medium; 0 turns a field off; `lookMul` and `laneMul` exist only there and count as 1 when absent). No per-difficulty values, by the user's decision. The AI reads `AID`, never `DIFF`, for its own fields (`spawnAI`, `aiDrive` via `stepAI`, `cutLine`, `?ai`); the player's side reads `DIFF` (`hurt` scales damage, `stepCar` the nitrous refill and wait).
- `aiDrive` (called from `stepAI`): AI speed (`c.vmul` scales engine power and top speed in `stepCar`), the rubber band (metres of road to the player), nitrous on `clearRun` straights (`PREVENT_FINAL_BOOST`: no new burst on the final lap past checkpoint 6), aggression (lane steering into the player), `cornering` (`cornerSpeeds`, a braking profile of the road; 0 is the original reactive braking), `cutCorners`, road holding (`gripMul`, `offMul`), recovery and start delay. The original game's AI (no nitrous, cornering, shortcuts or aggression) is still expressible in the fields (`nitroStart` above 1 disables nitrous).
- Calibrate by measuring (`?bench` in the harness), not by feel: a flat-out car only reaches about 47 m/s, so `speed` multipliers must be small.
- `cutCorners` (`js/aicuts.js`, 0 off): `cutLine(w)` plans one line per level at `startRace`, and `aiDrive` only reads its arrays (`lat`, `v`, `room`). The plan is the fastest lap (`cutPlan`, dynamic programming) over straight chords between two track samples. A chord must be clear of everything on a blocked map (`cutBlocked`: colliders, walls, rects, fires, spark spots, lava pools, `LV.obstacles`, each inflated by the car), pass every checkpoint within `CUT_GATE`, skip no ramp and no other stretch of road (`cutNearest`), and stay off deep off-road, soft ground, ice, water, lava, `LV.shockAt` and steep ground (`cutWalk`). The line, its lookahead and its speed all scale with `cutRoom`, the free ground outside the bends: between walls the extra lookahead and the lane shift go to zero, but the braking speed stays `min(cut.v, cornerSpeeds())`. Keep that rule: it is what keeps walled tracks from getting slower or crashier. A shorter steering lookahead is much slower (pursuit is how the AI cuts corners), a longer one needs the room, and higher `w` is not faster. A scenery object where the opponents swing wide or cut across changes their line, so recheck `cutLine` after moving one near the road. Measure with `ai_test_script/t9.js` and `t11.js`.
- `reaction` (seconds, times each driver's `rx` in `AI_DEFS`): `aiSees` (index.html) hands `aiDrive` its own car and the player as they were that long ago, carried forward by a forward model of the driver's own commands since then (wheel, pedals, nitrous, plus the felt drag of sand or a climb), so plain driving barely loses and only surprises (spins, slides, walls, the player's moves) are met late. Never use a plain delay without the model: the bang-bang brake then pumps and the AI loses 5-10%. Bend speeds are read at the modelled position (`P.ia`). 0 is exactly the old AI. Measure with `ai_test_script/t16.js`, `t17.js`, `t18.js`.
- `DIFFICULTY_LOW_GRAVITY_ADJUSTMENT` (`js/ailowg.js`): on levels whose `phys.g` is below `LOWG_FROM` of Earth's, `lowgCaps` (planned at `startRace`) gives a speed cap per track sample, the fastest take-off that still lands on the road, and `aiDrive` brakes for it on every difficulty; Earth levels are untouched. Take-off at a lip is decided within one frame by `stepCar`'s 7 cm stick rule, so the plan tests that rule at every point of a fine rail and flies each possible take-off, rather than driving a ghost lap (which only sees one phase of the frames). Measure with `ai_test_script/t12.js`.
- Per-level adjustments are measured with `ai_test_script/tdiff.js` and `tlai.js`.
- Exploration (`explore:true`) is the level without a race: `spawnAI` adds nobody, `updateRace` stops after the clock (no `checkGates`, no wrong way), `respawnIndex` ignores the next checkpoint, `stepCar` keeps the tank full, the HUD says EXPLORATION MODE with no place, and the minimap's gates are all one blue. It never finishes and never clears anything, so `passGate` must stay unreachable there (the debug V key is off). Damage, wrecks, hazards and the countdown work as in a race; with no laps there is no lap repair. Locked tracks stay locked. `?bench` on it just runs to its time limit.

## First played level and tutorial

The first played level is any race started while `SAVE.beaten` is empty (`firstLevel` in `js/tutorial.js`; never in exploration, `?ai`, `?bench`, `?warm` or `?ftest`). `FIRST_LEVEL_EASIER` adds `harderTurns` to the level's `LV.ai` in `levelAI` (not twice). `FIRST_LEVEL_TUTORIAL` shows eight tips (`TUT_TIPS`) in `#tut`, large at the bottom between the car and the controls help, during the first race on each level of the session (`tutSeen`; a retry gets none), only on levels open from the start (0 tracks needed in `LEVEL_TABLE`). One at a time, paced by checkpoints passed, never started while wrecked; `tutStep` runs from `updateRace`, `tutHud` from `updateHud`. Key names come from `hintKey` (pad buttons, rebinding; mouse racing names the mouse's way). Each tip has a symbol on both sides, centred on the text (`TUT_ICONS`: our own vector art like `FLAGS`, never emoji; a navy outline drawn by the `.ol` copy, a red offset shadow, popping in with the tip; the art faces right and `mir` mirrors the left-hand copy, so both face away from the text; keep only the icons a tip uses). The player-facing word is "nitrous"; the code keeps the `nitro` names (`car.nitro`, `NITRO_*`, the binding `nitro`).

## Damage

Every car (the player and the five opponents) has `damage` 0..1 and is wrecked at 1 (`hurt` in index.html, explosion via `explode(c)`, back on the road in `afterWreck(cr)` after `WRECK_TIME`). All the numbers (scenery hits, landings and large falls, car against car, fire and lava, opponents stuck or far off the road, lap repair) are the damage block of `js/config.js`. Opponents never teleport when stuck: `stepAI` damages them (`AI_STUCK_DAMAGE`, `AI_OFFTRACK_DAMAGE`) until they wreck. Cars that crossed the finish line are indestructible but stay solid (`racerCollide` only skips wrecked cars); finished opponents coast to the road edge.

## Design constraints from the user

Level design rules: do not use people as decorations (animals are fine), and do not depict readable text (abstract signs and symbols on signs are fine).

Avoid copyrighted, trademarked or patented names (films, games, toys, brands, characters) in comments, identifiers, level ids and docs: describe the thing itself instead. The exceptions are in-game text, the Credits' INSPIRED BY list, purely comparative remarks, puns, and mentions of something the in-game text already refers to.

Level ids should follow their file names (`js/levels/<id>.js`).

Fonts must be free to use commercially and publicly available (SIL OFL or similar), bundled in `fonts/` with their licence text; never rely on system fonts such as Impact or Arial Black (the CSS stacks only list them as a last fallback).

## Documentation conventions

Keep these when editing this file, `summary.md`, `README.md` or code comments:

- This file is technical: architecture, mechanisms, rules and pitfalls. `summary.md` is the overview: gameplay, controls, difficulty, and one entry per level. Level-specific notes, including the user's decisions about a level, go in that level's entry in `summary.md`, not here. `README.md` is the short front page for anyone taking a glance: what the game is, how to play, a brief feature list, a few technical highlights and the project layout. Keep it brief, with no per-level entries, and point to `summary.md` and this file for the details; when a feature it mentions changes, update it too.
- Architecture entries start with the file, then what it holds. Topics that span files go in the sections after it.
- Avoid naming specific levels here, because levels are added, renamed and removed: name one only as an example a reader needs, or when a feature belongs to that level alone. Prefer the hook or the helper to the level that uses it.
- Never state the current value of a config.js setting or switch (on/off, numbers): describe what it does, and leave the value to config.js.
- No history (dates, "since", "no longer", "before") and no measured results: keep the rules that follow from them and the script to measure with.
- Refer only to files in this folder: `CLAUDE.md`, `summary.md`, `README.md`, `index.html` and the subfolders. Never mention other files of the main folder (notes, reports, reference images), which are temporary.
- Never write absolute paths or the names of the folders above the project (drive letters, user folders, the project folder's own name) in the docs, the code or its comments: paths are relative to the project folder, and a command that needs an absolute path builds it from the current folder (see the headless smoke test).
- Keep the user's decisions, marked "by the user's decision", so they are not undone.
- When a file, hook or level is renamed or removed, search the docs and the code comments for the old name.
