import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playJumpSound } from '../../utils/audio';
import { spawnParticles } from '../../components/VFXRenderer';
import { DinoAnimationState } from './types';

const DINO_X = 2;
const GRAVITY = -80;
const JUMP_VELOCITY = 32;
const FAST_FALL_MULTIPLIER = 3;

export function useDinoPhysics(previewMode = false) {
  const innerRef = useRef<THREE.Group>(null);
  const hitboxRef = useRef<THREE.Group>(null);

  const velocity = useRef(0);
  const isGrounded = useRef(true);
  const isCrouching = useRef(false);
  const logicalY = useRef(0);
  const jumpCount = useRef(0);
  const springVel = useRef(0);
  const currentScale = useRef(new THREE.Vector3(1, 1, 1));
  const tilt = useRef(0);
  const earthCooldown = useRef(0);
  const isUnderground = useRef(false);
  const runPhase = useRef(0);
  const earthDuration = useRef(0);

  const animState = useRef<DinoAnimationState>({
    runPhase: 0,
    velocity: 0,
    isGrounded: true,
    isCrouching: false,
    isUnderground: false,
    isEating: false,
    activePowerup: 'none',
    status: 'menu',
    speed: 9,
    isGhost: false,
    baseScale: 1.0,
  });

  const resetDino = () => {
    logicalY.current = 0;
    velocity.current = 0;
    isGrounded.current = true;
    isCrouching.current = false;
    jumpCount.current = 0;
    earthCooldown.current = 0;
    earthDuration.current = 0;
    isUnderground.current = false;
    springVel.current = 0;
    currentScale.current.set(1, 1, 1);
    tilt.current = 0;
    runPhase.current = 0;

    if (innerRef.current) {
      innerRef.current.position.set(previewMode ? 0 : DINO_X, previewMode ? -0.6 : 0, 0);
      innerRef.current.scale.set(previewMode ? 0.65 : 0.85, previewMode ? 0.65 : 0.85, previewMode ? 0.65 : 0.85);
      innerRef.current.rotation.set(0, 0, 0);
    }

    if (hitboxRef.current) {
      hitboxRef.current.scale.set(1, 1.0, 1);
      hitboxRef.current.position.set(previewMode ? 0 : DINO_X - 0.1, 1.35, 0);
    }
  };

  const status = useGameStore(s => s.status);
  const gameId = useGameStore(s => s.gameId);

  // Reset when status or gameId change
  useEffect(() => {
    if (previewMode) return;
    resetDino();
  }, [gameId, status, previewMode]);

  // Handle inputs
  useEffect(() => {
    if (previewMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (state.status !== "playing") return;

      const isHeavy = performance.now() < state.heavyJumpUntil;
      const isWeak = performance.now() < state.weakJumpUntil;
      let currentJumpVelocity = JUMP_VELOCITY;
      if (isHeavy) currentJumpVelocity *= 0.7;
      if (isWeak) currentJumpVelocity *= 0.5;

      if (e.key === "ArrowUp" || e.key === "w" || e.code === "Space") {
        if (isGrounded.current) {
          velocity.current = currentJumpVelocity;
          isGrounded.current = false;
          jumpCount.current = 1;
          playJumpSound();
          spawnParticles("dust", [DINO_X, 0.1, 0], 10, "#cbd5e1");
          springVel.current = 10; // stretch impulse
        } else if (state.activePowerup === "wings" && jumpCount.current === 1) {
          // Double jump
          velocity.current = currentJumpVelocity * 0.8;
          jumpCount.current = 2;
          playJumpSound();
        }
      }
      if (e.key === "ArrowDown" || e.key === "s") {
        isCrouching.current = true;
        if (state.activePowerup === "earth" && earthCooldown.current <= 0) {
          if (!isUnderground.current) {
            useGameStore.getState().triggerCameraShake(0.8);
            spawnParticles("explosion", [DINO_X, 0, 0], 30, "#a8a29e");
          }
          isUnderground.current = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s") {
        isCrouching.current = false;
      }
      if (
        (e.key === "ArrowUp" || e.key === "w" || e.code === "Space") &&
        velocity.current > 0
      ) {
        velocity.current *= 0.5;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [previewMode]);

  useFrame((state, delta) => {
    const storeState = useGameStore.getState();
    const gameStatus = storeState.status;
    const currentPowerup = previewMode ? "none" : storeState.activePowerup;
    const speed = storeState.speed;
    const isEating = !previewMode && performance.now() < storeState.eatingUntil;
    const isGhost = currentPowerup === "ghost";

    if (previewMode) {
      if (innerRef.current) {
        innerRef.current.rotation.y = state.clock.getElapsedTime() * 0.8;
        innerRef.current.position.set(0, -0.6, 0);
        innerRef.current.scale.set(0.65, 0.65, 0.65);
      }

      // Update animation state for preview Mode
      animState.current = {
        runPhase: 0,
        velocity: 0,
        isGrounded: true,
        isCrouching: false,
        isUnderground: false,
        isEating: false,
        activePowerup: 'none',
        status: gameStatus,
        speed: 0,
        isGhost: false,
        baseScale: 1.0,
      };
      return;
    }

    if (earthCooldown.current > 0) earthCooldown.current -= delta;

    if (isUnderground.current) {
      earthDuration.current += delta;
      if (earthDuration.current > 2 || !isCrouching.current) {
        if (isUnderground.current) {
          velocity.current = JUMP_VELOCITY * 0.8;
          isGrounded.current = false;
          spawnParticles("explosion", [DINO_X, 0, 0], 20, "#78350f");
          useGameStore.getState().triggerCameraShake(0.4);
        }
        isUnderground.current = false;
        springVel.current = 0;
        currentScale.current.set(1, 1, 1);
        tilt.current = 0;
        earthCooldown.current = 2; // cooldown
        earthDuration.current = 0;
      }
    }

    // Physics
    if (innerRef.current) {
      const isHeavy = performance.now() < storeState.heavyJumpUntil;
      let currentGravity = isHeavy ? GRAVITY * 1.5 : GRAVITY;
      if (currentPowerup === "wings" && velocity.current < 0) {
        currentGravity *= 0.5; // Glide
      }
      let newVel =
        velocity.current +
        currentGravity *
        delta *
        (isCrouching.current && !isGrounded.current
          ? FAST_FALL_MULTIPLIER
          : 1);
      let newY = logicalY.current + newVel * delta;

      if (newY <= 0) {
        newY = 0;
        newVel = 0;
        if (!isGrounded.current) {
          isGrounded.current = true;
          jumpCount.current = 0;
          springVel.current = -15; // squash landing impulse
          spawnParticles("dust", [DINO_X, 0.1, 0], 15, "#cbd5e1");
          useGameStore.getState().triggerCameraShake(0.2);
        }
      } else {
        if (isGrounded.current) isGrounded.current = false;
      }

      logicalY.current = newY;

      // Squash & Stretch Spring Physics
      const stiffness = 150;
      const damping = 12;
      const baseScale = currentPowerup === "super" ? 2.5 : 1.0;
      let targetYScale = baseScale;
      let targetXScale = baseScale;

      if (!isGrounded.current) {
        const stretch = Math.abs(velocity.current) * 0.008;
        targetYScale = 1.0 + stretch;
        targetXScale = 1.0 - stretch * 0.4;
      } else if (isCrouching.current && !isUnderground.current) {
        targetYScale = baseScale * 0.7; // Taller crouch (70% instead of 50%) for better visual balance
        targetXScale = baseScale * 1.15; // Shorter width extension (15% instead of 30%)
      } else if (isUnderground.current) {
        targetYScale = baseScale * 0.2;
        targetXScale = baseScale * 0.2;
      }

      const force = stiffness * (targetYScale - currentScale.current.y) - damping * springVel.current;
      springVel.current += force * delta;
      currentScale.current.y += springVel.current * delta;

      currentScale.current.x = THREE.MathUtils.lerp(
        currentScale.current.x,
        isGrounded.current && !isCrouching.current ? (baseScale * baseScale) / Math.max(0.1, currentScale.current.y) : targetXScale,
        0.2
      );
      currentScale.current.z = currentScale.current.x;

      // Apply physics position and squash scale to main container group
      let visualY = newY;
      const runSpeed = storeState.getCurrentSpeed() * 0.75;

      if (gameStatus === "playing" || gameStatus === "menu" || gameStatus === "gameover") {
        runPhase.current += runSpeed * delta;

        if (isGrounded.current) {
          if (currentPowerup === "ghost") {
            visualY += 0.5 + Math.sin(runPhase.current * 1.5) * 0.2; // Float
          } else {
            visualY += Math.abs(Math.sin(runPhase.current)) * 0.22 * baseScale; // Bounce
          }
        } else {
          if (currentPowerup === "ghost") {
            visualY += 0.5;
          }
        }

        if (isUnderground.current) {
          visualY = -2;
        } else if (isCrouching.current) {
          visualY = newY > 0 ? newY : visualY - 0.3; // Sinks less into the ground (0.3 instead of 0.5)
        }

        // Apply X and Y position to innerRef
        innerRef.current.position.set(previewMode ? 0 : DINO_X, visualY, 0);

        // Apply scale for Super T-Rex / normal T-Rex size lerping
        const scaleMultiplier = currentPowerup === "super" ? 2.1 : 0.85;
        const targetWorldScale = new THREE.Vector3(scaleMultiplier, scaleMultiplier, scaleMultiplier).multiply(currentScale.current);
        innerRef.current.scale.copy(targetWorldScale);

        // Tilt body
        let targetTilt = isGrounded.current && !isCrouching.current ? -storeState.getCurrentSpeed() * 0.012 : 0;
        if (currentPowerup === "jaw" && isGrounded.current && !isCrouching.current) {
          targetTilt = -storeState.getCurrentSpeed() * 0.025;
        }
        tilt.current = THREE.MathUtils.lerp(tilt.current, targetTilt, 0.1);
        innerRef.current.rotation.z = tilt.current;

        // Particle VFX spawning
        if (isGrounded.current && !isCrouching.current && currentPowerup !== "ghost") {
          const cycle = Math.sin(runPhase.current * 0.67);
          if (Math.abs(cycle) > 0.95 && Math.random() > 0.5) {
            spawnParticles("dust", [DINO_X - 0.5 * baseScale, 0.1, (Math.random() - 0.5) * 0.5], 1 * baseScale, "#d2b48c");
          }
        }
        if (currentPowerup === "wings" && velocity.current < 0 && Math.random() > 0.5) {
          spawnParticles("dust", [DINO_X - 1, visualY + 1, (Math.random() - 0.5)], 1, "#ffffff");
        }
        if (currentPowerup === "ghost" && Math.random() > 0.3) {
          spawnParticles("sparkle", [DINO_X, visualY + 1 + (Math.random() - 0.5), (Math.random() - 0.5)], 1, "#a855f7");
        }
        if (isUnderground.current && Math.random() > 0.5) {
          spawnParticles("dust", [DINO_X, 0.1, (Math.random() - 0.5)], 2, "#78350f");
        }
      }

      velocity.current = newVel;

      // Adjust hitbox scale (adapted to the new base geometry height of 2.0)
      // Since hitboxRef is now outside of innerRef, its coordinates are absolute relative to the Dino origin.
      if (hitboxRef.current) {
        const hitboxX = previewMode ? 0 : DINO_X - 0.1;
        if (isUnderground.current) {
          hitboxRef.current.scale.set(1, 0.42, 1);
          hitboxRef.current.position.set(hitboxX, -2, 0);
        } else if (isCrouching.current) {
          // Standing height is 2.0. Scale of 0.6 makes it 1.2 height.
          // Center at newY + 0.6. Bottom is at newY (exact ground level).
          hitboxRef.current.scale.set(1, 0.6, 1);
          hitboxRef.current.position.set(hitboxX, newY + 0.6, 0);
        } else {
          // Standing height is 2.0. Scale of 1.2 makes it 2.4 height (matches new 0.85 scale visual size).
          // Center at newY + 1.35. Bottom is at newY + 0.15 (exactly above ground).
          hitboxRef.current.scale.set(1, 1.2, 1);
          hitboxRef.current.position.set(hitboxX, newY + 1.35, 0);
        }
      }

      // Update shared state reference for child components
      animState.current = {
        runPhase: runPhase.current,
        velocity: velocity.current,
        isGrounded: isGrounded.current,
        isCrouching: isCrouching.current,
        isUnderground: isUnderground.current,
        isEating,
        activePowerup: currentPowerup,
        status: gameStatus,
        speed,
        isGhost,
        baseScale,
      };
    }
  });

  return {
    innerRef,
    hitboxRef,
    animState,
    resetDino,
  };
}
