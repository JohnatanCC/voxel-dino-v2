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

// Powerup accent color used by the 2D HUD indicator/toast (see src/components/ui/Hud.tsx)
export const POWERUP_ACCENT_COLORS: Record<string, string> = {
  wings: '#7dd3fc',
  super: '#fde047',
  ghost: '#c084fc',
  jaw: '#fb923c',
  earth: '#d97706',
};

// Obstacle status-effect durations (ms)
export const MUMMY_SLOW_DURATION_MS = 4000;
export const HEAVY_JUMP_DURATION_MS = 1000; // skull
export const WEAK_JUMP_DURATION_MS = 2500; // snowman
export const PUDDLE_SLOW_DURATION_MS = 1500;
export const BIRD_EATING_DURATION_MS = 8000;

// Obstacle spawn gap curve (see src/scenarios/helpers.ts)
export const GAP_BASE_ADD = 6;
export const GAP_SPEED_MULTIPLIER = 1.1;
export const GAP_RANDOM_SPEED_MULTIPLIER = 0.8;
export const GAP_NARROW_SCORE_DIVISOR = 45000;
export const GAP_MIN_MULTIPLIER = 0.55;

// Score at which obstacle frequency/variety ramps up further (was "level 5")
export const FREQUENCY_RAMP_SCORE = 30000;
export const FREQUENCY_RAMP_MULTIPLIER = 0.65;

// Global rare spawns (life pickups / powerups)
export const LIFE_CHANCE = 0.015;
export const POWERUP_CHANCE = 0.02;

// Biome auto-cycling (infinite mode)
export const BIOME_ORDER: GameScenario[] = ['desert', 'forest', 'swamp', 'snow'];
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
    { type: 'skull', unlockScore: 0 },
    { type: 'mummy', unlockScore: 6000 },
    { type: 'bird', unlockScore: 12000 },
  ],
  forest: [
    { type: 'stump-low', unlockScore: 0 },
    { type: 'puddle', unlockScore: 0 },
    { type: 'stump-high', unlockScore: 6000 },
    { type: 'tree-hole', unlockScore: 12000 },
    { type: 'bird', unlockScore: 18000 },
  ],
  swamp: [
    { type: 'swamp-log', unlockScore: 0 },
    { type: 'puddle', unlockScore: 0 },
    { type: 'croc', unlockScore: 6000 },
    { type: 'swamp-fly', unlockScore: 6000 },
    { type: 'bird', unlockScore: 12000 },
  ],
  snow: [
    { type: 'rock-small', unlockScore: 0 },
    { type: 'firebox', unlockScore: 0 },
    { type: 'rock-large', unlockScore: 6000 },
    { type: 'snowman', unlockScore: 6000 },
  ],
};

export function getAllowedObstacles(scenario: GameScenario, score: number): ObstacleType[] {
  const unlocks = OBSTACLE_UNLOCKS[scenario];
  const allowed = unlocks.filter(o => score >= o.unlockScore).map(o => o.type);
  return allowed.length > 0 ? allowed : [unlocks[0].type];
}

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
