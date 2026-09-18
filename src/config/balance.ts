import { GameScenario, EggRarity } from '../store/gameStore';
import { ObstacleType } from '../scenarios/types';

// Runner core: speed & acceleration
export const INITIAL_SPEED = 9;
export const MAX_SPEED = 37.5; // 2.5x of 15
export const ACCELERATION_PER_FRAME = 0.001; // applied to gameTime * 60 "frames"

// Lives
export const INITIAL_LIVES = 3;
export const MAX_LIVES = 5;

// Dino physics (see src/models/dino/useDinoPhysics.ts)
export const GRAVITY = -80;
export const JUMP_VELOCITY = 32;
export const FAST_FALL_MULTIPLIER = 3;

// Jump feel: press a moment before landing and it still fires on touchdown.
export const JUMP_BUFFER_MS = 150;
// Hold the jump key at least this long to get full height; a quick tap gives a short hop.
export const MIN_JUMP_HOLD_MS = 120;
// Floor on how much velocity a quick-tap jump keeps (0-1).
export const MIN_JUMP_VELOCITY_RATIO = 0.45;

// Powerups
export const POWERUP_DURATION = 12; // seconds
export const INVINCIBILITY_DURATION_MS = 1500;
// After collecting a powerup, no new one can spawn until this much time passes
// (counted from the moment of collection, not from when the effect ends).
export const POWERUP_SPAWN_COOLDOWN_MS = 42000;

// Powerup accent color used by the 2D HUD indicator/toast (see src/components/ui/Hud.tsx)
export const POWERUP_ACCENT_COLORS: Record<string, string> = {
  wings: '#7dd3fc',
  super: '#fde047',
  ghost: '#c084fc',
  jaw: '#fb923c',
  earth: '#d97706',
  dragon: '#dc2626',
};

// Wings: caps how fast the dino can fall while gliding, so it reads as a real slow-fall
// instead of gravity just being halved (which still lets fall speed climb unbounded).
export const WINGS_GLIDE_MAX_FALL_SPEED = -8;

// Earth: while the powerup is active but the dino is grounded (not currently burrowed),
// its remaining duration drains this much faster per second, on top of the normal 1x tick —
// pressure to actually burrow instead of just holding the powerup passively.
export const EARTH_GROUNDED_DECAY_PER_SECOND = 0.5;

// Dragon: fires a forward fireball every N seconds while active, destroying whatever it hits.
export const DRAGON_FIREBALL_INTERVAL_S = 2;
export const DRAGON_FIREBALL_SPEED = 26; // units/sec, faster than any obstacle scroll speed
export const DRAGON_FIREBALL_LIFETIME_S = 1.5; // despawns unharmed after this long mid-air

// Test Room (3-lane runner mechanic prototype): the dino stays at a fixed
// forward X like the main runner (the world scrolls under it via the reused
// Ground components), only sliding sideways between lane Z offsets. All
// easing below is exponential and frame-rate independent
// (1 - exp(-rate*delta), see useTestRoomLanePhysics.ts / TestRoomCamera.tsx).
export const TEST_ROOM_LANE_OFFSETS = [-2.4, 0, 2.4]; // left, center, right
export const TEST_ROOM_LANE_SWITCH_RATE = 12; // how fast the dino slides to the target lane
export const TEST_ROOM_CAMERA_DISTANCE = 9; // behind the dino, opposite the run direction
export const TEST_ROOM_CAMERA_HEIGHT = 4.5;
export const TEST_ROOM_CAMERA_LOOK_AHEAD = 6; // how far down the track the camera looks
export const TEST_ROOM_CAMERA_LERP_RATE = 6; // how fast the camera eases to its ideal position
export const TEST_ROOM_CAMERA_BOB_AMPLITUDE = 0.15; // gentle vertical bob for a less static chase cam
export const TEST_ROOM_CAMERA_BOB_SPEED = 2.2;

// Test Room obstacle spawner: same world-X convention as the real per-biome
// obstacle pools (see SPAWN_DISTANCE/DESPAWN_DISTANCE in scenarios/helpers.ts),
// just kept independent since it spawns across 3 lanes instead of a single track.
export const TEST_ROOM_OBSTACLE_SPAWN_X = 50;
export const TEST_ROOM_OBSTACLE_DESPAWN_X = -10;
export const TEST_ROOM_OBSTACLE_MIN_GAP_S = 1.0;
export const TEST_ROOM_OBSTACLE_MAX_GAP_S = 1.8;

// Obstacle status-effect durations (ms)
export const WEAK_JUMP_DURATION_MS = 1200; // snowman
export const BIRD_EATING_DURATION_MS = 8000;
export const REDUCED_VISIBILITY_DURATION_MS = 3000; // mushroom (forest)

// Leeches (swamp): stack up on repeated contact, damage + clear on the Nth hit.
export const LEECH_STACKS_TO_DAMAGE = 3;

// Sand worm (desert): event enemy with its own chase/attack cycle.
export const SAND_WORM_MIN_SCORE = 10000; // never appears below this score
export const SAND_WORM_CHANCE_RAMP_SCORE = 15000; // score at which spawn chance hits its max
export const SAND_WORM_MAX_CHANCE = 0.35; // spawn chance per check once ramped up
export const SAND_WORM_CHECK_INTERVAL_S = 2.5; // how often a spawn roll happens
export const SAND_WORM_CHASE_DURATION_S = 3;
export const SAND_WORM_SUBMERGED_DURATION_S = 5;

