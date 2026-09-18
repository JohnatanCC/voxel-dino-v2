import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useRef, useState, createRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData } from '../types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, tryGenerateGlobalObstacle, calculateNextObstaclePosition, pickVariedType } from '../helpers';
import { VoxelEgg } from '../../components/VoxelEgg';
import { getAllowedObstacles, FREQUENCY_RAMP_SCORE, OBSTACLE_FLOCK_SIZE } from '../../config/balance';
import { PowerupBox } from '../shared/PowerupBox';
import { Bird } from '../desert/DesertObstacles';
import { LavaPool, LavaBug } from './LavaModels';
import { LavaRex } from './LavaRex';

const POOL_SIZE = 8;
const BUG_EXTRA_SPEED = 3; // walks toward the player a little faster than the ground scrolls
const BIRD_EXTRA_SPEED = 4;

export const LavaObstacles = forwardRef<ObstacleData[]>((_props, ref) => {
  const { status, gameId, isTransitioning } = useGameStore();

  const [pool] = useState<ObstacleData[]>(() =>
    Array.from({ length: POOL_SIZE }, (_, i) => ({
      id: i,
      type: 'lava-pool' as const,
      x: -1000,
      y: -1000,
      ref: createRef<THREE.Group>(),
    }))
  );

  // Dedicated slot for the T-Rex event (not part of the recycled pool).
  const [rex] = useState<ObstacleData>(() => ({
    id: 998,
    type: 'lava-rex',
    x: -1000,
    y: 0,
    ref: createRef<THREE.Group>(),
  }));

  const nextSpawnX = useRef(SPAWN_DISTANCE);
  const lastInitializedGameId = useRef<number | null>(null);

  const publish = () => {
    if (ref && 'current' in ref) {
      (ref as React.MutableRefObject<ObstacleData[]>).current = [...pool, rex].filter((o) => o.x > DESPAWN_DISTANCE);
    }
  };

  const generateObstacleInSlot = (slot: ObstacleData, x: number): ObstacleData => {
    const store = useGameStore.getState();
    if (store.shouldSpawnEgg && store.pendingEggRarity) {
      slot.type = 'egg';
      slot.x = x;
      slot.y = 0.35;
      slot.eggRarity = store.pendingEggRarity;
      slot.powerupType = undefined;
      useGameStore.setState({ shouldSpawnEgg: false, pendingEggRarity: null });
      return slot;
    }

    const globalObstacle = tryGenerateGlobalObstacle();
    if (globalObstacle) {
      slot.type = globalObstacle.type;
      slot.x = x;
      slot.y = globalObstacle.y;
      slot.powerupType = globalObstacle.powerupType;
      return slot;
    }

    const allowed = getAllowedObstacles('lava', store.score);
    const type = pickVariedType(allowed);
    slot.type = type;
    slot.x = x;
    slot.y = type === 'bird' ? 0.8 + Math.random() * 2.4 : 0;
    slot.scale = type === 'lava-pool' ? (Math.random() < 0.5 ? 0.8 : 1.4) : undefined;
    slot.powerupType = undefined;
    return slot;
  };

  const placeInSlot = (slot: ObstacleData) => {
    if (slot.ref.current) {
      slot.ref.current.position.set(slot.x, slot.y, 0);
      slot.ref.current.visible = true;
    }
  };

  // Start / reset
  useEffect(() => {
    if (status === 'playing') {
      if (lastInitializedGameId.current !== gameId) {
        lastInitializedGameId.current = gameId;
        pool.forEach((obs) => {
          obs.x = -1000;
          obs.y = -1000;
          if (obs.ref.current) {
            obs.ref.current.position.set(-1000, -1000, 0);
            obs.ref.current.visible = false;
          }
        });

        const isTransition = useGameStore.getState().gameTime > 2.0;
        generateObstacleInSlot(pool[0], isTransition ? 55 : 25);
        generateObstacleInSlot(pool[1], isTransition ? 70 : 40);
        nextSpawnX.current = isTransition ? 85 : 55;
      }

      pool.forEach((obs) => {
        if (obs.ref.current && obs.x > DESPAWN_DISTANCE) {
          obs.ref.current.position.set(obs.x, obs.y, 0);
          obs.ref.current.visible = true;
        }
      });
      publish();
    } else if (status === 'menu') {
      lastInitializedGameId.current = null;
      pool.forEach((obs) => {
        obs.x = -1000;
        obs.y = -1000;
        if (obs.ref.current) {
          obs.ref.current.position.set(-1000, -1000, 0);
          obs.ref.current.visible = false;
        }
      });
      if (ref && 'current' in ref) (ref as React.MutableRefObject<ObstacleData[]>).current = [];
      nextSpawnX.current = SPAWN_DISTANCE;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, status]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    const store = useGameStore.getState();
    const moveDistance = store.getCurrentSpeed() * delta;

    pool.forEach((obs) => {
      if (obs.x > DESPAWN_DISTANCE) {
        let step = moveDistance;
        if (obs.type === 'bird') step += BIRD_EXTRA_SPEED * delta;
        if (obs.type === 'lava-bug') step += BUG_EXTRA_SPEED * delta;
        obs.x -= step;
        if (obs.ref.current) {
          obs.ref.current.position.x = obs.x;
          if (obs.type !== 'bird') obs.ref.current.position.y = obs.y;
          obs.ref.current.visible = true;
        }
      } else if (obs.ref.current) {
        obs.ref.current.position.x = -1000;
        obs.ref.current.visible = false;
      }
    });

    nextSpawnX.current -= moveDistance;

    // Regular spawns pause during a biome transition and while the T-Rex event is running.
    const shouldSpawn = nextSpawnX.current < SPAWN_DISTANCE && !isTransitioning && !store.lavaRexActive;
    if (shouldSpawn) {
      const score = store.score;
      const spawnFlock = score > FREQUENCY_RAMP_SCORE && Math.random() < 0.6;
      const inactive = pool.filter((o) => o.x <= DESPAWN_DISTANCE);

      if (spawnFlock && inactive.length >= OBSTACLE_FLOCK_SIZE) {
        const nextObsX = calculateNextObstaclePosition();
        for (let k = 0; k < OBSTACLE_FLOCK_SIZE; k++) {
          const slot = inactive[k];
          slot.type = 'bird';
          slot.x = nextObsX + k * (2.5 + Math.random() * 2);
          slot.y = 0.8 + Math.random() * 2.4;
          slot.powerupType = undefined;
          placeInSlot(slot);
        }
        nextSpawnX.current = nextObsX + OBSTACLE_FLOCK_SIZE * 3;
      } else if (inactive.length > 0) {
        const slot = inactive[0];
        const newObsX = calculateNextObstaclePosition();
        generateObstacleInSlot(slot, newObsX);
        nextSpawnX.current = newObsX;
        placeInSlot(slot);
      }
    }

    publish();
  });

  return (
    <group>
      {pool.map((obs) => {
        if (obs.type === 'lava-pool') {
          return <LavaPool key={obs.id} ref={obs.ref as any} x={obs.x} scale={obs.scale ?? 1} />;
        }
        if (obs.type === 'lava-bug') {
          return <LavaBug key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'bird') {
          return <Bird key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} ember />;
        }
        if (obs.type === 'powerup') {
          return <PowerupBox key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} type={obs.powerupType} />;
        }
        if (obs.type === 'egg') {
          return <VoxelEgg key={obs.id} ref={obs.ref as any} rarity={obs.eggRarity || 'common'} x={obs.x} y={obs.y} />;
        }
        return null;
      })}
      <LavaRex key={gameId} ref={rex.ref as any} data={rex} pool={pool} />
    </group>
  );
});
