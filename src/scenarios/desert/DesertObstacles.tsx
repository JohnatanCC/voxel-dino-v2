import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, createRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { ObstacleData, ObstacleType } from '../types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE, tryGenerateGlobalObstacle, calculateNextObstaclePosition, pickVariedType } from '../helpers';
import { VoxelEgg } from '../../components/VoxelEgg';
import { getAllowedObstacles, FREQUENCY_RAMP_SCORE, SAND_WORM_MIN_SCORE, SAND_WORM_CHANCE_RAMP_SCORE, SAND_WORM_MAX_CHANCE, SAND_WORM_CHECK_INTERVAL_S, SAND_WORM_CHASE_DURATION_S, SAND_WORM_SUBMERGED_DURATION_S, OBSTACLE_FLOCK_SIZE } from '../../config/balance';
import { spawnParticles } from '../../components/VFXRenderer';
import { createNoiseTexture, createStripeTexture } from '../../utils/proceduralTextures';
import { PowerupBox } from '../shared/PowerupBox';

// Reusable obstacle geometries

// Ribbed hex-cylinders (instead of flat boxes) so the cactus reads as round/fluted even
// from a distance, with a mottled green texture for surface variation.
const cactusTexture = createNoiseTexture({
  baseColor: '#22c55e',
  speckleColors: ['#16a34a', '#15803d', '#4ade80'],
  speckleCount: 1200,
  speckleSize: [2, 5],
  repeat: [1, 3],
});
const cactusMaterial = new THREE.MeshStandardMaterial({ map: cactusTexture, roughness: 0.9, flatShading: true });
const cactusThornMaterial = new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.6 });

const birdBodyMaterial = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8 });
const birdBellyMaterial = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.8 });
const birdBeakMaterial = new THREE.MeshStandardMaterial({ color: '#fcd34d', roughness: 0.6 });
const birdEyeMaterial = new THREE.MeshBasicMaterial({ color: '#1c1917' });
// Ember variant (lava biome): charred body with glowing orange plumage
const emberBodyMaterial = new THREE.MeshStandardMaterial({ color: '#7c2d12', emissive: '#ea580c', emissiveIntensity: 0.6, roughness: 0.7 });
const emberBellyMaterial = new THREE.MeshStandardMaterial({ color: '#fb923c', emissive: '#f97316', emissiveIntensity: 0.9, roughness: 0.6 });

const birdBodyGeo = new THREE.BoxGeometry(1.1, 0.4, 0.38);
const birdBellyGeo = new THREE.BoxGeometry(0.9, 0.22, 0.34);
const birdWingGeo = new THREE.BoxGeometry(0.9, 0.07, 0.42);
const birdHeadGeo = new THREE.BoxGeometry(0.38, 0.36, 0.32);
const birdBeakGeo = new THREE.ConeGeometry(0.09, 0.32, 4);
const birdEyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
const birdTailGeo = new THREE.BoxGeometry(0.5, 0.06, 0.36);

