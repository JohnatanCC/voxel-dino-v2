import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SkinConfig } from '../../../store/gameStore';
import { createVoxelTexture } from '../../../utils/texture';
import { DinoModelProps } from '../types';

interface ClassicDinoProps extends DinoModelProps {
  skinConfig: SkinConfig;
}

export function ClassicDinoModel({ animState, previewMode = false, skinConfig }: ClassicDinoProps) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const wingLeftRef = useRef<THREE.Mesh>(null);
  const wingRightRef = useRef<THREE.Mesh>(null);
  const lowerJawRef = useRef<THREE.Mesh>(null);

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
  const spotsTexture = useMemo(() => createVoxelTexture(skinConfig.spotsColor, skinConfig.spotsColor, 'plain'), [skinConfig.spotsColor]);
  const spikesTexture = useMemo(() => createVoxelTexture(skinConfig.spikesColor, skinConfig.spikesColor, 'plain'), [skinConfig.spikesColor]);
  const collarTexture = useMemo(() => createVoxelTexture(skinConfig.collarColor, skinConfig.collarColor, 'plain'), [skinConfig.collarColor]);

  // Create materials
  const dinoMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: dinoTexture,
    roughness: 0.9,
    metalness: skinConfig.id === 'dino-gold' ? 0.8 : 0.1, // Shiny gold skin!
  }), [dinoTexture, skinConfig.id]);

  const spotsMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: spotsTexture,
    roughness: 0.9,
  }), [spotsTexture]);

  const spikesMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: spikesTexture,
    roughness: 0.9,
  }), [spikesTexture]);

  const collarMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: collarTexture,
    roughness: 0.9,
  }), [collarTexture]);

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

    // 1. Frost overlay & Emissive powerup lighting
    if (p === 'super') {
      dinoMaterial.emissive.setHSL((state.clock.getElapsedTime() * 2) % 1, 1, 0.5);
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
      return;
    }

    // 4. Procedural running & death cycles with limb spring squash/stretch
    if (status === 'gameover') {
      // Death splayed limbs and head
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
      
      // Fall sideways smoothly (rotate on X-axis and translate up to stay on ground)
      if (parentGroupRef.current) {
        parentGroupRef.current.rotation.x = THREE.MathUtils.lerp(parentGroupRef.current.rotation.x, Math.PI / 2, 0.1);
        parentGroupRef.current.position.y = THREE.MathUtils.lerp(parentGroupRef.current.position.y, 0.55, 0.1);
        parentGroupRef.current.position.x = THREE.MathUtils.lerp(parentGroupRef.current.position.x, -0.2, 0.1);
      }
    } else {
      // Reset parent group
      if (parentGroupRef.current) {
        parentGroupRef.current.rotation.set(0, 0, 0);
        parentGroupRef.current.position.set(0, 0, 0);
      }

      // Update landing spring physics
      if (isGrounded && !wasGrounded.current) {
        landingBounceVel.current = -5.0; // Landing squash
      } else if (!isGrounded && wasGrounded.current) {
        landingBounceVel.current = 4.0; // Jump stretch
      }
      wasGrounded.current = isGrounded;

      const springK = 220;
      const springD = 12;
      const force = springK * (0 - landingBounce.current) - springD * landingBounceVel.current;
      landingBounceVel.current += force * delta;
      landingBounce.current += landingBounceVel.current * delta;

      const legScaleY = 1.0 + landingBounce.current * 0.45;
      const legScaleXZ = 1.0 - landingBounce.current * 0.2;

      // Running / Idle poses
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
          // Apply spring scaling to legs
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
          // Apply spring scaling to arms
          leftArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
          rightArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
        }
      } else {
        // Jumping pose
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
          // Apply spring scaling to legs during jump
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

    // 5. Crouch & escavation head pose adjustments
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

    // Hurt wobble overlay on head (Pain feedback)
    const isHurt = now < storeState.invincibleUntil;
    if (isHurt && status !== 'gameover' && headRef.current && !previewMode) {
      // Slower and gentler head wobble
      const wobble = Math.sin(now * 0.015) * 0.1;
      headRef.current.rotation.z += wobble;
      headRef.current.position.x += wobble * 0.05;
      headRef.current.position.y += Math.abs(wobble) * 0.05;
    }

    // 6. Eating jaw movement
    if (lowerJawRef.current) {
      if (isEating) {
        lowerJawRef.current.rotation.z = -Math.abs(Math.sin(state.clock.getElapsedTime() * 15)) * 0.45;
      } else {
        lowerJawRef.current.rotation.z = p === 'super' ? -0.4 : 0;
      }
    }

    // 7. Wings flapping powerup
    if (wingLeftRef.current && wingRightRef.current) {
      if (p === 'wings') {
        if (!isGrounded && current.velocity < 0) {
          wingLeftRef.current.rotation.z = THREE.MathUtils.lerp(wingLeftRef.current.rotation.z, Math.PI / 4, 0.2);
          wingRightRef.current.rotation.z = THREE.MathUtils.lerp(wingRightRef.current.rotation.z, -Math.PI / 4, 0.2);
        } else if (!isGrounded && current.velocity > 0) {
          wingLeftRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 30) * 0.8;
          wingRightRef.current.rotation.z = -Math.sin(state.clock.getElapsedTime() * 30) * 0.8;
        } else {
          wingLeftRef.current.rotation.z = 0;
          wingRightRef.current.rotation.z = 0;
        }
      }
    }

    // 8. Spring Eye Blinking Animation (Cartoon jelly squash/stretch)
    const time = state.clock.getElapsedTime();
    const blinkCycle = time % 4.0;
    let targetScaleY = 1.0;
    
    if (status === 'gameover') {
      targetScaleY = 0.05; // Stay flat/closed when dead!
    } else if (isHurt && !previewMode) {
      targetScaleY = 0.5; // Eyes 50% closed (wincing in pain)
    } else if (blinkCycle < 0.12) {
      targetScaleY = 0.05; // Squash down flat
    } else if (blinkCycle < 0.25) {
      targetScaleY = 1.15; // Stretch overshoot
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

  // Render the classic Dino structure
  return (
    <group ref={parentGroupRef}>
      {/* Main Body */}
      <mesh position={[-0.1, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.0, 0.8]} />
        <primitive object={dinoMaterial} attach="material" />
      </mesh>

      {/* Texture Details (Spots) */}
      <mesh position={[0.2, 1.6, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.3, 1.4, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.9, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[0.2, 1.6, -0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.3, 1.4, -0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.9, -0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
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

      {/* Collar */}
      <mesh position={[0.4, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.6, 0.2, 0.9]} />
        <primitive object={collarMaterial} attach="material" />
      </mesh>
      {/* Tag */}
      <mesh position={[0.7, 1.6, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.3, 0.3]} />
        <meshStandardMaterial color="#fbbf24" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0.5, 0, 0]}>
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

        {/* Nostrils (Retro black pixel L-shape details on snout sides) */}
        <mesh position={[1.25, 2.1, 0.46]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color="#27272a" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
        </mesh>
        <mesh position={[1.25, 2.1, -0.46]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color="#27272a" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
        </mesh>

        {/* Teeth (Two pairs of cute fangs) */}
        {/* First pair (front fangs) */}
        <mesh position={[1.2, 1.7, 0.4]} castShadow={!isGhost}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[1.2, 1.7, -0.4]} castShadow={!isGhost}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Second pair (rear fangs) */}
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

        {/* Left Eye (With spring blinking group) */}
        <group ref={leftEyeGroupRef} position={[0.65, 2.4, 0]}>
          {/* Outline */}
          <mesh position={[0, 0, 0.54]} castShadow={!isGhost}>
            <boxGeometry args={[0.34, 0.39, 0.03]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          {/* Sclera */}
          <mesh position={[0, 0, 0.56]} castShadow={!isGhost}>
            <boxGeometry args={[0.30, 0.35, 0.04]} />
            <meshBasicMaterial
              color={activePowerup === 'jaw' || activePowerup === 'super' ? '#ef4444' : '#ffffff'}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          {/* Pupil */}
          <mesh position={[0.1, 0, 0.59]} castShadow={!isGhost}>
            <boxGeometry args={[0.12, 0.14, 0.02]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          {/* Sparkle */}
          <mesh position={[0.1, 0.03, 0.6]} castShadow={!isGhost}>
            <boxGeometry args={[0.05, 0.05, 0.01]} />
            <meshBasicMaterial color="white" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
        </group>

        {/* Right Eye (With spring blinking group) */}
        <group ref={rightEyeGroupRef} position={[0.65, 2.4, 0]}>
          {/* Outline */}
          <mesh position={[0, 0, -0.54]} castShadow={!isGhost}>
            <boxGeometry args={[0.34, 0.39, 0.03]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          {/* Sclera */}
          <mesh position={[0, 0, -0.56]} castShadow={!isGhost}>
            <boxGeometry args={[0.30, 0.35, 0.04]} />
            <meshBasicMaterial
              color={activePowerup === 'jaw' || activePowerup === 'super' ? '#ef4444' : '#ffffff'}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          {/* Pupil */}
          <mesh position={[0.1, 0, -0.59]} castShadow={!isGhost}>
            <boxGeometry args={[0.12, 0.14, 0.02]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          {/* Sparkle */}
          <mesh position={[0.1, 0.03, -0.6]} castShadow={!isGhost}>
            <boxGeometry args={[0.05, 0.05, 0.01]} />
            <meshBasicMaterial color="white" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
        </group>


      </group>

      {/* Wings Powerup Visual */}
      {activePowerup === "wings" && (
        <group position={[-0.2, 1.5, 0]}>
          <mesh ref={wingLeftRef} position={[0, 0, 0.6]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.6, 0.1, 0.4]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh ref={wingRightRef} position={[0, 0, -0.6]} rotation={[0, -Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.6, 0.1, 0.4]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      )}

      {/* Arms */}
      <mesh ref={leftArmRef} position={[0.6, 1.2, 0.50]} castShadow={!isGhost} receiveShadow={!isGhost}>
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
      <mesh ref={rightArmRef} position={[0.6, 1.2, -0.50]} castShadow={!isGhost} receiveShadow={!isGhost}>
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
