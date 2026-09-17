import { useGameStore } from '../store/gameStore';
import { ObstacleType, PowerupType } from './types';
import {
  LIFE_CHANCE,
  POWERUP_CHANCE,
  GAP_BASE_ADD,
  GAP_SPEED_MULTIPLIER,
  GAP_RANDOM_SPEED_MULTIPLIER,
  GAP_NARROW_SCORE_DIVISOR,
  GAP_MIN_MULTIPLIER,
  FREQUENCY_RAMP_SCORE,
  FREQUENCY_RAMP_MULTIPLIER,
} from '../config/balance';

export const SPAWN_DISTANCE = 30;
export const DESPAWN_DISTANCE = -10;

/**
 * Tries to generate a global obstacle (like a powerup or extra life) based on random chance.
 * Returns the generated properties or null if scenario-specific obstacles should be generated instead.
 */
export function tryGenerateGlobalObstacle(): { type: ObstacleType; y: number; powerupType?: PowerupType } | null {
  const { activePowerup, powerupCooldownUntil } = useGameStore.getState();
  const rand = Math.random();

  const lifeChance = LIFE_CHANCE;
  let powerupChance = POWERUP_CHANCE;
  if (activePowerup !== 'none' || performance.now() < powerupCooldownUntil) {
    powerupChance = 0;
  }

  if (rand < lifeChance) {
    return {
      type: 'powerup',
      y: Math.random() > 0.5 ? 1.0 : 2.5,
      powerupType: 'life'
    };
  }

  if (rand < lifeChance + powerupChance) {
    const powerups: PowerupType[] = ['wings', 'super', 'ghost', 'jaw', 'earth', 'dragon'];
    const powerupType = powerups[Math.floor(Math.random() * powerups.length)];
    return {
      type: 'powerup',
      y: Math.random() > 0.5 ? 1.0 : 2.5,
      powerupType
    };
  }

  return null;
}

/**
 * Calculates the next obstacle spawn position based on current score and speed.
 */
export function calculateNextObstaclePosition(): number {
  const state = useGameStore.getState();
  const score = state.score;
  const currentSpeed = state.getCurrentSpeed();

  // Gap narrows down as score climbs
  const gapMultiplier = Math.max(GAP_MIN_MULTIPLIER, 1.0 - (score / GAP_NARROW_SCORE_DIVISOR));

  const frequencyMultiplier = score > FREQUENCY_RAMP_SCORE ? FREQUENCY_RAMP_MULTIPLIER : 1.0;

  const minGap = ((currentSpeed * GAP_SPEED_MULTIPLIER) + GAP_BASE_ADD) * gapMultiplier * frequencyMultiplier;
  const gap = minGap + Math.random() * (currentSpeed * GAP_RANDOM_SPEED_MULTIPLIER) * gapMultiplier * frequencyMultiplier;

  return SPAWN_DISTANCE + gap;
}

/**
 * Returns whether birds are eligible to spawn at the current game speed or score.
 */
export function isBirdEligible(): boolean {
  const { score, speed } = useGameStore.getState();
  return speed > 14 || score > 1500;
}