const cactusTrunkGeo = new THREE.CylinderGeometry(0.26, 0.32, 2.4, 6);
const cactusTrunkCapGeo = new THREE.SphereGeometry(0.28, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
const cactusArmHGeo = new THREE.CylinderGeometry(0.16, 0.19, 0.55, 6);
const cactusArmVGeo = new THREE.CylinderGeometry(0.15, 0.18, 1.2, 6);
const cactusArmCapGeo = new THREE.SphereGeometry(0.17, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
const cactusThornGeo = new THREE.BoxGeometry(0.16, 0.035, 0.035);
const flowerGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const flowerMaterial = new THREE.MeshStandardMaterial({ color: '#ec4899', roughness: 0.5 });

// Thorns scattered around the trunk's circumference at a few heights — deterministic per
// cactus "kind" (not per-instance random) so it stays cheap and doesn't recompute on render.
const CACTUS_THORNS = Array.from({ length: 7 }, (_, i) => {
  const angle = (i / 7) * Math.PI * 2;
  const radius = 0.3;
  const height = 0.4 + ((i * 37) % 5) * 0.38;
  return {
    position: [Math.cos(angle) * radius, height, Math.sin(angle) * radius] as [number, number, number],
    rotationY: -angle,
  };
});

export const Cactus = forwardRef<THREE.Group, { x: number; scale: number; numStems?: number }>(
  ({ x, scale, numStems = 1 }, ref) => {

    // We can use the scale or numStems to deterministically decide if it has flowers
    const hasFlowers = scale > 0.9 && numStems > 1;

    return (
      <group ref={ref} position={[x, 0, 0]} scale={scale}>
        {/* Main stem — ribbed round trunk with a domed cap */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow material={cactusMaterial} geometry={cactusTrunkGeo} />
        <mesh position={[0, 2.4, 0]} castShadow material={cactusMaterial} geometry={cactusTrunkCapGeo} />

        {/* Thorns around the trunk */}
        {CACTUS_THORNS.map((t, i) => (
          <mesh key={i} position={t.position} rotation={[0, t.rotationY, 0]} castShadow geometry={cactusThornGeo} material={cactusThornMaterial} />
        ))}

        {/* Top Flower */}
        {hasFlowers && (
          <mesh position={[0, 2.6, 0]} geometry={flowerGeo} material={flowerMaterial} />
        )}

        {/* Left Arm */}
        {numStems > 1 && (
          <group position={[-0.45, 0.8, 0]}>
            <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={cactusMaterial} geometry={cactusArmHGeo} />
            <mesh position={[-0.35, 0.5, 0]} castShadow receiveShadow material={cactusMaterial} geometry={cactusArmVGeo} />
            <mesh position={[-0.35, 1.1, 0]} castShadow material={cactusMaterial} geometry={cactusArmCapGeo} />
            {hasFlowers && (
              <mesh position={[-0.35, 1.3, 0]} geometry={flowerGeo} material={flowerMaterial} />
            )}
          </group>
        )}

        {/* Right Arm */}
        {numStems > 2 && (
          <group position={[0.45, 1.3, 0]}>
            <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={cactusMaterial} geometry={cactusArmHGeo} />
            <mesh position={[0.35, 0.6, 0]} castShadow receiveShadow material={cactusMaterial} geometry={cactusArmVGeo} />
            <mesh position={[0.35, 1.2, 0]} castShadow material={cactusMaterial} geometry={cactusArmCapGeo} />
            {hasFlowers && (
              <mesh position={[0.35, 1.4, 0]} geometry={flowerGeo} material={flowerMaterial} />
            )}
          </group>
        )}
      </group>
    );
  }
);

export const Bird = forwardRef<THREE.Group, { x: number; y: number; ember?: boolean }>(({ x, y, ember = false }, ref) => {
  const bodyMat = ember ? emberBodyMaterial : birdBodyMaterial;
  const bellyMat = ember ? emberBellyMaterial : birdBellyMaterial;
  const innerRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (innerRef.current) {
      // Bobbing Y up and down smoothly
      const bobY = Math.sin(time * 4 + x) * 0.45;
      innerRef.current.position.y = y + bobY;
    }

    // Flapping wings, layered on top of their fixed backward sweep
    const flap = Math.sin(time * 15) * 0.5;
    if (wingLRef.current) wingLRef.current.rotation.x = flap;
    if (wingRRef.current) wingRRef.current.rotation.x = -flap;
  });

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      {/* Back */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow material={bodyMat} geometry={birdBodyGeo} />
      {/* Pale belly underside */}
      <mesh position={[0, -0.16, 0]} castShadow receiveShadow material={bellyMat} geometry={birdBellyGeo} />

      {/* Wings — swept back at rest so the silhouette reads as flight, not a cross */}
      <group ref={wingLRef} position={[0.05, 0.18, 0.28]} rotation={[0, 0, -0.4]}>
        <mesh position={[0, 0, 0.35]} castShadow material={bodyMat} geometry={birdWingGeo} />
      </group>
      <group ref={wingRRef} position={[0.05, 0.18, -0.28]} rotation={[0, 0, 0.4]}>
        <mesh position={[0, 0, -0.35]} castShadow material={bodyMat} geometry={birdWingGeo} />
      </group>

      {/* Head, eyes, beak */}
      <mesh position={[-0.58, 0.14, 0]} castShadow receiveShadow material={bodyMat} geometry={birdHeadGeo} />
      <mesh position={[-0.78, 0.15, 0.09]} material={birdEyeMaterial} geometry={birdEyeGeo} />
      <mesh position={[-0.78, 0.15, -0.09]} material={birdEyeMaterial} geometry={birdEyeGeo} />
      <mesh position={[-0.9, 0.12, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow material={birdBeakMaterial} geometry={birdBeakGeo} />

      {/* Fan tail */}
      <mesh position={[0.66, 0.02, 0]} rotation={[0, 0, 0.15]} castShadow receiveShadow material={bodyMat} geometry={birdTailGeo} />
    </group>
  );
});

// --- Sand Worm: event enemy with its own chase/attack cycle (not part of the spawn pool) ---

// Ringed sand-worm skin (alternating bands) instead of a flat tan color, so the segmented
// body reads clearly instead of blending into one blob.
const wormRingTexture = createStripeTexture({ colorA: '#c2a06a', colorB: '#a9834f', stripes: 10, vertical: false, repeat: [1, 1.4] });
const wormMaterial = new THREE.MeshStandardMaterial({ map: wormRingTexture, roughness: 0.85 });
const wormBellyMaterial = new THREE.MeshStandardMaterial({ color: '#8a6d47', roughness: 0.9 });
const wormMouthMaterial = new THREE.MeshBasicMaterial({ color: '#450a0a' });
const wormEyeMaterial = new THREE.MeshBasicMaterial({ color: '#7f1d1d' });
const wormEyeGlintMaterial = new THREE.MeshBasicMaterial({ color: '#fde68a' });
const wormMandibleMaterial = new THREE.MeshStandardMaterial({ color: '#57310c', roughness: 0.6 });
const wormSpineMaterial = new THREE.MeshStandardMaterial({ color: '#78542f', roughness: 0.8 });

const wormHeadGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
const wormSeg1Geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
const wormSeg2Geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const wormSeg3Geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
const wormMouthGeo = new THREE.BoxGeometry(0.5, 0.2, 0.6);
const wormEyeGeo = new THREE.BoxGeometry(0.14, 0.14, 0.1);
const wormEyeGlintGeo = new THREE.BoxGeometry(0.05, 0.05, 0.02);
const wormMandibleGeo = new THREE.BoxGeometry(0.35, 0.1, 0.1);
const wormSpineGeo = new THREE.BoxGeometry(0.12, 0.16, 0.12);

const CACTUS_CLUSTER_MIN_SCORE = 10000; // "grupo de cactos" only shows up once the run gets going

const WORM_EMERGE_X = -2.5;
const WORM_FOLLOW_X = -1.5; // stays behind the player while "chasing" — never close enough to hit
const WORM_ATTACK_X = 5.5;
const WORM_LUNGE_DURATION_S = 0.22; // the actual forward strike: fast, not the slow chase creep
const WORM_ATTACK_HOLD_S = 0.45; // total time in the 'attacking' state, lunge included
const WORM_SUBMERGE_DURATION_S = 0.22; // fast dive back into the ground after the strike
type WormState = 'inactive' | 'chasing' | 'attacking' | 'submerging' | 'cooldown';

export const SandWormModel = forwardRef<THREE.Group, { visible?: boolean }>(({ visible = true }, ref) => (
  <group ref={ref} visible={visible}>
    <mesh position={[0, 0, 0]} geometry={wormHeadGeo} material={wormMaterial} castShadow />
    <mesh position={[0, -0.1, 0.3]} geometry={wormMouthGeo} material={wormMouthMaterial} />

    {/* Mandibles flanking the mouth — the head needs to read as a face, not a plain cube */}
    <mesh position={[0.32, -0.05, 0.16]} rotation={[0, 0.35, 0]} geometry={wormMandibleGeo} material={wormMandibleMaterial} castShadow />
    <mesh position={[0.32, -0.05, -0.16]} rotation={[0, -0.35, 0]} geometry={wormMandibleGeo} material={wormMandibleMaterial} castShadow />

    {/* Eyes with a small glint so they catch light instead of vanishing into the tan skin */}
    <mesh position={[0.2, 0.25, 0.3]} geometry={wormEyeGeo} material={wormEyeMaterial} />
    <mesh position={[0.2, 0.25, -0.3]} geometry={wormEyeGeo} material={wormEyeMaterial} />
    <mesh position={[0.25, 0.29, 0.34]} geometry={wormEyeGlintGeo} material={wormEyeGlintMaterial} />
    <mesh position={[0.25, 0.29, -0.34]} geometry={wormEyeGlintGeo} material={wormEyeGlintMaterial} />

    {/* Body — a slight Z zig-zag on top of the Y taper gives it an S-curve instead of a straight ramp */}
    <mesh position={[-0.7, 0.05, 0.08]} geometry={wormSeg1Geo} material={wormMaterial} castShadow />
    <mesh position={[-1.25, 0.1, -0.06]} geometry={wormSeg2Geo} material={wormBellyMaterial} castShadow />
    <mesh position={[-1.65, 0.15, 0.05]} geometry={wormSeg3Geo} material={wormMaterial} castShadow />

    {/* Spine ridge bumps along the back */}
    <mesh position={[-0.05, 0.5, 0]} geometry={wormSpineGeo} material={wormSpineMaterial} castShadow />
    <mesh position={[-0.7, 0.45, 0.08]} geometry={wormSpineGeo} material={wormSpineMaterial} castShadow />
    <mesh position={[-1.25, 0.4, -0.06]} scale={0.75} geometry={wormSpineGeo} material={wormSpineMaterial} castShadow />
  </group>
));

const SandWorm = forwardRef<THREE.Group, { data: ObstacleData }>(({ data }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  useImperativeHandle(ref, () => innerRef.current!);

  const wormState = useRef<WormState>('inactive');
  const stateTimer = useRef(0);
  const cycleCount = useRef(0);
  const checkTimer = useRef(SAND_WORM_CHECK_INTERVAL_S);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.status !== 'playing') {
      data.x = -1000;
      if (innerRef.current) innerRef.current.visible = false;
      return;
    }

    if (wormState.current === 'inactive') {
      data.x = -1000;
      if (innerRef.current) innerRef.current.visible = false;

      checkTimer.current -= delta;
      if (checkTimer.current <= 0) {
        checkTimer.current = SAND_WORM_CHECK_INTERVAL_S;
        const score = store.score;
        if (score >= SAND_WORM_MIN_SCORE) {
          const t = Math.min(1, (score - SAND_WORM_MIN_SCORE) / (SAND_WORM_CHANCE_RAMP_SCORE - SAND_WORM_MIN_SCORE));
          if (Math.random() < SAND_WORM_MAX_CHANCE * t) {
            wormState.current = 'chasing';
            stateTimer.current = 0;
            cycleCount.current = 0;
            spawnParticles('dust', [WORM_EMERGE_X, 0, 0], 25, '#c2a06a');
          }
        }
      }
      return;
    }

    stateTimer.current += delta;

    if (wormState.current === 'chasing') {
      // Follows behind the player, still well out of attack range — builds tension without threatening a jump.
      const t = Math.min(1, stateTimer.current / SAND_WORM_CHASE_DURATION_S);
      data.x = THREE.MathUtils.lerp(WORM_EMERGE_X, WORM_FOLLOW_X, t);
      data.y = 0.3;
      if (innerRef.current) {
        innerRef.current.visible = true;
        innerRef.current.position.set(data.x, data.y, 0);
        innerRef.current.rotation.z = Math.sin(stateTimer.current * 10) * 0.08;
        innerRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, Math.min(1, stateTimer.current / 0.6)));
      }
      if (t >= 1) {
        wormState.current = 'attacking';
        stateTimer.current = 0;
        useGameStore.getState().triggerCameraShake(0.3);
        useGameStore.getState().addFloatingText('VERME DE AREIA!', data.x, data.y + 1.5, 0, '#c2a06a');
      }
    } else if (wormState.current === 'attacking') {
      // Sudden lunge: most of the distance is covered in the first fraction of a second (fast ease-out),
      // then it holds briefly in the strike pose before submerging.
      const lungeT = Math.min(1, stateTimer.current / WORM_LUNGE_DURATION_S);
      const eased = 1 - Math.pow(1 - lungeT, 4);
      data.x = THREE.MathUtils.lerp(WORM_FOLLOW_X, WORM_ATTACK_X, eased);
      data.y = THREE.MathUtils.lerp(0.3, 0.9, eased);
      if (innerRef.current) {
        innerRef.current.position.set(data.x, data.y, 0);
        innerRef.current.rotation.x = -0.3 * eased;
      }
      if (stateTimer.current >= WORM_ATTACK_HOLD_S) {
        wormState.current = 'submerging';
        stateTimer.current = 0;
      }
    } else if (wormState.current === 'submerging') {
      const t = Math.min(1, stateTimer.current / WORM_SUBMERGE_DURATION_S);
      const eased = t * t; // accelerates downward, like diving into the sand
      data.y = THREE.MathUtils.lerp(0.9, -1.5, eased);
      if (innerRef.current) {
        innerRef.current.position.set(data.x, data.y, 0);
        innerRef.current.scale.setScalar(THREE.MathUtils.lerp(1, 0.2, eased));
      }
      if (t >= 1) {
        data.x = -1000;
        if (innerRef.current) innerRef.current.visible = false;
        cycleCount.current += 1;
        if (cycleCount.current >= 2) {
          wormState.current = 'inactive';
          checkTimer.current = SAND_WORM_CHECK_INTERVAL_S;
        } else {
          wormState.current = 'cooldown';
          stateTimer.current = 0;
        }
      }
    } else if (wormState.current === 'cooldown') {
      if (stateTimer.current >= SAND_WORM_SUBMERGED_DURATION_S) {
        wormState.current = 'chasing';
        stateTimer.current = 0;
        spawnParticles('dust', [WORM_EMERGE_X, 0, 0], 25, '#c2a06a');
      }
    }
  });

  return <SandWormModel ref={innerRef} visible={false} />;
});

