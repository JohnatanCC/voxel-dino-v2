import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, createRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType } from '../types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, tryGenerateGlobalObstacle, calculateNextObstaclePosition } from '../helpers';
import { VoxelEgg } from '../../components/VoxelEgg';
import { getAllowedObstacles, FREQUENCY_RAMP_SCORE } from '../../config/balance';
import { PowerupBox } from '../shared/PowerupBox';

// Reusable static materials
const woodMaterial = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
const woodInnerMaterial = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.8 });
const treeHoleTrunkMaterial = new THREE.MeshStandardMaterial({ color: '#3f2715', roughness: 0.9 });
const treeHoleLeavesMaterial = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.9 });

// Bee materials
const beeBodyMaterial = new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.6 });
const beeStripeMaterial = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.6 });
const beeWingMaterial = new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.3, transparent: true, opacity: 0.55 });
const beeStingerMaterial = new THREE.MeshStandardMaterial({ color: '#450a0a', roughness: 0.5 });
const beeEyeMaterial = new THREE.MeshBasicMaterial({ color: '#000000' });
const beeBrowMaterial = new THREE.MeshBasicMaterial({ color: '#1c1917' });

// Mushroom materials
const mushroomCapMaterial = new THREE.MeshStandardMaterial({ color: '#7c3aed', roughness: 0.7 });
const mushroomStemMaterial = new THREE.MeshStandardMaterial({ color: '#f5f0e6', roughness: 0.8 });
const mushroomSpotMaterial = new THREE.MeshStandardMaterial({ color: '#c4b5fd', roughness: 0.5, emissive: '#a78bfa', emissiveIntensity: 0.5 });
const mushroomGillMaterial = new THREE.MeshStandardMaterial({ color: '#4c1d95', roughness: 0.9 });

// Reusable static geometries
const cylinderStumpHighGeo = new THREE.CylinderGeometry(0.5, 0.6, 2.5, 8);
const cylinderStumpLowGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8);
const cylinderStumpInnerGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.02, 8);

const beeBodyGeo = new THREE.BoxGeometry(0.8, 0.6, 0.6);
const beeStripeGeo = new THREE.BoxGeometry(0.16, 0.62, 0.62);
const beeWingGeo = new THREE.BoxGeometry(0.5, 0.05, 0.9);
const beeHeadGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
const beeStingerGeo = new THREE.BoxGeometry(0.3, 0.1, 0.1);
const beeEyeGeo = new THREE.BoxGeometry(0.08, 0.15, 0.08);
const beeBrowGeo = new THREE.BoxGeometry(0.14, 0.05, 0.08);
const beeAntennaGeo = new THREE.BoxGeometry(0.04, 0.22, 0.04);

const mushroomCapGeo = new THREE.SphereGeometry(1.0, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
const mushroomGillGeo = new THREE.CylinderGeometry(0.85, 0.6, 0.15, 10);
const mushroomStemGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.3, 8);
const mushroomSpotGeo = new THREE.SphereGeometry(0.14, 6, 6);

const treeHoleHitboxGeo = new THREE.BoxGeometry(1.5, 6, 2);
const treeHoleCanopyGeo = new THREE.BoxGeometry(2, 4, 5);
const treeHoleLeavesGeo = new THREE.SphereGeometry(4, 8, 8);
const treeHoleSideTrunkGeo = new THREE.CylinderGeometry(0.6, 1.2, 3, 5);

export const Stump = forwardRef<THREE.Group, { x: number; scale: number; isHigh?: boolean }>(
  ({ x, scale, isHigh = false }, ref) => {
    const height = isHigh ? 2.5 : 1.5;
    const geometry = isHigh ? cylinderStumpHighGeo : cylinderStumpLowGeo;
    return (
      <group ref={ref} position={[x, 0, 0]} scale={scale}>
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow material={woodMaterial} geometry={geometry} />
        <mesh position={[0, height + 0.01, 0]} receiveShadow material={woodInnerMaterial} geometry={cylinderStumpInnerGeo} />
      </group>
    );
  }
);

// --- Giant Angry Bee: forest's flying threat (keeps ObstacleType 'bird' to inherit the eat/jaw mechanics) ---

