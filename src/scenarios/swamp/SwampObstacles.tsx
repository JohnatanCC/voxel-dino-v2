import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, createRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType, PowerupType } from '../types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, tryGenerateGlobalObstacle, calculateNextObstaclePosition, isBirdEligible } from '../helpers';
import { VoxelEgg } from '../../components/VoxelEgg';

// Reusable static materials
const deadWoodMaterial = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.95 }); // Lighter grey/brown for visibility
const crocMaterial = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 });
const crocSpikeMaterial = new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.9 });
const crowMaterial = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.5 });
const crowBeakMaterial = new THREE.MeshStandardMaterial({ color: '#44403c', roughness: 0.8 });
const waterMaterial = new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.1, transparent: true, opacity: 0.8 });
const mossMaterial = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.9 }); // Brighter moss
const mushroomMaterial = new THREE.MeshStandardMaterial({ color: '#a7f3d0', emissive: '#34d399', emissiveIntensity: 0.8 });
const crocEyeMaterial = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#facc15', emissiveIntensity: 1.0 });
const blackEyeMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const powerupTextMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });

// Reusable static geometries
const cylinderTrunkHighGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.0, 6);
const cylinderTrunkLowGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 6);
const cylinderBranch1Geo = new THREE.CylinderGeometry(0.1, 0.2, 1, 5);
const cylinderVine1Geo = new THREE.CylinderGeometry(0.02, 0.02, 1, 3);
const cylinderBranch2Geo = new THREE.CylinderGeometry(0.05, 0.15, 0.8, 5);
const cylinderVine2Geo = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 3);
const shroomGeo1 = new THREE.BoxGeometry(0.1, 0.05, 0.1);
const shroomGeo2 = new THREE.BoxGeometry(0.08, 0.04, 0.08);

const crowBodyGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4);
const crowWingGeo = new THREE.BoxGeometry(0.6, 0.05, 0.8);
const crowHeadGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const crowBeakGeo = new THREE.BoxGeometry(0.3, 0.1, 0.1);

const crocHitboxGeo = new THREE.BoxGeometry(5.0, 0.5, 0.8);
const crocBodyGeo = new THREE.BoxGeometry(3, 0.5, 1);
const crocSpikeGeo1 = new THREE.ConeGeometry(0.3, 0.6, 4);
const crocSpikeGeo2 = new THREE.ConeGeometry(0.2, 0.4, 4);
const crocBumpGeo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
const crocTailGeo = new THREE.BoxGeometry(1.5, 0.3, 0.6);
const crocHeadGeo = new THREE.BoxGeometry(1.2, 0.4, 0.8);
const crocSnoutGeo = new THREE.BoxGeometry(1.0, 0.2, 0.7);
const crocBottomJawGeo = new THREE.BoxGeometry(1.0, 0.15, 0.6);
const crocEyeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const crocPupilGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);

const puddleCylinderGeo = new THREE.CylinderGeometry(3, 3, 0.1, 16);
const puddleHitboxGeo = new THREE.BoxGeometry(4, 3, 4);

const powerupBoxGeo = new THREE.BoxGeometry(1, 1, 1);
const powerupHorizontalBarGeo = new THREE.BoxGeometry(0.5, 0.15, 0.05);
const powerupVerticalBarGeo = new THREE.BoxGeometry(0.15, 0.5, 0.05);
const powerupQ1Geo = new THREE.BoxGeometry(0.4, 0.1, 0.05);
const powerupQ2Geo = new THREE.BoxGeometry(0.1, 0.2, 0.05);
const powerupQ3Geo = new THREE.BoxGeometry(0.3, 0.1, 0.05);
const powerupQ4Geo = new THREE.BoxGeometry(0.1, 0.1, 0.05);