export const DesertObstacles = forwardRef<ObstacleData[]>((props, ref) => {
  const { status, speed, gameId, isTransitioning } = useGameStore();

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

  // The sand worm is a single dedicated slot, not part of the recycled pool.
  const [sandWorm] = useState<ObstacleData>(() => ({
    id: 999,
    type: 'sand-worm',
    x: -1000,
    y: -1000,
    ref: createRef<THREE.Group>()
  }));

  const nextSpawnX = useRef(SPAWN_DISTANCE);
  const lastInitializedGameId = useRef<number | null>(null);

  const randomCactusScale = (type: ObstacleType): number => {
    if (type === 'cactus-large') return 1.0 + Math.random() * 0.5; // 1.0 - 1.5
    return 0.55 + Math.random() * 0.4; // 0.55 - 0.95
  };

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
    const allowed = getAllowedObstacles('desert', store.score);
    const type = pickVariedType(allowed);
    let y = 0;

    if (type === 'bird') {
      y = 0.8 + Math.random() * 2.4;
    }

    slot.type = type;
    slot.x = x;
    slot.y = y;
    slot.scale = (type === 'cactus-small' || type === 'cactus-large') ? randomCactusScale(type) : undefined;
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
         (ref as React.MutableRefObject<ObstacleData[]>).current = [...pool, sandWorm].filter(obs => obs.x > DESPAWN_DISTANCE);
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
      const spawnFlock = score > FREQUENCY_RAMP_SCORE && Math.random() < 0.75;
      const spawnCactusCluster = !spawnFlock && score >= CACTUS_CLUSTER_MIN_SCORE && Math.random() < 0.3;

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
      } else if (spawnCactusCluster) {
         const inactiveSlots = pool.filter(obs => obs.x <= DESPAWN_DISTANCE);
         const clusterSize = Math.min(inactiveSlots.length, 2 + Math.floor(Math.random() * 2)); // 2-3 cacti
         if (clusterSize >= 2) {
            const nextObsX = calculateNextObstaclePosition();
            for (let k = 0; k < clusterSize; k++) {
               const slot = inactiveSlots[k];
               const type: ObstacleType = Math.random() < 0.6 ? 'cactus-small' : 'cactus-large';
               slot.type = type;
               slot.x = nextObsX + k * (1.8 + Math.random() * 0.8);
               slot.y = 0;
               slot.scale = randomCactusScale(type);
               slot.powerupType = undefined;

               if (slot.ref.current) {
                 slot.ref.current.position.set(slot.x, slot.y, 0);
                 slot.ref.current.visible = true;
               }
            }
            nextSpawnX.current = nextObsX + clusterSize * 2.2;
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
      (ref as React.MutableRefObject<ObstacleData[]>).current = [...pool, sandWorm].filter(obs => obs.x > DESPAWN_DISTANCE);
    }
  });

  return (
    <group>
      {pool.map(obs => {
        if (obs.type === 'cactus-small') {
          return <Cactus key={obs.id} ref={obs.ref as any} x={obs.x} scale={obs.scale ?? 0.8} numStems={1} />;
        }
        if (obs.type === 'cactus-large') {
           const scale = obs.scale ?? 1.2;
           return <Cactus key={obs.id} ref={obs.ref as any} x={obs.x} scale={scale} numStems={scale > 1.3 ? 3 : 2} />;
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
        return null;
      })}
      <SandWorm key={gameId} ref={sandWorm.ref as any} data={sandWorm} />
    </group>
  );
});
