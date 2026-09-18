import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { ObstacleData, ObstacleType } from './types';
import { spawnParticles } from '../components/VFXRenderer';
import { playHitSound, playScoreSound, playLifeSound, playGameOverSound, playPowerupCollectSound } from '../utils/audio';
import {
  POWERUP_DURATION,
  INVINCIBILITY_DURATION_MS,
  WEAK_JUMP_DURATION_MS,
  BIRD_EATING_DURATION_MS,
  REDUCED_VISIBILITY_DURATION_MS,
  LEECH_STACKS_TO_DAMAGE,
} from '../config/balance';

export interface CollisionContext {
  obs: ObstacleData;
  x: number;
  y: number;
  dinoRef: React.RefObject<THREE.Group | null>;
}

function despawn(obs: ObstacleData) {
  obs.x = -100;
  if (obs.ref.current) obs.ref.current.position.y = -100;
}

// --- Collectibles: always resolved first, regardless of active powerup ---

function handleEgg({ obs, x, y }: CollisionContext): void {
  if (!obs.eggRarity) return;
  const rarityColor = obs.eggRarity === 'ultraRare' ? '#c084fc' : obs.eggRarity === 'rare' ? '#60a5fa' : '#4ade80';
  spawnParticles('sparkle', [x, y, 0], 20, rarityColor);
  playScoreSound();

  const textLabel = obs.eggRarity === 'ultraRare' ? 'OVO ULTRA RARO!' : obs.eggRarity === 'rare' ? 'OVO RARO!' : 'OVO COMUM!';
  const textColor = obs.eggRarity === 'ultraRare' ? '#a855f7' : obs.eggRarity === 'rare' ? '#3b82f6' : '#22c55e';
  useGameStore.getState().addFloatingText(textLabel, x, y + 1, 0, textColor);
  useGameStore.getState().collectEgg(obs.eggRarity);

  despawn(obs);
}

function handlePowerup({ obs, x, y }: CollisionContext): void {
  if (!obs.powerupType) return;

  if (obs.powerupType === 'life') {
    spawnParticles('sparkle', [x, y, 0], 20);
    playLifeSound();
    useGameStore.getState().gainLife();
    useGameStore.getState().addFloatingText('+1 VIDA', x, y + 1, 0, '#ef4444');
  } else {
    const powerupColors: Record<string, string> = {
      wings: '#ffd700',
      super: '#facc15',
      ghost: '#c084fc',
      jaw: '#f97316',
      earth: '#a16207',
      dragon: '#dc2626',
    };
    spawnParticles('absorb', [x, y, 0], 35, powerupColors[obs.powerupType] || '#fbbf24');
    playPowerupCollectSound();
    useGameStore.getState().activatePowerup(obs.powerupType, POWERUP_DURATION);
  }

  despawn(obs);
}

// --- Super/Ghost: any remaining obstacle is destroyed or phased through ---

function handleDestructiblePowerupObstacle({ obs, x, y }: CollisionContext, activePowerup: 'super' | 'ghost'): void {
  if (activePowerup === 'ghost') {
    useGameStore.getState().addFloatingText('-1s', x, y + 1, 0, '#a855f7');
    useGameStore.setState((state) => ({ powerupEndTime: state.powerupEndTime - 1 }));
    spawnParticles('sparkle', [x, y, 0], 12, '#a855f7');
  } else {
    // Super destroys on contact for the spectacle, but no longer farms score doing it.
    spawnParticles('explosion', [x, y, 0], 30);
    useGameStore.getState().triggerCameraShake(0.5);
    useGameStore.getState().triggerCameraShake(0.3);
  }
  despawn(obs);
}

// --- Shared "destroy an obstacle for score" effect, used by anything that destroys
//     obstacles from outside the normal dino/obstacle collision (e.g. the dragon's fireball) ---

