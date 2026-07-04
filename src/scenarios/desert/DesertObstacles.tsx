import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType, PowerupType } from '../types';

const SPAWN_DISTANCE = 30;
const DESPAWN_DISTANCE = -10;

// Reusable obstacle geometries
const cactusMaterial = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.9 });
const birdMaterial = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.8 });

const cactusTrunkGeo = new THREE.BoxGeometry(0.5, 2.4, 0.5);
const cactusArmHGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
const cactusArmVGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
const flowerGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const flowerMaterial = new THREE.MeshStandardMaterial({ color: '#ec4899', roughness: 0.5 });

const Cactus = forwardRef<THREE.Group, { x: number; scale: number; numStems?: number }>(
  ({ x, scale, numStems = 1 }, ref) => {
    
    // We can use the scale or numStems to deterministically decide if it has flowers
    const hasFlowers = scale > 0.9 && numStems > 1;

    return (
      <group ref={ref} position={[x, 0, 0]} scale={scale}>
        {/* Main stem */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow material={cactusMaterial} geometry={cactusTrunkGeo} />
        
        {/* Main stem spikes (just a few details) */}
        <mesh position={[0, 1.8, 0.28]} castShadow material={cactusMaterial}>
           <boxGeometry args={[0.1, 0.1, 0.1]} />
        </mesh>
        <mesh position={[-0.28, 1.2, 0]} castShadow material={cactusMaterial}>
           <boxGeometry args={[0.1, 0.1, 0.1]} />
        </mesh>
        
        {/* Top Flower */}
        {hasFlowers && (
          <mesh position={[0, 2.45, 0]} geometry={flowerGeo} material={flowerMaterial} />
        )}

        {/* Left Arm */}
        {numStems > 1 && (
          <group position={[-0.45, 0.8, 0]}>
            <mesh position={[-0.1, 0, 0]} castShadow receiveShadow material={cactusMaterial} geometry={cactusArmHGeo} />
            <mesh position={[-0.25, 0.5, 0]} castShadow receiveShadow material={cactusMaterial} geometry={cactusArmVGeo} />
            {hasFlowers && (
              <mesh position={[-0.25, 1.15, 0]} geometry={flowerGeo} material={flowerMaterial} />
            )}
          </group>
        )}
        
        {/* Right Arm */}
        {numStems > 2 && (
          <group position={[0.45, 1.3, 0]}>
            <mesh position={[0.1, 0, 0]} castShadow receiveShadow material={cactusMaterial} geometry={cactusArmHGeo} />
            <mesh position={[0.25, 0.6, 0]} castShadow receiveShadow material={cactusMaterial} geometry={cactusArmVGeo} />
            {hasFlowers && (
              <mesh position={[0.25, 1.25, 0]} geometry={flowerGeo} material={flowerMaterial} />
            )}
          </group>
        )}
      </group>
    );
  }
);

const boneMaterial = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 });

const Skull = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  return (
    <group ref={ref} position={[x, 0.4, 0]}>
      {/* Skull Base */}
      <mesh castShadow receiveShadow material={boneMaterial}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.2, 0.1, 0.41]} material={new THREE.MeshBasicMaterial({ color: '#0f172a' })}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
      </mesh>
      <mesh position={[-0.2, 0.1, 0.41]} material={new THREE.MeshBasicMaterial({ color: '#0f172a' })}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, -0.1, 0.41]} material={new THREE.MeshBasicMaterial({ color: '#0f172a' })}>
        <boxGeometry args={[0.1, 0.15, 0.05]} />
      </mesh>
      {/* Bones underneath */}
      <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 4]} castShadow receiveShadow material={boneMaterial}>
        <boxGeometry args={[1.2, 0.2, 0.2]} />
      </mesh>
      <mesh position={[0, -0.4, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow receiveShadow material={boneMaterial}>
        <boxGeometry args={[1.2, 0.2, 0.2]} />
      </mesh>
    </group>
  );
});

