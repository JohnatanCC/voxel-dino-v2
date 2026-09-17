import { createRef, RefObject, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, GameScenario } from '../../store/gameStore';
import {
  TEST_ROOM_LANE_OFFSETS,
  TEST_ROOM_OBSTACLE_SPAWN_X,
  TEST_ROOM_OBSTACLE_DESPAWN_X,
  TEST_ROOM_OBSTACLE_MIN_GAP_S,
  TEST_ROOM_OBSTACLE_MAX_GAP_S,
} from '../../config/balance';
import { Cactus, Bird } from '../../scenarios/desert/DesertObstacles';
import { Stump, GiantBee, GiantMushroom } from '../../scenarios/forest/ForestObstacles';
import { DeadTree, Crow, CrocodileObstacle } from '../../scenarios/swamp/SwampObstacles';
import { IceBlockObstacle, LiveSnowmanObstacle, CampfireObstacle } from '../../scenarios/snow/SnowObstacles';

interface ObstacleSlot {
  id: number;
  type: string;
  x: number;
  y: number;
  seed: number;
  active: boolean;
  outerRef: RefObject<THREE.Group | null>;
  innerRef: RefObject<THREE.Group | null>;
}

interface ObstacleRecipe {
  type: string;
  flying?: boolean;
}

// Reuses each biome's existing obstacle model components as-is (see
// scenarios/<biome>/<Biome>Obstacles.tsx) — only the spawn/scroll/lane
// bookkeeping below is new, so only the current scenario's obstacles show up.
const BIOME_RECIPES: Record<GameScenario, ObstacleRecipe[]> = {
  desert: [{ type: 'cactus-small' }, { type: 'cactus-large' }, { type: 'bird', flying: true }],
  forest: [{ type: 'stump' }, { type: 'mushroom' }, { type: 'bee', flying: true }],
  swamp: [{ type: 'dead-tree' }, { type: 'crocodile' }, { type: 'crow', flying: true }],
  snow: [{ type: 'ice-block' }, { type: 'snowman' }, { type: 'campfire' }],
};

function renderObstacle(type: string, x: number, y: number, seed: number, ref: React.Ref<THREE.Group>) {
  switch (type) {
    case 'cactus-small': return <Cactus ref={ref as any} x={x} scale={0.75} numStems={1} />;
    case 'cactus-large': return <Cactus ref={ref as any} x={x} scale={1.25} numStems={2} />;
    case 'bird': return <Bird ref={ref as any} x={x} y={y} />;
    case 'stump': return <Stump ref={ref as any} x={x} scale={1} />;
    case 'mushroom': return <GiantMushroom ref={ref as any} x={x} spotSeed={seed} />;
    case 'bee': return <GiantBee ref={ref as any} x={x} y={y} />;
    case 'dead-tree': return <DeadTree ref={ref as any} x={x} scale={1} />;
    case 'crocodile': return <CrocodileObstacle ref={ref as any} x={x} />;
    case 'crow': return <Crow ref={ref as any} x={x} y={y} />;
    case 'ice-block': return <IceBlockObstacle ref={ref as any} x={x} y={0} />;
    case 'snowman': return <LiveSnowmanObstacle ref={ref as any} x={x} y={0} />;
    case 'campfire': return <CampfireObstacle ref={ref as any} x={x} y={0} />;
    default: return null;
  }
}

const POOL_SIZE = 6;

interface TestRoomObstaclesProps {
  biome: GameScenario;
}

export function TestRoomObstacles({ biome }: TestRoomObstaclesProps) {
  const [pool] = useState<ObstacleSlot[]>(() =>
    Array.from({ length: POOL_SIZE }, (_, i) => ({
      id: i,
      type: 'cactus-small',
      x: -1000,
      y: 0,
      seed: 0.5,
      active: false,
      outerRef: createRef<THREE.Group>(),
      innerRef: createRef<THREE.Group>(),
    }))
  );
  const spawnTimer = useRef(1.0);
  const prevBiome = useRef(biome);

  // Clear any in-flight obstacles immediately on a scenario switch (1-4) so
  // only the current biome's obstacle types are ever visible.
  useEffect(() => {
    if (prevBiome.current === biome) return;
    prevBiome.current = biome;
    pool.forEach((slot) => {
      slot.active = false;
      if (slot.outerRef.current) slot.outerRef.current.visible = false;
    });
    spawnTimer.current = TEST_ROOM_OBSTACLE_MIN_GAP_S;
  }, [biome, pool]);

  useFrame((_state, delta) => {
    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta;

    pool.forEach((slot) => {
      if (!slot.active) return;
      slot.x -= moveDistance;
      if (slot.x < TEST_ROOM_OBSTACLE_DESPAWN_X) {
        slot.active = false;
        if (slot.outerRef.current) slot.outerRef.current.visible = false;
      } else if (slot.innerRef.current) {
        slot.innerRef.current.position.x = slot.x;
      }
    });

    spawnTimer.current -= delta;
    if (spawnTimer.current <= 0) {
      const freeSlot = pool.find((s) => !s.active);
      if (freeSlot) {
        const recipes = BIOME_RECIPES[biome];
        const choice = recipes[Math.floor(Math.random() * recipes.length)];
        freeSlot.type = choice.type;
        freeSlot.x = TEST_ROOM_OBSTACLE_SPAWN_X;
        freeSlot.y = choice.flying ? 1.0 + Math.random() * 1.8 : 0;
        freeSlot.seed = Math.random();
        freeSlot.active = true;

        const lane = Math.floor(Math.random() * TEST_ROOM_LANE_OFFSETS.length);
        if (freeSlot.outerRef.current) {
          freeSlot.outerRef.current.position.z = TEST_ROOM_LANE_OFFSETS[lane];
          freeSlot.outerRef.current.visible = true;
        }
        if (freeSlot.innerRef.current) {
          freeSlot.innerRef.current.position.x = freeSlot.x;
        }
      }
      spawnTimer.current = TEST_ROOM_OBSTACLE_MIN_GAP_S + Math.random() * (TEST_ROOM_OBSTACLE_MAX_GAP_S - TEST_ROOM_OBSTACLE_MIN_GAP_S);
    }
  });

  return (
    <group>
      {pool.map((slot) => (
        <group key={slot.id} ref={slot.outerRef}>
          {renderObstacle(slot.type, slot.x, slot.y, slot.seed, slot.innerRef)}
        </group>
      ))}
    </group>
  );
}