export function destroyObstacleWithScore(obs: ObstacleData, x: number, y: number, color = '#f97316'): void {
  playScoreSound();
  spawnParticles('explosion', [x, y, 0], 30, color);
  useGameStore.getState().triggerCameraShake(0.4);
  useGameStore.getState().addFloatingText('+100 Pts', x, y + 1, 0, '#ffffff');
  useGameStore.getState().incrementScore(100);
  despawn(obs);
}

// --- Jaw: eats any of these obstacle types outright, regardless of invincibility ---

const JAW_EDIBLE_TYPES: ObstacleType[] = ['bird', 'sand-worm', 'leech', 'croc', 'lava-bug'];

function handleJawEat({ obs, x, y }: CollisionContext): void {
  playScoreSound();
  spawnParticles('explosion', [x, y, 0], 20, '#ef4444');
  useGameStore.getState().addFloatingText('+100 Pts', x, y + 1, 0, '#ffffff');
  useGameStore.getState().incrementScore(100);
  useGameStore.getState().triggerCameraShake(0.3);

  // Eating a creature regenerates a life, capped at MAX_LIVES by gainLife() itself.
  useGameStore.getState().gainLife();
  playLifeSound();
  useGameStore.getState().addFloatingText('+1 VIDA', x, y + 2, 0, '#ef4444');

  despawn(obs);
}

// --- Bird: eaten by default (with a cooldown) when jaw isn't active ---

function handleBird(ctx: CollisionContext): 'resolved' | 'fallthrough' {
  const { obs, x, y } = ctx;
  const state = useGameStore.getState();

  const isCurrentlyEating = performance.now() < state.eatingUntil;
  if (!isCurrentlyEating) {
    playScoreSound();
    spawnParticles('explosion', [x, y, 0], 25, '#ef4444');
    state.setEatingUntil(performance.now() + BIRD_EATING_DURATION_MS);
    state.addFloatingText('NHAC!', x, y + 1, 0, '#ec4899');
    state.incrementScore(50);
    despawn(obs);
    return 'resolved';
  }

  // Already eating another bird: this one behaves like a normal obstacle.
  return 'fallthrough';
}

// --- Fatal collision: damage, egg loss, life loss, possible game over ---

function handleFatalCollision(ctx: CollisionContext, dinoColor: string): boolean {
  const { obs, x, y } = ctx;
  const state = useGameStore.getState();

  state.triggerCameraShake(1.0);
  spawnParticles('explosion', [x, y, 0], 40, dinoColor);
  despawn(obs);
  state.setInvincibleUntil(performance.now() + INVINCIBILITY_DURATION_MS);

  const tail = state.eggsInTail;
  if (tail.length > 0) {
    const lastEgg = tail[tail.length - 1];
    const eggColor = lastEgg.rarity === 'ultraRare' ? '#a855f7' : lastEgg.rarity === 'rare' ? '#3b82f6' : '#22c55e';

    let parentX = x;
    let parentY = 0;
    const dinoGroup = ctx.dinoRef.current;
    if (dinoGroup && dinoGroup.parent) {
      const visualGroup = dinoGroup.parent.children.find(child => child !== dinoGroup && child instanceof THREE.Group);
      if (visualGroup) {
        parentX = visualGroup.position.x;
        parentY = visualGroup.position.y;
      } else {
        parentX = dinoGroup.position.x;
        parentY = dinoGroup.position.y;
      }
    }

    spawnParticles('explosion', [parentX, parentY + 0.5, 0], 25, eggColor);
    state.loseEgg();
    state.addFloatingText('-1 OVO', parentX, parentY + 1, 0, '#ef4444');
  }

  state.loseLife();

  if (useGameStore.getState().lives <= 0) {
    playGameOverSound();
    useGameStore.getState().endGame();
    return true;
  }
  playHitSound();
  return false;
}

// --- Mushroom (forest): real damage plus a temporary fog/visibility debuff ---

