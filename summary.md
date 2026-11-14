# Clanker Racing: retro racer (pure HTML / JS / WebGL)

A static `index.html` plus plain scripts in `js/` that runs by double-clicking `index.html`. There is no server, no bundler and there are no dependencies. This file is the overview: what the game does and what each level has that the others do not. The technical side (architecture, how levels are built, conventions) is in `CLAUDE.md`.

## Inspiration

The game is inspired by *Big Red Racing* (1996, Big Red Software / Domark), an arcade off-road racer which shares the following features:
- chunky early-3D graphics and uneven terrain
- unusual environments
- no track barriers, so you can leave the road
- a limited nitrous
- a minimap in the upper-left corner
- a "return to track" key

## Rendering

- WebGL 1 with hand-written shaders and a small matrix library (no libraries).
- Retro look: the scene is drawn at 240 lines and scaled up with pixelated filtering. It uses flat-shaded faces, a banded sky, colour quantisation and distance fog.
- Per-level lighting (ambient / hemisphere / sun), plus emissive geometry for lit windows, lamps and signs.
- A sun or moon at a fixed compass direction that slides across the sky as the camera turns; stars, a second sky body and cloud banks where the level asks for them.
- Soft round particle sprites with their own shader: dust, snow spray, splashes, smoke, fire, explosions, rain, falling snow and falling leaves.
- Blob shadows, additive light pools and a headlight at night, alpha-blended water, and a tint when the camera dips under the sea.
- The ground can continue beyond the map to the horizon, made of the level's own terrain.

## Gameplay

### Driving

- Arcade car physics on a height-field: slope following, sideways grip and drifting, a handbrake, take-offs from ramps and crests, and landings.
- Surfaces change the handling: road vs off-road drag and grip, wading through water slows you, ice has almost no grip, and some levels have sand, mud or puddles.
- Limited nitrous that recharges after a pause. Low-gravity levels use their own gravity.
- Smoothed chase camera with speed-based field of view and shake on impacts. It pulls in so buildings can't swallow it.

### Race

- A few laps (`TOTAL_LAPS` in `js/config.js`), with a countdown, lap and race timer, best lap, speed readout, and nitrous and damage bars.
- **Checkpoints:** ordered checkpoint arches plus the finish line, in the same red-post / checkered-beam style. A lap only counts if every checkpoint was passed in order. Missing one shows a warning, and so does driving the wrong way. Each checkpoint shows the time of the current lap so far.
- Back on track (`R`), and respawning after a wreck, can never skip a checkpoint.
- **Minimap** in the upper-left, north-up: the road, rivers and lakes, bridges, jumps, checkpoint ticks (green = passed, yellow = next) and the cars as coloured dots.
- Race position (`1ST PLACE` ... `LAST PLACE`) is ranked by checkpoint-validated progress, so shortcuts that skip checkpoints don't count.
- Short synth sound effects: engine, crash, thud, splash, explosion, and checkpoint and lap beeps.
- **First played level:** until a track has been cleared, the opponents take no shortcuts and brake more for bends, and the first race on each track open from the start (once per session) shows eight large tips at the bottom of the screen, spaced out by checkpoints: nitrous, braking in turns, lap repair, back on track, the difficulty setting and a send-off.

### Opponents

- Five AI racers on every track.
- They use the same car physics as the player: they take jumps, slide on ice, wade through water and bump into things.
- They follow the road with a lane preference, brake ahead of bends, take shortcuts where there is room, use nitrous on clear straights, steer round things lying on the road, rubber-band towards the player and, on the harder difficulties, block and bump the player.
- An opponent that is stuck or far off the road takes damage until it wrecks, then comes back on the road like the player.

### Damage

- Every car has a damage meter that fills from crashes into scenery, hard landings, large falls, bumps from other cars, fire and lava.
- A full meter wrecks the car (explosion). It then comes back on the road with no damage and a short blinking invulnerability.
- Each completed lap repairs part of the damage.
- Touching flames, lava or a lit laser sets a car on fire: a second later it takes one heavy hit, then flashes and cannot catch fire again for a moment.
- Bumps hurt both cars; opponents take less from bumps and scenery than the player.
- Cars that have finished can still bump and be bumped, but cannot be damaged.

### Menus