export const GiantBee = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();

      // Erratic angry-bee bobbing + darting
      const bobY = Math.sin(time * 5 + x) * 0.4;
      const dartZ = Math.sin(time * 7 + x * 2) * 0.3;
      innerRef.current.position.y = y + bobY;
      innerRef.current.position.z = dartZ;

      const wingL = innerRef.current.children[2] as THREE.Mesh;
      const wingR = innerRef.current.children[3] as THREE.Mesh;
      if (wingL && wingR) {
        wingL.rotation.x = Math.sin(time * 35) * 0.7;
        wingR.rotation.x = -Math.sin(time * 35) * 0.7;
      }
    }
  });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow material={beeBodyMaterial} geometry={beeBodyGeo} />
      {/* Stripes */}
      <mesh position={[-0.15, 0, 0]} material={beeStripeMaterial} geometry={beeStripeGeo} />
      <mesh position={[0.15, 0, 0]} material={beeStripeMaterial} geometry={beeStripeGeo} />
      {/* Wing L */}
      <mesh position={[0, 0.3, 0.35]} castShadow material={beeWingMaterial} geometry={beeWingGeo} />
      {/* Wing R */}
      <mesh position={[0, 0.3, -0.35]} castShadow material={beeWingMaterial} geometry={beeWingGeo} />
      {/* Head */}
      <mesh position={[-0.55, 0.05, 0]} castShadow receiveShadow material={beeBodyMaterial} geometry={beeHeadGeo} />
      {/* Angry eyes */}
      <mesh position={[-0.72, 0.08, 0.15]} material={beeEyeMaterial} geometry={beeEyeGeo} />
      <mesh position={[-0.72, 0.08, -0.15]} material={beeEyeMaterial} geometry={beeEyeGeo} />
      {/* Angry eyebrows */}
      <mesh position={[-0.68, 0.2, 0.15]} rotation={[0, 0, 0.4]} material={beeBrowMaterial} geometry={beeBrowGeo} />
      <mesh position={[-0.68, 0.2, -0.15]} rotation={[0, 0, -0.4]} material={beeBrowMaterial} geometry={beeBrowGeo} />
      {/* Antennae */}
      <mesh position={[-0.7, 0.32, 0.08]} rotation={[0, 0, -0.3]} material={beeStripeMaterial} geometry={beeAntennaGeo} />
      <mesh position={[-0.7, 0.32, -0.08]} rotation={[0, 0, 0.3]} material={beeStripeMaterial} geometry={beeAntennaGeo} />
      {/* Stinger */}
      <mesh position={[0.55, -0.05, 0]} material={beeStingerMaterial} geometry={beeStingerGeo} />
    </group>
  );
});

// --- Giant Mushroom: real damage + a temporary fog debuff (obstacleEffects.ts handles the effect) ---

export const GiantMushroom = forwardRef<THREE.Group, { x: number; spotSeed: number }>(({ x, spotSeed }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  useImperativeHandle(ref, () => innerRef.current!);

  const spots = useRef(
    Array.from({ length: 4 }, (_, i) => {
      const angle = (i / 4) * Math.PI * 2 + spotSeed;
      const r = 0.5 + (spotSeed % 0.3);
      return [Math.cos(angle) * r, 1.55, Math.sin(angle) * r] as [number, number, number];
    })
  ).current;

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      const pulse = 1 + Math.sin(time * 2 + x) * 0.03;
      innerRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <group ref={innerRef} position={[x, 0, 0]}>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow material={mushroomStemMaterial} geometry={mushroomStemGeo} />
      <mesh position={[0, 1.45, 0]} receiveShadow material={mushroomGillMaterial} geometry={mushroomGillGeo} />
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow material={mushroomCapMaterial} geometry={mushroomCapGeo} />
      {spots.map((pos, i) => (
        <mesh key={i} position={pos} material={mushroomSpotMaterial} geometry={mushroomSpotGeo} />
      ))}
    </group>
  );
});


