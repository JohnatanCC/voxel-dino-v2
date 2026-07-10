import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, createRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType, PowerupType } from '../types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, tryGenerateGlobalObstacle, calculateNextObstaclePosition, isBirdEligible } from '../helpers';
import { VoxelEgg } from '../../components/VoxelEgg';
import { Stump } from '../forest/ForestObstacles';

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
const mummyMaterial = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.95 }); // Yellow mummy color
const mummyEyeMaterial = new THREE.MeshBasicMaterial({ color: '#fef08a' }); // Glowing yellow eyes

const Skeleton = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      
      // Dancing zombie skeleton animation:
      innerRef.current.rotation.z = Math.sin(time * 6) * 0.15;
      
      const head = innerRef.current.children[0] as THREE.Group;
      if (head) {
        head.rotation.z = -Math.sin(time * 6) * 0.1;
      }
      
      const leftArm = innerRef.current.children[2] as THREE.Mesh;
      const rightArm = innerRef.current.children[3] as THREE.Mesh;
      if (leftArm && rightArm) {
        leftArm.rotation.z = -Math.PI / 2 + Math.sin(time * 10) * 0.15;
        rightArm.rotation.z = -Math.PI / 2 - Math.sin(time * 10) * 0.15;
      }

      const leftLeg = innerRef.current.children[4] as THREE.Mesh;
      const rightLeg = innerRef.current.children[5] as THREE.Mesh;
      if (leftLeg && rightLeg) {
        leftLeg.rotation.z = Math.sin(time * 8) * 0.2;
        rightLeg.rotation.z = -Math.sin(time * 8) * 0.2;
      }

      innerRef.current.position.y = 0.6 + Math.sin(time * 12) * 0.05;
    }
  });

  return (
    <group ref={innerRef} position={[x, 0.6, 0]}>
      {/* Head */}
      <group position={[0, 0.65, 0]}>
        <mesh castShadow receiveShadow material={boneMaterial}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
        </mesh>
        <mesh position={[0.18, 0.05, 0.26]} material={new THREE.MeshBasicMaterial({ color: '#0f172a' })}>
          <boxGeometry args={[0.12, 0.12, 0.05]} />
        </mesh>
        <mesh position={[-0.18, 0.05, 0.26]} material={new THREE.MeshBasicMaterial({ color: '#0f172a' })}>
          <boxGeometry args={[0.12, 0.12, 0.05]} />
        </mesh>
        <mesh position={[0, -0.08, 0.26]} material={new THREE.MeshBasicMaterial({ color: '#0f172a' })}>
          <boxGeometry args={[0.06, 0.08, 0.05]} />
        </mesh>
      </group>

      {/* Spine / Ribcage */}
      <group position={[0, 0.2, 0]}>
        <mesh castShadow receiveShadow material={boneMaterial}>
          <boxGeometry args={[0.15, 0.6, 0.15]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow material={boneMaterial}>
          <boxGeometry args={[0.5, 0.08, 0.35]} />
        </mesh>
        <mesh position={[0, 0.0, 0]} castShadow material={boneMaterial}>
          <boxGeometry args={[0.45, 0.08, 0.3]} />
        </mesh>
        <mesh position={[0, -0.2, 0]} castShadow material={boneMaterial}>
          <boxGeometry args={[0.4, 0.08, 0.25]} />
        </mesh>
      </group>

      {/* Arms pointing forward */}
      <mesh position={[0.2, 0.35, 0.2]} rotation={[0, 0, -Math.PI / 2]} castShadow material={boneMaterial}>
        <boxGeometry args={[0.5, 0.08, 0.08]} />
      </mesh>
      <mesh position={[0.2, 0.35, -0.2]} rotation={[0, 0, -Math.PI / 2]} castShadow material={boneMaterial}>
        <boxGeometry args={[0.5, 0.08, 0.08]} />
      </mesh>

      {/* Legs */}
      <mesh position={[0, -0.3, 0.15]} castShadow material={boneMaterial}>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
      </mesh>
      <mesh position={[0, -0.3, -0.15]} castShadow material={boneMaterial}>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
      </mesh>
    </group>
  );
});

