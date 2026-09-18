import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SkinConfig } from '../../../store/gameStore';
import { createVoxelTexture } from '../../../utils/texture';
import { DinoModelProps } from '../types';
import { spawnParticles } from '../../../components/VFXRenderer';
import { Wings } from '../shared/Wings';
import { useWingFlap } from '../shared/useWingFlap';
import { useGhostFade } from '../shared/useGhostFade';

interface CarinhosoDinoProps extends DinoModelProps {
  skinConfig: SkinConfig;
}

// Care Bear-inspired pink accent glow, replacing the Kitsune's cyan fox-fire everywhere.
const GLOW = '#f472b6';
const RAINBOW_STRIPES = ['#ef4444', '#f97316', '#facc15', '#4ade80', '#38bdf8'];

export function CarinhosoDinoModel({ animState, previewMode = false, skinConfig }: CarinhosoDinoProps) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const wingLeftRef = useRef<THREE.Group>(null);
  const wingRightRef = useRef<THREE.Group>(null);
  const lowerJawRef = useRef<THREE.Mesh>(null);
  const parentGroupRef = useRef<THREE.Group>(null);

  // Single tail ref (Kitsune has 9/3 tails — Carinhoso keeps just one)
  const tailRefs = useRef<(THREE.Group | null)[]>([]);

  // 3 orbiting orbs, now pink instead of fox-fire cyan
  const orb1Ref = useRef<THREE.Group>(null);
  const orb2Ref = useRef<THREE.Group>(null);
  const orb3Ref = useRef<THREE.Group>(null);

  // Eye blinking spring physics refs
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);
  const eyeScaleY = useRef<number>(1.0);
  const eyeSpringVel = useRef<number>(0);

  // Squash & Stretch spring physics refs
  const wasGrounded = useRef<boolean>(true);
  const landingBounce = useRef<number>(0);
  const landingBounceVel = useRef<number>(0);

  // Temp vector for world position calculations
  const tempPos = useMemo(() => new THREE.Vector3(), []);

  // Single center tail (Kitsune's 3-tail fan reduced to one)
  const tailsConfig = useMemo(() => [{ ry: 0, rz: 0.25 }], []);

  // Generate procedural textures
  const carinhosoTexture = useMemo(() => createVoxelTexture(skinConfig.baseColor, skinConfig.spotsColor, 'kitsune'), [skinConfig.baseColor, skinConfig.spotsColor]);
  const spikesTexture = useMemo(() => createVoxelTexture(skinConfig.spikesColor, skinConfig.spikesColor, 'plain'), [skinConfig.spikesColor]);
  const collarTexture = useMemo(() => createVoxelTexture(skinConfig.collarColor, skinConfig.collarColor, 'plain'), [skinConfig.collarColor]);

  // Create materials
  const dinoMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: carinhosoTexture,
    roughness: 0.9,
  }), [carinhosoTexture]);

  const spikesMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: spikesTexture,
    roughness: 0.9,
  }), [spikesTexture]);

  const collarMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: collarTexture,
    roughness: 0.9,
  }), [collarTexture]);

  useGhostFade(animState, [dinoMaterial, spikesMaterial, collarMaterial]);
  useWingFlap(animState, wingLeftRef, wingRightRef);

  useFrame((state, delta) => {
    const current = animState.current;
    const p = current.activePowerup;
    const isGhost = current.isGhost;
    const phase = current.runPhase;
    const isGrounded = current.isGrounded;
    const isCrouching = current.isCrouching;
    const isUnderground = current.isUnderground;
    const isEating = current.isEating;
    const status = current.status;
    const time = state.clock.getElapsedTime();

    // 1. Frost overlay & Emissive powerup lighting
    if (p === 'super') {
      dinoMaterial.emissive.setHSL((time * 2) % 1, 1, 0.5);
      dinoMaterial.emissiveIntensity = 1.0;
    } else {
      const storeState = useGameStore.getState();
      const scenario = storeState.scenario;
      const coldTimer = storeState.coldTimer;
      if (scenario === 'snow' && !previewMode) {
        const frostFactor = Math.max(0, 1.0 - (coldTimer / 45));
        const baseColor = new THREE.Color(skinConfig.baseColor);
        const frostColor = new THREE.Color('#38bdf8');
        baseColor.lerp(frostColor, frostFactor);
        dinoMaterial.color.copy(baseColor);

        const iceEmissive = new THREE.Color('#0ea5e9');
        dinoMaterial.emissive.copy(iceEmissive);
        dinoMaterial.emissiveIntensity = frostFactor * 0.8;
      } else {
        dinoMaterial.emissive.set('#000000');
        dinoMaterial.emissiveIntensity = 0;
        dinoMaterial.color.set(skinConfig.baseColor);
      }
    }

    // 2. Invincibility Blink visual
    const storeState = useGameStore.getState();
    const now = performance.now();
    const isInvincible = now < storeState.invincibleUntil;
    if (isInvincible) {
      const isWhite = Math.floor(now / 150) % 2 === 0;
      dinoMaterial.color.set(isWhite ? "#ffffff" : skinConfig.baseColor);
      dinoMaterial.emissive.set(isWhite ? "#ffffff" : "#000000");
      dinoMaterial.emissiveIntensity = isWhite ? 0.5 : 0;
    }

    // 3. Update landing spring physics
    if (isGrounded && !wasGrounded.current) {
      landingBounceVel.current = -5.0;
    } else if (!isGrounded && wasGrounded.current) {
      landingBounceVel.current = 4.0;
    }
    wasGrounded.current = isGrounded;

    const springK = 220;
    const springD = 12;
    const force = springK * (0 - landingBounce.current) - springD * landingBounceVel.current;
    landingBounceVel.current += force * delta;
    landingBounce.current += landingBounceVel.current * delta;

    const legScaleY = 1.0 + landingBounce.current * 0.45;
    const legScaleXZ = 1.0 - landingBounce.current * 0.2;

    // 4. Single Swaying Tail animation (Runs in game and preview mode)
    tailRefs.current.forEach((tailGroup, index) => {
      if (!tailGroup) return;
      const config = tailsConfig[index];
      const swayY = Math.sin(time * 3.2 + index * 0.4) * 0.12;
      const swayZ = Math.cos(time * 2.7 + index * 0.35) * 0.08;
      tailGroup.rotation.y = config.ry + swayY;
      tailGroup.rotation.z = config.rz + swayZ;
    });

    // 5. Set Preview Mode pose and bypass legs/arms animations
    if (previewMode) {
      if (leftLegRef.current) {
        leftLegRef.current.rotation.z = 0;
        leftLegRef.current.position.y = 0.7;
        leftLegRef.current.scale.set(1, 1, 1);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.z = 0;
        rightLegRef.current.position.y = 0.7;
        rightLegRef.current.scale.set(1, 1, 1);
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = 0;
        leftArmRef.current.scale.set(1, 1, 1);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = 0;
        rightArmRef.current.scale.set(1, 1, 1);
      }
      if (headRef.current) {
        headRef.current.rotation.z = 0;
        headRef.current.position.set(0.5, 0, 0);
      }
      if (lowerJawRef.current) lowerJawRef.current.rotation.z = 0;

      // Pink orbs orbiting in preview mode
      if (orb1Ref.current) {
        orb1Ref.current.position.y = 2.4 + Math.sin(time * 2.0) * 0.2;
        orb1Ref.current.position.x = 0.6 + Math.cos(time * 1.5) * 0.7;
        orb1Ref.current.position.z = Math.sin(time * 1.5) * 0.7;
        orb1Ref.current.rotation.y = time * 2.0;
      }
      if (orb2Ref.current) {
        orb2Ref.current.position.y = 1.6 + Math.cos(time * 2.2) * 0.15;
        orb2Ref.current.position.x = -0.4 + Math.sin(time * 1.2) * 0.8;
        orb2Ref.current.position.z = Math.cos(time * 1.2) * 0.8;
        orb2Ref.current.rotation.x = time * 1.5;
      }
      if (orb3Ref.current) {
        orb3Ref.current.position.y = 2.0 + Math.sin(time * 1.8) * 0.25;
        orb3Ref.current.position.x = -1.6 + Math.cos(time * 1.0) * 0.6;
        orb3Ref.current.position.z = Math.sin(time * 1.0) * 0.6;
        orb3Ref.current.rotation.z = time * 2.5;
      }

      // Blinking eye logic for preview
      const blinkCycle = time % 4.0;
      let targetScaleY = 1.0;
      if (blinkCycle < 0.12) targetScaleY = 0.05;
      else if (blinkCycle < 0.25) targetScaleY = 1.15;
      const eyeStiffness = 220;
      const eyeDamping = 12;
      const eyeForce = eyeStiffness * (targetScaleY - eyeScaleY.current) - eyeDamping * eyeSpringVel.current;
      eyeSpringVel.current += eyeForce * delta;
      eyeScaleY.current += eyeSpringVel.current * delta;

      if (leftEyeGroupRef.current) leftEyeGroupRef.current.scale.set(1.0, eyeScaleY.current, 1.0);
      if (rightEyeGroupRef.current) rightEyeGroupRef.current.scale.set(1.0, eyeScaleY.current, 1.0);

      return;
    }

    // 6. Procedural running & death cycles
    if (status === 'gameover') {
      if (leftLegRef.current) {
        leftLegRef.current.rotation.z = 1.2;
        leftLegRef.current.position.y = 0.7;
        leftLegRef.current.scale.set(1.0, 1.0, 1.0);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.z = -1.2;
        rightLegRef.current.position.y = 0.7;
        rightLegRef.current.scale.set(1.0, 1.0, 1.0);
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = 1.5;
        leftArmRef.current.scale.set(1.0, 1.0, 1.0);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = -1.5;
        rightArmRef.current.scale.set(1.0, 1.0, 1.0);
      }
      if (headRef.current) {
        headRef.current.rotation.z = -0.4;
        headRef.current.position.set(0.5, -0.2, 0);
      }

      if (parentGroupRef.current) {
        parentGroupRef.current.rotation.x = THREE.MathUtils.lerp(parentGroupRef.current.rotation.x, Math.PI / 2, 0.1);
        parentGroupRef.current.position.y = THREE.MathUtils.lerp(parentGroupRef.current.position.y, 0.55, 0.1);
        parentGroupRef.current.position.x = THREE.MathUtils.lerp(parentGroupRef.current.position.x, -0.2, 0.1);
      }
    } else {
      if (parentGroupRef.current) {
        parentGroupRef.current.rotation.set(0, 0, 0);
        parentGroupRef.current.position.set(0, 0, 0);
      }

      if (isGrounded) {
        if (leftLegRef.current && rightLegRef.current) {
          if (p === 'ghost') {
            leftLegRef.current.rotation.z = -0.2;
            rightLegRef.current.rotation.z = 0.2;
            leftLegRef.current.position.y = 0.7;
            rightLegRef.current.position.y = 0.7;
          } else {
            const leftCycle = Math.sin(phase);
            const rightCycle = Math.sin(phase + Math.PI);

            leftLegRef.current.rotation.z = leftCycle * 0.9 + Math.cos(phase) * 0.2;
            rightLegRef.current.rotation.z = rightCycle * 0.9 + Math.cos(phase + Math.PI) * 0.2;

            leftLegRef.current.position.y = 0.7 + Math.max(0, -leftCycle) * 0.4;
            rightLegRef.current.position.y = 0.7 + Math.max(0, -rightCycle) * 0.4;
          }
          leftLegRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
          rightLegRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
        }

        if (leftArmRef.current && rightArmRef.current) {
          if (p === 'ghost') {
            leftArmRef.current.rotation.z = 0;
            rightArmRef.current.rotation.z = 0;
          } else {
            leftArmRef.current.rotation.z = Math.sin(phase + Math.PI) * 0.6 + landingBounce.current * 0.5;
            leftArmRef.current.rotation.y = Math.sin(phase + Math.PI) * 0.2;

            rightArmRef.current.rotation.z = Math.sin(phase) * 0.6 + landingBounce.current * 0.5;
            rightArmRef.current.rotation.y = Math.sin(phase) * 0.2;
          }
          leftArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
          rightArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
        }
      } else {
        if (leftLegRef.current && rightLegRef.current) {
          if (p === 'ghost') {
            leftLegRef.current.rotation.z = -0.2;
            rightLegRef.current.rotation.z = 0.2;
          } else {
            const isFalling = current.velocity < 0;
            leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, isFalling ? 0.3 : -0.7, 0.2);
            rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, isFalling ? 0.7 : 0.4, 0.2);

            leftLegRef.current.position.y = THREE.MathUtils.lerp(leftLegRef.current.position.y, 0.7, 0.2);
            rightLegRef.current.position.y = THREE.MathUtils.lerp(rightLegRef.current.position.y, 0.7, 0.2);
          }
          leftLegRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
          rightLegRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.8, 0.2) + landingBounce.current * 0.5;
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.8, 0.2) + landingBounce.current * 0.5;

          leftArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
          rightArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
        }
      }

      // 7. Crouch & escavation head pose adjustments
      if (isUnderground) {
        if (headRef.current) {
          headRef.current.position.y = 0;
          headRef.current.position.x = 0.5;
          headRef.current.rotation.z = 0;
        }
      } else if (isCrouching) {
        if (headRef.current) {
          headRef.current.position.y = -0.3;
          headRef.current.position.x = 0.6;
          headRef.current.rotation.z = 0.15;
        }
      } else {
        if (headRef.current) {
          headRef.current.position.y = 0;
          headRef.current.position.x = 0.5;
          if (isGrounded && p !== 'ghost') {
            headRef.current.rotation.z = Math.sin(phase) * 0.1 - 0.05;
            headRef.current.position.x = 0.5 + Math.sin(phase) * 0.05;
          } else if (current.velocity < 0) {
            headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.2, 0.1);
          }
        }
      }

      // Hurt wobble overlay on head (Pain feedback)
      if (isInvincible && headRef.current) {
        const wobble = Math.sin(now * 0.015) * 0.1;
        headRef.current.rotation.z += wobble;
        headRef.current.position.x += wobble * 0.05;
        headRef.current.position.y += Math.abs(wobble) * 0.05;
      }

      // 8. Eating jaw movement
      if (lowerJawRef.current) {
        if (isEating) {
          lowerJawRef.current.rotation.z = -Math.abs(Math.sin(time * 15)) * 0.45;
        } else {
          lowerJawRef.current.rotation.z = p === 'super' ? -0.4 : 0;
        }
      }
    }

    // 10. Pink orbs orbiting
    if (orb1Ref.current) {
      orb1Ref.current.position.y = 2.4 + Math.sin(time * 2.0) * 0.2;
      orb1Ref.current.position.x = 0.6 + Math.cos(time * 1.5) * 0.7;
      orb1Ref.current.position.z = Math.sin(time * 1.5) * 0.7;
      orb1Ref.current.rotation.y = time * 2.0;
    }
    if (orb2Ref.current) {
      orb2Ref.current.position.y = 1.6 + Math.cos(time * 2.2) * 0.15;
      orb2Ref.current.position.x = -0.4 + Math.sin(time * 1.2) * 0.8;
      orb2Ref.current.position.z = Math.cos(time * 1.2) * 0.8;
      orb2Ref.current.rotation.x = time * 1.5;
    }
    if (orb3Ref.current) {
      orb3Ref.current.position.y = 2.0 + Math.sin(time * 1.8) * 0.25;
      orb3Ref.current.position.x = -1.6 + Math.cos(time * 1.0) * 0.6;
      orb3Ref.current.position.z = Math.sin(time * 1.0) * 0.6;
      orb3Ref.current.rotation.z = time * 2.5;
    }

    // 11. Spring Eye Blinking Animation
    const blinkCycle = time % 4.0;
    let targetScaleY = 1.0;

    if (status === 'gameover') {
      targetScaleY = 0.05;
    } else if (isInvincible) {
      targetScaleY = 0.5;
    } else if (blinkCycle < 0.12) {
      targetScaleY = 0.05;
    } else if (blinkCycle < 0.25) {
      targetScaleY = 1.15;
    }

    const eyeStiffness = 220;
    const eyeDamping = 12;
    const eyeForce = eyeStiffness * (targetScaleY - eyeScaleY.current) - eyeDamping * eyeSpringVel.current;
    eyeSpringVel.current += eyeForce * delta;
    eyeScaleY.current += eyeSpringVel.current * delta;

    if (leftEyeGroupRef.current) {
      leftEyeGroupRef.current.scale.set(1.0, eyeScaleY.current, 1.0);
    }
    if (rightEyeGroupRef.current) {
      rightEyeGroupRef.current.scale.set(1.0, eyeScaleY.current, 1.0);
    }

    // 12. Spawning pink sparkle particles when running
    if (status === 'playing' && isGrounded && Math.random() > 0.4) {
      if (parentGroupRef.current) {
        parentGroupRef.current.getWorldPosition(tempPos);
        spawnParticles(
          'sparkle',
          [
            tempPos.x - 1.5 + (Math.random() - 0.5) * 0.4,
            tempPos.y + 1.2 + (Math.random() - 0.5) * 0.4,
            tempPos.z + (Math.random() - 0.5) * 0.8
          ],
          1,
          GLOW
        );
      }
    }
  });

  const isGhost = animState.current.activePowerup === 'ghost';
  const activePowerup = animState.current.activePowerup;

  return (
    <group ref={parentGroupRef}>
      {/* Main Body */}
      <mesh position={[-0.1, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.0, 0.8]} />
        <primitive object={dinoMaterial} attach="material" />

        {/* Care Bear-style rainbow belly badge: two flank patches plus a connecting
            band across the front chest, so it reads as one belt wrapping the belly
            instead of two disconnected side decals. */}
        {[0.41, -0.41].map((z) => (
          <group key={z} position={[0.15, -0.05, z]}>
            {RAINBOW_STRIPES.map((c, i) => (
              <mesh key={c} position={[0, 0.16 - i * 0.075, 0]} castShadow={false}>
                <boxGeometry args={[0.32, 0.065, 0.01]} />
                <meshStandardMaterial color={c} transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
              </mesh>
            ))}
          </group>
        ))}
        <group position={[0.72, -0.05, 0]}>
          {RAINBOW_STRIPES.map((c, i) => (
            <mesh key={c} position={[0, 0.16 - i * 0.075, 0]} castShadow={false}>
              <boxGeometry args={[0.02, 0.065, 0.86]} />
              <meshStandardMaterial color={c} transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
            </mesh>
          ))}
        </group>
      </mesh>

      {/* Chest Fluff / Mane */}
      <group position={[0.5, 1.2, 0]}>
        <mesh castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.2, 0.7, 0.76]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>
        <mesh position={[-0.1, -0.25, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.15, 0.4, 0.55]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>
      </group>

      {/* Single Swaying Tail (Kitsune's fan of 3 reduced to one) */}
      <group position={[-0.7, 1.0, 0]}>
        {tailsConfig.map((config, index) => (
          <group
            key={index}
            ref={(el) => {
              tailRefs.current[index] = el;
            }}
            rotation={[0, config.ry, config.rz]}
          >
            <mesh position={[-0.4, 0.1, 0]} castShadow={!isGhost}>
              <boxGeometry args={[0.7, 0.7, 0.7]} />
              <primitive object={dinoMaterial} attach="material" />
            </mesh>
            <mesh position={[-1.0, 0.4, 0]} castShadow={!isGhost}>
              <boxGeometry args={[0.9, 0.9, 0.9]} />
              <primitive object={dinoMaterial} attach="material" />
            </mesh>
            <mesh position={[-1.6, 0.7, 0]} castShadow={!isGhost}>
              <boxGeometry args={[0.6, 0.6, 0.6]} />
              <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.0} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Collar */}
      <mesh position={[0.4, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.6, 0.2, 0.9]} />
        <primitive object={collarMaterial} attach="material" />
      </mesh>
      {/* Tag */}
      <mesh position={[0.7, 1.6, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.3, 0.3]} />
        <meshStandardMaterial color={GLOW} transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0.5, 0, 0]}>
        <mesh position={[0.4, 2.2, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[1.2, 1.1, 1.1]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Snout / Upper Jaw */}
        <mesh position={[1.2, 2.05, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.8, 0.4, 0.5]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.42, 0.08, 0]} castShadow={!isGhost}>
            <boxGeometry args={[0.1, 0.12, 0.12]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </mesh>

        {/* Whiskers */}
        <mesh position={[1.2, 2.05, 0.26]} rotation={[0, 0.15, 0.08]} castShadow={!isGhost}>
          <boxGeometry args={[0.3, 0.03, 0.02]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[1.2, 1.95, 0.26]} rotation={[0, 0.15, -0.08]} castShadow={!isGhost}>
          <boxGeometry args={[0.3, 0.03, 0.02]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[1.2, 2.05, -0.26]} rotation={[0, -0.15, 0.08]} castShadow={!isGhost}>
          <boxGeometry args={[0.3, 0.03, 0.02]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[1.2, 1.95, -0.26]} rotation={[0, -0.15, -0.08]} castShadow={!isGhost}>
          <boxGeometry args={[0.3, 0.03, 0.02]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Lower Jaw */}
        <mesh ref={lowerJawRef} position={[1.1, 1.85, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.6, 0.2, 0.4]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Ears (large, with glowing pink inner part) */}
        <group position={[0.1, 2.7, 0.38]} rotation={[0.15, 0, -0.2]}>
          <mesh castShadow={!isGhost} receiveShadow={!isGhost}>
            <boxGeometry args={[0.3, 1, 0.35]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>
          <mesh position={[0.02, 0.05, 0.02]} castShadow={!isGhost}>
            <boxGeometry args={[0.2, 0.45, 0.2]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={1.2} />
          </mesh>
        </group>
        <group position={[0.1, 2.7, -0.38]} rotation={[-0.15, 0, -0.2]}>
          <mesh castShadow={!isGhost} receiveShadow={!isGhost}>
            <boxGeometry args={[0.3, 1, 0.35]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>
          <mesh position={[0.02, 0.05, -0.02]} castShadow={!isGhost}>
            <boxGeometry args={[0.2, 0.45, 0.2]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={1.2} />
          </mesh>
        </group>

        {/* Forehead Gem/Marking */}
        <mesh position={[1, 2.5, 0]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.22, 0.08]} />
          <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.2} />
        </mesh>

        {/* Cheek Markings */}
        <mesh position={[0.7, 2.05, 0.56]} castShadow={!isGhost}>
          <boxGeometry args={[0.12, 0.12, 0.02]} />
          <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={1.6} />
        </mesh>
        <mesh position={[0.7, 2.05, -0.56]} castShadow={!isGhost}>
          <boxGeometry args={[0.12, 0.12, 0.02]} />
          <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={1.6} />
        </mesh>

        {/* Strong Jaw / Dragon Powerup Visual */}
        {(activePowerup === "jaw" || activePowerup === "dragon") && (
          <group position={[1.4, 2.0, 0]}>
            <mesh position={[0, 0, 0.3]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.4, 0.4, 0.15]} />
              <meshStandardMaterial color="white" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
            </mesh>
            <mesh position={[0, 0, -0.3]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.4, 0.4, 0.15]} />
              <meshStandardMaterial color="white" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
            </mesh>
          </group>
        )}

        {/* Eyes (Pink eyeliner-less soft look, glowing pink pupil with Blink Group) */}
        <group ref={leftEyeGroupRef} position={[0.55, 2.4, 0]}>
          <mesh position={[0, 0, 0.55]}>
            <boxGeometry args={[0.35, 0.35, 0.02]} />
            <meshStandardMaterial color="#000000" roughness={0.8} transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0.05, 0, 0.55]}>
            <boxGeometry args={[0.2, 0.25, 0.05]} />
            <meshStandardMaterial
              color={activePowerup === 'dragon' ? '#dc2626' : GLOW}
              emissive={activePowerup === 'dragon' ? '#7f1d1d' : GLOW}
              emissiveIntensity={2.0}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
        </group>
        <group ref={rightEyeGroupRef} position={[0.55, 2.4, 0]}>
          <mesh position={[0, 0, -0.55]}>
            <boxGeometry args={[0.35, 0.35, 0.02]} />
            <meshStandardMaterial color="#000000" roughness={0.8} transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0.05, 0, -0.55]}>
            <boxGeometry args={[0.2, 0.25, 0.05]} />
            <meshStandardMaterial
              color={activePowerup === 'dragon' ? '#dc2626' : GLOW}
              emissive={activePowerup === 'dragon' ? '#7f1d1d' : GLOW}
              emissiveIntensity={2.0}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
        </group>
      </group>

      {/* Wings Powerup Visual */}
      {activePowerup === "wings" && (
        <Wings wingLeftRef={wingLeftRef} wingRightRef={wingRightRef} position={[-0.2, 1.5, 0]} accentColor={GLOW} />
      )}

      {/* Orbiting Pink Orbs */}
      <group ref={orb1Ref}>
        <mesh castShadow={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={4.0} />
        </mesh>
        <mesh castShadow={false}>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#f472b6" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>
      <group ref={orb2Ref}>
        <mesh castShadow={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#f9a8d4" emissive="#f9a8d4" emissiveIntensity={4.0} />
        </mesh>
        <mesh castShadow={false}>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#f9a8d4" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>
      <group ref={orb3Ref}>
        <mesh castShadow={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={4.0} />
        </mesh>
        <mesh castShadow={false}>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#e879f9" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[0.6, 1.2, 0.56]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <primitive object={dinoMaterial} attach="material" />
        <group position={[0.2, 0.04, 0.06]}>
          <mesh castShadow={!isGhost}>
            <boxGeometry args={[0.2, 0.06, 0.06]} />
            <meshStandardMaterial color="#111111" roughness={0.8} />
          </mesh>
          <mesh position={[0.11, 0, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.0} />
          </mesh>
        </group>
        <group position={[0.23, 0, 0]}>
          <mesh castShadow={!isGhost}>
            <boxGeometry args={[0.25, 0.06, 0.06]} />
            <meshStandardMaterial color="#111111" roughness={0.8} />
          </mesh>
          <mesh position={[0.135, 0, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.0} />
          </mesh>
        </group>
        <group position={[0.2, -0.04, -0.06]}>
          <mesh castShadow={!isGhost}>
            <boxGeometry args={[0.2, 0.06, 0.06]} />
            <meshStandardMaterial color="#111111" roughness={0.8} />
          </mesh>
          <mesh position={[0.11, 0, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.0} />
          </mesh>
        </group>
      </mesh>
      <mesh ref={rightArmRef} position={[0.6, 1.2, -0.56]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <primitive object={dinoMaterial} attach="material" />
        <group position={[0.2, 0.04, 0.06]}>
          <mesh castShadow={!isGhost}>
            <boxGeometry args={[0.2, 0.06, 0.06]} />
            <meshStandardMaterial color="#111111" roughness={0.8} />
          </mesh>
          <mesh position={[0.11, 0, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.0} />
          </mesh>
        </group>
        <group position={[0.23, 0, 0]}>
          <mesh castShadow={!isGhost}>
            <boxGeometry args={[0.25, 0.06, 0.06]} />
            <meshStandardMaterial color="#111111" roughness={0.8} />
          </mesh>
          <mesh position={[0.135, 0, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.0} />
          </mesh>
        </group>
        <group position={[0.2, -0.04, -0.06]}>
          <mesh castShadow={!isGhost}>
            <boxGeometry args={[0.2, 0.06, 0.06]} />
            <meshStandardMaterial color="#111111" roughness={0.8} />
          </mesh>
          <mesh position={[0.11, 0, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2.0} />
          </mesh>
        </group>
      </mesh>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.2, 0.7, 0.35]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.5, 0.7, 0.4]} />
        <primitive object={dinoMaterial} attach="material" />
        <mesh position={[0.15, -0.3, 0]}>
          <boxGeometry args={[0.6, 0.3, 0.45]} />
          <primitive object={dinoMaterial} attach="material" />
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
      <mesh ref={rightLegRef} position={[0.2, 0.7, -0.35]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.5, 0.7, 0.4]} />
        <primitive object={dinoMaterial} attach="material" />
        <mesh position={[0.15, -0.3, 0]}>
          <boxGeometry args={[0.6, 0.3, 0.45]} />
          <primitive object={dinoMaterial} attach="material" />
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
  );
}
