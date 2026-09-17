import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Dragon powerup projectile: a small spinning fireball fired forward every few seconds,
// destroying whatever obstacle it touches. See Game.tsx for spawn/movement/collision logic.

const fireballCoreGeo = new THREE.SphereGeometry(0.32, 10, 8);
const fireballGlowGeo = new THREE.SphereGeometry(0.48, 10, 8);
const fireballCoreMaterial = new THREE.MeshStandardMaterial({ color: '#fde047', emissive: '#f97316', emissiveIntensity: 2.0, roughness: 0.3 });
const fireballGlowMaterial = new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.35 });

export const Fireball = forwardRef<THREE.Group, { x: number; y: number }>(({ x, y }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const t = clock.getElapsedTime();
      innerRef.current.rotation.x = t * 8;
      innerRef.current.rotation.z = t * 6;
    }
  });

  return (
    <group ref={innerRef} position={[x, y, 0]} visible={false}>
      <mesh geometry={fireballGlowGeo} material={fireballGlowMaterial} />
      <mesh geometry={fireballCoreGeo} material={fireballCoreMaterial} castShadow />
    </group>
  );
});
