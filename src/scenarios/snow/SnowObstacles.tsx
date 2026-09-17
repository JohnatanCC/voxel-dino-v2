import { forwardRef, useEffect, useRef, useState, createRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType, PowerupType } from '../types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, tryGenerateGlobalObstacle, calculateNextObstaclePosition } from '../helpers';
import * as THREE from 'three';
import { VoxelEgg } from '../../components/VoxelEgg';
import { getAllowedObstacles, ICE_BLOCK_WARNING_S, ICE_BLOCK_FALL_HEIGHT } from '../../config/balance';
import { PowerupBox } from '../shared/PowerupBox';

export type SnowObstacleType = 'ice-block' | 'snowman' | 'powerup' | 'firebox';

// Reusable static materials
const snowmanBodyMaterial = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.95 });
const snowmanNoseMaterial = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.8 });
const snowmanCoalMaterial = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 1.0 });
const snowmanStickMaterial = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
const snowmanHatMaterial = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 });

const iceBlockMaterial = new THREE.MeshStandardMaterial({ color: '#a8e6ff', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 });
const iceShadowMaterial = new THREE.MeshBasicMaterial({ color: '#0c1a24', transparent: true, opacity: 0.4 });

// Campfire materials
const woodMaterial = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
const coalMaterial = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.95 });
const flameRedMaterial = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.5, roughness: 0.1 });
const flameOrangeMaterial = new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#f97316', emissiveIntensity: 1.5, roughness: 0.1 });
const flameYellowMaterial = new THREE.MeshStandardMaterial({ color: '#fbbf24', emissive: '#fbbf24', emissiveIntensity: 1.5, roughness: 0.1 });

// Reusable static geometries
const snowmanBaseGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
const snowmanMiddleGeo = new THREE.BoxGeometry(0.68, 0.68, 0.68);
const snowmanHeadGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
const snowmanNoseGeo = new THREE.BoxGeometry(0.25, 0.08, 0.08);
const snowmanCoalGeo = new THREE.BoxGeometry(0.04, 0.07, 0.07);
const snowmanStickGeo = new THREE.BoxGeometry(0.07, 0.07, 0.45);
const snowmanHatBrimGeo = new THREE.BoxGeometry(0.55, 0.04, 0.55);
const snowmanHatTopGeo = new THREE.BoxGeometry(0.32, 0.35, 0.32);

const iceBlockGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
const iceShadowGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.05, 16);

// Campfire geometries
const logGeo = new THREE.BoxGeometry(0.8, 0.22, 0.22);
const coalGeo = new THREE.BoxGeometry(0.18, 0.12, 0.18);
const flameBaseGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
const flameMidGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const flameTopGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

export const IceBlockObstacle = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const blockRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const timer = useRef(0);
  const prevX = useRef(x);

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame((_, delta) => {
    // A large forward jump in x means this slot was just recycled: restart the telegraph.
    if (x - prevX.current > 10) {
      timer.current = 0;
    }
    prevX.current = x;

    if (x <= DESPAWN_DISTANCE) return;

    timer.current += delta;
    const progress = Math.min(timer.current / ICE_BLOCK_WARNING_S, 1);

    if (blockRef.current) {
      if (progress < 1) {
        const eased = progress * progress; // accelerates like a real fall
        blockRef.current.position.y = ICE_BLOCK_FALL_HEIGHT * (1 - eased);
        blockRef.current.rotation.x += delta * 3;
        blockRef.current.rotation.z += delta * 2;
      } else {
        blockRef.current.position.y = 0;
        blockRef.current.rotation.set(0, 0, 0);
      }
    }
    if (shadowRef.current) {
      const shadowScale = 0.35 + progress * 0.65;
      shadowRef.current.scale.set(shadowScale, 1, shadowScale);
    }
  });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      <mesh ref={shadowRef} position={[0, 0.02, 0]} material={iceShadowMaterial} geometry={iceShadowGeo} />
      <mesh ref={blockRef} position={[0, ICE_BLOCK_FALL_HEIGHT, 0]} castShadow receiveShadow material={iceBlockMaterial} geometry={iceBlockGeo} />
    </group>
  );
});

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

export const CampfireObstacle = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const flameBaseRef = useRef<THREE.Mesh>(null);
  const flameMidRef = useRef<THREE.Mesh>(null);
  const flameTopRef = useRef<THREE.Mesh>(null);

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (flameBaseRef.current) {
      flameBaseRef.current.scale.y = 1 + Math.sin(time * 15) * 0.15;
      flameBaseRef.current.scale.x = 1 + Math.cos(time * 12) * 0.1;
      flameBaseRef.current.scale.z = 1 + Math.sin(time * 10) * 0.1;
    }
    if (flameMidRef.current) {
      flameMidRef.current.scale.y = 1 + Math.sin(time * 18) * 0.2;
      flameMidRef.current.position.y = 0.5 + Math.sin(time * 15) * 0.04;
    }
    if (flameTopRef.current) {
      flameTopRef.current.scale.y = 1 + Math.sin(time * 22) * 0.25;
      flameTopRef.current.position.y = 0.72 + Math.sin(time * 18) * 0.06;
    }
  });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      {/* Logs at base */}
      <mesh position={[0, 0.1, 0.15]} rotation={[0.1, 0.8, 0]} material={woodMaterial} geometry={logGeo} castShadow />
      <mesh position={[0, 0.1, -0.15]} rotation={[0.1, -0.8, 0]} material={woodMaterial} geometry={logGeo} castShadow />
      {/* Coals surrounding the fire */}
      <mesh position={[0.3, 0.05, 0.3]} material={coalMaterial} geometry={coalGeo} />
      <mesh position={[-0.3, 0.05, 0.3]} material={coalMaterial} geometry={coalGeo} />
      <mesh position={[0.3, 0.05, -0.3]} material={coalMaterial} geometry={coalGeo} />
      <mesh position={[-0.3, 0.05, -0.3]} material={coalMaterial} geometry={coalGeo} />

      {/* Flame Base (Red) */}
      <mesh ref={flameBaseRef} position={[0, 0.25, 0]} material={flameRedMaterial} geometry={flameBaseGeo} />
      {/* Flame Mid (Orange) */}
      <mesh ref={flameMidRef} position={[0, 0.5, 0]} material={flameOrangeMaterial} geometry={flameMidGeo} />
      {/* Flame Top (Yellow) */}
      <mesh ref={flameTopRef} position={[0, 0.72, 0]} material={flameYellowMaterial} geometry={flameTopGeo} />
    </group>
  );
});


export const SnowObstacles = forwardRef<ObstacleData[]>((props, ref) => {
  const { status, speed, gameId, isTransitioning } = useGameStore();
  
  // The pool is a fixed state array of 8 items, pre-created with stable refs
  const [pool] = useState<ObstacleData[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      type: 'ice-block',
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
        obs.x -= moveDistance;
        if (obs.ref.current) {
          obs.ref.current.position.x = obs.x;
          obs.ref.current.position.y = obs.y;
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
        // Decide obstacle type: 10% chance for powerup, 30% campfire, 60% standard obstacles
        const rand = Math.random();
        let chosenType: SnowObstacleType | 'egg' = 'ice-block';
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
          const fallbackType = allowed.length > 0 ? allowed[Math.floor(Math.random() * allowed.length)] : 'ice-block';
          chosenType = fallbackType;
          spawnY = 0;
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
        if (obs.type === 'ice-block') {
          return <IceBlockObstacle key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
        }

        if (obs.type === 'snowman') {
          return <LiveSnowmanObstacle key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
        }

        if (obs.type === 'firebox') {
          return <CampfireObstacle key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
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
