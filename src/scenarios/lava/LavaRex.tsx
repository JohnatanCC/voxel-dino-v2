import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SkinConfig } from '../../store/gameStore';
import { ObstacleData } from '../types';
import { setSurface, clearAllSurfaces } from '../standable';
import { spawnParticles } from '../../components/VFXRenderer';
import { playRoarSound } from '../../utils/audio';
import { ClassicDinoModel } from '../../models/dino/skins/ClassicDinoModel';
import { DinoAnimationState } from '../../models/dino/types';
import {
  LAVA_REX_MIN_BIOME_SCORE,
  LAVA_REX_CHECK_INTERVAL_S,
  LAVA_REX_CHANCE,
  LAVA_REX_COOLDOWN_S,
  LAVA_REX_WARNING_S,
  LAVA_REX_CHARGE_SPEED,
  LAVA_REX_CHARGE_ACCEL,
  LAVA_REX_BODY_TOP,
  LAVA_REX_TAIL_TOP,
  LAVA_REX_SURF_BONUS,
  LAVA_REX_FRONT_CHANCE,
  LAVA_REX_FRONT_SPEED,
  BIOME_CYCLE_SCORE,
} from '../../config/balance';

// The T-Rex is the player's own dino rig blown up: same walk cycle, jaw and blinking, with the head
// dropped level with the back (so head + back form one flat platform) and a wider body.
const SCALE = 2.5;
const WIDTH = 1.3; // extra z stretch on top of SCALE
const HEAD_OFFSET: [number, number, number] = [0.5, -1.0, 0];
const SNOUT_X = 2.45; // rig units from the rig origin to the snout tip
const MODEL_X = -SNOUT_X * SCALE; // puts the snout at the wrapper origin, body toward -x
const BODY_LEN = (SNOUT_X + 0.7) * SCALE; // snout -> where the torso ends and the lower tail begins
const REX_LEN = (SNOUT_X + 1.8) * SCALE; // snout -> tail tip
const FEET_X = -5.6; // feet centre relative to the snout (along the direction of travel)
// The body runs on a lane just behind the player's (so it never hides the dino); only the foot
// hitbox sits in the player's own lane.
const REX_Z = -1.4;

// Rear charge: the T-Rex appears behind the player and overtakes moving right.
const REAR_START_X = -16; // snout position when the warning starts (whole body still off-screen)
const REAR_READY_X = -7;
const REAR_EXIT_X = 32;
// Front charge: it appears off the right edge, faces the player and runs left.
const FRONT_START_X = 34;
const FRONT_READY_X = 26;
const FRONT_EXIT_X = -20;

const REX_SKIN: SkinConfig = {
  id: 'lava-rex',
  name: 'Lava T-Rex',
  rarity: 'common',
  price: 0,
  baseColor: '#c2683c',
  spotsColor: '#fde047',
  spikesColor: '#fbbf24',
  collarColor: '#dc2626',
};

const rexWarnMaterial = new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
const warnPadGeo = new THREE.PlaneGeometry(4, 5);
const hitboxFootGeo = new THREE.BoxGeometry(3.0, 1.5, 1.8);

// 'armed': the event is decided and regular spawns are paused, waiting for the track to clear.
type RexState = 'inactive' | 'armed' | 'warning' | 'charging';

interface LavaRexProps {
  data: ObstacleData;
  // Regular obstacle pool: the event only starts on a clear track.
  pool: ObstacleData[];
}

