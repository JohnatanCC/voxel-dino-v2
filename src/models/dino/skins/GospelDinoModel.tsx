import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SkinConfig } from '../../../store/gameStore';
import { createVoxelTexture } from '../../../utils/texture';
import { DinoModelProps } from '../types';

interface GospelDinoProps extends DinoModelProps {
  skinConfig: SkinConfig;
}

export function GospelDinoModel({ animState, previewMode = false, skinConfig }: GospelDinoProps) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const wingLeftRef = useRef<THREE.Group>(null);
  const wingRightRef = useRef<THREE.Group>(null);
  const lowerJawRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Eye Spring Blinking Refs
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);
  const eyeScaleY = useRef<number>(1.0);
  const eyeSpringVel = useRef<number>(0);

  // Master Parent Group Ref (for death fall animation)
  const parentGroupRef = useRef<THREE.Group>(null);

  // Limb Squash & Stretch spring physics
  const wasGrounded = useRef<boolean>(true);
  const landingBounce = useRef<number>(0);
  const landingBounceVel = useRef<number>(0);

  // Generate procedural textures
  const dinoTexture = useMemo(() => createVoxelTexture(skinConfig.baseColor, skinConfig.spotsColor, 'classic'), [skinConfig.baseColor, skinConfig.spotsColor]);
  const spikesTexture = useMemo(() => createVoxelTexture(skinConfig.spikesColor, skinConfig.spikesColor, 'plain'), [skinConfig.spikesColor]);
  const collarTexture = useMemo(() => createVoxelTexture(skinConfig.collarColor, skinConfig.collarColor, 'plain'), [skinConfig.collarColor]);

  // Create materials
  const dinoMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: dinoTexture,
    roughness: 0.5,
    metalness: 0.15,
  }), [dinoTexture]);

  const spikesMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: spikesTexture,
    roughness: 0.35,
    metalness: 0.2,
    emissive: new THREE.Color('#fbbf24'),
    emissiveIntensity: 0.4,
  }), [spikesTexture]);

  const collarMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: collarTexture,
    roughness: 0.4,
    metalness: 0.2,
  }), [collarTexture]);

  // Halo & wing trim: warm, steadily-glowing gold (independent of powerups).
  const haloMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffd700',
    emissive: '#ffea00',
    emissiveIntensity: 1.5,
    roughness: 0.1,
    metalness: 0.3,
  }), []);

  const sparkleMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fffbe6',
    emissive: '#fde68a',
    emissiveIntensity: 1.2,
    roughness: 0.1,
  }), []);

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

    // Immediate ghost transparency updates
    const isGhostActive = p === 'ghost';
    if (dinoMaterial.transparent !== isGhostActive) {
      dinoMaterial.transparent = isGhostActive;
      dinoMaterial.opacity = isGhostActive ? 0.4 : 1.0;
      spikesMaterial.transparent = isGhostActive;
      spikesMaterial.opacity = isGhostActive ? 0.4 : 1.0;
      collarMaterial.transparent = isGhostActive;
      collarMaterial.opacity = isGhostActive ? 0.4 : 1.0;
      haloMaterial.transparent = isGhostActive;
      haloMaterial.opacity = isGhostActive ? 0.4 : 1.0;
      sparkleMaterial.transparent = isGhostActive;
      sparkleMaterial.opacity = isGhostActive ? 0.4 : 1.0;
    }

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
      } else if (p === 'earth') {
        dinoMaterial.emissive.set('#000000');
        dinoMaterial.emissiveIntensity = 0;
        const earthColor = new THREE.Color(skinConfig.baseColor).multiplyScalar(0.4);
        dinoMaterial.color.copy(earthColor);
      } else {
        dinoMaterial.emissive.set('#000000');
        dinoMaterial.emissiveIntensity = 0;
        dinoMaterial.color.set(skinConfig.baseColor);
      }
    }

    // Halo & sparkle: gentle steady glow, boosted while the wings powerup is active.
    const wingsBoost = p === 'wings' ? 1.0 : 0.0;
    haloMaterial.emissiveIntensity = 1.2 + Math.sin(time * 2) * 0.3 + wingsBoost * 1.5;
    sparkleMaterial.emissiveIntensity = 0.9 + Math.sin(time * 6) * 0.5;
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * (0.4 + wingsBoost * 1.2);
    }

    // 2. Invincibility Blink visual
    const storeState = useGameStore.getState();
    const now = performance.now();
    if (now < storeState.invincibleUntil) {
      const isWhite = Math.floor(now / 150) % 2 === 0;
      dinoMaterial.color.set(isWhite ? "#ffffff" : skinConfig.baseColor);
      dinoMaterial.emissive.set(isWhite ? "#ffffff" : "#000000");
      dinoMaterial.emissiveIntensity = isWhite ? 0.5 : 0;
    }

    // 3. Set Preview Mode pose and bypass animations
    if (previewMode) {
      if (leftLegRef.current) {
        leftLegRef.current.rotation.z = 0;
        leftLegRef.current.position.y = 0.7;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.z = 0;
        rightLegRef.current.position.y = 0.7;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.z = 0;
      if (headRef.current) {
        headRef.current.rotation.z = 0;
        headRef.current.position.set(0.5, 0, 0);
      }
      if (lowerJawRef.current) lowerJawRef.current.rotation.z = 0;
      if (wingLeftRef.current && wingRightRef.current) {
        wingLeftRef.current.rotation.z = Math.sin(time * 1.5) * 0.15;
        wingRightRef.current.rotation.z = -Math.sin(time * 1.5) * 0.15;
      }
      return;
    }

    // 4. Procedural running & death cycles with limb spring squash/stretch
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

      // Landing spring physics
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
    }

    // 5. Crouch & excavation head pose adjustments
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
      if (headRef.current && status !== 'gameover') {
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

    // Hurt wobble overlay on head
    const isHurt = now < storeState.invincibleUntil;
    if (isHurt && status !== 'gameover' && headRef.current && !previewMode) {
      const wobble = Math.sin(now * 0.015) * 0.1;
      headRef.current.rotation.z += wobble;
      headRef.current.position.x += wobble * 0.05;
      headRef.current.position.y += Math.abs(wobble) * 0.05;
    }

    // 6. Eating jaw movement
    if (lowerJawRef.current) {
      if (isEating) {
        lowerJawRef.current.rotation.z = -Math.abs(Math.sin(time * 15)) * 0.45;
      } else {
        lowerJawRef.current.rotation.z = p === 'super' ? -0.4 : 0;
      }
    }

    // 7. Wings: always present, gentle idle flutter at rest, full flap when airborne
    // (with the wings powerup pushing the flap further and faster).
    if (wingLeftRef.current && wingRightRef.current) {
      if (status === 'gameover') {
        wingLeftRef.current.rotation.z = 0.3;
        wingRightRef.current.rotation.z = -0.3;
      } else if (isGrounded && p !== 'wings') {
        wingLeftRef.current.rotation.z = Math.sin(phase * 0.5) * 0.12;
        wingRightRef.current.rotation.z = -Math.sin(phase * 0.5) * 0.12;
      } else if (!isGrounded && current.velocity < 0) {
        wingLeftRef.current.rotation.z = THREE.MathUtils.lerp(wingLeftRef.current.rotation.z, Math.PI / 4, 0.2);
        wingRightRef.current.rotation.z = THREE.MathUtils.lerp(wingRightRef.current.rotation.z, -Math.PI / 4, 0.2);
      } else if (!isGrounded) {
        const flapSpeed = p === 'wings' ? 30 : 14;
        wingLeftRef.current.rotation.z = Math.sin(time * flapSpeed) * 0.8;
        wingRightRef.current.rotation.z = -Math.sin(time * flapSpeed) * 0.8;
      } else {
        wingLeftRef.current.rotation.z = Math.sin(time * 30) * 0.8;
        wingRightRef.current.rotation.z = -Math.sin(time * 30) * 0.8;
      }
    }

    // 8. Spring Eye Blinking Animation
    const blinkCycle = time % 4.0;
    let targetScaleY = 1.0;

    if (status === 'gameover') {
      targetScaleY = 0.05;
    } else if (isHurt && !previewMode) {
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
  });

  const isGhost = animState.current.activePowerup === 'ghost';
  const activePowerup = animState.current.activePowerup;

  return (
    <group ref={parentGroupRef}>
      {/* Main Body */}
      <mesh position={[-0.1, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.0, 0.8]} />
        <primitive object={dinoMaterial} attach="material" />
      </mesh>

      {/* Chest gem */}
      <mesh position={[-0.1, 1.2, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.22, 0.22, 0.05]} />
        <primitive object={sparkleMaterial} attach="material" />
      </mesh>

      {/* Texture Details (gold trim spots) */}
      <mesh position={[0.2, 1.6, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.3, 1.4, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>
      <mesh position={[0.2, 1.6, -0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.3, 1.4, -0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>

      {/* Spikes */}
      <mesh position={[-0.1, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.5, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.5, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.3, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>
      <mesh position={[-1.0, 1.5, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.3, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>

      {/* Tail */}
      <mesh position={[-1.0, 1.0, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <primitive object={dinoMaterial} attach="material" />
      </mesh>
      <mesh position={[-1.5, 0.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.6, 0.4, 0.4]} />
        <primitive object={dinoMaterial} attach="material" />
      </mesh>
      {/* Tail tip sparkle */}
      <mesh position={[-1.82, 0.8, 0]} castShadow={!isGhost}>
        <boxGeometry args={[0.08, 0.1, 0.1]} />
        <primitive object={sparkleMaterial} attach="material" />
      </mesh>

      {/* Collar */}
      <mesh position={[0.4, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.6, 0.2, 0.9]} />
        <primitive object={collarMaterial} attach="material" />
      </mesh>
      {/* Tag */}
      <mesh position={[0.7, 1.6, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.3, 0.3]} />
        <primitive object={sparkleMaterial} attach="material" />
      </mesh>

      {/* Head Group (tilts during jump/duck) */}
      <group ref={headRef} position={[0.4, 1.7, 0]}>
        {/* Halo (always present) */}
        <mesh ref={haloRef} position={[0.5, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.35, 0.06, 8, 24]} />
          <primitive object={haloMaterial} attach="material" />
        </mesh>

        {/* Main Head */}
        <mesh position={[0.4, 2.2, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[1.2, 1.1, 1.1]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Snout / Upper Jaw */}
        <mesh position={[1.1, 2.1, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.6, 0.7, 0.9]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Nostrils */}
        <mesh position={[1.25, 2.1, 0.46]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color="#78716c" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
        </mesh>
        <mesh position={[1.25, 2.1, -0.46]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color="#78716c" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
        </mesh>

        {/* Teeth */}
        <mesh position={[1.2, 1.7, 0.4]} castShadow={!isGhost}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[1.2, 1.7, -0.4]} castShadow={!isGhost}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[1.35, 1.7, 0.2]} castShadow={!isGhost}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[1.35, 1.7, -0.2]} castShadow={!isGhost}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {/* Lower Jaw */}
        <mesh ref={lowerJawRef} position={[0.95, 1.65, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.5, 0.1, 0.8]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Horns */}
        <mesh position={[0.1, 2.8, 0.35]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <primitive object={spikesMaterial} attach="material" />
        </mesh>
        <mesh position={[0.1, 2.8, -0.35]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <primitive object={spikesMaterial} attach="material" />
        </mesh>

        {/* Strong Jaw Powerup Visual */}
        {activePowerup === "jaw" && (
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

        {/* Left Eye (spring blinking group) */}
        <group ref={leftEyeGroupRef} position={[0.65, 2.4, 0]}>
          <mesh position={[0, 0, 0.54]} castShadow={!isGhost}>
            <boxGeometry args={[0.34, 0.39, 0.03]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0, 0, 0.56]} castShadow={!isGhost}>
            <boxGeometry args={[0.30, 0.35, 0.04]} />
            <meshStandardMaterial
              color={activePowerup === 'jaw' || activePowerup === 'super' ? '#ef4444' : '#ffd700'}
              emissive="#ffea00"
              emissiveIntensity={0.6}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          <mesh position={[0.1, 0, 0.59]} castShadow={!isGhost}>
            <boxGeometry args={[0.12, 0.14, 0.02]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0.1, 0.03, 0.6]} castShadow={!isGhost}>
            <boxGeometry args={[0.05, 0.05, 0.01]} />
            <meshBasicMaterial color="white" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
        </group>

        {/* Right Eye (spring blinking group) */}
        <group ref={rightEyeGroupRef} position={[0.65, 2.4, 0]}>
          <mesh position={[0, 0, -0.54]} castShadow={!isGhost}>
            <boxGeometry args={[0.34, 0.39, 0.03]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0, 0, -0.56]} castShadow={!isGhost}>
            <boxGeometry args={[0.30, 0.35, 0.04]} />
            <meshStandardMaterial
              color={activePowerup === 'jaw' || activePowerup === 'super' ? '#ef4444' : '#ffd700'}
              emissive="#ffea00"
              emissiveIntensity={0.6}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          <mesh position={[0.1, 0, -0.59]} castShadow={!isGhost}>
            <boxGeometry args={[0.12, 0.14, 0.02]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0.1, 0.03, -0.6]} castShadow={!isGhost}>
            <boxGeometry args={[0.05, 0.05, 0.01]} />
            <meshBasicMaterial color="white" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
        </group>
      </group>

      {/* Wings (always present, feathered) */}
      <group position={[-0.4, 1.2, 0]}>
        <group ref={wingLeftRef} position={[0, 0, 0.5]}>
          <mesh position={[0, 0.2, 0.6]} rotation={[0, Math.PI / 6, 0]} castShadow>
            <boxGeometry args={[0.15, 0.9, 1.6]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.05, -0.1, 0.8]} rotation={[0.1, Math.PI / 8, 0]} castShadow>
            <boxGeometry args={[0.08, 0.6, 1.2]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.08, -0.3, 1.0]} rotation={[0.2, Math.PI / 10, 0]} castShadow>
            <boxGeometry args={[0.08, 0.4, 0.9]} />
            <primitive object={spikesMaterial} attach="material" />
          </mesh>
        </group>
        <group ref={wingRightRef} position={[0, 0, -0.5]}>
          <mesh position={[0, 0.2, -0.6]} rotation={[0, -Math.PI / 6, 0]} castShadow>
            <boxGeometry args={[0.15, 0.9, 1.6]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.05, -0.1, -0.8]} rotation={[-0.1, -Math.PI / 8, 0]} castShadow>
            <boxGeometry args={[0.08, 0.6, 1.2]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.08, -0.3, -1.0]} rotation={[-0.2, -Math.PI / 10, 0]} castShadow>
            <boxGeometry args={[0.08, 0.4, 0.9]} />
            <primitive object={spikesMaterial} attach="material" />
          </mesh>
        </group>
      </group>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[0.6, 1.2, 0.50]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <primitive object={dinoMaterial} attach="material" />
        <mesh position={[0.2, 0, 0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
        <mesh position={[0.2, 0, -0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
      </mesh>
      <mesh ref={rightArmRef} position={[0.6, 1.2, -0.50]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <primitive object={dinoMaterial} attach="material" />
        <mesh position={[0.2, 0, 0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
        <mesh position={[0.2, 0, -0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
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
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
          <mesh position={[0.35, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
          <mesh position={[0.35, -0.1, -0.15]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#d1d5db" />
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
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
          <mesh position={[0.35, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
          <mesh position={[0.35, -0.1, -0.15]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#d1d5db" />
          </mesh>
        </mesh>
      </mesh>
    </group>
  );
}
