// dev settings
const DEBUG_MODE = false;                   // V: win the race instantly, L: wreck the car instantly, and UNLOCK ALL TRACKS in Settings
const DEBUG_MOBILE_CONTROLS = false;        // simulate mobile controls
const SHOW_COLLIDERS_IN_GAME = false;       // (only with DEBUG_MODE) draw every collision shape as a see-through solid, as tall as it collides, color depends on collider type

// game version
const GAME_VERSION = '1.0';                 // game version shown at the bottom of the intro screen
const VERSION_ON_TRACK_SELECT = true;       // also show the version in the lower right corner of the track select screen

// gameplay settings
const TOTAL_LAPS = 3;                       // laps to finish the race (a whole number, 1 or more; the same for the player and the opponents)
const DETAILED_CAR_COLLISION = true;        // a car meets scenery as three circles along its length rather than one circle around its center
const SHOW_LEVEL_SUB = false;               // show the level's subtitle (its `sub`) under the 3/2/1 of the countdown

// in-game UI settings
const SIMPLIFY_INGAME_UI = false;           // no speed/level/difficulty, DAMAGE and NITROUS bars in the upper right, only nitrous & pause/controls listed, pause menu lists controls
const CONTROLS_VERTICAL = false;            // the in-race controls help is a column at the lower left, one control per line from the top down
const HIDE_CHECKPOINT_TIME = true;          // the CHECKPOINT X/Y message shows no time
const PAUSE_MENU_CONTROLS = false;          // the pause menu lists the race controls beside its options
const TOUCH_AUTO_THROTTLE = true;           // touch controls: holding the stick drives (pull it down to reverse); false: push it up to drive

// level features
const EXPAND_TERRAIN_AROUND_LEVEL = true;   // draw ground beyond the edges of the level, at the height of the edge and made of the level's own triangles (cars still stop at the edge)
const FIRE_SMOKE_PARTICLES = true;          // draw the particles of level fires and smoke (false: none are drawn, but the fires still damage cars)
const UNDERWATER_TINT = 0.65;               // the tint of the part of the screen under water, when the camera is in or at the water (0: off, 1: solid colour of the water)

// nitro settings
const INFINITE_NITRO = false;               // dev setting: nitro never drains (and never locks)
const NITRO_LOCKOUT = false;                // dev setting: nitro needs to be restored entirely to be used again
const NITRO_WAIT = 6;                       // seconds after the last use before the tank starts refilling
const NITRO_DRAIN = 0.6;                    // tank fraction used per second of boost
const NITRO_REFILL = 0.1;                   // tank fraction refilled per second
const PREVENT_FINAL_BOOST = true;           // opponents start no nitro burst on the final lap once past checkpoint 6, in races of more than 1 lap (a burst already going carries on)

// menu settings (the track select screen)
const MENU_ANIM = false;                    // the big preview and the description slide in when another track is selected
const MENU_THUMB_ANIM = false;              // the little animation of the miniature that gets selected in the grid: it grows and its frame fades in
const USE_MAIN_PAGE = false;                // the intro screen with New Game, Settings and Credits
const SETTINGS_IN_TRACK_SELECT = true;      // a SETTINGS button on the track select screen, to the right of the difficulty bar
const HINT_BACK_FIRST = false;              // the controls prompts of the menus start with the back / resume key
const DIFFICULTY_NEEDS_SELECT = true;       // arrow keys on the difficulty bar: confirm opens it, then LEFT/RIGHT change it and confirm closes it; while closed LEFT goes to the BACK button
const MOBILE_MENU = true;                   // phone and tablet menus: their layouts, the RACE button and the touch behaviour

// level progression
const CLEAR_PLACE = 3;                      // a finish in this place or better clears the track (how many clears unlock each level: LEVEL_TABLE in level_registry.js)
const RESULTS_DELAY = 2.2;                  // seconds from the finish line to the results screen
const SUGGEST_NEXT_TRACK = true;            // the results screen offers NEXT TRACK (track select with the next track selected) as well as BACK TO MENU

// controls: default bindings of every action, two slots each (KeyboardEvent code, 'Mouse0'..'Mouse4' or null), rebindable in Settings > Controls
const BIND_SLOTS = 2;
const DEFAULT_BINDS = {
  accel:['ArrowUp','KeyW'], reverse:['ArrowDown','KeyS'], left:['ArrowLeft','KeyA'], right:['ArrowRight','KeyD'],
  brake:['Space',null], nitro:['ShiftLeft','ShiftRight'], respawn:['KeyR',null], pause:['Escape','KeyP'],
  confirm:['Enter','KeyX'], cancel:['Backspace','KeyZ'],
};

