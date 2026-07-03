import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function SwampEnvironment() {
  const flashLightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame((state) => {
    if (!flashLightRef.current) return;
    
    const timeSecs = state.clock.getElapsedTime();
    const flash = Math.sin(timeSecs * 10) * Math.sin(timeSecs * 3.1) * Math.sin(timeSecs * 7.2);
    const isLightning = flash > 0.95 && Math.random() > 0.4;
    
    if (isLightning) {
      flashLightRef.current.intensity = 3.5;
    } else {
      // Lerp back to zero intensity
      flashLightRef.current.intensity = THREE.MathUtils.lerp(flashLightRef.current.intensity, 0, 0.2);
    }
  });
  
  return (
    <directionalLight
      ref={flashLightRef}
      position={[5, 15, 5]}
      intensity={0}
      color="#e2e8f0"
    />
  );
}