const DeadTree = forwardRef<THREE.Group, { x: number; scale: number; isHigh?: boolean }>(
  ({ x, scale, isHigh = false }, ref) => {
    const height = isHigh ? 3 : 1.5;
    const geometry = isHigh ? cylinderTrunkHighGeo : cylinderTrunkLowGeo;
    return (
      <group ref={ref} position={[x, 0, 0]} scale={scale}>
        {/* Trunk */}
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow material={deadWoodMaterial} geometry={geometry} />
        {/* Branch */}
        <mesh position={[0.4, height * 0.7, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow receiveShadow material={deadWoodMaterial} geometry={cylinderBranch1Geo} />
        {/* Vine hanging from branch */}
        <mesh position={[0.7, height * 0.7 - 0.5, 0]} castShadow receiveShadow material={mossMaterial} geometry={cylinderVine1Geo} />

        {/* Another Branch */}
        {isHigh && (
           <mesh position={[-0.4, height * 0.9, 0]} rotation={[0, 0, Math.PI / 4]} castShadow receiveShadow material={deadWoodMaterial} geometry={cylinderBranch2Geo} />
        )}
        {/* Vine hanging from another branch */}
        {isHigh && (
           <mesh position={[-0.6, height * 0.9 - 0.4, 0]} castShadow receiveShadow material={mossMaterial} geometry={cylinderVine2Geo} />
        )}

        {/* Glowing Mushrooms */}
        <mesh position={[0.2, height * 0.3, 0.2]} material={mushroomMaterial} geometry={shroomGeo1} />
        <mesh position={[-0.2, height * 0.5, -0.1]} material={mushroomMaterial} geometry={shroomGeo1} />
        <mesh position={[0, height * 0.8, 0.3]} material={mushroomMaterial} geometry={shroomGeo2} />
      </group>
    );
  }
);

const Crow = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      
      // Bobbing Y up and down smoothly
      const bobY = Math.sin(time * 4 + x) * 0.45;
      innerRef.current.position.y = y + bobY;

      const wingL = innerRef.current.children[1] as THREE.Mesh;
      const wingR = innerRef.current.children[2] as THREE.Mesh;
      if (wingL && wingR) {
        wingL.rotation.x = Math.sin(time * 25) * 0.7;
        wingR.rotation.x = -Math.sin(time * 25) * 0.7;
      }
    }
  });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow material={crowMaterial} geometry={crowBodyGeo} />
      {/* Wing L */}
      <mesh position={[0, 0.1, 0.3]} castShadow material={crowMaterial} geometry={crowWingGeo} />
      {/* Wing R */}
      <mesh position={[0, 0.1, -0.3]} castShadow material={crowMaterial} geometry={crowWingGeo} />
      {/* Head */}
      <mesh position={[-0.4, 0.2, 0]} castShadow receiveShadow material={crowMaterial} geometry={crowHeadGeo} />
      {/* Beak */}
      <mesh position={[-0.7, 0.1, 0]} castShadow receiveShadow material={crowBeakMaterial} geometry={crowBeakGeo} />
    </group>
  );
});

const CrocodileObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  
  const state = useRef({
     phase: 'waiting',
     timer: 0
  });

  const zPos = useRef(-4);

  useImperativeHandle(ref, () => innerRef.current!);
  
  useFrame(({ clock }, delta) => {
    if (innerRef.current) {
       const time = clock.getElapsedTime();
       
       if (state.current.phase !== 'waiting') {
           state.current.timer += delta;
       }
       
       if (state.current.phase === 'waiting') {
           // distance to player
           if (innerRef.current.position.x < 10 && innerRef.current.position.x > 0) {
               state.current.phase = 'attacking';
               state.current.timer = 0;
           }
           zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05);
       } else if (state.current.phase === 'attacking') {
           zPos.current = THREE.MathUtils.lerp(zPos.current, 0, 0.2); // lunge forward fast
           if (innerRef.current.position.x < -2) { // retreat after passing player
               state.current.phase = 'retreating';
               state.current.timer = 0;
           }
       } else if (state.current.phase === 'retreating') {
           zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05); // retreat slowly
           if (state.current.timer > 1.0) {
               state.current.phase = 'waiting';
               state.current.timer = 0;
           }
       }
       innerRef.current.position.y = Math.sin(time * 2) * 0.1 - 0.2;
       innerRef.current.position.z = zPos.current;
       
       if (tailRef.current) {
           tailRef.current.rotation.y = Math.sin(time * (state.current.phase === 'attacking' ? 15 : 3)) * 0.15;
       }
       
       if (jawRef.current) {
           if (state.current.phase === 'attacking' && zPos.current > -1) {
               // Biting animation only when close
               jawRef.current.rotation.z = Math.abs(Math.sin(time * 15)) * 0.4;
           } else {
               jawRef.current.rotation.z = 0;
           }
       }
    }
  });

  return (
    <group ref={innerRef} position={[x, -0.2, -4]} rotation={[0, Math.PI / 2, 0]} scale={1.8}>
      {/* Invisible Hitbox matching the model size */}
      <mesh position={[-0.7, 0.25, 0]} visible={false} geometry={crocHitboxGeo} />
      
      <mesh position={[0, 0.4, 0]} castShadow material={crocMaterial} geometry={crocBodyGeo} />
      {/* Spikes on back */}
      <mesh position={[0, 0.7, 0]} castShadow material={crocSpikeMaterial} geometry={crocSpikeGeo1} />
      <mesh position={[0.8, 0.6, 0]} castShadow material={crocSpikeMaterial} geometry={crocSpikeGeo2} />
      <mesh position={[-0.8, 0.6, 0]} castShadow material={crocSpikeMaterial} geometry={crocSpikeGeo2} />

      <mesh position={[0.5, 0.7, 0]} castShadow material={crocMaterial} geometry={crocBumpGeo} />
      <mesh position={[-0.5, 0.7, 0]} castShadow material={crocMaterial} geometry={crocBumpGeo} />
      
      <group position={[1.5, 0.3, 0]} ref={tailRef}>
          <mesh position={[0.75, 0, 0]} castShadow material={crocMaterial} geometry={crocTailGeo} />
      </group>

      <mesh position={[-2.0, 0.45, 0]} castShadow material={crocMaterial} geometry={crocHeadGeo} />
      <mesh position={[-3.0, 0.45, 0]} castShadow material={crocMaterial} geometry={crocSnoutGeo} />
      
      <group position={[-2.5, 0.35, 0]} ref={jawRef}>
          <mesh position={[-0.5, -0.1, 0]} castShadow material={crocMaterial} geometry={crocBottomJawGeo} />
      </group>

      <mesh position={[-1.7, 0.7, 0.3]} material={crocEyeMaterial} geometry={crocEyeGeo} />
      <mesh position={[-1.7, 0.7, -0.3]} material={crocEyeMaterial} geometry={crocEyeGeo} />
      <mesh position={[-1.75, 0.7, 0.4]} material={blackEyeMaterial} geometry={crocPupilGeo} />
      <mesh position={[-1.75, 0.7, -0.4]} material={blackEyeMaterial} geometry={crocPupilGeo} />
    </group>
  );
});

const PuddleObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
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
         <mesh position={[0, 1.5, 0]} visible={false} geometry={puddleHitboxGeo} />
      </group>
      
      <group ref={visualRef} position={[x, -0.49, 0]}>
         <mesh receiveShadow material={waterMaterial} geometry={puddleCylinderGeo} />
      </group>
    </>
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

export const SwampObstacles = forwardRef<ObstacleData[]>((props, ref) => {
  const { status, speed, gameId, difficulty, isTransitioning } = useGameStore();
  
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
    const allowed = currentLevel?.allowedObstacles || ['swamp-log', 'puddle'];
    const type = allowed[Math.floor(Math.random() * allowed.length)];
    let y = 0;

    if (type === 'bird') {
      y = 0.8 + Math.random() * 2.4;
    } else if (type === 'swamp-fly') {
      y = 1.0 + Math.random() * 1.5;
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
      const score = useGameStore.getState().score;
      const spawnFlock = score > 30000 && Math.random() < 0.7;

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
        if (obs.type === 'stump-low' || obs.type === 'swamp-log') {
          return <DeadTree key={obs.id} ref={obs.ref as any} x={obs.x} scale={0.8} />;
        }
        if (obs.type === 'stump-high') {
           return <DeadTree key={obs.id} ref={obs.ref as any} x={obs.x} scale={1.2} isHigh={true} />;
        }
        if (obs.type === 'puddle') {
           return <PuddleObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'croc') {
           return <CrocodileObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'bird') {
          return <Crow key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
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