- Track select: the game title at the top, the difficulty bar under it, every track in miniature on the left (6 columns x 4 rows, scrolling when there are more), and on the right a panel with the track's number, name, real-life location with a flag, a large map preview with the checkpoints, the numbers (length, jumps, checkpoints, bridges) and a short description. Keyboard, mouse, gamepad and touch all work; locked tracks show what they need.
- A pause menu during a race (return to game, restart race, controls, back to menu), with every race control listed beside it; the race and the engine sound stand still while it is open.
- A results screen with your place, newly unlocked tracks, and next track, retry and back to menu.
- Phone and tablet layouts for the menus, and touch controls for racing (see Controls).
- Two bundled fonts (SIL Open Font License): Kanit Bold Italic for headings and the big race text, Titillium Web for everything else. The background is a dark navy-to-black gradient with faint noise.

## Progress and settings

A finish in the top places clears a track and marks it with a star (bronze, silver or gold for the hardest difficulty cleared). Each track needs a number of cleared tracks to unlock (`LEVEL_TABLE` in `js/level_registry.js`); the results screen announces new tracks, and congratulates the player for clearing them all. Settings has rebindable controls (two slots per action, keys or mouse buttons), mouse racing and deleting the saved data. Progress and settings are one IndexedDB record in the browser, written only once the player agrees. Controllers work without setup through the Gamepad API. Credits name the author, Claude, the fonts and the games and shows that inspired it.

## Controls

These are the defaults.

| Action | Key |
|---|---|
| Accelerate / reverse / steer | Arrow keys or WASD |
| Nitrous | Shift |
| Brake (handbrake) | Space |
| Back on track | R |
| Pause menu | Esc or P |
| Menus: confirm / cancel | Enter or X / Backspace or Z |

On phones and tablets the race has on-screen controls: a stick that appears under the left thumb (hold it to drive, move it sideways to steer, pull it down to reverse), nitrous and brake buttons on the right, and back on track and pause buttons at the top right.

## Difficulty

Four difficulties, chosen in the track select menu with the difficulty bar (its arrows or TAB) and remembered: exploration, easy, medium and hard. On low-gravity levels the opponents brake before jumps so they still land on the road, on every difficulty.

**Exploration** is below easy and is not a race: the level to yourself, with no opponents, laps, place, timer, checkpoint messages, next-checkpoint marker or wrong way warning, and it never ends (leave through the pause menu). The checkpoint arches and the finish line are only scenery. Nitrous never runs out. The countdown, damage, wrecks and level hazards work as usual, and with no laps there is no lap repair. It clears no tracks and earns no stars, and locked tracks stay locked.

The numbers below come from `DIFFICULTIES` in `js/config.js`; update this table when they change.

| | Easy | Medium | Hard |
|---|---|---|---|
| AI speed (engine power, top speed) | x1.03 | x1.055 | x1.08 |
| Rubber band: far behind the player | +15% speed | +20% | +25% |
| Rubber band: far ahead of the player | -8% | -6.5% | -5% |
| AI nitrous | on a full tank, clear straights | from three quarters of a tank | from half a tank |
| AI aggression (blocks and bumps the player) | medium | high | full |
| Cornering (brakes ahead of bends) | yes | at the limit | past the limit |
| Road holding (grip, smaller off-road penalty) | better | much better | best |
| AI corner cutting (shortcuts where there is room) | yes | yes | yes |
| AI starts taking damage when stuck / off road | 0.72 s / 3.6 s | 0.6 s / 3 s | 0.48 s / 2.4 s |
| AI reaction to GO! | 0.2 s | 0.1 s | 0 |
| AI reaction delay while driving (per driver x0.9 to x1.15) | 0.20 s | 0.175 s | 0.15 s |
| Damage the player takes | x1.0 | x1.25 | x1.6 |
| Player nitrous refill speed / wait | x1.0 / x1.0 | x0.85 / x1.0 | x0.7 / x1.0 |

A few tracks adjust their opponents on top of the difficulty (`ai` on the level, `LEVEL_AI_MULTIPLIERS` in `js/config.js`): see the level entries below.

