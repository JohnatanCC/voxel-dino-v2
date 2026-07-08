import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SkinConfig } from '../../../store/gameStore';
import { spawnParticles } from '../../../components/VFXRenderer';
import { DinoModelProps } from '../types';

interface SharkDinoProps extends DinoModelProps {
  skinConfig: SkinConfig;
}

interface VoxelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args: [number, number, number];
  color: string;
  isGhost?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  outline?: boolean;
  outlineColor?: string;
  material?: THREE.Material;
  children?: React.ReactNode;
}

// Helper Voxel component with cartoon outline
function Voxel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  args,
  color,
  isGhost = false,
  castShadow = true,
  receiveShadow = true,
  outline = true,
  outlineColor = '#000000',
  material,
  children
}: VoxelProps) {
  const voxelMaterial = useMemo(() => material || new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.8,
    transparent: isGhost,
    opacity: isGhost ? 0.45 : 1.0,
  }), [color, isGhost, material]);

  const outlineMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: outlineColor,
      transparent: isGhost,
      opacity: isGhost ? 0.35 : 1.0,
      side: THREE.BackSide
    });
    if (outlineColor === '#00ffff') {
      mat.color.set('#00ffff');
    }
    return mat;
  }, [outlineColor, isGhost]);

  return (
    <group position={position} rotation={rotation}>
      {/* Black Outline (Slightly larger box using BackSide) */}
      {outline && (
        <mesh>
          <boxGeometry args={[args[0] + 0.08, args[1] + 0.08, args[2] + 0.08]} />
          <primitive object={outlineMaterial} attach="material" />
        </mesh>
      )}
      {/* Inner Color Voxel */}
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={args} />
        <primitive object={voxelMaterial} attach="material" />
      </mesh>
      {children}
    </group>
  );
}

