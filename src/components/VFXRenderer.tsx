import { useRef, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const PARTICLE_COUNT = 500;
const DUST_COLOR = new THREE.Color('#a8a29e');
const SPARKLE_COLOR = new THREE.Color('#fde047');
const EXPLOSION_COLOR = new THREE.Color('#44403c');

interface ParticleData {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  color: THREE.Color;
  type?: 'dust' | 'sparkle' | 'explosion' | 'absorb';
}

const particlesData: ParticleData[] = Array.from({ length: PARTICLE_COUNT }, () => ({
  active: false,
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  life: 0,
  maxLife: 1,
  scale: 1,
  color: new THREE.Color(),
  type: 'dust',
}));

let particleIndex = 0;

export const spawnParticles = (
  type: 'dust' | 'sparkle' | 'explosion' | 'absorb',
  position: THREE.Vector3 | [number, number, number],
  count: number = 10,
  color?: string
) => {
  for (let i = 0; i < count; i++) {
    const p = particlesData[particleIndex];
    p.active = true;
    p.type = type;
    
    if (Array.isArray(position)) {
      p.position.set(position[0], position[1], position[2]);
    } else {
      p.position.copy(position);
    }
    
    if (type === 'dust') {
      p.velocity.set(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.1 + 0.05,
        (Math.random() - 0.5) * 0.1
      );
      p.life = p.maxLife = Math.random() * 0.5 + 0.5;
      p.scale = Math.random() * 0.3 + 0.1;
      p.color.copy(color ? new THREE.Color(color) : DUST_COLOR);
    } else if (type === 'sparkle') {
      p.velocity.set(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.3 + 0.1,
        (Math.random() - 0.5) * 0.2
      );
      p.life = p.maxLife = Math.random() * 0.8 + 0.2;
      p.scale = Math.random() * 0.2 + 0.05;
      p.color.copy(color ? new THREE.Color(color) : SPARKLE_COLOR);
    } else if (type === 'explosion') {
      p.velocity.set(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5 + 0.2,
        (Math.random() - 0.5) * 0.5
      );
      p.life = p.maxLife = Math.random() * 0.6 + 0.4;
      p.scale = Math.random() * 0.5 + 0.2;
      p.color.copy(color ? new THREE.Color(color) : EXPLOSION_COLOR);
    } else if (type === 'absorb') {
      // Spawn in a sphere/circle around position
      const radius = 2.5 + Math.random() * 1.5;
      const angle = Math.random() * Math.PI * 2;
      const offsetHeight = (Math.random() - 0.5) * 2;
      
      p.position.set(
        p.position.x + Math.cos(angle) * radius,
        p.position.y + offsetHeight,
        p.position.z + Math.sin(angle) * radius
      );
      p.velocity.set(0, 0, 0);
      p.life = p.maxLife = Math.random() * 1.5 + 1.0;
      p.scale = Math.random() * 0.22 + 0.08;
      p.color.copy(color ? new THREE.Color(color) : SPARKLE_COLOR);
    }

    particleIndex = (particleIndex + 1) % PARTICLE_COUNT;
  }
};

export function VFXRenderer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorArray = useRef(new Float32Array(PARTICLE_COUNT * 3));
  
  useLayoutEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      dummy.position.set(0, -100, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        meshRef.current.setColorAt(i, new THREE.Color(0,0,0));
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceColor!.needsUpdate = true;
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const dummy = new THREE.Object3D();
    const speed = useGameStore.getState().speed;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particlesData[i];
      if (p.active) {
        p.life -= delta;
        if (p.life <= 0) {
          p.active = false;
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        // Physics
        if (p.type === 'absorb') {
          // Gently attract to player target at x = 2
          const targetX = 2.0;
          const targetY = 1.0;
          const targetZ = 0.0;
          p.position.x = THREE.MathUtils.lerp(p.position.x, targetX, 0.03);
          p.position.y = THREE.MathUtils.lerp(p.position.y, targetY, 0.03);
          p.position.z = THREE.MathUtils.lerp(p.position.z, targetZ, 0.03);
        } else {
          p.velocity.y -= 0.5 * delta; // Gravity
          p.position.add(p.velocity);
          
          // Move backwards with world
          if (useGameStore.getState().status === 'playing') {
            p.position.x -= useGameStore.getState().getCurrentSpeed() * delta;
          }
        }

        dummy.position.copy(p.position);
        
        // Shrink over time
        const currentScale = p.scale * (p.life / p.maxLife);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, p.color);
      }
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh frustumCulled={false} ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}