export const TreeHoleObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const hitboxRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => hitboxRef.current!);

  useFrame(() => {
    if (hitboxRef.current && visualRef.current) {
       visualRef.current.position.x = hitboxRef.current.position.x;
    }
  });

  return (
    <>
      <group ref={hitboxRef} position={[x, 0, 0]}>
        {/* Hitbox at the top */}
        <mesh position={[0, 4.5, 0]} visible={false} geometry={treeHoleHitboxGeo} />
      </group>

      <group ref={visualRef} position={[x, 0, 0]}>
        {/* Canopy / Arch connecting */}
        <mesh position={[0, 5, 0]} castShadow receiveShadow material={treeHoleTrunkMaterial} geometry={treeHoleCanopyGeo} />
        <mesh position={[0, 7, 0]} castShadow receiveShadow material={treeHoleLeavesMaterial} geometry={treeHoleLeavesGeo} />

        {/* Roots / side trunks */}
        <mesh position={[0, 1.5, 2.5]} castShadow receiveShadow material={treeHoleTrunkMaterial} geometry={treeHoleSideTrunkGeo} />
        <mesh position={[0, 1.5, -2.5]} castShadow receiveShadow material={treeHoleTrunkMaterial} geometry={treeHoleSideTrunkGeo} />
      </group>
    </>
  );
});

