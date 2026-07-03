import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export interface CloudsProps {
  color?: string;
  count?: number;
  length?: number;
  speedFactor?: number;
  opacity?: number;
}

export function Clouds({
  color = '#ffffff',
  count = 8,
  length = 150,
  speedFactor = 0.1,
  opacity = 0.8
}: CloudsProps) {
  const { status, speed } = useGameStore();
  const cloudRef = useRef<THREE.InstancedMesh>(null);

  const cloudsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * length,
        y: 15 + Math.random() * 10,
        z: -20 - Math.random() * 10,
        scaleX: 4 + Math.random() * 6,
        scaleY: 1 + Math.random() * 2,
        scaleZ: 3 + Math.random() * 4,
      });
    }
    return data;
  }, [count, length]);

  useFrame((_, delta) => {
    if (status !== 'playing' && status !== 'menu') return;
    if (!cloudRef.current) return;

    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta * speedFactor;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const d = cloudsData[i];
      d.x -= moveDistance;
      
      if (d.x < -length / 2) {
        d.x += length;
      }
      
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(d.scaleX, d.scaleY, d.scaleZ);
      dummy.updateMatrix();
      cloudRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    cloudRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={cloudRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </instancedMesh>
  );
}
