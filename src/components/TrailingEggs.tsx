import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { VoxelEgg } from './VoxelEgg';

const DINO_X = 2;

// Offset positions for up to 5 eggs in a layer (forming a pyramid/cluster shape)
const LAYER_OFFSETS = [
  { x: 0.0, y: 0.0, z: 0.0 },      // Center bottom
  { x: 0.0, y: 0.0, z: -0.6 },     // Left bottom
  { x: 0.0, y: 0.0, z: 0.6 },      // Right bottom
  { x: -0.1, y: 0.7, z: -0.3 },    // Left top (slightly back)
  { x: -0.1, y: 0.7, z: 0.3 },     // Right top (slightly back)
];

interface TrailingEggsProps {
  dinoRef: React.RefObject<THREE.Group | null>;
}

export function TrailingEggs({ dinoRef }: TrailingEggsProps) {
  const eggsInTail = useGameStore(s => s.eggsInTail);
  const status = useGameStore(s => s.status);

  const groupRef = useRef<THREE.Group>(null);
  const yHistory = useRef<number[]>([]);

  // Clear history on status change or restart
  useEffect(() => {
    yHistory.current = [];
  }, [status]);

  useFrame((state) => {
    // 1. Record Dino's current visual Y position
    let currentDinoY = 0;
    if (dinoRef.current && dinoRef.current.parent) {
      const parent = dinoRef.current.parent;
      const visualGroup = parent.children.find(child => child !== dinoRef.current && child instanceof THREE.Group);
      if (visualGroup) {
        currentDinoY = visualGroup.position.y;
      }
    }

    yHistory.current.unshift(currentDinoY);
    if (yHistory.current.length > 200) {
      yHistory.current.pop();
    }

    if (!groupRef.current) return;

    // 2. Adjust for Super power-up scaling
    const activePowerup = useGameStore.getState().activePowerup;
    const isSuper = activePowerup === 'super';
    const scaleMultiplier = isSuper ? 2.5 : 1.0;

    const children = groupRef.current.children;
    const count = Math.min(children.length, eggsInTail.length);

    // Same delay for all eggs to jump at the same time
    const delay = 8;
    const dinoJumpY = yHistory.current[delay] ?? yHistory.current[yHistory.current.length - 1] ?? 0;

    for (let i = 0; i < count; i++) {
      const child = children[i] as THREE.Group;

      const layerIndex = Math.floor(i / 5);
      const idxInLayer = i % 5;
      const offset = LAYER_OFFSETS[idxInLayer];

      // Eggs are grouped in layers, moving backwards on the X axis
      const targetX = DINO_X - (0.8 + layerIndex * 1.1) * scaleMultiplier + offset.x * scaleMultiplier;
      const targetY = dinoJumpY + offset.y * scaleMultiplier;
      const targetZ = offset.z * scaleMultiplier;

      // Increased size to match the scale of the eggs in the scenario (default is 1.0)
      const targetScale = 1.0 * scaleMultiplier;

      // Lerp X, Y, Z, and scale for smooth follow dynamics
      child.position.x = THREE.MathUtils.lerp(child.position.x, targetX, 0.15);
      child.position.y = THREE.MathUtils.lerp(child.position.y, targetY, 0.2);
      child.position.z = THREE.MathUtils.lerp(child.position.z, targetZ, 0.15);

      const currentScale = THREE.MathUtils.lerp(child.scale.x, targetScale, 0.15);
      child.scale.set(currentScale, currentScale, currentScale);

      // Add a slight rolling rotation to the eggs to match running action
      if (status === 'playing') {
        const speed = useGameStore.getState().getCurrentSpeed();
        const rollSpeed = speed * 0.8;
        child.rotation.z = Math.sin(state.clock.getElapsedTime() * rollSpeed - i * 0.5) * 0.12;
      } else {
        child.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {eggsInTail.map((egg) => (
        <VoxelEgg
          key={egg.id}
          rarity={egg.rarity}
          isCollected={true}
        />
      ))}
    </group>
  );
}