const Mummy = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      
      // Zombie mummy slow dance:
      innerRef.current.rotation.z = Math.sin(time * 4) * 0.12;
      
      const head = innerRef.current.children[0] as THREE.Group;
      if (head) {
        head.rotation.z = -Math.sin(time * 4) * 0.08;
      }
      
      const leftArm = innerRef.current.children[2] as THREE.Mesh;
      const rightArm = innerRef.current.children[3] as THREE.Mesh;
      if (leftArm && rightArm) {
        leftArm.rotation.z = -Math.PI / 2 + Math.sin(time * 8) * 0.1;
        rightArm.rotation.z = -Math.PI / 2 - Math.sin(time * 8) * 0.1;
      }

      const leftLeg = innerRef.current.children[4] as THREE.Mesh;
      const rightLeg = innerRef.current.children[5] as THREE.Mesh;
      if (leftLeg && rightLeg) {
        leftLeg.rotation.z = Math.sin(time * 6) * 0.15;
        rightLeg.rotation.z = -Math.sin(time * 6) * 0.15;
      }

      innerRef.current.position.y = 0.6 + Math.sin(time * 8) * 0.06;
    }
  });

  return (
    <group ref={innerRef} position={[x, 0.6, 0]}>
      {/* Head */}
      <group position={[0, 0.65, 0]}>
        <mesh castShadow receiveShadow material={mummyMaterial}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
        </mesh>
        <mesh position={[0.18, 0.05, 0.26]} material={mummyEyeMaterial}>
          <boxGeometry args={[0.12, 0.12, 0.05]} />
        </mesh>
        <mesh position={[-0.18, 0.05, 0.26]} material={mummyEyeMaterial}>
          <boxGeometry args={[0.12, 0.12, 0.05]} />
        </mesh>
      </group>

      {/* Body wrapped in yellow bandages */}
      <group position={[0, 0.2, 0]}>
        <mesh castShadow receiveShadow material={mummyMaterial}>
          <boxGeometry args={[0.22, 0.6, 0.22]} />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow material={mummyMaterial}>
          <boxGeometry args={[0.42, 0.12, 0.32]} />
        </mesh>
        <mesh position={[0, -0.15, 0]} castShadow material={mummyMaterial}>
          <boxGeometry args={[0.38, 0.12, 0.28]} />
        </mesh>
      </group>

      {/* Arms pointing forward */}
      <mesh position={[0.2, 0.35, 0.2]} rotation={[0, 0, -Math.PI / 2]} castShadow material={mummyMaterial}>
        <boxGeometry args={[0.5, 0.1, 0.1]} />
      </mesh>
      <mesh position={[0.2, 0.35, -0.2]} rotation={[0, 0, -Math.PI / 2]} castShadow material={mummyMaterial}>
        <boxGeometry args={[0.5, 0.1, 0.1]} />
      </mesh>

      {/* Legs */}
      <mesh position={[0, -0.3, 0.12]} castShadow material={mummyMaterial}>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
      </mesh>
      <mesh position={[0, -0.3, -0.12]} castShadow material={mummyMaterial}>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
      </mesh>
    </group>
  );
});

const Bird = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      
      // Bobbing Y up and down smoothly
      const bobY = Math.sin(time * 4 + x) * 0.45;
      innerRef.current.position.y = y + bobY;

      // Flapping wings
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
  
  // The pool is a fixed state array of 8 items, pre-created with stable refs
  const [pool] = useState<ObstacleData[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      type: 'cactus-small',
      x: -1000,
      y: -1000,
      ref: createRef<THREE.Group>()
    }))
  );

  const nextSpawnX = useRef(SPAWN_DISTANCE);
  const lastInitializedGameId = useRef<number | null>(null);

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

    // Scenario-specific obstacles based on current level configuration
    const currentLevel = store.getCurrentLevel();
    const allowed = currentLevel?.allowedObstacles || ['cactus-small', 'cactus-large', 'skull'];
    const type = allowed[Math.floor(Math.random() * allowed.length)];
    let y = 0;

    if (type === 'bird') {
      y = 0.8 + Math.random() * 2.4;
    } else if (type === 'mummy' || type === 'skull') {
      y = 0.6;
    }

    slot.type = type;
    slot.x = x;
    slot.y = y;
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
      const currentLevel = useGameStore.getState().getCurrentLevel();
      const isLevel5 = currentLevel && currentLevel.levelNumber >= 5;
      const score = useGameStore.getState().score;
      const spawnFlock = (isLevel5 || score > 30000) && Math.random() < 0.75;

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
        if (obs.type === 'egg') {
          return <VoxelEgg key={obs.id} ref={obs.ref as any} rarity={obs.eggRarity || 'common'} x={obs.x} y={obs.y} />;
        }
        if (obs.type === 'skull') {
          return <Skeleton key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'mummy') {
          return <Mummy key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'stump-low' || obs.type === 'swamp-log') {
          return <Stump key={obs.id} ref={obs.ref as any} x={obs.x} scale={0.8} />;
        }
        if (obs.type === 'stump-high') {
          return <Stump key={obs.id} ref={obs.ref as any} x={obs.x} scale={1.2} isHigh={true} />;
        }
        return null;
      })}
    </group>
  );
});