- *Harder turns* (`harderTurns`), to make opponents easier on walled, vertical, twisty tracks: the opponents take no shortcuts and brake more for bends (0.88 of their usual cornering speed). Every track gets it during the first played level.
- *Easier turns* (`easierTurns`), to make opponents harder on flat, wide open tracks with room to cut: the opponents cut corners twice as far (past their planned line, as far as it stays clear), start nitrous on half the usual tank, react faster (0.7 of the reaction delay), brake a little less for bends, and catch up harder from behind (a quarter more rubber band, at full strength from two thirds of the usual distance).
- *Narrow road* (`narrowRoad`), to prevent opponents from crashing on narrow roads with scenery close to the edge: the opponents steer with a slightly shorter look ahead (0.92), so their line cuts less far inside a curve and stays off the buildings at the edge.

## Levels

In track order (`LEVEL_TABLE`). Each entry gives the file, the setting, and what is unique to the level: its mechanics, its hooks and helpers, and the rules that apply to it alone. Whatever the scenery, every level has the same race rules.

### Coconut Beach (`miami.js`)

Miami beach at sunset: a beach road along the sea, then a city of art deco hotels.
- Soft sand off the road (`softAt`): slower, less grip.
- About 20 abandoned vehicles parked along the lane, never on bends, jumps or checkpoints, entered in `LV.obstacles` so the AI steers round them.
- A sea inside the map (`ocean`), continued beyond the edge with its shallows along the coast (`seaAt`); sailing yachts; a cumulus bank on the horizon (`theme.clouds`).

### Midnight Circuit (`city.js`)

Downtown Montreal by night, a street grid over rolling hills.
- The same mix on every block, by the user's decision: no real geography and no one-off landmarks. `rowBlock` puts terraces round a block (`mtlPlot`: plexes with iron stairs via `MTL_PLEX`, greystone rows via `MTL_STONE_ROW`; a row's detail only within `near` of the road) with a lane and often a `mtlTower` in the middle; about one block in four is a feature (`mtlPlazaTower`, `mtlChurch`, `mtlDome`). Walls stand back from the block edge by `yard` and the collision box still ends at the edge, so stairs need no colliders.
- Chevron boards on the outside of the bends (`guidance`, reused by Windmill Valley and Refinery Rush); `wallPanel` is reused by Spaghetti Junction and London Calling.
- Street lamps with light pools, the headlight, a moon and glowing checkpoint arches.

### Fistful of Gravel (`dirt.js`)

A rolling dirt canyon, the first level built and the simplest example of a level file.
- Five jumps of different sizes.
- A main river and a tributary carved into the terrain in `prepare`/`shape`, with three wooden bridges from `findBridges`; each river's level sits below the decks and always flows downhill.

### Ancient Rome (`rome.js`)

- A cobbled road round a ruined Colosseum (`colosseum`), under two aqueducts (`aqueduct`), one with a huge arch the road runs through.
- Temples, colonnades, villas, statues, cypresses and umbrella pines.

### Spaghetti Junction (`junction.js`)

An American interstate interchange.
- A trefoil: the road crosses over and under itself three times. Each crossing is a hand-made `BRIDGES` deck over the lower road, with `TRACK_Y` so the car is matched to the road at its own height, and flat ground under the deck.
- No ground-level object stands under an upper deck (`underDeck`), because its collider would stop a car on the deck.
- Gantries, jersey barriers, decorative viaducts carrying cross streets, suburbs on the hills (standing on the lowest point of their footprint).

### Volcanic Island (`volcanic.js`)

- A lava crater and a lava river (`lava:true`) that crosses the road under a stone bridge: driving into lava sets the car on fire.
- The outer road dips under the sea's shallows (wading); a sea round the island, deep enough for the underwater tint.
- Burning rocks (`addFire`) entered as road obstacles.

### Autumn Breeze (`forest.js`)

- About 1,900 trees biased to crowd the road; falling leaves; logs, stumps and a log cabin.

### Rock Bottom (`quarry.js`)

- A terraced quarry with steep haul roads that ignore the terraces; dump trucks (`dumpTruck`), excavators, conveyors; very heavy dust.

### Dragon Market (`market.js`)

