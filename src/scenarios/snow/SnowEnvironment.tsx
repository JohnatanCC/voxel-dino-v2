import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export function SnowEnvironment() {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const { gameTime } = useGameStore.getState();
    const CYCLE_DURATION = 200;
    const phase = (gameTime % CYCLE_DURATION) / CYCLE_DURATION;
    
    if (meshRef.current) {
      // Only visible at night
      const isNight = phase >= 0.45 && phase <= 0.95;
      meshRef.current.visible = isNight;
      
      if (isNight) {
        meshRef.current.children.forEach((child, i) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshBasicMaterial;
            const pulse = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.5 + 0.5;
            material.opacity = 0.2 + pulse * 0.3;
            child.position.x += Math.sin(state.clock.elapsedTime * 0.2 + i * 2) * 0.05;
          }
        });
      }
    }
  });

  const planes = useMemo(() => {
    const items = [];
    const colors = ['#34d399', '#6ee7b7', '#a7f3d0', '#818cf8', '#6366f1'];
    for (let i = 0; i < 5; i++) {
      items.push({
        position: [Math.random() * 80 - 40, 20 + Math.random() * 10, -30 - Math.random() * 10] as [number, number, number],
        rotation: [0, 0, Math.random() * 0.5 - 0.25] as [number, number, number],
        scale: [30 + Math.random() * 20, 15 + Math.random() * 10, 1] as [number, number, number],
        color: colors[i % colors.length]
      });
    }
    return items;
  }, []);

  return (
    <group ref={meshRef} visible={false}>
      {planes.map((props, i) => (
        <mesh key={i} position={props.position} rotation={props.rotation} scale={props.scale}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={props.color} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
