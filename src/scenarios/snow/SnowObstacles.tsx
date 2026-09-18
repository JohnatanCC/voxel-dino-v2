import { forwardRef, useEffect, useRef, useState, createRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType, PowerupType } from '../types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, tryGenerateGlobalObstacle, calculateNextObstaclePosition, pickVariedType } from '../helpers';
import * as THREE from 'three';
import { VoxelEgg } from '../../components/VoxelEgg';
import { getAllowedObstacles } from '../../config/balance';
import { PowerupBox } from '../shared/PowerupBox';
import { Bird } from '../desert/DesertObstacles';

export type SnowObstacleType = 'ice-spike' | 'snowman' | 'bird' | 'powerup';

// Reusable static materials
const snowmanBodyMaterial = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.95 });
const snowmanNoseMaterial = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.8 });
const snowmanCoalMaterial = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 1.0 });
const snowmanStickMaterial = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
const snowmanHatMaterial = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 });

const iceSpikeMaterial = new THREE.MeshStandardMaterial({ color: '#a8e6ff', emissive: '#38bdf8', emissiveIntensity: 0.35, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92, flatShading: true });

// Reusable static geometries
const snowmanBaseGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
const snowmanMiddleGeo = new THREE.BoxGeometry(0.68, 0.68, 0.68);
const snowmanHeadGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
const snowmanNoseGeo = new THREE.BoxGeometry(0.25, 0.08, 0.08);
const snowmanCoalGeo = new THREE.BoxGeometry(0.04, 0.07, 0.07);
const snowmanStickGeo = new THREE.BoxGeometry(0.07, 0.07, 0.45);
const snowmanHatBrimGeo = new THREE.BoxGeometry(0.55, 0.04, 0.55);
const snowmanHatTopGeo = new THREE.BoxGeometry(0.32, 0.35, 0.32);

const iceSpikeBigGeo = new THREE.ConeGeometry(0.5, 2.0, 4);
const iceSpikeMidGeo = new THREE.ConeGeometry(0.36, 1.35, 4);
const iceSpikeSmallGeo = new THREE.ConeGeometry(0.28, 0.9, 4);

// Cluster of jagged ice spikes standing on the ground (replaces the old falling ice block).
export const IceSpikesObstacle = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => (
  <group ref={ref} position={[x, y, 0]}>
    <mesh position={[0, 1.0, 0]} rotation={[0, 0.4, 0.04]} castShadow receiveShadow material={iceSpikeMaterial} geometry={iceSpikeBigGeo} />
    <mesh position={[0.5, 0.67, 0.15]} rotation={[0, 0.9, -0.2]} castShadow receiveShadow material={iceSpikeMaterial} geometry={iceSpikeMidGeo} />
    <mesh position={[-0.48, 0.45, -0.1]} rotation={[0, 0.2, 0.22]} castShadow receiveShadow material={iceSpikeMaterial} geometry={iceSpikeSmallGeo} />
  </group>
));

export const LiveSnowmanObstacle = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (innerRef.current) {
      // Body wobbles left-right
      innerRef.current.rotation.z = Math.sin(time * 3) * 0.08;
      // Body breathes up-down
      innerRef.current.position.y = y + Math.sin(time * 6) * 0.02;
    }
    if (headGroupRef.current) {
      // Head bounces opposite to body
      headGroupRef.current.rotation.y = Math.cos(time * 4) * 0.12;
      headGroupRef.current.rotation.z = Math.cos(time * 3.5) * 0.06;
    }
  });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      {/* Base snowball */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow material={snowmanBodyMaterial} geometry={snowmanBaseGeo} />
      {/* Middle snowball */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow material={snowmanBodyMaterial} geometry={snowmanMiddleGeo} />
      {/* Arms (branches) */}
      <mesh position={[0, 1.2, 0.4]} rotation={[0.2, 0, 0.3]} castShadow material={snowmanStickMaterial} geometry={snowmanStickGeo} />
      <mesh position={[0, 1.2, -0.4]} rotation={[-0.2, 0, 0.3]} castShadow material={snowmanStickMaterial} geometry={snowmanStickGeo} />
      
      {/* Coal buttons */}
      <mesh position={[-0.35, 1.25, 0]} castShadow material={snowmanCoalMaterial} geometry={snowmanCoalGeo} />
      <mesh position={[-0.35, 1.05, 0]} castShadow material={snowmanCoalMaterial} geometry={snowmanCoalGeo} />

      {/* Head Group (contains face and hat) */}
      <group ref={headGroupRef} position={[0, 0, 0]}>
        {/* Head snowball */}
        <mesh position={[0, 1.625, 0]} castShadow receiveShadow material={snowmanBodyMaterial} geometry={snowmanHeadGeo} />
        {/* Nose */}
        <mesh position={[-0.32, 1.625, 0]} castShadow material={snowmanNoseMaterial} geometry={snowmanNoseGeo} />
        {/* Coal eyes */}
        <mesh position={[-0.23, 1.72, 0.1]} castShadow material={snowmanCoalMaterial} geometry={snowmanCoalGeo} />
        <mesh position={[-0.23, 1.72, -0.1]} castShadow material={snowmanCoalMaterial} geometry={snowmanCoalGeo} />
        
        {/* Hat */}
        <mesh position={[0, 1.86, 0]} castShadow material={snowmanHatMaterial} geometry={snowmanHatBrimGeo} />
        <mesh position={[0, 2.05, 0]} castShadow material={snowmanHatMaterial} geometry={snowmanHatTopGeo} />
      </group>
    </group>
  );
});


