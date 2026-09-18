import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, createRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType } from '../types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, tryGenerateGlobalObstacle, calculateNextObstaclePosition, isBirdEligible, pickVariedType } from '../helpers';
import { VoxelEgg } from '../../components/VoxelEgg';
import { getAllowedObstacles, FREQUENCY_RAMP_SCORE, OBSTACLE_FLOCK_SIZE } from '../../config/balance';
import { PowerupBox } from '../shared/PowerupBox';

// Reusable static materials
const deadWoodMaterial = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.95 }); // Lighter grey/brown for visibility
const crocMaterial = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 });
const crocSpikeMaterial = new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.9 });
const crowMaterial = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.5 });
const crowBeakMaterial = new THREE.MeshStandardMaterial({ color: '#44403c', roughness: 0.8 });
const mossMaterial = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.9 }); // Brighter moss
const mushroomMaterial = new THREE.MeshStandardMaterial({ color: '#a7f3d0', emissive: '#34d399', emissiveIntensity: 0.8 });
const crocEyeMaterial = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#facc15', emissiveIntensity: 1.0 });
const blackEyeMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const leechPatchMaterial = new THREE.MeshStandardMaterial({ color: '#3f0d12', roughness: 0.9, transparent: true, opacity: 0.88 });
const leechBlobMaterial = new THREE.MeshStandardMaterial({ color: '#160406', roughness: 0.6 });

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

const leechPatchGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.06, 12);
const leechBlobGeo = new THREE.BoxGeometry(0.22, 0.32, 0.22);

// Glowing fireflies circling the trunk: the swamp is dark, so they make the obstacle
// readable from far away.
const fireflyCoreMaterial = new THREE.MeshBasicMaterial({ color: '#fef08a', toneMapped: false });
const fireflyHaloMaterial = new THREE.MeshBasicMaterial({ color: '#facc15', transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false });
const fireflyCoreGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
const fireflyHaloGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
const FIREFLIES_PER_TRUNK = 4;

function TrunkFireflies({ height }: { height: number }) {
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((g, i) => {
      if (!g) return;
      const a = t * (0.9 + i * 0.25) + i * 1.7;
      // Kept inside the trunk/branch footprint so the collision box (built from every
      // child mesh) doesn't grow.
      const r = 0.6 + Math.sin(t * 1.3 + i) * 0.1;
      g.position.set(
        Math.cos(a) * r,
        height * (0.25 + (i / FIREFLIES_PER_TRUNK) * 0.75) + Math.sin(t * 2 + i * 2) * 0.25,
        Math.sin(a) * r
      );
      const pulse = 0.75 + Math.sin(t * 5 + i * 1.9) * 0.25;
      g.scale.setScalar(pulse);
    });
  });

  return (
    <>
      {Array.from({ length: FIREFLIES_PER_TRUNK }, (_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <mesh material={fireflyCoreMaterial} geometry={fireflyCoreGeo} />
          <mesh material={fireflyHaloMaterial} geometry={fireflyHaloGeo} />
        </group>
      ))}
    </>
  );
}

export const DeadTree = forwardRef<THREE.Group, { x: number; scale: number; isHigh?: boolean }>(
  ({ x, scale, isHigh = false }, ref) => {
    const height = isHigh ? 3 : 1.5;
    const geometry = isHigh ? cylinderTrunkHighGeo : cylinderTrunkLowGeo;
    return (
      <group ref={ref} position={[x, 0, 0]} scale={scale}>
        <TrunkFireflies height={height} />
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

export const Crow = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
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

export const CrocodileObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
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

export const LeechObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      const pulse = 1 + Math.sin(time * 6 + x) * 0.08;
      innerRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <group ref={innerRef} position={[x, 0, 0]}>
      <mesh position={[0, 0.03, 0]} receiveShadow material={leechPatchMaterial} geometry={leechPatchGeo} />
      <mesh position={[0.32, 0.4, 0.22]} material={leechBlobMaterial} geometry={leechBlobGeo} />
      <mesh position={[-0.28, 0.4, -0.18]} material={leechBlobMaterial} geometry={leechBlobGeo} />
      <mesh position={[0.08, 0.4, -0.38]} material={leechBlobMaterial} geometry={leechBlobGeo} />
    </group>
  );
});


export const SwampObstacles = forwardRef<ObstacleData[]>((props, ref) => {
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
    const allowed = getAllowedObstacles('swamp', store.score);
    const type = pickVariedType(allowed);
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
      const spawnFlock = score > FREQUENCY_RAMP_SCORE && Math.random() < 0.7;

      if (spawnFlock) {
         const inactiveSlots = pool.filter(obs => obs.x <= DESPAWN_DISTANCE);
         if (inactiveSlots.length >= OBSTACLE_FLOCK_SIZE) {
            const nextObsX = calculateNextObstaclePosition();
            for (let k = 0; k < OBSTACLE_FLOCK_SIZE; k++) {
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
            nextSpawnX.current = nextObsX + OBSTACLE_FLOCK_SIZE * 3;
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
        if (obs.type === 'leech') {
           return <LeechObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
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