export const LavaRex = forwardRef<THREE.Group, LavaRexProps>(({ data, pool }, ref) => {
  const wrapperRef = useRef<THREE.Group>(null);
  const feetRef = useRef<THREE.Group>(null); // collision proxy for the feet — the ONLY thing that hurts
  const warnRef = useRef<THREE.Mesh>(null);

  // Fake animation state feeding the shared dino rig.
  const animState = useRef<DinoAnimationState>({
    runPhase: 0,
    velocity: 0,
    isGrounded: true,
    isCrouching: false,
    isUnderground: false,
    isEating: false,
    activePowerup: 'none',
    status: 'playing',
    speed: 10,
    isGhost: false,
    baseScale: 1,
  });

  const stateRef = useRef<RexState>('inactive');
  const dir = useRef<1 | -1>(1); // +1 = charges from behind (rightwards), -1 = head-on (leftwards)
  const timer = useRef(0);
  const checkTimer = useRef(LAVA_REX_CHECK_INTERVAL_S);
  const cooldown = useRef(0);
  const x = useRef(REAR_START_X);
  const velocity = useRef(0);
  const shakeTimer = useRef(0);
  const surfed = useRef(false);

  useImperativeHandle(ref, () => feetRef.current!);

  const reset = () => {
    stateRef.current = 'inactive';
    data.x = -1000;
    if (wrapperRef.current) wrapperRef.current.visible = false;
    if (feetRef.current) feetRef.current.position.x = -1000; // keep the stale hitbox far from the player
    if (warnRef.current) (warnRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
    clearAllSurfaces();
    if (useGameStore.getState().lavaRexActive) useGameStore.setState({ lavaRexActive: false });
  };

  // A fresh run must never inherit a half-finished event.
  const gameId = useGameStore((s) => s.gameId);
  useEffect(() => {
    reset();
    cooldown.current = 0;
    checkTimer.current = LAVA_REX_CHECK_INTERVAL_S;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  useEffect(() => reset, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.status === 'paused') return; // freeze mid-event; resuming carries on
    if (store.status !== 'playing' || store.scenario !== 'lava') {
      if (stateRef.current !== 'inactive') reset();
      data.x = -1000;
      return;
    }

    if (stateRef.current === 'inactive') {
      data.x = -1000;
      if (wrapperRef.current) wrapperRef.current.visible = false;
      cooldown.current -= delta;
      checkTimer.current -= delta;
      if (checkTimer.current > 0) return;
      checkTimer.current = LAVA_REX_CHECK_INTERVAL_S;

      const progress = store.score % BIOME_CYCLE_SCORE;
      if (
        cooldown.current > 0 || store.isTransitioning || progress < LAVA_REX_MIN_BIOME_SCORE ||
        Math.random() > LAVA_REX_CHANCE
      ) return;

      // Stop new obstacles now so the track drains before the T-Rex shows up.
      stateRef.current = 'armed';
      timer.current = 0;
      useGameStore.setState({ lavaRexActive: true });
      return;
    }

    if (stateRef.current === 'armed') {
      data.x = -1000;
      timer.current += delta;
      // Spawns are paused, so every obstacle already ahead must scroll past before the T-Rex shows up.
      const trackClear = pool.every((o) => o.type === 'egg' || o.x <= 0);
      if (store.isTransitioning) { reset(); return; }
      if (!trackClear && timer.current < 12) return;

      dir.current = Math.random() < LAVA_REX_FRONT_CHANCE ? -1 : 1;
      stateRef.current = 'warning';
      timer.current = 0;
      shakeTimer.current = 0;
      x.current = dir.current === 1 ? REAR_START_X : FRONT_START_X;
      surfed.current = false;
      store.addFloatingText('T-REX!', dir.current === 1 ? 1 : 8, 4.5, 0, '#ef4444');
      store.triggerCameraShake(0.5);
      return;
    }

    const d = dir.current;
    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.visible = true;
      wrapper.rotation.y = d === 1 ? 0 : Math.PI; // the rig faces +x; flip it for the head-on charge
    }
    // World-space marker on the edge the T-Rex is coming from.
    const warnX = d === 1 ? -1.5 : 13.5;
    if (warnRef.current) warnRef.current.position.x = warnX;

    const anim = animState.current;
    if (stateRef.current === 'warning') {
      timer.current += delta;
      const t = Math.min(1, timer.current / LAVA_REX_WARNING_S);
      // Creeps in from off-screen with a shaking, growling approach.
      const from = d === 1 ? REAR_START_X : FRONT_START_X;
      const to = d === 1 ? REAR_READY_X : FRONT_READY_X;
      x.current = THREE.MathUtils.lerp(from, to, 1 - Math.pow(1 - t, 2));
      shakeTimer.current -= delta;
      if (shakeTimer.current <= 0) {
        shakeTimer.current = 0.3;
        store.triggerCameraShake(0.25);
        spawnParticles('dust', [warnX + Math.random() * 2, 0.2, (Math.random() - 0.5) * 0.8], 4, '#f97316');
      }
      if (warnRef.current) (warnRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.abs(Math.sin(timer.current * 9)) * 0.35;
      anim.isEating = true; // jaw snaps open and shut: the growl
      anim.runPhase += delta * 6;
      if (timer.current >= LAVA_REX_WARNING_S) {
        stateRef.current = 'charging';
        velocity.current = 3;
        store.triggerCameraShake(0.7);
        playRoarSound();
      }
    } else {
      anim.isEating = false;
      anim.runPhase += delta * 13;
      if (warnRef.current) (warnRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      const maxSpeed = d === 1 ? LAVA_REX_CHARGE_SPEED : LAVA_REX_FRONT_SPEED;
      velocity.current = Math.min(maxSpeed, velocity.current + LAVA_REX_CHARGE_ACCEL * delta);
      x.current += d * velocity.current * delta;

      // Head and back carry the dino; the lower tail is a small step down.
      const onLand = () => {
        if (surfed.current) return;
        surfed.current = true;
        const s = useGameStore.getState();
        s.incrementScore(LAVA_REX_SURF_BONUS);
        s.addFloatingText(`SURF! +${LAVA_REX_SURF_BONUS}`, 2, 5.6, 0, '#fde047');
        spawnParticles('sparkle', [2, 4.4, 0], 20, '#fbbf24');
      };
      // Snout is x.current; the body extends behind it (toward -x going right, toward +x going left).
      const bodyEnd = x.current - d * BODY_LEN;
      const tailEnd = x.current - d * REX_LEN;
      setSurface({ id: 'rex-body', x0: Math.min(x.current, bodyEnd), x1: Math.max(x.current, bodyEnd), top: LAVA_REX_BODY_TOP, onLand });
      setSurface({ id: 'rex-tail', x0: Math.min(bodyEnd, tailEnd), x1: Math.max(bodyEnd, tailEnd), top: LAVA_REX_TAIL_TOP, onLand });

      if (Math.random() > 0.5) spawnParticles('dust', [x.current + d * FEET_X, 0.2, (Math.random() - 0.5) * 1.6], 1, '#f97316');

      if ((d === 1 && x.current >= REAR_EXIT_X) || (d === -1 && x.current <= FRONT_EXIT_X)) {
        cooldown.current = LAVA_REX_COOLDOWN_S;
        reset();
        return;
      }
    }

    data.x = x.current;
    data.y = 0;
    if (wrapper) wrapper.position.set(x.current, 0, REX_Z);
    // The hitbox follows the feet; also undoes any despawn nudge applied by a collision handler.
    if (feetRef.current) feetRef.current.position.set(x.current + d * FEET_X, 0, 0);
  });

  return (
    <>
      {/* Foot collision proxy — an invisible box in the player's lane; only this can damage the dino. */}
      <group ref={feetRef} position={[-1000, 0, 0]}>
        <mesh position={[0, 0.75, 0]} geometry={hitboxFootGeo} visible={false}>
          <meshBasicMaterial />
        </mesh>
      </group>

      <group ref={wrapperRef} visible={false}>
        <group position={[MODEL_X, 0, 0]} scale={[SCALE, SCALE, SCALE * WIDTH]}>
          <ClassicDinoModel animState={animState} skinConfig={REX_SKIN} headOffset={HEAD_OFFSET} ignoreHurt />
        </group>
      </group>

      {/* Danger pad on the side the T-Rex will come from (world space, so it never mirrors) */}
      <mesh ref={warnRef} position={[-1.5, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} material={rexWarnMaterial} geometry={warnPadGeo} />
    </>
  );
});

LavaRex.displayName = 'LavaRex';