// Obstacle spawn gap curve (see src/scenarios/helpers.ts)
// Gaps are time-based (seconds of travel at the current speed) so the reaction window
// doesn't collapse as the run speeds up.
export const GAP_BASE_ADD = 6;
export const GAP_MIN_REACTION_S = 1.5; // guaranteed travel time between two obstacles
export const GAP_NARROW_SCORE_DIVISOR = 90000;
export const GAP_MIN_MULTIPLIER = 0.8;

// Score at which obstacle frequency/variety ramps up further (was "level 5")
export const FREQUENCY_RAMP_SCORE = 30000;
export const FREQUENCY_RAMP_MULTIPLIER = 0.9;

// Lava T-Rex (lava biome event): a giant that stalks from behind, then charges across the
// track. Only its feet hurt; head/neck/back are a standable platform (see scenarios/standable.ts).
export const LAVA_REX_MIN_BIOME_SCORE = 2500; // points into the biome before it can show up
export const LAVA_REX_CHECK_INTERVAL_S = 3;
export const LAVA_REX_CHANCE = 0.4; // per check
export const LAVA_REX_COOLDOWN_S = 25; // after an event ends
export const LAVA_REX_WARNING_S = 1.6; // rumble + telegraph before the charge
export const LAVA_REX_CHARGE_SPEED = 10; // world units/s across the screen (the ground scrolls under it too)
export const LAVA_REX_CHARGE_ACCEL = 22;
export const LAVA_REX_BODY_TOP = 4.4; // standable height of head/back (matches the scaled dino rig)
export const LAVA_REX_TAIL_TOP = 3.4;
export const LAVA_REX_FRONT_CHANCE = 0.4; // odds the T-Rex charges from the right, facing the player
export const LAVA_REX_FRONT_SPEED = 15; // top speed of the head-on charge (leftwards)
export const LAVA_REX_SURF_BONUS = 150; // points for landing on it

// Bird/bee flock spawns (desert, forest): how many spawn together at once.
export const OBSTACLE_FLOCK_SIZE = 3;

// Global rare spawns (life pickups / powerups)
export const LIFE_CHANCE = 0.015;
export const POWERUP_CHANCE = 0.02;

// Biome auto-cycling (infinite mode)
export const BIOME_ORDER: GameScenario[] = ['desert', 'forest', 'swamp', 'snow', 'lava'];
export const BIOME_CYCLE_SCORE = 10000; // switch biome every N points
export const BIOME_TRANSITION_SWAP_TIME = 2.0; // seconds into transition when scenario actually swaps
export const BIOME_TRANSITION_END_TIME = 3.0; // seconds until transition flag clears
export const BIOME_TRANSITION_INVINCIBILITY_MS = 2000;

// Per-biome obstacle unlock curve: obstacle types become eligible for spawn
// once the run's score crosses their unlockScore. Replaces the old per-level
// `allowedObstacles` lists.
export const OBSTACLE_UNLOCKS: Record<GameScenario, { type: ObstacleType; unlockScore: number }[]> = {
  desert: [
    { type: 'cactus-small', unlockScore: 0 },
    { type: 'cactus-large', unlockScore: 0 },
    { type: 'bird', unlockScore: 12000 },
  ],
  forest: [
    { type: 'stump-low', unlockScore: 0 },
    { type: 'stump-high', unlockScore: 6000 },
    { type: 'mushroom', unlockScore: 6000 },
    { type: 'tree-hole', unlockScore: 12000 },
    { type: 'bird', unlockScore: 18000 },
  ],
  swamp: [
    { type: 'swamp-log', unlockScore: 0 },
    { type: 'croc', unlockScore: 6000 },
    { type: 'swamp-fly', unlockScore: 6000 },
    { type: 'leech', unlockScore: 3000 },
    { type: 'bird', unlockScore: 12000 },
  ],
  snow: [
    { type: 'ice-spike', unlockScore: 0 },
    { type: 'snowman', unlockScore: 3000 },
    { type: 'bird', unlockScore: 6000 },
  ],
  lava: [
    { type: 'lava-pool', unlockScore: 0 },
    { type: 'lava-bug', unlockScore: 2000 },
    { type: 'bird', unlockScore: 4000 },
  ],
};

export function getAllowedObstacles(scenario: GameScenario, score: number): ObstacleType[] {
  const unlocks = OBSTACLE_UNLOCKS[scenario];
  const allowed = unlocks.filter(o => score >= o.unlockScore).map(o => o.type);
  return allowed.length > 0 ? allowed : [unlocks[0].type];
}

// Dino Coins picked up on the track (rows of 3-5), on top of the egg rewards.
export const COIN_VALUE = 5; // Dino Coins per pickup
export const COIN_ROW_MIN = 3;
export const COIN_ROW_MAX = 5;
export const COIN_SPACING = 2.0; // world units between coins in a row
export const COIN_ROW_GAP_MIN = 14; // world units of empty track after a row
export const COIN_ROW_GAP_MAX = 34;

// Eggs per biome window (each BIOME_CYCLE_SCORE block of the run)
export const EGGS_PER_BIOME_MIN = 1;
export const EGGS_PER_BIOME_MAX = 4;

// Egg economy
export const EGG_COIN_VALUES: Record<EggRarity, number> = {
  common: 50,
  rare: 150,
  ultraRare: 250,
};

// Cumulative odds when an egg spawn is triggered
export const EGG_RARITY_ODDS: { rarity: EggRarity; upTo: number }[] = [
  { rarity: 'common', upTo: 0.6 },
  { rarity: 'rare', upTo: 0.9 },
  { rarity: 'ultraRare', upTo: 1.0 },
];

export function rollEggRarity(): EggRarity {
  const rand = Math.random();
  for (const entry of EGG_RARITY_ODDS) {
    if (rand < entry.upTo) return entry.rarity;
  }
  return 'common';
}