export const SnowObstacles = forwardRef<ObstacleData[]>((props, ref) => {
  const { status, speed, gameId, isTransitioning } = useGameStore();
  
  // The pool is a fixed state array of 8 items, pre-created with stable refs
  const [pool] = useState<ObstacleData[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      type: 'ice-spike',
      x: -100,
      y: 0,
      ref: createRef<THREE.Group>(),
      powerupType: undefined,
    }))
  );

  const nextSpawnX = useRef(SPAWN_DISTANCE);
  const lastInitializedGameId = useRef(-1);

  // Initialize/reset pool when gameId changes
  useEffect(() => {
     if (gameId !== lastInitializedGameId.current) {
        lastInitializedGameId.current = gameId;
        pool.forEach(obs => {
          obs.x = -100;
          obs.y = 0;
          if (obs.ref.current) {
            obs.ref.current.position.set(-100, 0, 0);
            obs.ref.current.visible = false;
          }
        });
        nextSpawnX.current = SPAWN_DISTANCE;
     }
  }, [gameId, pool]);

  useFrame((state, delta) => {
    if (status !== 'playing') return;

    const currentSpeed = useGameStore.getState().getCurrentSpeed();
    const moveDistance = currentSpeed * delta;

    // 1. Move active obstacles
    pool.forEach(obs => {
      if (obs.x > DESPAWN_DISTANCE) {
        obs.x -= obs.type === 'bird' ? moveDistance + 4 * delta : moveDistance;
        if (obs.ref.current) {
          obs.ref.current.position.x = obs.x;
          if (obs.type !== 'bird') obs.ref.current.position.y = obs.y;
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
      const inactiveSlot = pool.find(obs => obs.x <= DESPAWN_DISTANCE);
      if (inactiveSlot) {
        // Decide obstacle type: eggs first, then a small chance of a powerup, else a standard obstacle
        const rand = Math.random();
        let chosenType: SnowObstacleType | 'egg' = 'ice-spike';
        let spawnY = 0;
        let chosenPowerup: PowerupType | undefined;
        let chosenEggRarity: 'common' | 'rare' | 'ultraRare' | undefined;

        const store = useGameStore.getState();
        if (store.shouldSpawnEgg && store.pendingEggRarity) {
          chosenType = 'egg';
          spawnY = 0.35;
          chosenPowerup = undefined;
          chosenEggRarity = store.pendingEggRarity;
          useGameStore.setState({ shouldSpawnEgg: false, pendingEggRarity: null });
        } else if (rand < 0.1 && store.activePowerup === 'none' && performance.now() >= store.powerupCooldownUntil) {
          chosenType = 'powerup';
          spawnY = Math.random() > 0.5 ? 2.5 : 1.2; // high or low
          const powerupOpts: PowerupType[] = ['wings', 'super', 'ghost', 'jaw', 'earth', 'dragon', 'life'];
          chosenPowerup = powerupOpts[Math.floor(Math.random() * powerupOpts.length)];
        } else {
          // Choose from obstacles unlocked so far for the snow scenario
          const allowed = getAllowedObstacles('snow', store.score) as SnowObstacleType[];
          chosenType = allowed.length > 0 ? pickVariedType(allowed) : 'ice-spike';
          spawnY = chosenType === 'bird' ? 0.8 + Math.random() * 2.4 : 0;
        }

        // Try to generate global powerup/obstacle override
        const globalOverride = tryGenerateGlobalObstacle();
        if (globalOverride) {
          chosenType = globalOverride.type as any;
          spawnY = globalOverride.y;
          chosenPowerup = globalOverride.powerupType;
        }

        inactiveSlot.type = chosenType as any;
        inactiveSlot.powerupType = chosenPowerup;
        inactiveSlot.eggRarity = chosenEggRarity;
        inactiveSlot.x = SPAWN_DISTANCE + nextSpawnX.current;
        inactiveSlot.y = spawnY;

        nextSpawnX.current = calculateNextObstaclePosition();

        // Force React update so the new mesh type is rendered
        if (inactiveSlot.ref.current) {
          inactiveSlot.ref.current.position.set(inactiveSlot.x, inactiveSlot.y, 0);
          inactiveSlot.ref.current.visible = true;
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
        if (obs.type === 'ice-spike') {
          return <IceSpikesObstacle key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
        }

        if (obs.type === 'bird') {
          return <Bird key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
        }

        if (obs.type === 'snowman') {
          return <LiveSnowmanObstacle key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
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
