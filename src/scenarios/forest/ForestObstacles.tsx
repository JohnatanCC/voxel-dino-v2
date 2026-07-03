import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType, PowerupType } from '../types';

const SPAWN_DISTANCE = 30;
const DESPAWN_DISTANCE = -10;

// Reusable static materials
const woodMaterial = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
const woodInnerMaterial = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.8 });
const tropicalBirdMaterial = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.6 }); // Red macaw
const birdBeakMaterial = new THREE.MeshStandardMaterial({ color: '#fcd34d', roughness: 0.8 });
const birdTailMaterial = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.8 });
const waterMaterial = new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.1, transparent: true, opacity: 0.8 });
const mudEdgeMaterial = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 1 });
const puddleRockMaterial = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.9 });
const powerupTextMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const treeHoleTrunkMaterial = new THREE.MeshStandardMaterial({ color: '#3f2715', roughness: 0.9 });
const treeHoleLeavesMaterial = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.9 });

// Reusable static geometries
const cylinderStumpHighGeo = new THREE.CylinderGeometry(0.5, 0.6, 2.5, 8);
const cylinderStumpLowGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8);
const cylinderStumpInnerGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.02, 8);

const birdBodyGeo = new THREE.BoxGeometry(1.0, 0.5, 0.5);
const birdWingGeo = new THREE.BoxGeometry(0.8, 0.1, 1.2);
const birdHeadGeo = new THREE.BoxGeometry(0.5, 0.5, 0.4);
const birdBeakGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
const birdTailGeo = new THREE.BoxGeometry(0.6, 0.1, 0.3);

const puddleEdgeGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.05, 16);
const puddleWaterGeo = new THREE.CylinderGeometry(1.9, 1.9, 0.05, 16);
const decaRockGeo1 = new THREE.DodecahedronGeometry(0.3, 0);
const decaRockGeo2 = new THREE.DodecahedronGeometry(0.2, 0);
const decaRockGeo3 = new THREE.DodecahedronGeometry(0.25, 0);

const powerupBoxGeo = new THREE.BoxGeometry(1, 1, 1);
const powerupHorizontalBarGeo = new THREE.BoxGeometry(0.5, 0.15, 0.05);
const powerupVerticalBarGeo = new THREE.BoxGeometry(0.15, 0.5, 0.05);
const powerupQ1Geo = new THREE.BoxGeometry(0.4, 0.1, 0.05);
const powerupQ2Geo = new THREE.BoxGeometry(0.1, 0.2, 0.05);
const powerupQ3Geo = new THREE.BoxGeometry(0.3, 0.1, 0.05);
const powerupQ4Geo = new THREE.BoxGeometry(0.1, 0.1, 0.05);

const treeHoleHitboxGeo = new THREE.BoxGeometry(1.5, 6, 2);
const treeHoleCanopyGeo = new THREE.BoxGeometry(2, 4, 5);
const treeHoleLeavesGeo = new THREE.SphereGeometry(4, 8, 8);
const treeHoleSideTrunkGeo = new THREE.CylinderGeometry(0.6, 1.2, 3, 5);

const Stump = forwardRef<THREE.Group, { x: number; scale: number; isHigh?: boolean }>(
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

const TropicalBird = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      const wingL = innerRef.current.children[1] as THREE.Mesh;
      const wingR = innerRef.current.children[2] as THREE.Mesh;
      if (wingL && wingR) {
        wingL.rotation.x = Math.sin(time * 20) * 0.6;
        wingR.rotation.x = -Math.sin(time * 20) * 0.6;
      }
    }
  });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow material={tropicalBirdMaterial} geometry={birdBodyGeo} />
      {/* Wing L */}
      <mesh position={[0, 0.2, 0.4]} castShadow material={tropicalBirdMaterial} geometry={birdWingGeo} />
      {/* Wing R */}
      <mesh position={[0, 0.2, -0.4]} castShadow material={tropicalBirdMaterial} geometry={birdWingGeo} />
      {/* Head */}
      <mesh position={[-0.5, 0.2, 0]} castShadow receiveShadow material={tropicalBirdMaterial} geometry={birdHeadGeo} />
      {/* Beak */}
      <mesh position={[-0.9, 0.1, 0]} castShadow receiveShadow material={birdBeakMaterial} geometry={birdBeakGeo} />
      {/* Tail - Blue/Yellow for macaw look */}
      <mesh position={[0.7, 0, 0]} castShadow receiveShadow material={birdTailMaterial} geometry={birdTailGeo} />
    </group>
  );
});