export const ForestObstacles = forwardRef<ObstacleData[]>((props, ref) => {
  const { status, speed, gameId, isTransitioning } = useGameStore();

  // The pool is a fixed state array of 8 items, pre-created with stable refs
  const [pool] = useState<ObstacleData[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      type: 'stump-low',
      x: -1000,
      y: -1000,
      ref: createRef<THREE.Group>()
    }))
  );

  const nextSpawnX = useRef(SPAWN_DISTANCE);
  const lastInitializedGameId = useRef<number | null>(null);

  const randomStumpScale = (isHigh: boolean): number => (isHigh ? 1.0 + Math.random() * 0.5 : 0.6 + Math.random() * 0.4);

  const generateObstacleInSlot = (slot: ObstacleData, x: number): ObstacleData => {
    // Intercept egg spawning if flagged by the score system
    const store = useGameStore.getState();
    if (store.shouldSpawnEgg && store.pendingEggRarity) {
      slot.type = 'egg';
      slot.x = x;
      slot.y = 0.35;
      slot.eggRarity = store.pendingEggRarity;
      slot.powerupType = undefined;

      // Reset the spawning flags in the store
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

    // Scenario-specific obstacles, unlocked progressively as the score climbs
    const allowed = getAllowedObstacles('forest', store.score);
    const type = allowed[Math.floor(Math.random() * allowed.length)];
    let y = 0;

    if (type === 'bird') {
      y = 0.8 + Math.random() * 2.4;
    }

    slot.type = type;
    slot.x = x;
    slot.y = y;
    slot.scale = (type === 'stump-low' || type === 'stump-high') ? randomStumpScale(type === 'stump-high') : Math.random() * 1000;
    slot.powerupType = undefined;
    return slot;
  };

  // Handle start and reset
  useEffect(() => {
    if (status === 'playing') {
       if (lastInitializedGameId.current !== gameId) {
          lastInitializedGameId.current = gameId;

          pool.forEach(obs => {
            obs.x = -1000;
            obs.y = -1000;
            if (obs.ref.current) {
              obs.ref.current.position.set(-1000, -1000, 0);
              obs.ref.current.visible = false;
            }
          });

          const isTransition = useGameStore.getState().gameTime > 2.0;
          const firstX = isTransition ? 55 : 25;
          const secondX = isTransition ? 70 : 40;

          generateObstacleInSlot(pool[0], firstX);
          generateObstacleInSlot(pool[1], secondX);

          nextSpawnX.current = isTransition ? 85 : 55;
       }

       // Sync refs
       pool.forEach(obs => {
         if (obs.ref.current && obs.x > DESPAWN_DISTANCE) {
           obs.ref.current.position.set(obs.x, obs.y, 0);
           obs.ref.current.visible = true;
         }
       });

       if (ref && 'current' in ref) {
         (ref as React.MutableRefObject<ObstacleData[]>).current = pool.filter(obs => obs.x > DESPAWN_DISTANCE);
       }
    } else if (status === 'menu') {
       lastInitializedGameId.current = null;
       pool.forEach(obs => {
         obs.x = -1000;
         obs.y = -1000;
         if (obs.ref.current) {
           obs.ref.current.position.set(-1000, -1000, 0);
           obs.ref.current.visible = false;
         }
       });
       if (ref && 'current' in ref) {
         (ref as React.MutableRefObject<ObstacleData[]>).current = [];
       }
       nextSpawnX.current = SPAWN_DISTANCE;
    }
  }, [gameId, status]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta;

    // 1. Move active items and sync visibility/positions
    pool.forEach(obs => {
      if (obs.x > DESPAWN_DISTANCE) {
        let currentMove = moveDistance;
        if (obs.type === 'bird') {
          currentMove += 4 * delta; // Slowly flies forward
        }
        obs.x -= currentMove;
        if (obs.ref.current) {
          obs.ref.current.position.x = obs.x;
          if (obs.type !== 'bird') {
            obs.ref.current.position.y = obs.y;
          }
          obs.ref.current.visible = true;
        }
      } else {
        if (obs.ref.current) {
          obs.ref.current.position.x = -1000;
          obs.ref.current.visible = false;
        }
      }
    });

    nextSpawnX.current -= moveDistance;

    // 2. Check if we need to recycle off-screen or spawn new ones
    const shouldSpawn = nextSpawnX.current < SPAWN_DISTANCE && !isTransitioning;

    if (shouldSpawn) {
      const score = useGameStore.getState().score;
      const spawnFlock = score > FREQUENCY_RAMP_SCORE && Math.random() < 0.7;

      if (spawnFlock) {
         const inactiveSlots = pool.filter(obs => obs.x <= DESPAWN_DISTANCE);
         if (inactiveSlots.length >= 5) {
            const nextObsX = calculateNextObstaclePosition();
            for (let k = 0; k < 5; k++) {
               const slot = inactiveSlots[k];
               slot.type = 'bird';
               slot.x = nextObsX + k * (2.5 + Math.random() * 2);
               slot.y = 0.8 + Math.random() * 2.4;
               slot.powerupType = undefined;

               if (slot.ref.current) {
                 slot.ref.current.position.set(slot.x, slot.y, 0);
                 slot.ref.current.visible = true;
               }
            }
            nextSpawnX.current = nextObsX + 5 * 3;
         } else {
            const inactiveSlot = pool.find(obs => obs.x <= DESPAWN_DISTANCE);
            if (inactiveSlot) {
              const newObsX = calculateNextObstaclePosition();
              generateObstacleInSlot(inactiveSlot, newObsX);
              nextSpawnX.current = newObsX;
              if (inactiveSlot.ref.current) {
                inactiveSlot.ref.current.position.set(inactiveSlot.x, inactiveSlot.y, 0);
                inactiveSlot.ref.current.visible = true;
              }
            }
         }
      } else {
         const inactiveSlot = pool.find(obs => obs.x <= DESPAWN_DISTANCE);
         if (inactiveSlot) {
           const newObsX = calculateNextObstaclePosition();
           generateObstacleInSlot(inactiveSlot, newObsX);
           nextSpawnX.current = newObsX;
           if (inactiveSlot.ref.current) {
             inactiveSlot.ref.current.position.set(inactiveSlot.x, inactiveSlot.y, 0);
             inactiveSlot.ref.current.visible = true;
           }
         }
      }
    }

    if (ref && 'current' in ref) {
      (ref as React.MutableRefObject<ObstacleData[]>).current = pool.filter(obs => obs.x > DESPAWN_DISTANCE);
    }
  });

  return (
    <group>
      {pool.map(obs => {
        if (obs.type === 'stump-low') {
          return <Stump key={obs.id} ref={obs.ref as any} x={obs.x} scale={obs.scale ?? 0.8} />;
        }
        if (obs.type === 'stump-high') {
           return <Stump key={obs.id} ref={obs.ref as any} x={obs.x} scale={obs.scale ?? 1.2} isHigh={true} />;
        }
        if (obs.type === 'mushroom') {
           return <GiantMushroom key={obs.id} ref={obs.ref as any} x={obs.x} spotSeed={obs.scale ?? 0} />;
        }
        if (obs.type === 'tree-hole') {
           return <TreeHoleObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'bird') {
          return <GiantBee key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
        }
        if (obs.type === 'powerup') {
          return <PowerupBox key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} type={obs.powerupType} />;
        }
        if (obs.type === 'egg') {
          return <VoxelEgg key={obs.id} ref={obs.ref as any} rarity={obs.eggRarity || 'common'} x={obs.x} y={obs.y} />;
        }
        return null;
      })}
    </group>
  );
});
