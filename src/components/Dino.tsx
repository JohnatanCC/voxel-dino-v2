import { useFrame } from "@react-three/fiber";
import { forwardRef, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";
import { playJumpSound } from "../utils/audio";
import { spawnParticles } from "./VFXRenderer";

const DINO_X = 2;
const GRAVITY = -80;
const JUMP_VELOCITY = 32;
const FAST_FALL_MULTIPLIER = 3;

function DustParticles({ active, speed }: { active: boolean; speed: number }) {
  const group = useRef<THREE.Group>(null);
  const particles = useRef<
    { mesh: THREE.Mesh; life: number; v: THREE.Vector3 }[]
  >([]);

  useFrame((_, delta) => {
    if (active && Math.random() > 0.6) {
      spawnParticles(
        "dust",
        [
          DINO_X - 0.5 + (Math.random() - 0.5) * 0.5,
          0.1,
          (Math.random() - 0.5) * 0.5,
        ],
        1,
        "#d2b48c",
      );
    }
  });

  return <group ref={group} />;
}

export const Dino = forwardRef<THREE.Group>((props, ref) => {
  const { status, gameId, dinoColor, activePowerup } = useGameStore();

  const innerRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const hitboxRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const wingLeftRef = useRef<THREE.Mesh>(null);
  const wingRightRef = useRef<THREE.Mesh>(null);
  const lowerJawRef = useRef<THREE.Mesh>(null);

  const dinoMaterial = useRef(
    new THREE.MeshStandardMaterial({ roughness: 1.0, bumpScale: 0.2 }),
  ).current;

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

  // Combine forwarded ref and local ref
  useEffect(() => {
    if (typeof ref === "function") {
      ref(hitboxRef.current);
    } else if (ref) {
      ref.current = hitboxRef.current;
    }
  }, [ref]);

  useEffect(() => {
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
          // stretch impulse
          springVel.current = 10;
        } else if (state.activePowerup === "wings" && jumpCount.current === 1) {
          // Double jump
          velocity.current = currentJumpVelocity * 0.8; // Weaker double jump
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
      // Stop jumping higher if space released early
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
  }, []);

  const earthDuration = useRef(0);

  const resetDino = () => {
    if (innerRef.current) {
      innerRef.current.position.y = 0;
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
        innerRef.current.scale.set(1, 1, 1);
        innerRef.current.rotation.z = 0;
      }
      if (headRef.current) {
        headRef.current.rotation.z = 0;
      }
    }
  };

  useEffect(() => {
    if (status === "playing" || status === "menu") {
      resetDino();
    }
  }, [gameId]);

  useEffect(() => {
    if (status === "menu") {
      resetDino();
    }
  }, [status]);

   useFrame((state, delta) => {
    const storeState = useGameStore.getState();
    const scenario = storeState.scenario;
    const coldTimer = storeState.coldTimer;
    const p = storeState.activePowerup;

    if (p === 'super') {
       dinoMaterial.emissive.setHSL((state.clock.getElapsedTime() * 2) % 1, 1, 0.5);
       dinoMaterial.emissiveIntensity = 1.0;
       dinoMaterial.color.set('#ffffff');
    } else {
       if (scenario === 'snow') {
          const frostFactor = Math.max(0, 1.0 - (coldTimer / 45));
          const baseColor = new THREE.Color(dinoColor);
          const frostColor = new THREE.Color('#38bdf8');
          baseColor.lerp(frostColor, frostFactor);
          dinoMaterial.color.copy(baseColor);
          
          const iceEmissive = new THREE.Color('#0ea5e9');
          dinoMaterial.emissive.copy(iceEmissive);
          dinoMaterial.emissiveIntensity = frostFactor * 0.8;
       } else {
          dinoMaterial.emissive.set('#000000');
          dinoMaterial.emissiveIntensity = 1.0;
          dinoMaterial.color.set(dinoColor);
       }
    }
    
    const isEating = performance.now() < useGameStore.getState().eatingUntil;
    if (lowerJawRef.current) {
       if (isEating) {
          lowerJawRef.current.rotation.z = -Math.abs(Math.sin(state.clock.getElapsedTime() * 15)) * 0.45;
          if (Math.random() > 0.85) {
             const baseScale = p === 'super' ? 2.5 : 1.0;
             spawnParticles('sparkle', [DINO_X + 1.2 * baseScale, logicalY.current + 2.0 * baseScale, 0], 2, '#ef4444');
          }
       } else {
          lowerJawRef.current.rotation.z = p === 'super' ? -0.4 : 0;
       }
    }
    
    if (wingLeftRef.current && wingRightRef.current) {
       if (p === 'wings') {
          if (!isGrounded.current && velocity.current < 0) {
             wingLeftRef.current.rotation.z = THREE.MathUtils.lerp(wingLeftRef.current.rotation.z, Math.PI / 4, 0.2);
             wingRightRef.current.rotation.z = THREE.MathUtils.lerp(wingRightRef.current.rotation.z, -Math.PI / 4, 0.2);
          } else if (!isGrounded.current && velocity.current > 0) {
             wingLeftRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 30) * 0.8;
             wingRightRef.current.rotation.z = -Math.sin(state.clock.getElapsedTime() * 30) * 0.8;
          } else {
             wingLeftRef.current.rotation.z = 0;
             wingRightRef.current.rotation.z = 0;
          }
       }
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
        if (innerRef.current) {
          innerRef.current.scale.set(1, 1, 1);
          innerRef.current.rotation.z = 0;
        }
        earthCooldown.current = 2; // 2 seconds cooldown
        earthDuration.current = 0;
      }
    }

    // Physics
    if (innerRef.current) {
      const isHeavy = performance.now() < useGameStore.getState().heavyJumpUntil;
      let currentGravity = isHeavy ? GRAVITY * 1.5 : GRAVITY;
      if (useGameStore.getState().activePowerup === "wings" && velocity.current < 0) {
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
          // Squash on land
          springVel.current = -15; // strong downward impulse
          
          // Landing dust
          spawnParticles(
            "dust",
            [DINO_X, 0.1, 0],
            15,
            "#cbd5e1" // better color for general use
          );
          
          // Subtle camera shake on landing
          useGameStore.getState().triggerCameraShake(0.2);
        }
      } else {
        if (isGrounded.current) isGrounded.current = false;
      }

      logicalY.current = newY;
      innerRef.current.position.y = newY;
      
      // Squash & Stretch Spring Physics
      const stiffness = 150;
      const damping = 12;
      
      const currentPowerup = useGameStore.getState().activePowerup;
      const baseScale = currentPowerup === "super" ? 2.5 : 1.0;
      let targetYScale = baseScale;
      let targetXScale = baseScale;

      if (!isGrounded.current) {
         // Stretch based on velocity
         const stretch = Math.abs(velocity.current) * 0.008;
         targetYScale = 1.0 + stretch;
         targetXScale = 1.0 - stretch * 0.4;
      } else if (isCrouching.current && !isUnderground.current) {
         targetYScale = baseScale * 0.5;
         targetXScale = baseScale * 1.3;
      } else if (isUnderground.current) {
         targetYScale = baseScale * 0.2;
         targetXScale = baseScale * 0.2;
      }

      // Spring for Y scale
      const force = stiffness * (targetYScale - currentScale.current.y) - damping * springVel.current;
      springVel.current += force * delta;
      currentScale.current.y += springVel.current * delta;

      // X/Z scale follow smoothly to preserve volume or match target
      currentScale.current.x = THREE.MathUtils.lerp(currentScale.current.x, isGrounded.current && !isCrouching.current ? (baseScale * baseScale) / Math.max(0.1, currentScale.current.y) : targetXScale, 0.2);
      currentScale.current.z = currentScale.current.x;

      innerRef.current.scale.copy(currentScale.current);

      
      // Procedural Body Tilt
      if (status === "playing" || status === "menu") {
        const speed = useGameStore.getState().speed;
        let targetTilt = isGrounded.current && !isCrouching.current ? -useGameStore.getState().getCurrentSpeed() * 0.012 : 0;
        if (currentPowerup === "jaw" && isGrounded.current && !isCrouching.current) targetTilt = -useGameStore.getState().getCurrentSpeed() * 0.025;
        tilt.current = THREE.MathUtils.lerp(tilt.current, targetTilt, 0.1);
        innerRef.current.rotation.z = tilt.current;

        // Step dust based on animation cycle
        if (isGrounded.current && !isCrouching.current && currentPowerup !== "ghost") {
           const cycle = Math.sin(runPhase.current * 0.67);
           if (Math.abs(cycle) > 0.95 && Math.random() > 0.5) {
               spawnParticles("dust", [DINO_X - 0.5 * baseScale, 0.1, (Math.random() - 0.5) * 0.5], 1 * baseScale, "#d2b48c");
           }
        }
        
        // Powerup Continuous VFX
        if (currentPowerup === "wings" && velocity.current < 0 && Math.random() > 0.5) {
           spawnParticles("dust", [DINO_X - 1, newY + 1, (Math.random() - 0.5)], 1, "#ffffff");
        }
        if (currentPowerup === "ghost" && Math.random() > 0.3) {
           spawnParticles("sparkle", [DINO_X, newY + 1 + (Math.random()-0.5), (Math.random()-0.5)], 1, "#a855f7");
        }
        if (isUnderground.current && Math.random() > 0.5) {
           spawnParticles("dust", [DINO_X, 0.1, (Math.random()-0.5)], 2, "#78350f");
        }

        // Head dynamic look

         if (headRef.current && !isUnderground.current) {
            let targetHeadRot = 0;
            if (!isGrounded.current) {
               targetHeadRot = Math.max(-0.5, Math.min(0.5, velocity.current * 0.015)); 
            }
            let chewOffset = 0;
            if (isEating) {
               chewOffset = Math.sin(state.clock.getElapsedTime() * 15) * 0.08;
            }
            headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, targetHeadRot + chewOffset, 0.15);
         }
      }

      velocity.current = newVel;



      // Run animation
      if (status === "playing" || status === "menu") {
        const runSpeed = useGameStore.getState().getCurrentSpeed() * 0.75; // Increased for snappier leg motion
        runPhase.current += runSpeed * delta;
        const phase = runPhase.current;
        let visualY = newY;

        if (isGrounded.current) {
          if (leftLegRef.current && rightLegRef.current) {
            if (currentPowerup === "ghost") {
               leftLegRef.current.rotation.z = -0.2;
               rightLegRef.current.rotation.z = 0.2;
               leftLegRef.current.position.y = 0.7;
               rightLegRef.current.position.y = 0.7;
               visualY += 0.5 + Math.sin(phase * 1.5) * 0.2; // Float
            } else {
               // Advanced procedural running cycle using phase
               const leftCycle = Math.sin(phase);
               const rightCycle = Math.sin(phase + Math.PI);
               
               // Legs rotate back and forth
               leftLegRef.current.rotation.z = leftCycle * 0.9 + Math.cos(phase) * 0.2;
               rightLegRef.current.rotation.z = rightCycle * 0.9 + Math.cos(phase + Math.PI) * 0.2;
               
               // Dynamic leg lifting (bending at knee equivalent)
               leftLegRef.current.position.y = 0.7 + Math.max(0, -leftCycle) * 0.4;
               rightLegRef.current.position.y = 0.7 + Math.max(0, -rightCycle) * 0.4;
               
               // Dynamic bouncing body
               visualY += Math.abs(Math.sin(phase)) * 0.22 * baseScale;
            }
          }

          if (leftArmRef.current && rightArmRef.current) {
            if (currentPowerup === "ghost") {
               leftArmRef.current.rotation.z = 0;
               rightArmRef.current.rotation.z = 0;
            } else {
               // Arm swings (opposite to legs)
               leftArmRef.current.rotation.z = Math.sin(phase + Math.PI) * 0.6;
               leftArmRef.current.rotation.y = Math.sin(phase + Math.PI) * 0.2;
               
               rightArmRef.current.rotation.z = Math.sin(phase) * 0.6;
               rightArmRef.current.rotation.y = Math.sin(phase) * 0.2;
            }
          }
        } else {
          // Jump / Fall pose
          if (leftLegRef.current && rightLegRef.current) {
            if (currentPowerup === "ghost") {
               leftLegRef.current.rotation.z = -0.2;
               rightLegRef.current.rotation.z = 0.2;
               visualY += 0.5;
            } else {
               const isFalling = velocity.current < 0;
               // Lerp towards jump/fall pose for fluidity
               leftLegRef.current.rotation.z = THREE.MathUtils.lerp(
                 leftLegRef.current.rotation.z,
                 isFalling ? 0.3 : -0.7,
                 0.2,
               );
               rightLegRef.current.rotation.z = THREE.MathUtils.lerp(
                 rightLegRef.current.rotation.z,
                 isFalling ? 0.7 : 0.4,
                 0.2,
               );
               
               // Legs extend when jumping, tuck slightly when falling
               leftLegRef.current.position.y = THREE.MathUtils.lerp(leftLegRef.current.position.y, 0.7, 0.2);
               rightLegRef.current.position.y = THREE.MathUtils.lerp(rightLegRef.current.position.y, 0.7, 0.2);
            }
          }
          if (leftArmRef.current && rightArmRef.current) {
            leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
              leftArmRef.current.rotation.z,
              -0.8,
              0.2,
            );
            rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
              rightArmRef.current.rotation.z,
              -0.8,
              0.2,
            );
          }
        }

        // Crouch pose adjustments
        if (isUnderground.current) {
          visualY = -2; // Underground
          if (headRef.current) {
            headRef.current.position.y = 0;
            headRef.current.position.x = 0.5;
            headRef.current.rotation.z = 0;
          }
        } else if (isCrouching.current) {
          if (headRef.current) {
            headRef.current.position.y = -0.5;
            headRef.current.position.x = 1.0;
            headRef.current.rotation.z = 0.2;
          }
          visualY = newY > 0 ? newY : visualY - 0.5; // lower body slightly if on ground
        } else {
          if (headRef.current) {
            headRef.current.position.y = 0;
            headRef.current.position.x = 0.5;
            if (isGrounded.current && currentPowerup !== "ghost") {
               headRef.current.rotation.z = Math.sin(phase) * 0.1 - 0.05;
               headRef.current.position.x = 0.5 + Math.sin(phase) * 0.05;
            } else if (velocity.current < 0) {
               headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.2, 0.1);
            }
          }
        }

        innerRef.current.position.y = visualY;

        // Apply scale for Super T-Rex with a fun elastic bounce
        const targetScale = currentPowerup === "super" ? 2.1 : 0.7; // 3x scale of original (0.7 * 3)
        innerRef.current.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          0.15,
        );
      } else if (status === "gameover") {
        // Dead pose
        if (headRef.current) {
          headRef.current.rotation.z = -0.5;
        }
      }

      // Handle blinking when invincible
      const { invincibleUntil } = useGameStore.getState();
      const now = performance.now();
      if (now < invincibleUntil) {
        const isWhite = Math.floor(now / 150) % 2 === 0;
        dinoMaterial.color.set(
          isWhite ? "#ffffff" : useGameStore.getState().dinoColor,
        );
        dinoMaterial.emissive.set(isWhite ? "#ffffff" : "#000000");
        dinoMaterial.emissiveIntensity = isWhite ? 0.5 : 0;
      } else {
        dinoMaterial.color.set(useGameStore.getState().dinoColor);
        dinoMaterial.emissive.set("#000000");
        dinoMaterial.emissiveIntensity = 0;
      }

      // Dynamic Hitbox adjustments (standing vs crouching)
      if (hitboxRef.current) {
        if (isCrouching.current || isUnderground.current) {
          hitboxRef.current.scale.set(1, 0.7, 1);
          hitboxRef.current.position.set(-0.1, 0.7, 0);
        } else {
          hitboxRef.current.scale.set(1, 1.7, 1);
          hitboxRef.current.position.set(-0.1, 1.35, 0);
        }
      }
    }
  });

  const isGhost = activePowerup === "ghost";
  useEffect(() => {
    dinoMaterial.transparent = isGhost;
    dinoMaterial.opacity = isGhost ? 0.4 : 1.0;
  }, [isGhost, dinoMaterial]);

  return (
    <group>
      <DustParticles
        active={status === "playing" && isGrounded.current}
        speed={useGameStore.getState().speed}
      />
      <group ref={innerRef} position={[DINO_X, 0, 0]} scale={0.7}>
        {/* Hitbox */}
        <group ref={hitboxRef} position={[-0.1, 1.2, 0]}>
           <mesh visible={false}>
             <boxGeometry args={[1.2, 1.2, 0.8]} />
           </mesh>
        </group>

        {/* Main Body */}
        <mesh
          position={[-0.1, 1.2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.2, 1.0, 0.8]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Texture Details (Spots) */}
        <mesh position={[0.2, 1.6, 0.41]} castShadow={!isGhost}>
          <boxGeometry args={[0.2, 0.2, 0.05]} />
          <meshStandardMaterial
            color="#3f3f46"
            roughness={1.0}
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>
        <mesh position={[-0.3, 1.4, 0.41]} castShadow={!isGhost}>
          <boxGeometry args={[0.3, 0.2, 0.05]} />
          <meshStandardMaterial
            color="#3f3f46"
            roughness={1.0}
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>
        <mesh position={[0, 0.9, 0.41]} castShadow={!isGhost}>
          <boxGeometry args={[0.25, 0.15, 0.05]} />
          <meshStandardMaterial
            color="#3f3f46"
            roughness={1.0}
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>
        <mesh position={[0.2, 1.6, -0.41]} castShadow={!isGhost}>
          <boxGeometry args={[0.2, 0.2, 0.05]} />
          <meshStandardMaterial
            color="#3f3f46"
            roughness={1.0}
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>
        <mesh position={[-0.3, 1.4, -0.41]} castShadow={!isGhost}>
          <boxGeometry args={[0.3, 0.2, 0.05]} />
          <meshStandardMaterial
            color="#3f3f46"
            roughness={1.0}
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>
        <mesh position={[0, 0.9, -0.41]} castShadow={!isGhost}>
          <boxGeometry args={[0.25, 0.15, 0.05]} />
          <meshStandardMaterial
            color="#3f3f46"
            roughness={1.0}
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>

        {/* Spikes */}
        <mesh
          position={[-0.1, 1.9, 0]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial
            color="#333"
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>
        <mesh
          position={[-0.6, 1.8, 0]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial
            color="#333"
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>
        <mesh
          position={[-1.0, 1.5, 0]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.3, 0.3, 0.2]} />
          <meshStandardMaterial
            color="#333"
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>

        {/* Tail */}
        <mesh
          position={[-1.0, 1.0, 0]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>
        <mesh
          position={[-1.5, 0.8, 0]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.6, 0.4, 0.4]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Collar */}
        <mesh
          position={[0.4, 1.8, 0]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
          rotation={[0, 0, 0.2]}
        >
          <boxGeometry args={[0.6, 0.2, 0.9]} />
          <meshStandardMaterial
            color="#0ea5e9"
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>
        {/* Tag */}
        <mesh
          position={[0.7, 1.6, 0]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
          rotation={[0, 0, 0.2]}
        >
          <boxGeometry args={[0.1, 0.3, 0.3]} />
          <meshStandardMaterial
            color="#fbbf24"
            transparent={isGhost}
            opacity={isGhost ? 0.4 : 1.0}
          />
        </mesh>

        {/* Head Group */}
        <group ref={headRef} position={[0.5, 0, 0]}>
          {/* Main Head */}
          <mesh
            position={[0.4, 2.2, 0]}
            castShadow={!isGhost}
            receiveShadow={!isGhost}
          >
            <boxGeometry args={[1.2, 1.1, 1.1]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>

          {/* Snout / Upper Jaw */}
          <mesh
            position={[1.1, 2.1, 0]}
            castShadow={!isGhost}
            receiveShadow={!isGhost}
          >
            <boxGeometry args={[0.6, 0.7, 0.9]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>

          {/* Teeth (Upper Jaw) */}
          <mesh position={[1.2, 1.7, 0.4]} castShadow={!isGhost}>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[1.3, 1.7, 0.2]} castShadow={!isGhost}>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[1.3, 1.7, -0.2]} castShadow={!isGhost}>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[1.2, 1.7, -0.4]} castShadow={!isGhost}>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="white" />
          </mesh>

          {/* Lower Jaw (slightly smaller) */}
          <mesh
            ref={lowerJawRef}
            position={[1.0, 1.75, 0]}
            castShadow={!isGhost}
            receiveShadow={!isGhost}
          >
            <boxGeometry args={[0.5, 0.3, 0.8]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>

          {/* Horns */}
          <mesh
            position={[0.1, 2.8, 0.35]}
            castShadow={!isGhost}
            receiveShadow={!isGhost}
            rotation={[0, 0, -0.3]}
          >
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial
              color="#333"
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          <mesh
            position={[0.1, 2.8, -0.35]}
            castShadow={!isGhost}
            receiveShadow={!isGhost}
            rotation={[0, 0, -0.3]}
          >
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial
              color="#333"
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>

          {/* Strong Jaw Powerup Visual */}
          {useGameStore.getState().activePowerup === "jaw" && (
            <group position={[1.4, 2.0, 0]}>
              <mesh position={[0, 0, 0.3]} rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[0.4, 0.4, 0.15]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 0, -0.3]} rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[0.4, 0.4, 0.15]} />
                <meshStandardMaterial color="white" />
              </mesh>
            </group>
          )}

          {/* Eye */}
          <mesh position={[0.6, 2.4, 0.56]}>
            <boxGeometry args={[0.2, 0.25, 0.05]} />
            <meshBasicMaterial
              color={useGameStore.getState().activePowerup === 'jaw' || useGameStore.getState().activePowerup === 'super' ? '#ef4444' : '#fef08a'}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          {/* Pupil */}
          <mesh position={[0.65, 2.4, 0.57]}>
            <boxGeometry args={[0.1, 0.15, 0.05]} />
            <meshBasicMaterial
              color="black"
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>

          <mesh position={[0.6, 2.4, -0.56]}>
            <boxGeometry args={[0.2, 0.25, 0.05]} />
            <meshBasicMaterial
              color={useGameStore.getState().activePowerup === 'jaw' || useGameStore.getState().activePowerup === 'super' ? '#ef4444' : '#fef08a'}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          <mesh position={[0.65, 2.4, -0.57]}>
            <boxGeometry args={[0.1, 0.15, 0.05]} />
            <meshBasicMaterial
              color="black"
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
        </group>

        {/* Wings Powerup Visual */}
        {useGameStore.getState().activePowerup === "wings" && (
          <group position={[-0.2, 1.5, 0]}>
            <mesh
              ref={wingLeftRef}
              position={[0, 0, 0.6]}
              rotation={[0, Math.PI / 4, 0]}
              castShadow
            >
              <boxGeometry args={[0.6, 0.1, 0.4]} />
              <meshStandardMaterial color="white" />
            </mesh>
            <mesh
              ref={wingRightRef}
              position={[0, 0, -0.6]}
              rotation={[0, -Math.PI / 4, 0]}
              castShadow
            >
              <boxGeometry args={[0.6, 0.1, 0.4]} />
              <meshStandardMaterial color="white" />
            </mesh>
          </group>
        )}

        {/* Arms */}
        <mesh
          ref={leftArmRef}
          position={[0.6, 1.2, 0.56]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.3, 0.2, 0.2]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.2, 0, 0.05]}>
            <boxGeometry args={[0.1, 0.05, 0.05]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.2, 0, -0.05]}>
            <boxGeometry args={[0.1, 0.05, 0.05]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </mesh>
        <mesh
          ref={rightArmRef}
          position={[0.6, 1.2, -0.56]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.3, 0.2, 0.2]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.2, 0, 0.05]}>
            <boxGeometry args={[0.1, 0.05, 0.05]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.2, 0, -0.05]}>
            <boxGeometry args={[0.1, 0.05, 0.05]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </mesh>

        {/* Legs */}
        <mesh
          ref={leftLegRef}
          position={[-0.2, 0.7, 0.35]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.5, 0.7, 0.4]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.15, -0.3, 0]}>
            <boxGeometry args={[0.6, 0.3, 0.45]} />
            <primitive object={dinoMaterial} attach="material" />
            {/* Claws */}
            <mesh position={[0.35, -0.1, 0.15]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.35, -0.1, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.35, -0.1, -0.15]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </mesh>
        </mesh>
        <mesh
          ref={rightLegRef}
          position={[0.2, 0.7, -0.35]}
          castShadow={!isGhost}
          receiveShadow={!isGhost}
        >
          <boxGeometry args={[0.5, 0.7, 0.4]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.15, -0.3, 0]}>
            <boxGeometry args={[0.6, 0.3, 0.45]} />
            <primitive object={dinoMaterial} attach="material" />
            {/* Claws */}
            <mesh position={[0.35, -0.1, 0.15]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.35, -0.1, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.35, -0.1, -0.15]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </mesh>
        </mesh>
      </group>
    </group>
  );
});
