import { useGameStore } from '../store/gameStore';
import { ObstacleType, PowerupType } from './types';

export const SPAWN_DISTANCE = 30;
export const DESPAWN_DISTANCE = -10;

/**
 * Tries to generate a global obstacle (like a powerup or extra life) based on random chance and difficulty.
 * Returns the generated properties or null if scenario-specific obstacles should be generated instead.
 */
export function tryGenerateGlobalObstacle(): { type: ObstacleType; y: number; powerupType?: PowerupType } | null {
  const { difficulty } = useGameStore.getState();
  const rand = Math.random();
  
  let lifeChance = 0;
  if (difficulty === 'easy') lifeChance = 0.03;
  if (difficulty === 'medium') lifeChance = 0.01;

  let powerupChance = difficulty === 'hard' ? 0.01 : 0.03;

  if (rand < lifeChance) {
    return {
      type: 'powerup',
      y: Math.random() > 0.5 ? 1.0 : 2.5,
      powerupType: 'life'
    };
  }
  
  if (rand < lifeChance + powerupChance) {
    const powerups: PowerupType[] = ['wings', 'super', 'ghost', 'jaw', 'earth'];
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
  
  // Gap narrows down from 1.0 to 0.55 as score reaches 45,000 pts
  const gapMultiplier = Math.max(0.55, 1.0 - (score / 45000));
  
  const minGap = ((currentSpeed * 1.1) + 6) * gapMultiplier;
  const gap = minGap + Math.random() * (currentSpeed * 0.8) * gapMultiplier;
  
  return SPAWN_DISTANCE + gap;
}

/**
 * Returns whether birds are eligible to spawn at the current game speed or score.
 */
export function isBirdEligible(): boolean {
  const { score, speed } = useGameStore.getState();
  return speed > 14 || score > 1500;
}
