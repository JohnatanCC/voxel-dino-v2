import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SkinConfig } from '../../../store/gameStore';
import { DinoModelProps } from '../types';

interface DuckDinoProps extends DinoModelProps {
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
  material,
  children
}: VoxelProps) {
  const voxelMaterial = useMemo(() => material || new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.8,
    transparent: isGhost,
    opacity: isGhost ? 0.45 : 1.0,
  }), [color, isGhost, material]);

  const outlineMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#000000',
    transparent: isGhost,
    opacity: isGhost ? 0.35 : 1.0,
    side: THREE.BackSide
  }), [isGhost]);

  return (
    <group position={position} rotation={rotation}>
      {/* Black Outline (Slightly larger box) */}
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

export function DuckDinoModel({ animState, previewMode = false, skinConfig }: DuckDinoProps) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const wingLeftRef = useRef<THREE.Group>(null);
  const wingRightRef = useRef<THREE.Group>(null);
  const lowerJawRef = useRef<THREE.Group>(null);

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

  // Colors based on skin configuration
  const baseColor = skinConfig.baseColor; // Yellow
  const beakColor = skinConfig.spotsColor; // Orange
  const antlerColor = skinConfig.spikesColor; // Brown
  const collarColor = skinConfig.collarColor; // Red

  // Use materials
  const dinoMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.8,
  }), [baseColor]);

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
    const storeState = useGameStore.getState();

    // 1. Invincibility blink
    if (now < storeState.invincibleUntil) {
      const isWhite = Math.floor(now / 150) % 2 === 0;
      dinoMaterial.color.set(isWhite ? "#ffffff" : baseColor);
    } else {
      dinoMaterial.color.set(baseColor);
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
        headRef.current.position.set(0.4, 1.8, 0);
      }
      if (lowerJawRef.current) lowerJawRef.current.rotation.z = 0;
      if (wingLeftRef.current) wingLeftRef.current.rotation.z = 0;
      if (wingRightRef.current) wingRightRef.current.rotation.z = 0;
      return;
    }

    // 3. Game Over pose
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
        headRef.current.position.set(0.4, 1.6, 0);
      }
      if (parentGroupRef.current) {
        parentGroupRef.current.rotation.x = THREE.MathUtils.lerp(parentGroupRef.current.rotation.x, Math.PI / 2, 0.1);
        parentGroupRef.current.position.y = THREE.MathUtils.lerp(parentGroupRef.current.position.y, 0.55, 0.1);
        parentGroupRef.current.position.x = THREE.MathUtils.lerp(parentGroupRef.current.position.x, -0.2, 0.1);
      }
    } else {
      // Normal running / jump loop
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

      // Leg running animations
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

        // Arm running animations
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
        // Jumping arms
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.8, 0.2) + landingBounce.current * 0.5;
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.8, 0.2) + landingBounce.current * 0.5;
          leftArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
          rightArmRef.current.scale.set(legScaleXZ, legScaleY, legScaleXZ);
        }
      }
    }

    // 4. Crouch and head positioning
    if (isUnderground) {
      if (headRef.current) {
        headRef.current.position.y = 1.5;
        headRef.current.position.x = 0.4;
        headRef.current.rotation.z = 0;
      }
    } else if (isCrouching) {
      if (headRef.current) {
        headRef.current.position.y = 1.5;
        headRef.current.position.x = 0.5;
        headRef.current.rotation.z = 0.15;
      }
    } else {
      if (headRef.current && status !== 'gameover') {
        headRef.current.position.y = 1.8;
        headRef.current.position.x = 0.4;
        if (isGrounded && p !== 'ghost') {
          headRef.current.rotation.z = Math.sin(phase) * 0.1 - 0.05;
          headRef.current.position.x = 0.4 + Math.sin(phase) * 0.05;
        } else if (current.velocity < 0) {
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.2, 0.1);
        }
      }
    }

    // Hurt wobble on head
    const isHurt = now < storeState.invincibleUntil;
    if (isHurt && status !== 'gameover' && headRef.current && !previewMode) {
      const wobble = Math.sin(now * 0.015) * 0.1;
      headRef.current.rotation.z += wobble;
      headRef.current.position.x += wobble * 0.05;
      headRef.current.position.y += Math.abs(wobble) * 0.05;
    }

    // 5. Eating beak movement
    if (lowerJawRef.current) {
      if (isEating) {
        lowerJawRef.current.rotation.z = -Math.abs(Math.sin(state.clock.getElapsedTime() * 15)) * 0.45;
      } else {
        lowerJawRef.current.rotation.z = p === 'super' ? -0.4 : 0;
      }
    }

    // 6. Wing flapping animation
    if (wingLeftRef.current && wingRightRef.current) {
      if (p === 'wings') {
        const time = state.clock.getElapsedTime();
        if (!isGrounded && current.velocity < 0) {
          wingLeftRef.current.rotation.z = THREE.MathUtils.lerp(wingLeftRef.current.rotation.z, Math.PI / 4, 0.2);
          wingRightRef.current.rotation.z = THREE.MathUtils.lerp(wingRightRef.current.rotation.z, -Math.PI / 4, 0.2);
        } else if (!isGrounded && current.velocity > 0) {
          wingLeftRef.current.rotation.z = Math.sin(time * 30) * 0.8;
          wingRightRef.current.rotation.z = -Math.sin(time * 30) * 0.8;
        } else {
          wingLeftRef.current.rotation.z = Math.sin(time * 2) * 0.05;
          wingRightRef.current.rotation.z = -Math.sin(time * 2) * 0.05;
        }
      } else {
        // Standard folded duck wing posture
        wingLeftRef.current.rotation.z = 0;
        wingRightRef.current.rotation.z = 0;
      }
    }

    // 7. Eye spring blinking animation
    const time = state.clock.getElapsedTime();
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

  return (
    <group ref={parentGroupRef}>
      {/* 1. Main Yellow Body */}
      <Voxel position={[-0.1, 1.15, 0]} args={[1.3, 1.1, 0.9]} color={baseColor} isGhost={isGhost}>
        {/* Collar / Tie */}
        <Voxel position={[0.65, 0.1, 0]} args={[0.08, 0.2, 0.4]} color={collarColor} isGhost={isGhost} />
        
        {/* Cute Upturned Duck Tail */}
        <Voxel position={[-0.75, 0.25, 0]} rotation={[0, 0, 0.35]} args={[0.3, 0.3, 0.45]} color={baseColor} isGhost={isGhost} />
        <Voxel position={[-0.88, 0.4, 0]} rotation={[0, 0, 0.55]} args={[0.2, 0.25, 0.3]} color={baseColor} isGhost={isGhost} />
      </Voxel>

      {/* 2. Head Group */}
      <group ref={headRef} position={[0.4, 1.8, 0]}>
        {/* Main Yellow Head */}
        <Voxel position={[0, 0.4, 0]} args={[1.1, 1.1, 1.1]} color={baseColor} isGhost={isGhost}>
          
          {/* Antlers Left */}
          <group position={[-0.1, 0.55, 0.35]}>
            {/* Antler Base Stalk */}
            <Voxel position={[0, 0.25, 0]} args={[0.16, 0.5, 0.16]} color={antlerColor} isGhost={isGhost} />
            {/* Antler Front Prong */}
            <Voxel position={[0.15, 0.35, 0]} args={[0.2, 0.12, 0.12]} color={antlerColor} isGhost={isGhost} />
            {/* Antler Upper Stalk */}
            <Voxel position={[-0.05, 0.6, 0.1]} args={[0.14, 0.35, 0.14]} color={antlerColor} isGhost={isGhost} />
            {/* Antler Back Prong */}
            <Voxel position={[-0.2, 0.5, 0.05]} args={[0.18, 0.12, 0.12]} color={antlerColor} isGhost={isGhost} />
          </group>

          {/* Antlers Right */}
          <group position={[-0.1, 0.55, -0.35]}>
            {/* Antler Base Stalk */}
            <Voxel position={[0, 0.25, 0]} args={[0.16, 0.5, 0.16]} color={antlerColor} isGhost={isGhost} />
            {/* Antler Front Prong */}
            <Voxel position={[0.15, 0.35, 0]} args={[0.2, 0.12, 0.12]} color={antlerColor} isGhost={isGhost} />
            {/* Antler Upper Stalk */}
            <Voxel position={[-0.05, 0.6, -0.1]} args={[0.14, 0.35, 0.14]} color={antlerColor} isGhost={isGhost} />
            {/* Antler Back Prong */}
            <Voxel position={[-0.2, 0.5, -0.05]} args={[0.18, 0.12, 0.12]} color={antlerColor} isGhost={isGhost} />
          </group>

          {/* Big Cartoon Eye Left */}
          <group ref={leftEyeGroupRef} position={[0.35, 0.15, 0.56]}>
            {/* White Sclera */}
            <Voxel position={[0, 0, 0]} args={[0.35, 0.35, 0.05]} color="#ffffff" isGhost={isGhost} />
            {/* Brown Pupil */}
            <Voxel position={[0.05, 0, 0.01]} args={[0.16, 0.16, 0.05]} color={antlerColor} isGhost={isGhost} outline={false} />
          </group>

          {/* Big Cartoon Eye Right */}
          <group ref={rightEyeGroupRef} position={[0.35, 0.15, -0.56]}>
            {/* White Sclera */}
            <Voxel position={[0, 0, 0]} args={[0.35, 0.35, 0.05]} color="#ffffff" isGhost={isGhost} />
            {/* Brown Pupil */}
            <Voxel position={[0.05, 0, -0.01]} args={[0.16, 0.16, 0.05]} color={antlerColor} isGhost={isGhost} outline={false} />
          </group>

          {/* Upper Orange Duck Beak */}
          <Voxel position={[0.7, -0.15, 0]} args={[0.55, 0.22, 0.8]} color={beakColor} isGhost={isGhost} />
        </Voxel>

        {/* Lower Beak (Moving Jaw) */}
        <group ref={lowerJawRef} position={[0.15, 0.1, 0]}>
          <Voxel position={[0.45, -0.32, 0]} args={[0.45, 0.14, 0.7]} color={beakColor} isGhost={isGhost} />
        </group>
      </group>

      {/* 3. Small Duck Wings (Folded on the sides, animated when flapping) */}
      <group ref={wingLeftRef} position={[-0.1, 1.2, 0.46]}>
        <Voxel position={[-0.1, 0, 0.04]} args={[0.45, 0.45, 0.08]} color={baseColor} isGhost={isGhost} />
      </group>
      <group ref={wingRightRef} position={[-0.1, 1.2, -0.46]}>
        <Voxel position={[-0.1, 0, -0.04]} args={[0.45, 0.45, 0.08]} color={baseColor} isGhost={isGhost} />
      </group>

      {/* 4. Left Arm (Tiny cartoon duck hand/wingtip) */}
      <mesh ref={leftArmRef} position={[0.5, 1.0, 0.48]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.15, 0.15]} />
        <meshStandardMaterial color={baseColor} roughness={0.8} transparent={isGhost} opacity={isGhost ? 0.45 : 1.0} />
      </mesh>

      {/* 5. Right Arm (Tiny cartoon duck hand/wingtip) */}
      <mesh ref={rightArmRef} position={[0.5, 1.0, -0.48]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.15, 0.15]} />
        <meshStandardMaterial color={baseColor} roughness={0.8} transparent={isGhost} opacity={isGhost ? 0.45 : 1.0} />
      </mesh>

      {/* 6. Legs & Webbed Feet */}
      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.2, 0.7, 0.35]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.5, 0.25]} />
        <meshStandardMaterial color={baseColor} roughness={0.8} transparent={isGhost} opacity={isGhost ? 0.45 : 1.0} />
        {/* Left Orange Webbed Foot */}
        <group position={[0.1, -0.28, 0]}>
          {/* Main flat foot */}
          <Voxel position={[0.15, 0, 0.05]} args={[0.55, 0.08, 0.45]} color={beakColor} isGhost={isGhost} />
          {/* Left foot flap */}
          <Voxel position={[0.15, 0, 0.28]} args={[0.4, 0.08, 0.08]} color={beakColor} isGhost={isGhost} />
        </group>
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[-0.2, 0.7, -0.35]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.5, 0.25]} />
        <meshStandardMaterial color={baseColor} roughness={0.8} transparent={isGhost} opacity={isGhost ? 0.45 : 1.0} />
        {/* Right Orange Webbed Foot */}
        <group position={[0.1, -0.28, 0]}>
          {/* Main flat foot */}
          <Voxel position={[0.15, 0, -0.05]} args={[0.55, 0.08, 0.45]} color={beakColor} isGhost={isGhost} />
          {/* Right foot flap */}
          <Voxel position={[0.15, 0, -0.28]} args={[0.4, 0.08, 0.08]} color={beakColor} isGhost={isGhost} />
        </group>
      </mesh>
    </group>
  );
}