// Temporary fog debuff shared by the forest mushroom and the snowman.
function applyReducedVisibility(x: number, y: number, label: string): void {
  const state = useGameStore.getState();
  const currentFog = state.fogSettings[state.scenario];
  if (performance.now() >= state.reducedVisibilityUntil) {
    state.setOriginalFogDensity(currentFog);
  }
  state.setFogDensity(state.scenario, 'high');
  state.setReducedVisibilityUntil(performance.now() + REDUCED_VISIBILITY_DURATION_MS);
  state.addFloatingText('VISÃO REDUZIDA!', x, y + 1, 0, label);
}

function handleMushroom(ctx: CollisionContext, dinoColor: string): boolean {
  applyReducedVisibility(ctx.x, ctx.y, '#a3e635');
  return handleFatalCollision(ctx, dinoColor);
}

// --- Snowman (snow): real damage, a short weak-jump slow, plus reduced visibility ---

function handleSnowman(ctx: CollisionContext, dinoColor: string): boolean {
  const { x, y } = ctx;
  applyReducedVisibility(x, y, '#93c5fd');
  useGameStore.getState().setWeakJumpUntil(performance.now() + WEAK_JUMP_DURATION_MS);
  return handleFatalCollision(ctx, dinoColor);
}

// --- Leech (swamp): stacks up on repeated contact, damage + clear on the 3rd ---

function handleLeech(ctx: CollisionContext, dinoColor: string): boolean {
  const { obs, x, y } = ctx;
  const state = useGameStore.getState();
  const stacks = state.addLeechStack();

  if (stacks >= LEECH_STACKS_TO_DAMAGE) {
    state.resetLeechStacks();
    state.addFloatingText('SANGUESSUGAS LIMPAS!', x, y + 1, 0, '#ef4444');
    return handleFatalCollision(ctx, dinoColor);
  }

  playHitSound();
  spawnParticles('dust', [x, y, 0], 12, '#7f1d1d');
  state.addFloatingText(`+1 SANGUESSUGA (${stacks}/${LEECH_STACKS_TO_DAMAGE})`, x, y + 1, 0, '#b91c1c');
  despawn(obs);
  return false;
}

/**
 * Resolves a single dino/obstacle collision: mutates the obstacle to despawn
 * it and applies whatever score/status/damage effect it causes.
 * Returns true if the run ended as a result (caller should stop iterating).
 */
export function resolveObstacleCollision(ctx: CollisionContext, dinoColor: string): boolean {
  const { obs } = ctx;

  if (obs.type === 'egg') {
    handleEgg(ctx);
    return false;
  }
  if (obs.type === 'powerup') {
    handlePowerup(ctx);
    return false;
  }

  const state = useGameStore.getState();

  // The lava T-Rex is a scripted event, not a one-hit obstacle: Super/Ghost just let the dino
  // through without destroying it or draining the powerup every frame it overlaps.
  if (obs.type === 'lava-rex' && (state.activePowerup === 'super' || state.activePowerup === 'ghost')) {
    return false;
  }

  if (state.activePowerup === 'super' || state.activePowerup === 'ghost') {
    handleDestructiblePowerupObstacle(ctx, state.activePowerup);
    return false;
  }

  if (state.activePowerup === 'jaw' && JAW_EDIBLE_TYPES.includes(obs.type)) {
    handleJawEat(ctx);
    return false;
  }

  if (obs.type === 'bird' && handleBird(ctx) === 'resolved') {
    return false;
  }

  if (performance.now() < state.invincibleUntil) {
    return false;
  }

  if (obs.type === 'leech') {
    return handleLeech(ctx, dinoColor);
  }

  if (obs.type === 'snowman') {
    return handleSnowman(ctx, dinoColor);
  }

  if (obs.type === 'mushroom') {
    return handleMushroom(ctx, dinoColor);
  }

  return handleFatalCollision(ctx, dinoColor);
}