// saved game
const COOKIE_WARNING = true;                        // nothing is stored on this device until the player agrees, settings below decide when the prompt appears
const COOKIE_WHEN_FIRST_ENTERING_SETTINGS = false;  // before settings open from the menus (not from the pause menu: never during a race); settings wait for the answer
const COOKIE_WHEN_FIRST_STARTING_RACE = false;      // before the first race starts; the race waits for the answer
const COOKIE_AFTER_FINISHING_RACE = true;           // on returning to the menu after the first race that clears a track (a finish in CLEAR_PLACE or better)
const COOKIE_WHEN_SETTINGS_CHANGED = true;          // on returning to the menu after settings were changed (controls, mouse racing, unlocking the tracks); a change undone again does not count
const COOKIE_ROTATION_ANGLE = -45;                  // degrees above the spinning cookie's level that it is seen from (0: straight from the side, 90: from directly above; negative: from below)

// ---------- damage ----------
// Damage runs from 0 to 1 for every car (you and opponents). At 1 the car is wrecked: it explodes, sits out WRECK_TIME s, then is put back on the road with no damage.
// Cars that have crossed the finish line are indestructible, but still solid. The player's damage is multiplied by the difficulty's `damage` (see DIFFICULTIES below).
const WRECK_TIME = 1.8;                       // seconds a wrecked car stays out before it is put back on the road
const PIT_REPAIR = 0.5;                       // damage repaired when a car completes a lap (all cars)

// Touching flames (fires, burning oil, burning rocks), lava or a lit laser beam sets a car alight: FIRE_BURN_TIME s later it takes FIRE_HIT_DAMAGE in one go (not scaled by difficulty, halved for opponents) with a small explosion, then flashes for FIRE_IMMUNE_TIME s. No new fire can catch from the moment it is lit until that flashing ends.
const FIRE_HIT_DAMAGE = 0.35;
const FIRE_BURN_TIME = 1;
const FIRE_IMMUNE_TIME = 1;
const FIRE_OPPONENT_FACTOR = 0.5;             // opponents take this much of FIRE_HIT_DAMAGE
const FIRE_MAX_SPEED = 0.67;                  // the player's top speed multiplier while on fire (opponents are not slowed)
const FIRE_SLOW_RATE = 45;                    // how fast (m/s per second) a burning player above that top speed is pulled down to it
const DATACENTER_OFFROAD_SHOCK = true;        // Data Center: a car that strays from the road takes SHOCK DAMAGE (works just like the fire above, with sparks for flames, opponents too)
const DATACENTER_OFFROAD_MARGIN = 6;          // how far past the road edge (units) a car can go before the shock starts
const SPARK_DAMAGE = 0.12;                    // per hit from an electric spark while it is active
const ZAP_COOLDOWN = 0.8;                     // seconds after a spark hit before the same car can be hit again
const SPARK_WARN = 0.8;                       // seconds of harmless crackle before a spark goes active

// laser beams light one after the other: lit for LASER_ON s, then LASER_GAP s dark before the next, fading in and out over LASER_FADE (avoid fast strobe effect for accessibility)
const LASER_ON = 1.1;
const LASER_GAP = 0.5;
const LASER_FADE = 0.22;

// hitting scenery (trees, rocks, houses, rails ...): damage = (impact speed - MIN_SPEED) * PER_SPEED, at most MAX
const OBSTACLE_HIT_MIN_SPEED = 5;             // m/s of impact speed along the surface normal; below this nothing happens
const OBSTACLE_HIT_DAMAGE_PER_SPEED = 1/110;
const OBSTACLE_HIT_MAX = 0.4;                 // per hit
const SOFT_OBSTACLE_FACTOR = 0.3;             // soft things (bushes, bridge rails ...) hurt this much of the above

// landing from a jump or fall: damage = (impact speed - MIN_SPEED) * PER_SPEED; LARGE falls (fast impact) add a lot on top
const LANDING_MIN_SPEED = 22;                 // m/s of impact speed; ordinary jumps stay below this or only just above
const LANDING_DAMAGE_PER_SPEED = 1/160;
const LARGE_FALL_SPEED = 40;                  // impact speed from which a fall counts as large (a drop of about 20 units on Earth gravity)
const LARGE_FALL_DAMAGE_PER_SPEED = 0.035;    // extra damage per m/s above that: a 55 m/s impact adds 0.5, 65 m/s wrecks the car

