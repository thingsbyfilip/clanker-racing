# Clanker Racing

The game is a vibe-coded retro racing game which runs in the browser, using plain JavaScript and WebGL 1, with no libraries, no build step and no server.

Race five AI opponents across about two dozen silly tracks, from a dirt canyon to a night-time city to Mars, all rendered in a chunky 240-line, flat-shaded style.

**[Play it online](https://thingsbyfilip.github.io/clanker-racing/)**, or download the project and open `index.html`. Select a track, and press Enter or double-click/tap the track preview.

Screenshots: [Fistful of Gravel](screenshots/fistful_of_gravel_river_crossing.png), [Volcanic Island](screenshots/volcanic_island_lava_bridge.png), [Snowy Mountain](screenshots/snowy_mountain_frozen_lake.png), [Tranquility Base](screenshots/tranquility_base_earthrise.png).

## Inspiration

The game is inspired by *Big Red Racing* (1996, Big Red Software / Domark), an arcade off-road racer which shares the following features:
- chunky early-3D graphics and uneven terrain
- unusual and/or silly tracks and environments
- no barriers so you can just go off-track and explore
- limited nitrous (speed boost)
- a track minimap

## Playing

Open `index.html` in a desktop browser. `file://` works, so no server is needed. Keyboard, mouse and gamepad are supported, and the menus should also work on phones and tablets (although racing by touch is not built yet).

| Action | Default keys |
|---|---|
| Accelerate / reverse / steer | Arrow keys or WASD |
| Nitrous | Shift |
| Brake (handbrake) | Space |
| Back on track | R |
| Pause menu | Esc or P |
| Menus: confirm / cancel | Enter or X / Backspace or Z |

Every control can be rebound in Settings, and there is a mouse racing mode.

## Gameplay Features

- **Driving:** Arcade physics on uneven terrain (boosts, drifting, braking, jumping from ramps, landing, crashing). Roads, off-road ground, water, ice, sand, mud and puddles all handle differently, and some tracks have their own gravity and unique hazards.
- **Racing:** Laps with ordered checkpoints (a lap only counts if every checkpoint was passed), a minimap, nitrous which recharges after a while, and a back-on-track key to return to skipped checkpoints.
- **Opponent AI:** There are five AI racers using the same physics as the player. They brake ahead of bends, take shortcuts where there is room, use nitrous on clear straights, steer round things on the road, rubber-band towards the player and, on the harder difficulties, also try to block and bump them.
- **Damage meter:** Crashes, hard landings, bumps, fire and lava fill a damage meter. A full one explodes the car and resets it on the track. Passing a lap repairs part of it.
- **Track hazards:** Lava, burning oil, laser fences, electric sparks, open bridges to jump, rivers to ford.
- **Difficulty:** Easy, medium and hard, as well as a free exploration mode.
- **Unlocking more tracks:** A top-3 finish clears a track and earns a bronze, silver or gold star depending on the difficulty. Cleared tracks unlock new ones. Progress and settings are saved in the browser, only once the player agrees.
- **Tutorial:** Until a track is cleared, the opponents go easier and in-game tips explain the controls.
- **An ending of sorts:** That, too, is a thing which exists.

You can activate the **debug mode** (including the ability to unlock every track), as well as peek under the hood (get it?) and change many settings, by opening and editing `config.js`.

## Project Structure

| Path | Contents |
|---|---|
| `index.html` | Markup, styles and the core gameplay: car physics, race rules, AI opponents, camera, main loop |
| `js/` | Rendering, terrain and mesh building, input, audio, particles, HUD, menus, saving, effects, AI planning |
| `js/levels/` | One file per level, plus shared scenery and track-building helpers |
| `fonts/` | The two bundled fonts with their licences |
| `ai_test_script/` | The Node test harness and measuring scripts |
| `summary.md` | Detailed overview of the game and individual tracks |
| `CLAUDE.md` | Technical documentation: architecture, how levels are built, conventions |
| `LICENSE` | The MIT License |

## Credits

Coded by Claude Opus 5.5, based on vibes by Filip Skwarski, and released under the [MIT License](LICENSE).

Fonts: Kanit and Titillium Web, both under the SIL Open Font License (see `fonts/`), not the MIT License.

The full credits, including the games and shows that inspired it, are in the game's Credits screen.
