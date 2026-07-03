import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export interface MountainsProps {
  baseColor: string;
  topColor: string;
  count?: number;
  length?: number;
  speedFactor?: number;
  minScaleY?: number;
  maxScaleY?: number;
  zOffset?: number;
}

export function Mountains({
  baseColor,
  topColor,
  count = 20,
  length = 150,
  speedFactor = 0.2, // This is the parallax factor
  minScaleY = 3,
  maxScaleY = 11,
  zOffset = -45
}: MountainsProps) {
  const { status, speed } = useGameStore();
  const mountainRef = useRef<THREE.InstancedMesh>(null);
  const mountainTopRef = useRef<THREE.InstancedMesh>(null);

  const mountainsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const scaleY = minScaleY + Math.random() * (maxScaleY - minScaleY);
      const baseScale = scaleY * (0.8 + Math.random() * 0.6); // Scale width proportionally to height
      data.push({
        x: (Math.random() - 0.5) * length,
        y: scaleY / 2 - 1,
        z: zOffset - Math.random() * 15,
        scaleX: baseScale,
        scaleY: scaleY,
        scaleZ: baseScale,
        rotY: Math.PI / 4 // face camera directly
      });
    }
    return data;
  }, [count, length, minScaleY, maxScaleY, zOffset]);

  useFrame((_, delta) => {
    if (status !== 'playing' && status !== 'menu') return;
    if (!mountainRef.current || !mountainTopRef.current) return;

    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta * speedFactor;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const d = mountainsData[i];
      d.x -= moveDistance;
      
      if (d.x < -length / 2) {
        d.x += length;
        d.z = zOffset - Math.random() * 15;
      }
      
      // Base
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(d.scaleX, d.scaleY, d.scaleZ);
      dummy.updateMatrix();
      mountainRef.current.setMatrixAt(i, dummy.matrix);
      
      // Top
      const factor = 0.3; // Top 30%
      dummy.position.set(d.x, d.y + (1 - factor) * d.scaleY / 2, d.z);
      dummy.scale.set(d.scaleX * factor * 1.05, d.scaleY * factor, d.scaleZ * factor * 1.05);
      dummy.updateMatrix();
      mountainTopRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    mountainRef.current.instanceMatrix.needsUpdate = true;
    mountainTopRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={mountainRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={baseColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={mountainTopRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={topColor} roughness={0.8} />
      </instancedMesh>
    </>
  );
}