const Puddle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const hitboxRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => hitboxRef.current!);

  useFrame(({ clock }) => {
    if (hitboxRef.current && visualRef.current) {
       visualRef.current.position.x = hitboxRef.current.position.x;
       
       const time = clock.getElapsedTime();
       const croc = visualRef.current.children[1] as THREE.Mesh;
       if (croc) {
          croc.position.y = Math.sin(time * 3) * 0.1 + 0.2;
       }
    }
  });

  return (
    <>
      <group ref={hitboxRef} position={[x, 0, 0]}>
         {/* Invisible Hitbox */}
         <mesh position={[0, 1.5, 0]} visible={false} geometry={treeHoleHitboxGeo} />
      </group>
      
      <group ref={visualRef} position={[x, 0, 0]}>
        {/* Mud Edge */}
        <mesh position={[0, 0.02, 0]} receiveShadow material={mudEdgeMaterial} geometry={puddleEdgeGeo} />
        {/* Water Plane */}
        <mesh position={[0, 0.04, 0]} receiveShadow material={waterMaterial} geometry={puddleWaterGeo} />
        
        {/* Some decorative rocks in the puddle */}
        <mesh position={[1.2, 0.1, 0.5]} castShadow receiveShadow material={puddleRockMaterial} geometry={decaRockGeo1} />
        <mesh position={[-0.8, 0.1, -1.2]} castShadow receiveShadow material={puddleRockMaterial} geometry={decaRockGeo2} />
        <mesh position={[0.5, 0.1, 1.5]} castShadow receiveShadow material={puddleRockMaterial} geometry={decaRockGeo3} />
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

const TreeHoleObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
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
  const { status, speed, gameId, difficulty, isTransitioning } = useGameStore();
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const nextSpawnX = useRef(SPAWN_DISTANCE);
  const idCounter = useRef(0);

  useImperativeHandle(ref, () => obstacles, [obstacles]);

  const generateObstacle = (x: number): ObstacleData => {
    const rand = Math.random();
    let type: ObstacleType = 'stump-low';
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
      const birdThreshold = Math.max(0.55, 0.7 - (score / 60000));
      
      if (isBirdEligible && rand > birdThreshold) {
        type = 'bird';
        const birdHeights = [1.0, 1.8, 2.6];
        y = birdHeights[Math.floor(Math.random() * birdHeights.length)];
      } else if (rand > 0.45) {
        type = 'puddle';
      } else if (rand > 0.22) {
        type = 'stump-high';
      } else {
        type = 'tree-hole';
      }
    }

    return {
      id: idCounter.current++,
      type,
      x,
      y,
      powerupType,
      ref: { current: null }
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
        if (obs.type === 'stump-low') {
          return <Stump key={obs.id} ref={obs.ref as any} x={obs.x} scale={0.8} />;
        }
        if (obs.type === 'stump-high') {
           return <Stump key={obs.id} ref={obs.ref as any} x={obs.x} scale={1.2} isHigh={true} />;
        }
        if (obs.type === 'puddle') {
           return <Puddle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'tree-hole') {
           return <TreeHoleObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'bird') {
          return <TropicalBird key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} />;
        }
        if (obs.type === 'powerup') {
          return <PowerupBox key={obs.id} ref={obs.ref as any} x={obs.x} y={obs.y} type={obs.powerupType} />;
        }
        return null;
      })}
    </group>
  );
});