// car against car (needs a closing speed above MIN_SPEED; both cars are hurt by the same hit)
const CAR_HIT_MIN_SPEED = 6;
const CAR_HIT_DAMAGE_PER_SPEED = 1/200;
const CAR_HIT_MAX = 0.12;                     // per hit, before the factors below
const CAR_HIT_PLAYER_FACTOR = 1.0;            // you take the full hit
const CAR_HIT_OPPONENT_FACTOR = 0.6;          // an opponent bumping you or bumped by you: a little damage
const CAR_HIT_OPPONENT_OPPONENT_FACTOR = 0.3; // two opponents bumping each other

// opponents only
const OPPONENT_ENVIRONMENT_FACTOR = 0.6;      // multiplier on the scenery, landing and large fall damage opponents take (they drive worse than you)
const AI_STUCK_DAMAGE = 0.6;                  // per second once an opponent has been stuck for a moment (the difficulty's `recovery` sets how long): about 1.7 s to wreck
const AI_OFFTRACK_DAMAGE = 0.5;               // per second while an opponent is far off the road or has been off it for long (`recovery`): 2 s to wreck
const AI_OFFTRACK_DIST = 20;                  // how far past the road edge (units) counts as far off the road

// ---------- difficulty ----------
// Picked in the track select menu (the difficulty bar) and kept in the saved game; URL: ?diff=exploration|easy|medium|hard (not remembered).
// Every factor below is read at call time, so a tweak here is all it takes. A level can adjust its opponents on top of this (LEVEL_AI_MULTIPLIERS below).
//   EASY    opponents that know the bends, take shortcuts and use nitro
//   MEDIUM  quicker, pushier
//   HARD    fast, ruthless, never let go
//   EXPLORATION  below easy: `explore:true` means no opponents and no race at all, just the level. No laps, place, time, checkpoints or wrong way warning (the gates are scenery), so it never ends
//                and clears nothing, and it has nitro without limit. Damage, wrecks and level hazards work as usual; only the player fields below apply to it.
//
// opponents (the five AI racers)
//   speed      engine power and top speed of the AI cars (1 = original; 1.2 = 20% faster on the straights). A car flat out on a clear road tops
//              out at about 47 m/s (drag), the same for the player; with nitro it is much more.
//   aggression 0..1. 0 = every car keeps to its own lane. Above that the AI goes for the player: it moves into the player's lane to
//              block when it is just ahead, and to bump when it is alongside or just behind (hurts a little, shoves the player about),
//              and it brakes a little later for bends (at 1 it brakes at 16% over the bend's speed instead of 6%; the throttle cut is unchanged).
//   cornering  0 = the original driver: brakes only once the car points well away from the road ahead (and so often runs wide or off).
//              Above 0 the AI knows the bends: it brakes ahead of them to the speed the bend allows times this number (1 = about the limit).
//   cutCorners 0..1. 0 = the AI follows the road. Above 0 it takes shortcuts: a line planned from straight chords between two points of the road, clear of
//              everything a car can hit (js/aicuts.js). The number is how far it goes from the road centre towards that line. It also takes its braking from
//              that line, and pushes harder where there is room to run wide, so it gains on open tracks and hardly at all between walls.
//   roadHold   grip multiplier of the AI's tyres (1 = original): bigger = slides wide less in bends and after landings
//   offRoad    how much of the off-road penalty (slower top speed, more drag, less grip) the AI still suffers (1 = original, 0 = none)
//   recovery   sets when a stuck or lost AI starts taking damage: stuck for recovery*0.4 s (AI_STUCK_DAMAGE), or off the road for recovery*2 s (AI_OFFTRACK_DAMAGE;
//              at once when more than AI_OFFTRACK_DIST past the edge). It is put back on the road only once it wrecks (the original game teleported it after stuck 2.5 / off-road 5)
//   nitroStart tank fraction needed before an AI starts a nitro burst (above 1 = the AI never uses nitro)
//   nitroKeep  a burst goes on until the tank drops to this. The AI only fires on a clear straight with the throttle open,
//              and uses the same tank, drain and refill as the player.
//   startDelay seconds the AI takes to react to GO!
//   reaction   seconds of reaction delay (0 = none: the AI sees everything at once). The AI sees its own car and the player as they were
//              that long ago, but like a human it knows what it has done since then with the wheel and pedals and allows for that, so ordinary driving is
//              barely slower (under 1%): what it meets late is the unexpected, such as a spin, a slide, a wall, or the player swerving or braking in front.
//              Each driver has its own factor on this (AI_DEFS rx, 0.9..1.15 in index.html).
// rubber band (relative to the player, in metres of road): AI cars behind the player speed up, AI cars ahead slow down
//   behindBoost  top speed bonus (fraction of the AI's speed) when far behind; reached at `behindRange` metres behind. Linear in between.
//   aheadSlow    top speed cut (fraction) when far ahead; reached at `aheadRange` metres ahead.
//   (the bonus is real engine power, so a car far behind can exceed the normal top speed: that is what catching up with a player on nitro takes)
//
// player
//   damage       damage the player takes from every crash and bump (multiplier; not fire or lava hits)
//   nitroRefill  speed of the player's nitro refill (multiplier; the AI's own tank always refills at the normal rate)
//   nitroWait    pause before the player's nitro starts refilling (multiplier)

