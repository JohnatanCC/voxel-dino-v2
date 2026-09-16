import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { ObstacleData, ObstacleType } from './types';
import { spawnParticles } from '../components/VFXRenderer';
import { playHitSound, playScoreSound, playLifeSound, playGameOverSound } from '../utils/audio';
import {
  POWERUP_DURATION,
  INVINCIBILITY_DURATION_MS,
  MUMMY_SLOW_DURATION_MS,
  HEAVY_JUMP_DURATION_MS,
  WEAK_JUMP_DURATION_MS,
  PUDDLE_SLOW_DURATION_MS,
  BIRD_EATING_DURATION_MS,
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
    };
    spawnParticles('absorb', [x, y, 0], 35, powerupColors[obs.powerupType] || '#fbbf24');
    playScoreSound();
    useGameStore.getState().activatePowerup(obs.powerupType, POWERUP_DURATION);
  }

  despawn(obs);
}

// --- Status-effect obstacles: apply a temporary effect and despawn, no damage ---

type StatusEffectHandler = (ctx: CollisionContext) => void;

const STATUS_EFFECT_HANDLERS: Partial<Record<ObstacleType, StatusEffectHandler>> = {
  mummy: ({ obs, x, y }) => {
    playHitSound();
    spawnParticles('dust', [x, y, 0], 30, '#fef08a');

    const state = useGameStore.getState();
    const currentFog = state.fogSettings[state.scenario];
    if (performance.now() >= state.mummySlowUntil) {
      state.setOriginalFogDensity(currentFog);
    }
    state.setFogDensity(state.scenario, 'high');
    state.setMummySlowUntil(performance.now() + MUMMY_SLOW_DURATION_MS);
    state.addFloatingText('MÚMIA! NEBLINA E LENTO', x, y + 1, 0, '#eab308');

    despawn(obs);
  },
  skull: ({ obs, x, y }) => {
    playHitSound();
    spawnParticles('dust', [x, y, 0], 30, '#f8fafc');
    useGameStore.getState().addFloatingText('PESADO!', x, y + 1, 0, '#94a3b8');
    useGameStore.getState().setHeavyJumpUntil(performance.now() + HEAVY_JUMP_DURATION_MS);
    despawn(obs);
  },
  snowman: ({ obs, x, y }) => {
    playHitSound();
    spawnParticles('dust', [x, y, 0], 30, '#f8fafc');
    useGameStore.getState().addFloatingText('FRACO!', x, y + 1, 0, '#60a5fa');
    useGameStore.getState().setWeakJumpUntil(performance.now() + WEAK_JUMP_DURATION_MS);
    despawn(obs);
  },
  puddle: ({ obs, x, y }) => {
    spawnParticles('dust', [x, y, 0], 30, '#0ea5e9');
    useGameStore.getState().addFloatingText('LENTO!', x, y + 1, 0, '#0ea5e9');
    useGameStore.getState().setSlowUntil(performance.now() + PUDDLE_SLOW_DURATION_MS);
    despawn(obs);
  },
  firebox: ({ obs, x, y }) => {
    playScoreSound();
    spawnParticles('sparkle', [x, y, 0], 20, '#ef4444');
    useGameStore.getState().addFloatingText('QUENTE!', x, y + 1, 0, '#ef4444');
    useGameStore.getState().resetColdTimer();
    despawn(obs);
  },
};

// --- Super/Ghost: any remaining obstacle is destroyed or phased through ---

function handleDestructiblePowerupObstacle({ obs, x, y }: CollisionContext, activePowerup: 'super' | 'ghost'): void {
  if (activePowerup === 'ghost') {
    useGameStore.getState().addFloatingText('-1s', x, y + 1, 0, '#a855f7');
    useGameStore.setState((state) => ({ powerupEndTime: state.powerupEndTime - 1 }));
    spawnParticles('sparkle', [x, y, 0], 12, '#a855f7');
  } else {
    playScoreSound();
    spawnParticles('explosion', [x, y, 0], 30);
    useGameStore.getState().triggerCameraShake(0.5);
    useGameStore.getState().addFloatingText('+100 Pts', x, y + 1, 0, '#ffffff');
    useGameStore.getState().incrementScore(100);
    useGameStore.getState().triggerCameraShake(0.3);
  }
  despawn(obs);
}

// --- Bird: eaten by the jaw powerup, or eaten by default (with a cooldown) ---

function handleBird(ctx: CollisionContext): 'resolved' | 'fallthrough' {
  const { obs, x, y } = ctx;
  const state = useGameStore.getState();

  if (state.activePowerup === 'jaw') {
    playScoreSound();
    spawnParticles('explosion', [x, y, 0], 20, '#ef4444');
    state.addFloatingText('+100 Pts', x, y + 1, 0, '#ffffff');
    state.incrementScore(100);
    state.triggerCameraShake(0.3);
    despawn(obs);
    return 'resolved';
  }

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

  if (state.activePowerup === 'super' || state.activePowerup === 'ghost') {
    handleDestructiblePowerupObstacle(ctx, state.activePowerup);
    return false;
  }

  if (obs.type === 'bird' && handleBird(ctx) === 'resolved') {
    return false;
  }

  if (performance.now() < state.invincibleUntil) {
    return false;
  }

  const statusEffect = STATUS_EFFECT_HANDLERS[obs.type];
  if (statusEffect) {
    statusEffect(ctx);
    return false;
  }

  return handleFatalCollision(ctx, dinoColor);
}
