import { forwardRef, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EggRarity } from '../store/gameStore';

// Highly optimized cached materials for voxel egg rendering
const commonMaterial = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.8 });
const rareMaterial = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.8, metalness: 0.2 });
const ultraRareMaterial = new THREE.MeshStandardMaterial({ color: '#a855f7', roughness: 0.8, metalness: 0.3, emissive: '#3b0764', emissiveIntensity: 0.3 });

// Spoted details for voxel eggs
const commonSpotMaterial = new THREE.MeshStandardMaterial({ color: '#86efac', roughness: 0.7 });
const rareSpotMaterial = new THREE.MeshStandardMaterial({ color: '#93c5fd', roughness: 0.7 });
const ultraRareSpotMaterial = new THREE.MeshStandardMaterial({ color: '#c084fc', roughness: 0.7 });

// Voxel egg geometries
const coreGeo = new THREE.BoxGeometry(0.5, 0.75, 0.5);
const horizontalBeltGeo = new THREE.BoxGeometry(0.62, 0.45, 0.62);
const verticalCoreGeo = new THREE.BoxGeometry(0.4, 0.85, 0.4);
const spotGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);

interface VoxelEggProps {
  rarity: EggRarity;
  x?: number;
  y?: number;
  isCollected?: boolean;
  scale?: number;
}

export const VoxelEgg = forwardRef<THREE.Group, VoxelEggProps>(
  ({ rarity, x = 0, y = 0.3, isCollected = false, scale = 1.0 }, ref) => {
    const groupRef = useRef<THREE.Group>(null);

    // Dynamic rotation and hover bounce for eggs waiting on the ground
    useFrame((state) => {
      if (isCollected) return; // Follower logic handles positioning
      if (groupRef.current) {
        const time = state.clock.getElapsedTime();
        // Hover bounce
        groupRef.current.position.y = y + Math.sin(time * 6 + x) * 0.08;
        // Rotation
        groupRef.current.rotation.y = time * 2;
      }
    });

    const mat = rarity === 'ultraRare' ? ultraRareMaterial : rarity === 'rare' ? rareMaterial : commonMaterial;
    const spotMat = rarity === 'ultraRare' ? ultraRareSpotMaterial : rarity === 'rare' ? rareSpotMaterial : commonSpotMaterial;

    return (
      <group ref={ref || groupRef} position={[x, isCollected ? 0 : y, 0]} scale={scale}>
        {/* Core block */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow material={mat} geometry={coreGeo} />
        
        {/* Horizontal girth */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow material={mat} geometry={horizontalBeltGeo} />
        
        {/* Vertical tip */}
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow material={mat} geometry={verticalCoreGeo} />
        
        {/* Rounded voxel spots */}
        <mesh position={[0.26, 0.48, 0.18]} castShadow material={spotMat} geometry={spotGeo} />
        <mesh position={[-0.26, 0.3, -0.18]} castShadow material={spotMat} geometry={spotGeo} />
        <mesh position={[0.18, 0.36, -0.26]} castShadow material={spotMat} geometry={spotGeo} />
        <mesh position={[-0.18, 0.54, 0.26]} castShadow material={spotMat} geometry={spotGeo} />
      </group>
    );
  }
);
