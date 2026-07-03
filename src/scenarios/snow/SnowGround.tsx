import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { Mountains } from '../../components/environment/Mountains';
import { Clouds } from '../../components/environment/Clouds';
import * as THREE from 'three';

const GROUND_LENGTH = 120;
const DUST_COUNT = 60; // Snow bumps
const TREE_COUNT = 25;
const MOUNTAIN_COUNT = 8;
const SNOWSTORM_COUNT = 300;

function createSnowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  
  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, 512, 512);
  
  // Add some slight blue/grey noise for snow
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 2;
    context.fillStyle = Math.random() > 0.5 ? '#e2e8f0' : '#f1f5f9';
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 2);
  return texture;
}

export function SnowGround() {
  const floorRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.InstancedMesh>(null);
  const treeWoodRef = useRef<THREE.InstancedMesh>(null);
  const treeLeavesRef = useRef<THREE.InstancedMesh>(null);
        const snowstormRef = useRef<THREE.InstancedMesh>(null);

  const snowTexture = useMemo(() => createSnowTexture(), []);

  const dustData = useMemo(() => {
    return Array.from({ length: DUST_COUNT }, () => ({
      x: (Math.random() - 0.5) * GROUND_LENGTH,
      y: -0.2 + Math.random() * 0.2, // slight height variation
      z: (Math.random() - 0.5) * 20 - 5,
      scaleX: 0.5 + Math.random() * 1.5,
      scaleY: 0.2 + Math.random() * 0.3,
      scaleZ: 0.5 + Math.random() * 1.5,
    }));
  }, []);

  const treeData = useMemo(() => {
    return Array.from({ length: TREE_COUNT }, () => ({
      x: (Math.random() - 0.5) * GROUND_LENGTH,
      z: -2 - Math.random() * 10,
      scale: 1 + Math.random() * 1.5,
    }));
  }, []);


  const snowstormData = useMemo(() => {
    return Array.from({ length: SNOWSTORM_COUNT }, () => ({
      x: (Math.random() - 0.5) * GROUND_LENGTH,
      y: Math.random() * 20,
      z: (Math.random() - 0.5) * 30 - 5,
      speedX: 5 + Math.random() * 15,
      speedY: 2 + Math.random() * 5,
    }));
  }, []);


  useFrame((state, delta) => {
    const { speed, status } = useGameStore.getState();
    if (status !== 'playing' && status !== 'menu') return;

    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta;

    if (floorRef.current) {
      const material = floorRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.offset.y -= moveDistance / 40;
      }
    }

    const dummy = new THREE.Object3D();

    if (dustRef.current) {
      for (let i = 0; i < DUST_COUNT; i++) {
        const d = dustData[i];
        d.x -= moveDistance;
        if (d.x < -GROUND_LENGTH / 2) {
          d.x += GROUND_LENGTH;
        }
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(d.scaleX, d.scaleY, d.scaleZ);
        dummy.updateMatrix();
        dustRef.current.setMatrixAt(i, dummy.matrix);
      }
      dustRef.current.instanceMatrix.needsUpdate = true;
    }

    if (treeWoodRef.current && treeLeavesRef.current) {
      for (let i = 0; i < TREE_COUNT; i++) {
        const d = treeData[i];
        d.x -= moveDistance * 0.5; // parallax
        if (d.x < -GROUND_LENGTH / 2) {
          d.x += GROUND_LENGTH;
        }
        // Wood
        dummy.position.set(d.x, 0.5 * d.scale, d.z);
        dummy.scale.set(0.4 * d.scale, 1 * d.scale, 0.4 * d.scale);
        dummy.updateMatrix();
        treeWoodRef.current.setMatrixAt(i, dummy.matrix);
        
        // Leaves (Pine style)
        dummy.position.set(d.x, 2 * d.scale, d.z);
        dummy.scale.set(1.5 * d.scale, 2.5 * d.scale, 1.5 * d.scale);
        dummy.updateMatrix();
        treeLeavesRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeWoodRef.current.instanceMatrix.needsUpdate = true;
      treeLeavesRef.current.instanceMatrix.needsUpdate = true;
    }


    if (snowstormRef.current) {
      for (let i = 0; i < SNOWSTORM_COUNT; i++) {
        const d = snowstormData[i];
        d.x -= moveDistance + d.speedX * delta;
        d.y -= d.speedY * delta;
        
        if (d.x < -GROUND_LENGTH / 2) d.x += GROUND_LENGTH;
        if (d.y < 0) {
          d.y = 20;
          d.x = (Math.random() - 0.5) * GROUND_LENGTH;
        }
        
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(0.1, 0.1, 0.5);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        snowstormRef.current.setMatrixAt(i, dummy.matrix);
      }
      snowstormRef.current.instanceMatrix.needsUpdate = true;
    }

  });

  return (
    <group>
      {/* Main Ground */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_LENGTH * 2, 50]} />
        <meshStandardMaterial map={snowTexture} roughness={0.8} />
      </mesh>
      
      {/* Snow bumps */}
      <instancedMesh frustumCulled={false} ref={dustRef} args={[undefined, undefined, DUST_COUNT]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f8fafc" roughness={1} />
      </instancedMesh>

      {/* Trees Wood */}
      <instancedMesh frustumCulled={false} ref={treeWoodRef} args={[undefined, undefined, TREE_COUNT]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#78350f" roughness={1} />
      </instancedMesh>

      {/* Trees Leaves (Snow covered pine) */}
      <instancedMesh frustumCulled={false} ref={treeLeavesRef} args={[undefined, undefined, TREE_COUNT]} castShadow receiveShadow>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} flatShading />
      </instancedMesh>

      {/* Mountains */}
      

      {/* Mountain Tops */}
      


      {/* Snowstorm */}
      <instancedMesh frustumCulled={false} ref={snowstormRef} args={[undefined, undefined, SNOWSTORM_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </instancedMesh>


      {/* Clouds */}
      
    </group>
  );
}