Mong Kok, Hong Kong, after dark.
- Two town levels 18 m apart, five steep ramps at the ends of straights, so you land in the turn.
- Two back alleys across the mouths of U-shaped bends (`MK_ALLEYS`): firm ends that count as road (`pavedAt`), bumpy rubble in the middle (`softAt`), carts that force a slalom. A row of toppled carts with one small gap hides each entrance. No checkpoints inside those bends, so the shortcut needs no race code. A clean run gains little and a mistake costs far more; measure any change with a route-picking bot.
- An overpass above the lower town: its supports are `wallRun`s with fixed heights, and its deck is a surface cars can land on while the road runs under it (`slabAt`).
- Fruit carts in the roadway entered in `LV.obstacles`. No people: the market is deserted.

### Windmill Valley (`farm.js`)

Dutch farmland around Lisse.
- A serpentine lane over steep hills; mud in the valleys (`softAt`, brown dust).
- Farms on stone plinths where the ground slopes; horizon hills with collision (`solidCone`).

### Toy Room (`toyroom.js`)

A giant nursery: the cars are toys.
- The block run, which belongs to this level only: the road climbs a ramp of wooden blocks onto a platform and comes down a second ramp (`TY_RUN`, `tyRunBuild`, `tyRunDecor`). It is a sloping deck (`deckAt`) with wall sides that a car above passes over, its whole top counts as road (`pavedAt`), and it is wider than a checkpoint and carries one, so it cannot be driven round. The user wants calm colours on the surfaces cars drive on.
- Under the bed, a cardboard tunnel, toy scatter whose collision walls fit each toy.

### Tranquility Base (`moon.js`)

- Gravity about a sixth of Earth's (`phys.g`), the opponents' landing limits (`ailowg.js`).
- No haze, stars, the Earth in the sky (`body2`, mode 2), airless dust that flies in low arcs (`dust.vac`).
- Easter egg in the middle of the map: a flag, a lunar module, a rover and a probe.

### Snowy Mountain (`snow.js`)

- A road that climbs round a tall peak; frozen lakes on the road and black-ice patches (`iceAt`, the lowest grip in the game); deep snow off the road.

### London Calling (`london.js`)

- Overcast drizzle (`theme.rain`), wet roads with less grip, puddles on the road (`puddleAt`).
- Both bridges over the Thames are open and the road jumps them (`lonOpenBridge`, `LON_TB`, `LON_SB`): a raised leaf is a ramp (`B.leaf`), and a wall across every free end stops a car that falls short from climbing the end face. About 25 and 22 m/s clear the gaps. A car in the river is not reset (`dunkCheck`): the player uses back on track, and an opponent there takes damage until it wrecks or gets out.
- A detailed far city away from the streets; horizon towers with collision.

### Dicer Town (`capetown.js`)

Cape Town's city bowl under Table Mountain.
- A narrow road (`tw` 20) with blind corners between buildings close to the edge.
- Its own start: the GO! is VUVUZELA.WAV and plays a synthesized horn (`go`).
- AI modifiers: *Narrow road* (`narrowRoad`), so the opponents stop cutting into the buildings at the hairpins.

### Refinery Rush (`refinery.js`)

A refinery ablaze at nightfall.
- Lit only by its fires (`theme.firelight`, `bakeFirelight`): keep the lights sparse and the road readable. A light added in `flare` only applies here (`RF_SITES`).
- Burning oil on the road and a toppled column whose tip lies across the road near 47% of the lap, all entered as road obstacles.
- Oil spray (`theme.spray`), embers (`theme.embers`), three columns of smoke instead of a cloud bank (`theme.clouds.pillars`), pipe gates crossing high over the road.

### Dune Derby (`dune.js`)

The Empty Quarter, Saudi Arabia.
- A sand piste (`tw` 26) between huge dunes; everything off the piste is soft sand, with drifts of fesh-fesh across the piste itself (`softAt`).
- Sandstone massifs beyond the map (`beyondPlayfield`).

### Red Planet (`mars.js`)

- Low gravity (`phys.g`), floaty jumps across craters the road dives through; a research outpost.

### Machu Picchu (`machu.js`)

- A narrow road (`tw` 22) of hairpins up a terraced ridge to the Inca citadel and down the far side, with its grade capped (`limitGrade`) and walls on the outside of every hairpin.
- AI modifiers: *Harder turns* (`harderTurns`).

### Carrier Wave (`carrier.js`)

