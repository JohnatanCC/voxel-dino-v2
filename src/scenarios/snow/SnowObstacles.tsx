import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType, PowerupType } from '../types';
import * as THREE from 'three';

export type SnowObstacleType = 'rock-large' | 'snowman' | 'rock-small' | 'powerup' | 'firebox';

const SPAWN_DISTANCE = 30;
const DESPAWN_DISTANCE = -10;

// Reusable static materials
const snowmanBodyMaterial = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 });
const snowmanNoseMaterial = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.8 });
const snowmanCoalMaterial = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 1.0 });
const snowmanStickMaterial = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
const snowmanHatMaterial = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 });

const rockBaseMaterial = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.9, flatShading: true });
const rockSnowMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, flatShading: true });
const fireboxMaterial = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#f87171', emissiveIntensity: 0.5 });
const powerupTextMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });

// Reusable static geometries
const snowmanBaseGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
const snowmanMiddleGeo = new THREE.BoxGeometry(0.68, 0.68, 0.68);
const snowmanHeadGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
const snowmanNoseGeo = new THREE.BoxGeometry(0.25, 0.08, 0.08);
const snowmanCoalGeo = new THREE.BoxGeometry(0.04, 0.07, 0.07);
const snowmanStickGeo = new THREE.BoxGeometry(0.07, 0.07, 0.45);
const snowmanHatBrimGeo = new THREE.BoxGeometry(0.55, 0.04, 0.55);
const snowmanHatTopGeo = new THREE.BoxGeometry(0.32, 0.35, 0.32);

const rockLargeGeo = new THREE.DodecahedronGeometry(1.2, 0);
const rockLargeSnowGeo = new THREE.DodecahedronGeometry(1.1, 0);
const rockSmallGeo = new THREE.DodecahedronGeometry(0.7, 0);
const rockSmallSnowGeo = new THREE.DodecahedronGeometry(0.65, 0);
const fireboxGeo = new THREE.BoxGeometry(1, 1, 1);

const powerupBoxGeo = new THREE.BoxGeometry(1, 1, 1);
const powerupHorizontalBarGeo = new THREE.BoxGeometry(0.5, 0.15, 0.05);
const powerupVerticalBarGeo = new THREE.BoxGeometry(0.15, 0.5, 0.05);
const powerupQ1Geo = new THREE.BoxGeometry(0.4, 0.1, 0.05);
const powerupQ2Geo = new THREE.BoxGeometry(0.1, 0.2, 0.05);
const powerupQ3Geo = new THREE.BoxGeometry(0.3, 0.1, 0.05);
const powerupQ4Geo = new THREE.BoxGeometry(0.1, 0.1, 0.05);

const PowerupBox = forwardRef<THREE.Group, { x: number; y: number; type?: PowerupType }>(({ x, y, type }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      innerRef.current.rotation.y = time * 2;
      innerRef.current.position.y = y + Math.sin(time * 5) * 0.2;
    }
  });

  const isLife = type === 'life';
  const color = isLife ? "#ef4444" : "#fbbf24";
  const powerupMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.8 });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      <mesh castShadow receiveShadow material={powerupMaterial} geometry={powerupBoxGeo} />
      {isLife ? (
        <group position={[0, 0, 0.51]}>
           <mesh position={[0, 0, 0]} material={powerupTextMaterial} geometry={powerupHorizontalBarGeo} />
           <mesh position={[0, 0, 0]} material={powerupTextMaterial} geometry={powerupVerticalBarGeo} />
        </group>
      ) : (
        <group position={[0, 0, 0.51]}>
           <mesh position={[0, 0.2, 0]} material={powerupTextMaterial} geometry={powerupQ1Geo} />
           <mesh position={[0.2, 0.1, 0]} material={powerupTextMaterial} geometry={powerupQ2Geo} />
           <mesh position={[0, 0, 0]} material={powerupTextMaterial} geometry={powerupQ3Geo} />
           <mesh position={[0, -0.15, 0]} material={powerupTextMaterial} geometry={powerupQ4Geo} />
        </group>
      )}
      {isLife ? (
        <group position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
           <mesh position={[0, 0, 0]} material={powerupTextMaterial} geometry={powerupHorizontalBarGeo} />
           <mesh position={[0, 0, 0]} material={powerupTextMaterial} geometry={powerupVerticalBarGeo} />
        </group>
      ) : (
        <group position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
           <mesh position={[0, 0.2, 0]} material={powerupTextMaterial} geometry={powerupQ1Geo} />
           <mesh position={[0.2, 0.1, 0]} material={powerupTextMaterial} geometry={powerupQ2Geo} />
           <mesh position={[0, 0, 0]} material={powerupTextMaterial} geometry={powerupQ3Geo} />
           <mesh position={[0, -0.15, 0]} material={powerupTextMaterial} geometry={powerupQ4Geo} />
        </group>
      )}
    </group>
  );
});

