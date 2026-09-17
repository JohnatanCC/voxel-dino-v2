import { useRef, useEffect, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DinoAnimationState } from './types';
import { useGameStore } from '../../store/gameStore';
import { GRAVITY, JUMP_VELOCITY, TEST_ROOM_LANE_OFFSETS, TEST_ROOM_LANE_SWITCH_RATE } from '../../config/balance';
import { spawnParticles } from '../../components/VFXRenderer';
import { playJumpSound } from '../../utils/audio';

const FORWARD_X = 2;
const CENTER_LANE = 1;

// 3-lane runner prototype: the dino sits at a fixed forward X (the world
// scrolls under it, same convention as the main runner's DINO_X) and only
// slides sideways between lane Z offsets. Vertical physics (gravity/jump)
// mirrors useDinoPhysics.ts but stays independent — this is a separate
// sandbox mode, not a modification of the main runner.
export function useTestRoomLanePhysics(groupRef: RefObject<THREE.Group | null>) {
  const laneIndex = useRef(CENTER_LANE);
  const visualZ = useRef(TEST_ROOM_LANE_OFFSETS[CENTER_LANE]);
  const velocityY = useRef(0);
  const logicalY = useRef(0);
  const isGrounded = useRef(true);
  const runPhase = useRef(0);

  const animState = useRef<DinoAnimationState>({
    runPhase: 0,
    velocity: 0,
    isGrounded: true,
    isCrouching: false,
    isUnderground: false,
    isEating: false,
    activePowerup: 'none',
    status: 'playing',
    speed: 0,
    isGhost: false,
    baseScale: 1.0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key) {
        case 'a': case 'A': case 'ArrowLeft':
          laneIndex.current = Math.max(0, laneIndex.current - 1);
          break;
        case 'd': case 'D': case 'ArrowRight':
          laneIndex.current = Math.min(TEST_ROOM_LANE_OFFSETS.length - 1, laneIndex.current + 1);
          break;
        case ' ': case 'w': case 'W': case 'ArrowUp':
          if (isGrounded.current) {
            velocityY.current = JUMP_VELOCITY;
            isGrounded.current = false;
            playJumpSound();
            spawnParticles('dust', [FORWARD_X, 0.1, visualZ.current], 10, '#cbd5e1');
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useFrame((_state, delta) => {
    const targetZ = TEST_ROOM_LANE_OFFSETS[laneIndex.current];
    const laneT = 1 - Math.exp(-TEST_ROOM_LANE_SWITCH_RATE * delta);
    visualZ.current = THREE.MathUtils.lerp(visualZ.current, targetZ, laneT);

    let newVelY = velocityY.current + GRAVITY * delta;
    let newY = logicalY.current + newVelY * delta;
    if (newY <= 0) {
      newY = 0;
      newVelY = 0;
      if (!isGrounded.current) {
        isGrounded.current = true;
        spawnParticles('dust', [FORWARD_X, 0.1, visualZ.current], 15, '#cbd5e1');
      }
    } else {
      isGrounded.current = false;
    }
    logicalY.current = newY;
    velocityY.current = newVelY;

    // Reuses the store's own speed/getCurrentSpeed so the run-cycle rate matches
    // how fast the (already-scrolling) Ground components are moving underneath.
    const speed = useGameStore.getState().getCurrentSpeed();
    runPhase.current += speed * 0.75 * delta;

    if (groupRef.current) {
      groupRef.current.position.set(FORWARD_X, logicalY.current, visualZ.current);
    }

    animState.current = {
      runPhase: runPhase.current,
      velocity: velocityY.current,
      isGrounded: isGrounded.current,
      isCrouching: false,
      isUnderground: false,
      isEating: false,
      activePowerup: 'none',
      status: 'playing',
      speed,
      isGhost: false,
      baseScale: 1.0,
    };
  });

  return { animState };
}