const Bird = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      // Flapping wings
      const time = clock.getElapsedTime();
      const wingL = innerRef.current.children[1] as THREE.Mesh;
      const wingR = innerRef.current.children[2] as THREE.Mesh;
      if (wingL && wingR) {
        wingL.rotation.x = Math.sin(time * 15) * 0.5;
        wingR.rotation.x = -Math.sin(time * 15) * 0.5;
      }
    }
  });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow material={birdMaterial}>
        <boxGeometry args={[1.2, 0.4, 0.4]} />
      </mesh>
      {/* Wing L */}
      <mesh position={[0, 0.2, 0.4]} castShadow material={birdMaterial}>
        <boxGeometry args={[0.6, 0.1, 1.0]} />
      </mesh>
      {/* Wing R */}
      <mesh position={[0, 0.2, -0.4]} castShadow material={birdMaterial}>
        <boxGeometry args={[0.6, 0.1, 1.0]} />
      </mesh>
      {/* Head */}
      <mesh position={[-0.6, 0.1, 0]} castShadow receiveShadow material={birdMaterial}>
        <boxGeometry args={[0.4, 0.4, 0.3]} />
      </mesh>
      {/* Beak */}
      <mesh position={[-0.9, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.8} />
      </mesh>
      {/* Tail */}
      <mesh position={[0.7, 0, 0]} castShadow receiveShadow material={birdMaterial}>
        <boxGeometry args={[0.4, 0.2, 0.2]} />
      </mesh>
    </group>
  );
});

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

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Simple mark using boxes */}
      {isLife ? (
        // A simple cross for health
        <group position={[0, 0, 0.51]}>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.5, 0.15, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.15, 0.5, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      ) : (
        <group position={[0, 0, 0.51]}>
           <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.4, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0.2, 0.1, 0]}><boxGeometry args={[0.1, 0.2, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.3, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, -0.15, 0]}><boxGeometry args={[0.1, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      )}
      
      {isLife ? (
        <group position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.5, 0.15, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.15, 0.5, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      ) : (
        <group position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
           <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.4, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0.2, 0.1, 0]}><boxGeometry args={[0.1, 0.2, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.3, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, -0.15, 0]}><boxGeometry args={[0.1, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      )}
    </group>
  );
});

export const DesertObstacles = forwardRef<ObstacleData[]>((props, ref) => {
  const { status, speed, gameId, difficulty, isTransitioning } = useGameStore();
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const nextSpawnX = useRef(SPAWN_DISTANCE);
  const idCounter = useRef(0);

  // Sync ref with local state so Game component can check collisions
  useImperativeHandle(ref, () => obstacles, [obstacles]);

  const generateObstacle = (x: number): ObstacleData => {
    const rand = Math.random();
    let type: ObstacleType = 'cactus-small';
    let y = 0;
    let powerupType: PowerupType | undefined;
    
    let lifeChance = 0;
    if (difficulty === 'easy') lifeChance = 0.03;
    if (difficulty === 'medium') lifeChance = 0.01;

    let powerupChance = difficulty === 'hard' ? 0.01 : 0.03;

    if (rand < lifeChance) {
      type = 'powerup';
      y = Math.random() > 0.5 ? 1.0 : 2.5;
      powerupType = 'life';
    } else if (rand < lifeChance + powerupChance) {
      type = 'powerup';
      y = Math.random() > 0.5 ? 1.0 : 2.5;
      const powerups: PowerupType[] = ['wings', 'super', 'ghost', 'jaw', 'earth'];
      powerupType = powerups[Math.floor(Math.random() * powerups.length)];
    } else {
      const score = useGameStore.getState().score;
      const isBirdEligible = speed > 14 || score > 1500;
      const birdThreshold = Math.max(0.55, 0.8 - (score / 60000));
      
      if (isBirdEligible && rand > birdThreshold) {
        type = 'bird';
        // Bird can be low, middle or high
        const birdHeights = [1.0, 1.5, 2.6];
        y = birdHeights[Math.floor(Math.random() * birdHeights.length)];
      } else if (rand > 0.5) {
        type = 'cactus-large';
      } else {
        type = 'skull';
      }
    }

    return {
      id: idCounter.current++,
      type,
      x,
      y,
      powerupType,
      ref: { current: null } // will be attached by react
    };
  };

  // Initial spawn
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
  }, [gameId]); // Only run when a new game starts

  useEffect(() => {
    if (status === 'menu') {
      setObstacles([]);
      nextSpawnX.current = SPAWN_DISTANCE;
    }
  }, [status]);

  useFrame((_, delta) => {
    if (status !== 'playing') return;

    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta;
    
    // 1. Mutate positions of active obstacles directly
    obstacles.forEach(obs => {
      obs.x -= moveDistance;
      if (obs.ref.current) {
        obs.ref.current.position.x = obs.x;
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
        if (obs.type === 'cactus-small') {
          return <Cactus key={obs.id} ref={obs.ref as any} x={obs.x} scale={0.8} numStems={1} />;
        }
        if (obs.type === 'cactus-large') {
           return <Cactus key={obs.id} ref={obs.ref as any} x={obs.x} scale={1.2} numStems={3} />;
        }
        if (obs.type === 'bird') {
          return <Bird key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
        }
        if (obs.type === 'powerup') {
          return <PowerupBox key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} type={obs.powerupType} />;
        }
        if (obs.type === 'skull') {
          return <Skull key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        return null;
      })}
    </group>
  );
});