export const SnowObstacles = forwardRef<ObstacleData[]>((props, ref) => {
  const { status, speed, gameId, difficulty, isTransitioning } = useGameStore();
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const nextSpawnX = useRef(SPAWN_DISTANCE);
  const idCounter = useRef(0);

  useImperativeHandle(ref, () => obstacles, [obstacles]);

  const generateObstacle = (x: number): ObstacleData => {
    const rand = Math.random();
    let type: SnowObstacleType = 'snowman';
    let y = 0;
    let powerupType: PowerupType | undefined;

    let lifeChance = 0;
    if (difficulty === 'easy') lifeChance = 0.03;
    if (difficulty === 'medium') lifeChance = 0.01;

    let powerupChance = difficulty === 'hard' ? 0.01 : 0.03;

    if (rand < lifeChance) {
      type = 'powerup';
      y = 1.5 + Math.random();
      powerupType = 'life';
    } else if (rand < lifeChance + powerupChance) {
      type = 'powerup';
      y = 1.5 + Math.random();
      const powerups: PowerupType[] = ['wings', 'super', 'ghost', 'jaw', 'earth'];
      powerupType = powerups[Math.floor(Math.random() * powerups.length)];
    } else {
      const obstacleRand = Math.random();
      if (obstacleRand < 0.15) {
        type = 'firebox';
        y = 1.0;
      } else if (obstacleRand < 0.5) {
        type = 'rock-large';
      } else if (obstacleRand < 0.75) {
        type = 'rock-small';
      } else {
        type = 'snowman';
      }
    }

    return {
      id: idCounter.current++,
      type,
      x,
      y,
      powerupType,
      ref: { current: null } as React.RefObject<THREE.Group>,
    };
  };

  useEffect(() => {
    if (status === 'playing') {
       const initialObstacles = [
         generateObstacle(25),
         generateObstacle(40),
       ];
       setObstacles(initialObstacles);
       if (ref && 'current' in ref) {
         (ref as React.MutableRefObject<ObstacleData[]>).current = initialObstacles;
       }
       nextSpawnX.current = 55;
    }
  }, [gameId]);

  useEffect(() => {
    if (status === 'menu') {
      setObstacles([]);
      nextSpawnX.current = SPAWN_DISTANCE;
    }
  }, [status]);

  useFrame((state, delta) => {
    if (status !== 'playing') return;

    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta;

    // 1. Mutate positions of active obstacles directly
    obstacles.forEach(obs => {
      obs.x -= moveDistance;
      if (obs.ref.current) {
        obs.ref.current.position.x = obs.x;
        
        // Add wiggle to firebox
        if (obs.type === 'firebox') {
           obs.ref.current.rotation.y += delta * 2;
           obs.ref.current.position.y = obs.y + Math.sin(state.clock.elapsedTime * 5) * 0.2;
        }
      }
    });

    nextSpawnX.current -= moveDistance;

    // 2. Check if we need to remove off-screen or spawn new ones (which requires state change)
    const hasOffscreen = obstacles.some(obs => obs.x <= DESPAWN_DISTANCE);
    const shouldSpawn = nextSpawnX.current < SPAWN_DISTANCE && !isTransitioning;

    if (hasOffscreen || shouldSpawn) {
      setObstacles(prev => {
        let nextObstacles = prev.filter(obs => obs.x > DESPAWN_DISTANCE);
        
        if (shouldSpawn) {
          const score = useGameStore.getState().score;
          // Gap narrows down from 1.0 to 0.55 as score reaches 20,000 pts
          const gapMultiplier = Math.max(0.55, 1.0 - (score / 45000));
          
          const minGap = ((useGameStore.getState().getCurrentSpeed() * 1.1) + 6) * gapMultiplier;
          const gap = minGap + Math.random() * (useGameStore.getState().getCurrentSpeed() * 0.8) * gapMultiplier;
          const newObsX = SPAWN_DISTANCE + gap;
          
          nextObstacles.push(generateObstacle(newObsX));
          nextSpawnX.current = newObsX;
        }

        // Sync ref with local state
        if (ref && 'current' in ref) {
          (ref as React.MutableRefObject<ObstacleData[]>).current = nextObstacles;
        }
        return nextObstacles;
      });
    }
  });

  return (
    <group>
      {obstacles.map(obs => {
        if (obs.type === 'rock-large') {
          return (
            <group key={obs.id} ref={obs.ref} position={[obs.x, obs.y, 0]}>
              <mesh position={[0, 0.75, 0]} material={rockBaseMaterial} geometry={rockLargeGeo} />
              <mesh position={[0, 1.2, 0]} material={rockSnowMaterial} geometry={rockLargeSnowGeo} />
            </group>
          );
        }
        
        if (obs.type === 'snowman') {
          return (
            <group key={obs.id} ref={obs.ref} position={[obs.x, obs.y, 0]}>
              {/* Voxel Snowman Body Base */}
              <mesh position={[0, 0.45, 0]} castShadow receiveShadow material={snowmanBodyMaterial} geometry={snowmanBaseGeo} />
              {/* Voxel Snowman Body Middle */}
              <mesh position={[0, 1.15, 0]} castShadow receiveShadow material={snowmanBodyMaterial} geometry={snowmanMiddleGeo} />
              {/* Voxel Snowman Head */}
              <mesh position={[0, 1.625, 0]} castShadow receiveShadow material={snowmanBodyMaterial} geometry={snowmanHeadGeo} />

              {/* Carrot Nose (Orange Voxel) */}
              <mesh position={[-0.32, 1.625, 0]} castShadow material={snowmanNoseMaterial} geometry={snowmanNoseGeo} />

              {/* Eyes (Charcoal Voxels) */}
              <mesh position={[-0.23, 1.72, 0.1]} castShadow material={snowmanCoalMaterial} geometry={snowmanCoalGeo} />
              <mesh position={[-0.23, 1.72, -0.1]} castShadow material={snowmanCoalMaterial} geometry={snowmanCoalGeo} />

              {/* Buttons (Charcoal Voxels) */}
              <mesh position={[-0.35, 1.25, 0]} castShadow material={snowmanCoalMaterial} geometry={snowmanCoalGeo} />
              <mesh position={[-0.35, 1.05, 0]} castShadow material={snowmanCoalMaterial} geometry={snowmanCoalGeo} />

              {/* Wooden Stick Arms (Brown Voxels) */}
              <mesh position={[0, 1.2, 0.4]} rotation={[0.2, 0, 0.3]} castShadow material={snowmanStickMaterial} geometry={snowmanStickGeo} />
              <mesh position={[0, 1.2, -0.4]} rotation={[-0.2, 0, 0.3]} castShadow material={snowmanStickMaterial} geometry={snowmanStickGeo} />

              {/* Top Hat (Black Voxel) */}
              <mesh position={[0, 1.86, 0]} castShadow material={snowmanHatMaterial} geometry={snowmanHatBrimGeo} />
              <mesh position={[0, 2.05, 0]} castShadow material={snowmanHatMaterial} geometry={snowmanHatTopGeo} />
            </group>
          );
        }

        if (obs.type === 'rock-small') {
          return (
            <group key={obs.id} ref={obs.ref} position={[obs.x, obs.y, 0]}>
              <mesh position={[0, 0.4, 0]} material={rockBaseMaterial} geometry={rockSmallGeo} />
              <mesh position={[0, 0.7, 0]} material={rockSnowMaterial} geometry={rockSmallSnowGeo} />
            </group>
          );
        }

        if (obs.type === 'firebox') {
          return (
            <group key={obs.id} ref={obs.ref} position={[obs.x, obs.y, 0]}>
              <mesh material={fireboxMaterial} geometry={fireboxGeo} />
            </group>
          );
        }

        if (obs.type === 'powerup') {
          return <PowerupBox key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} type={obs.powerupType} />;
        }

        return null;
      })}
    </group>
  );
});