export function SharkDinoModel({ animState, previewMode = false, skinConfig }: SharkDinoProps) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const wingLeftRef = useRef<THREE.Mesh>(null);
  const wingRightRef = useRef<THREE.Mesh>(null);
  const lowerJawRef = useRef<THREE.Mesh>(null);
  const parentGroupRef = useRef<THREE.Group>(null);

  // Eye Spring Blinking Refs (For T-Rex eyes inside the hood)
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);
  const eyeScaleY = useRef<number>(1.0);
  const eyeSpringVel = useRef<number>(0);

  // Limb Squash & Stretch spring physics
  const wasGrounded = useRef<boolean>(true);
  const landingBounce = useRef<number>(0);
  const landingBounceVel = useRef<number>(0);

  // Adjusted Color Palette based on reference image
  const dinoDarkBlue = '#0d5c94'; // Dark ocean blue
  const costumeSlateBlue = '#789bb8'; // Clean, lighter slate blue
  const bellyLightGray = '#dbe5ed'; // Soft greyish blue underbelly
  const spikeBlue = '#0d5c94'; // Spine spikes color (matches dino)
  const collarPink = '#e03577'; // Vibrant pink collar
  const goldColor = '#f9c80e'; // Bright gold tag

  // Materials
  const dinoMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: dinoDarkBlue,
    roughness: 0.9,
  }), []);

  const costumeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: costumeSlateBlue,
    roughness: 0.85,
  }), []);

  const underbellyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: bellyLightGray,
    roughness: 0.85,
  }), []);

  const spikesMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: spikeBlue,
    roughness: 0.9,
  }), []);

  const spotsMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: bellyLightGray,
    roughness: 0.9,
  }), []);

  const collarMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: collarPink,
    roughness: 0.8,
  }), []);

  const teethMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.9,
  }), []);

  const hoodEyeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a202c',
    roughness: 0.1,
  }), []);

  useFrame((state, delta) => {
    const current = animState.current;
    const p = current.activePowerup;
    const phase = current.runPhase;
    const isGrounded = current.isGrounded;
    const isCrouching = current.isCrouching;
    const isUnderground = current.isUnderground;
    const isEating = current.isEating;
    const status = current.status;
    const now = performance.now();
    const time = state.clock.getElapsedTime();

    // Reset default properties
    dinoMaterial.color.set(dinoDarkBlue);
    dinoMaterial.roughness = 0.9;
    dinoMaterial.emissive.set('#000000');
    dinoMaterial.emissiveIntensity = 0;

    costumeMaterial.color.set(costumeSlateBlue);
    costumeMaterial.roughness = 0.85;
    costumeMaterial.emissive.set('#000000');
    costumeMaterial.emissiveIntensity = 0;

    underbellyMaterial.color.set(bellyLightGray);
    underbellyMaterial.roughness = 0.85;
    underbellyMaterial.emissive.set('#000000');
    underbellyMaterial.emissiveIntensity = 0;

    spikesMaterial.color.set(spikeBlue);
    spikesMaterial.roughness = 0.9;
    spikesMaterial.emissive.set('#000000');
    spikesMaterial.emissiveIntensity = 0;

    spotsMaterial.color.set(bellyLightGray);
    spotsMaterial.roughness = 0.9;
    spotsMaterial.emissive.set('#000000');
    spotsMaterial.emissiveIntensity = 0;

    collarMaterial.color.set(collarPink);
    collarMaterial.roughness = 0.8;
    collarMaterial.emissive.set('#000000');
    collarMaterial.emissiveIntensity = 0;

    teethMaterial.color.set('#ffffff');
    teethMaterial.emissive.set('#000000');
    teethMaterial.emissiveIntensity = 0;
    teethMaterial.metalness = 0;
    teethMaterial.roughness = 0.9;

    hoodEyeMaterial.color.set('#1a202c');
    hoodEyeMaterial.emissive.set('#000000');
    hoodEyeMaterial.emissiveIntensity = 0;

    // Apply powerup visual logic
    if (p === 'super') {
      hoodEyeMaterial.color.set('#ff0000');
      hoodEyeMaterial.emissive.set('#ff0000');
      hoodEyeMaterial.emissiveIntensity = 3.0;

      // Spawn bubbles
      if (status === 'playing' && isGrounded && Math.random() > 0.4) {
        spawnParticles('sparkle', [-0.5, 0.8, (Math.random() - 0.5) * 0.8], 1, '#93c5fd');
      }
    } else if (p === 'ghost') {
      dinoMaterial.color.set('#38bdf8');
      costumeMaterial.color.set('#a5f3fc');
      underbellyMaterial.color.set('#cffafe');
      spikesMaterial.color.set('#bae6fd');
      spotsMaterial.color.set('#cffafe');
      collarMaterial.color.set('#bae6fd');
    } else if (p === 'jaw') {
      teethMaterial.color.set(goldColor);
      teethMaterial.emissive.set('#d97706');
      teethMaterial.emissiveIntensity = 2.0;
      teethMaterial.metalness = 0.8;
      teethMaterial.roughness = 0.2;
    } else if (p === 'earth') {
      dinoMaterial.color.set('#44403c');
      costumeMaterial.color.set('#78716c');
      underbellyMaterial.color.set('#a8a29e');
      spikesMaterial.color.set('#57534e');
      spotsMaterial.color.set('#a8a29e');
      collarMaterial.color.set('#44403c');
    }

    // Invincibility blink
    const storeState = useGameStore.getState();
    if (now < storeState.invincibleUntil) {
      const isWhite = Math.floor(now / 150) % 2 === 0;
      if (isWhite) {
        dinoMaterial.color.set("#ffffff");
        costumeMaterial.color.set("#ffffff");
        underbellyMaterial.color.set("#ffffff");
        spikesMaterial.color.set("#ffffff");
        spotsMaterial.color.set("#ffffff");
        collarMaterial.color.set("#ffffff");
      }
    }

    // 2. Preview pose
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

    // 3. Game Over pose
    if (status === 'gameover') {
      if (leftLegRef.current) {
        leftLegRef.current.rotation.z = 1.2;
        leftLegRef.current.position.y = 0.7;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.z = -1.2;
        rightLegRef.current.position.y = 0.7;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.z = 1.5;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -1.5;
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
      // Reset parent group
      if (parentGroupRef.current) {
        parentGroupRef.current.rotation.set(0, 0, 0);
        parentGroupRef.current.position.set(0, 0, 0);
      }

      // Squash and stretch spring
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

      // Legs running
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

        // Arms running
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
        // Jumping legs
        if (leftLegRef.current && rightLegRef.current) {
          const isFalling = current.velocity < 0;
          leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, isFalling ? 0.3 : -0.7, 0.2);
          rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, isFalling ? 0.7 : 0.4, 0.2);
          leftLegRef.current.position.y = THREE.MathUtils.lerp(leftLegRef.current.position.y, 0.7, 0.2);
          rightLegRef.current.position.y = THREE.MathUtils.lerp(rightLegRef.current.position.y, 0.7, 0.2);
          leftLegRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
          rightLegRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
        }
        // Jumping arms
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.8, 0.2) + landingBounce.current * 0.5;
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.8, 0.2) + landingBounce.current * 0.5;
          leftArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
          rightArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
        }
      }
    }

    // 4. Crouch head pose
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

    // Hurt head wobble
    if (now < storeState.invincibleUntil && status !== 'gameover' && headRef.current && !previewMode) {
      const wobble = Math.sin(now * 0.015) * 0.1;
      headRef.current.rotation.z += wobble;
    }

    // 5. Eating jaw movement
    if (lowerJawRef.current) {
      if (p === 'jaw') {
        lowerJawRef.current.rotation.z = -0.4;
      } else if (isEating) {
        lowerJawRef.current.rotation.z = -Math.abs(Math.sin(time * 15)) * 0.45;
      } else {
        lowerJawRef.current.rotation.z = 0;
      }
    }

    // 6. Wing flapping visual
    if (wingLeftRef.current && wingRightRef.current) {
      if (p === 'wings') {
        if (!isGrounded && current.velocity < 0) {
          wingLeftRef.current.rotation.z = THREE.MathUtils.lerp(wingLeftRef.current.rotation.z, Math.PI / 4, 0.2);
          wingRightRef.current.rotation.z = THREE.MathUtils.lerp(wingRightRef.current.rotation.z, -Math.PI / 4, 0.2);
        } else if (!isGrounded && current.velocity > 0) {
          wingLeftRef.current.rotation.z = Math.sin(time * 30) * 0.8;
          wingRightRef.current.rotation.z = -Math.sin(time * 30) * 0.8;
        } else {
          wingLeftRef.current.rotation.z = Math.sin(time * 2) * 0.1 - 0.2;
          wingRightRef.current.rotation.z = -Math.sin(time * 2) * 0.1 + 0.2;
        }
      }
    }

    // 7. Eye spring blinking logic (Dino eyes)
    const blinkCycle = time % 4.0;
    let targetScaleY = 1.0;

    if (status === 'gameover') {
      targetScaleY = 0.05;
    } else if (now < storeState.invincibleUntil && !previewMode) {
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

  const activePowerup = animState.current.activePowerup;
  const isGhost = activePowerup === 'ghost';
  const outlineColor = isGhost ? '#00ffff' : '#000000';

  return (
    <group ref={parentGroupRef}>
      {/* 1. Main Body in Costume */}
      {/* Onesie Costume Slate-Blue Shell */}
      <mesh position={[-0.1, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.24, 1.04, 0.84]} />
        <primitive object={costumeMaterial} attach="material" />
      </mesh>

      {/* Costume White Underbelly (Aligned to Chest/Front area) */}
      <mesh position={[0.3, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.72, 0.86]} />
        <primitive object={underbellyMaterial} attach="material" />
      </mesh>

      {/* Texture Details (White Spots on onesie) */}
      <mesh position={[0.2, 1.6, 0.43]} castShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.3, 1.4, 0.43]} castShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.9, 0.43]} castShadow={!isGhost}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[0.2, 1.6, -0.43]} castShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.3, 1.4, -0.43]} castShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.9, -0.43]} castShadow={!isGhost}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <primitive object={spotsMaterial} attach="material" />
      </mesh>

      {/* Dino's Spikes Sticking Out of Onesie Back (Dark Blue) */}
      <mesh position={[-0.1, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.5, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.5, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.3, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>

      {/* Costume Tail (Slate-Blue) */}
      <mesh position={[-1.0, 1.0, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.72, 0.72, 0.72]} />
        <primitive object={costumeMaterial} attach="material" />
      </mesh>
      <mesh position={[-1.5, 0.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.62, 0.42, 0.42]} />
        <primitive object={costumeMaterial} attach="material" />
      </mesh>
      {/* Caudal Shark Tail Fin */}
      <mesh position={[-1.85, 0.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.20, 0.80, 0.1]} />
        <primitive object={costumeMaterial} attach="material" />
      </mesh>
      {/* Dino's Tail Spikes Sticking Out */}
      <mesh position={[-1.0, 1.5, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.3, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>

      {/* Collar & Tag */}
      <mesh position={[0.4, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.6, 0.2, 0.9]} />
        <primitive object={collarMaterial} attach="material" />
      </mesh>
      <mesh position={[0.7, 1.6, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.3, 0.3]} />
        <meshStandardMaterial color={goldColor} transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
      </mesh>

      {/* 2. Head Group (Dino face inside the Shark hood) */}
      <group ref={headRef} position={[0.5, 0, 0]}>
        {/* Dark Blue T-Rex Head (inside the onesie) */}
        <mesh position={[0.4, 2.2, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[1.2, 0.9, 1]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Dark Blue T-Rex Snout */}
        <mesh position={[1.1, 2.1, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.6, 0.7, 0.9]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Nostrils */}
        <mesh position={[1.25, 2.1, 0.46]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color="#27272a" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
        </mesh>
        <mesh position={[1.25, 2.1, -0.46]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshBasicMaterial color="#27272a" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
        </mesh>

        {/* Dino Teeth/Fangs */}
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

        {/* Lower Jaw (Dark Blue) */}
        <mesh ref={lowerJawRef} position={[0.95, 1.7, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.5, 0.1, 0.8]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* SHARK HOOD COVER (Onesie Hood, Slate-Blue) - PUFFY WITH MORE VOLUME */}
        {/* Back Wall */}
        <mesh position={[-0.2, 2.2, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.2, 1.25, 1.34]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>
        {/* Top Wall */}
        <mesh position={[0.2, 2.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.75, 0.1, 1.34]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>
        {/* Left Side Wall (stepped diagonal, shifted outwards for Z-volume) */}
        <mesh position={[0.25, 2.56, 0.63]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.7, 0.45, 0.08]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>
        <mesh position={[0.15, 2.15, 0.63]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.7, 0.38, 0.08]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>
        <mesh position={[0.0, 1.78, 0.63]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.8, 0.38, 0.08]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>

        {/* Right Side Wall (stepped diagonal, shifted outwards for Z-volume) */}
        <mesh position={[0.2, 2.52, -0.63]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.7, 0.45, 0.08]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>
        <mesh position={[0.15, 2.15, -0.63]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.7, 0.45, 0.08]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>
        <mesh position={[0.0, 1.78, -0.63]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.8, 0.38, 0.08]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>

        {/* White Hood opening rim/lining - STEPPED DIAGONAL RUNNING FROM (0.72, 2.78) DOWN TO (0.4, 1.7) */}
        {/* Top Rim */}
        <mesh position={[0.62, 2.80, 0]} castShadow={!isGhost}>
          <boxGeometry args={[0.09, 0.1, 1.34]} />
          <primitive object={underbellyMaterial} attach="material" />
        </mesh>

        {/* Left Rim segments */}
        <mesh position={[0.62, 2.52, 0.63]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.38, 0.08]} />
          <primitive object={underbellyMaterial} attach="material" />
        </mesh>
        <mesh position={[0.52, 2.15, 0.63]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.38, 0.08]} />
          <primitive object={underbellyMaterial} attach="material" />
        </mesh>
        <mesh position={[0.42, 1.78, 0.63]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.38, 0.08]} />
          <primitive object={underbellyMaterial} attach="material" />
        </mesh>

        {/* Right Rim segments */}
        <mesh position={[0.62, 2.52, -0.63]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.38, 0.08]} />
          <primitive object={underbellyMaterial} attach="material" />
        </mesh>
        <mesh position={[0.52, 2.15, -0.63]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.38, 0.08]} />
          <primitive object={underbellyMaterial} attach="material" />
        </mesh>
        <mesh position={[0.42, 1.78, -0.63]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.38, 0.08]} />
          <primitive object={underbellyMaterial} attach="material" />
        </mesh>

        {/* Hood Shark Teeth (Pointing down from top rim) */}
        <mesh position={[0.62, 2.68, 0.44]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.62, 2.68, 0.22]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.62, 2.68, -0.22]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.62, 2.68, -0.44]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>

        {/* Upper Side Teeth (Pointing inward/downward) */}
        <mesh position={[0.62, 2.45, 0.62]} castShadow={!isGhost} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.62, 2.45, -0.62]} castShadow={!isGhost} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>

        {/* Mid Side Teeth (Pointing inward) */}
        <mesh position={[0.52, 2.15, 0.62]} castShadow={!isGhost} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.52, 2.15, -0.62]} castShadow={!isGhost} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>

        {/* Lower Side Teeth (Pointing inward/upward) */}
        <mesh position={[0.42, 1.85, 0.62]} castShadow={!isGhost} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.42, 1.85, -0.62]} castShadow={!isGhost} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>

        {/* Bottom Hood Lining rim (White lining on bottom jaw rim area) */}
        <mesh position={[0.38, 1.62, 0]} castShadow={!isGhost}>
          <boxGeometry args={[1.05, 0.1, 1.15]} />
          <primitive object={underbellyMaterial} attach="material" />
        </mesh>

        {/* Bottom Teeth (Pointing up from bottom hood lining) */}
        <mesh position={[0.48, 1.68, 0.36]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.48, 1.68, 0.18]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.48, 1.68, -0.18]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>
        <mesh position={[0.48, 1.68, -0.36]} castShadow={!isGhost}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <primitive object={teethMaterial} attach="material" />
        </mesh>

        {/* Printed Shark Eye Left on the hood side */}
        <mesh position={[0.15, 2.4, 0.67]} castShadow={!isGhost}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
          <primitive object={hoodEyeMaterial} attach="material" />
        </mesh>
        {/* Printed Shark Eye Right on the hood side */}
        <mesh position={[0.15, 2.4, -0.67]} castShadow={!isGhost}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
          <primitive object={hoodEyeMaterial} attach="material" />
        </mesh>

        {/* Dino's actual eye Left (fully visible inside the stepped hood opening) */}
        <group ref={leftEyeGroupRef} position={[0.65, 2.4, 0]}>
          <mesh position={[0, 0, 0.50]} castShadow={!isGhost}>
            <boxGeometry args={[0.34, 0.39, 0.03]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0, 0, 0.50]} castShadow={!isGhost}>
            <boxGeometry args={[0.30, 0.35, 0.04]} />
            <meshBasicMaterial
              color={activePowerup === 'jaw' || activePowerup === 'super' ? '#ef4444' : '#ffffff'}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          <mesh position={[0.1, 0, 0.52]} castShadow={!isGhost}>
            <boxGeometry args={[0.12, 0.14, 0.02]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0.1, 0.03, 0.53]} castShadow={!isGhost}>
            <boxGeometry args={[0.05, 0.05, 0.01]} />
            <meshBasicMaterial color="white" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
        </group>

        {/* Dino's actual eye Right (fully visible inside the stepped hood opening) */}
        <group ref={rightEyeGroupRef} position={[0.65, 2.4, 0]}>
          <mesh position={[0, 0, -0.50]} castShadow={!isGhost}>
            <boxGeometry args={[0.34, 0.39, 0.03]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0, 0, -0.50]} castShadow={!isGhost}>
            <boxGeometry args={[0.30, 0.35, 0.04]} />
            <meshBasicMaterial
              color={activePowerup === 'jaw' || activePowerup === 'super' ? '#ef4444' : '#ffffff'}
              transparent={isGhost}
              opacity={isGhost ? 0.4 : 1.0}
            />
          </mesh>
          <mesh position={[0.1, 0, -0.52]} castShadow={!isGhost}>
            <boxGeometry args={[0.12, 0.14, 0.02]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
          <mesh position={[0.1, 0.03, -0.53]} castShadow={!isGhost}>
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

      {/* Arms (Dark blue hands coming out of slate-blue sleeves) */}
      <group position={[0.6, 1.2, 0.50]}>
        {/* Onesie Sleeve */}
        <mesh castShadow={!isGhost}>
          <boxGeometry args={[0.15, 0.22, 0.22]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>
        {/* Dino hand sticking out */}
        <mesh ref={leftArmRef} position={[0.18, -0.01, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.22, 0.18, 0.18]} />
          <primitive object={dinoMaterial} attach="material" />
          {/* Black Claws */}
          <mesh position={[0.13, 0, 0.05]}>
            <boxGeometry args={[0.06, 0.04, 0.04]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[0.13, 0, -0.05]}>
            <boxGeometry args={[0.06, 0.04, 0.04]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </mesh>
      </group>

      <group position={[0.6, 1.2, -0.50]}>
        {/* Onesie Sleeve */}
        <mesh castShadow={!isGhost}>
          <boxGeometry args={[0.15, 0.22, 0.22]} />
          <primitive object={costumeMaterial} attach="material" />
        </mesh>
        {/* Dino hand sticking out */}
        <mesh ref={rightArmRef} position={[0.18, -0.01, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.22, 0.18, 0.18]} />
          <primitive object={dinoMaterial} attach="material" />
          {/* Black Claws */}
          <mesh position={[0.13, 0, 0.05]}>
            <boxGeometry args={[0.06, 0.04, 0.04]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[0.13, 0, -0.05]}>
            <boxGeometry args={[0.06, 0.04, 0.04]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </mesh>
      </group>

      {/* Legs (Dark blue legs coming out of onesie pant cuffs) */}
      <mesh ref={leftLegRef} position={[-0.2, 0.7, 0.35]} castShadow={!isGhost} receiveShadow={!isGhost}>
        {/* Onesie pant cuff */}
        <boxGeometry args={[0.52, 0.52, 0.42]} />
        <primitive object={costumeMaterial} attach="material" />
        {/* Dino lower leg/foot sticking out */}
        <mesh position={[0.12, -0.3, 0]}>
          <boxGeometry args={[0.56, 0.3, 0.44]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.1, -0.15, 0]}>
            <boxGeometry args={[0.5, 0.05, 0.42]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>
          {/* Claws */}
          <mesh position={[0.32, -0.12, 0.15]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[0.32, -0.12, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[0.32, -0.12, -0.15]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </mesh>
      </mesh>

      <mesh ref={rightLegRef} position={[0.2, 0.7, -0.35]} castShadow={!isGhost} receiveShadow={!isGhost}>
        {/* Onesie pant cuff */}
        <boxGeometry args={[0.52, 0.52, 0.42]} />
        <primitive object={costumeMaterial} attach="material" />
        {/* Dino lower leg/foot sticking out */}
        <mesh position={[0.12, -0.3, 0]}>
          <boxGeometry args={[0.56, 0.3, 0.44]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.1, -0.15, 0]}>
            <boxGeometry args={[0.5, 0.05, 0.42]} />
            <primitive object={dinoMaterial} attach="material" />
          </mesh>
          {/* Claws */}
          <mesh position={[0.32, -0.12, 0.15]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[0.32, -0.12, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[0.32, -0.12, -0.15]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#000" />
          </mesh>
        </mesh>
      </mesh>
    </group>
  );
}