const DIFFICULTIES = {
  exploration:{ id:'exploration', name:'EXPLORATION', explore:true,
    damage:1.0, nitroRefill:1.0, nitroWait:1.0 },
  easy:  { id:'easy', name:'EASY',
    speed:1.03, aggression:0.5, cornering:0.95, cutCorners:0.5, roadHold:1.12, offRoad:0.65, recovery:1.8, nitroStart:0.95, nitroKeep:0.45, startDelay:0.2, reaction:0.20,
    behindBoost:0.15, behindRange:140, aheadSlow:0.08, aheadRange:130,
    damage:1.0, nitroRefill:1.0, nitroWait:1.0 },
  medium:{ id:'medium', name:'MEDIUM',
    speed:1.055, aggression:0.75, cornering:1.00, cutCorners:0.5, roadHold:1.185, offRoad:0.55, recovery:1.5, nitroStart:0.75, nitroKeep:0.275, startDelay:0.1, reaction:0.175,
    behindBoost:0.20, behindRange:125, aheadSlow:0.065, aheadRange:145,
    damage:1.25, nitroRefill:0.85, nitroWait:1.0 },
  hard:  { id:'hard', name:'HARD',
    speed:1.08, aggression:1.0, cornering:1.05, cutCorners:0.5, roadHold:1.25, offRoad:0.45, recovery:1.2, nitroStart:0.55, nitroKeep:0.1, startDelay:0.0, reaction:0.15,
    behindBoost:0.25, behindRange:110, aheadSlow:0.05, aheadRange:160,
    damage:1.6, nitroRefill:0.7, nitroWait:1.0 },
};

// Per-level opponent adjustments, on top of the difficulty: a level lists the ones it uses in `ai` (e.g. ai:['harderTurns']), applied by levelAI (index.html) at each race start.
// Every value is a multiplier on that difficulty field, the same for every difficulty (tuned against MEDIUM; 0 turns a field off). Exploration borrows easy's settings for ?ai.
//   harderTurns  for walled, twisty tracks (Machu Picchu): no shortcuts, more braking for the bends (MEDIUM loses about 2%; HARD barely, its 1.05 cornering being past the limit)
//   easierTurns  for wide open decks with room to cut (Carrier Wave, Data Center): twice the shortcut (over 1 goes past the planned line, as far as it stays clear),
//                earlier nitro, quicker reactions, a little less braking for the bends
//   narrowRoad   for narrow roads with scenery close to the edge (Cape Town): a slightly shorter steering lookahead, so the line cuts less far inside a curve and
//                stays off the buildings at the edge (laneMul 0.5 also cuts Cape Town's wrecks, but bunches the pack)
const LEVEL_AI_MULTIPLIERS = {
  harderTurns:{ cutCorners:0, cornering:0.88 },
  easierTurns:{ cutCorners:2, nitroStart:0.5, reaction:0.7, cornering:1.05, behindRange:0.667, behindBoost:1.25 },
  narrowRoad: { lookMul:0.92 },
};

// difficulty selection on the track screen
const DIFFICULTY_ORDER = ['easy','medium','hard'];                 // the difficulties that can clear a track: saved games store an index into this list (the star), so never reorder it
const DIFFICULTY_MENU = ['exploration',...DIFFICULTY_ORDER];       // what the difficulty bar and TAB go through
const DEFAULT_DIFFICULTY = 'medium';                               // default difficulty on the main screen

// opponent AI in low gravity (js/ailowg.js)
const DIFFICULTY_LOW_GRAVITY_ADJUSTMENT = true;  // opponents on levels with less gravity than Earth's work out from the level's gravity how to react

// the first played level (any race the player starts while no track is cleared yet, except in exploration)
const FIRST_LEVEL_EASIER = true;                 // the opponents get the harderTurns adjustment in first level unless the level already has it
const FIRST_LEVEL_TUTORIAL = true;               // tips appear on the screen during the first race on each level, once per level per session

// cutscenes (the ending, js/levels/ending.js)
const CUTSCENE_TEXT_IN_PICTURE = true;           // where the dialogue box sits: false = low down, over the black bar under the picture; true = at the bottom of the picture
const CUTSCENE_TRAILS = false;                   // true: the cars in a cutscene leave their Data Center light trails, as in a race on that level; false: no trails during cutscenes