An aircraft carrier at sea.
- The deck is a real outline (`clipTerrain`, no skirt; a plain sheet of water to the horizon and the ship's wake in `oceanFar`), with a solid rail (`wallRun`) along the same outline.
- On the flat open deck the road could be cut anywhere: tie-down kerbs (`CV_KERBS`) close the inside of the loop along its middle, with a branch into every finger. Every kerb ends on another kerb, the rail, or right at the road's edge, because a gap reads as a way through. No kerbs along the ship's edge: the rail is the barrier there.
- Jets: those of the tie-down lines are parked beside their kerb, on the side away from the road (`CV_KERB_SIDE`); loose jets near the road are pushed towards it (`CV_NEAR`: body 2 m off the edge, wingtips at most 2.5 m over it, the wings being above the cars); `CV_BEND_JETS` are placed by hand. Each jet's collision is its fuselage outline. Every jet near the road leaves the opponents' planned line unchanged: recheck when moving one.
- The road is drawn as side-by-side strips lifted only `CV_ROAD_LIFT` above the deck, because the cars stand on the deck and a higher road hides their tyres.
- The user's rules: keep the pale deck and jet colours, no people (vehicles, helicopters and loose planes instead), yellow and black kerbs only where needed.
- AI modifiers: *Easier turns* (`easierTurns`).

### Hell Creek (`hellcreek.js`)

Montana in the late Cretaceous.
- Dinosaurs near the road, solid to hit; each one's collision is only what reaches the ground (a Tyrannosaurus is its legs).
- Two fords through the creek (no bridges); horizon highlands with collision (`solidCone`).

### Top of the World (`tibet.js`)

The Himalayas.
- The narrowest road in the game (`tw` 16), cut into a cliff: rock above, a drop below, cairns instead of rails.
- A dzong whose tiers have fixed collision heights (`.fix`).

### Vid Flumina (`titan.js`)

Titan, the moon of Saturn.
- The lowest gravity in the game (`phys.g`), with the opponents' landing limits.
- Rivers and lakes of liquid methane (`theme.water`), fords, methane drizzle (`rainCol`), methane puddles on the road with dark spray (`puddleAt`, `theme.spray`), Saturn in the sky (`body2`).
- Easter eggs: a rotorcraft lander by the start and a probe with its collapsed parachute.

### Data Center (`datacenter.js`)

A server hall in the style of a cyberspace film, at night.
- Light trails (`theme.trails`): every car leaves a wall of light in its own colour (red for you, then blue, yellow, green, purple and orange), purely visual.
- Laser fences that step down from high to low (`addLaser`); only the low beam reaches a car, and it sets it on fire. Electric sparks (`addSparkSpots`). Leaving the road shocks the car (`shockAt`, `DATACENTER_OFFROAD_SHOCK`).
- Each U-shaped bend has a checkpoint on it, so none can be cut short.
- The MCP (`dcMcp`, `DC_MCP`): a round red column ending in a point, carrying four gold AI-company-style logos that spin and are wrapped round the column every frame (`dcLogoGeom`; `LV.mcpAng`, when set, is their angle), drawn as moving meshes (`LV.dynamic`).
- A clear offers WATCH ENDING (`ending:'ending'`).
- AI modifiers: *Easier turns* (`easierTurns`).

## The ending (`ending.js`)

"The Rubber Band", a cutscene after a clear of Data Center: Data Center plus a stage, not in the track list, then straight back to the menu.
- Speakers `MCP` (a held hum) and `RACER` (a babble).
- The user's decisions: no skip button (only resume and back to menu in its pause menu), and the band goes round the racer's roll cage (the buggy has no aerial).
- The opening crane shot comes to rest on the framing of the MCP's first line (`EN_OPEN`) and holds it with no cut.

## Unused levels

Loaded by `index.html` but left out of `LEVEL_TABLE` (kept commented out there), so only `?level=<id>` reaches them, and a finish records nothing.

### Monsoon Challenge (`monsoon.js`)

The Goa rainforest in the monsoon.
- Heavy rain (`theme.rain`, `rainN`), puddles (`puddleAt`), a road that gives way to mud and ruts for more than half of the lap (`softAt`, with the grip and drag of Snowy Mountain), three fords and one bridge.
