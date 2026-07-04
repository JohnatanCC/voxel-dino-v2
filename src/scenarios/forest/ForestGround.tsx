import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Mountains } from '../../components/environment/Mountains';
import { Clouds } from '../../components/environment/Clouds';

const GROUND_LENGTH = 150;
const GRASS_COUNT = 600;
const MOUNTAIN_COUNT = 30;
const MOUNTAIN_LENGTH = 200;
const TREE_COUNT = 80;
const CLOUD_LENGTH = 200;

export function ForestGround() {
  const { status, speed } = useGameStore();
  
  const floorRef = useRef<THREE.Mesh>(null);
  const grassRef = useRef<THREE.InstancedMesh>(null);
      
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeLeaves1Ref = useRef<THREE.InstancedMesh>(null);
  const treeLeaves2Ref = useRef<THREE.InstancedMesh>(null);
  
  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#4ade80'; // Base grass color
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for grass texture
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random();
      if (r < 0.33) ctx.fillStyle = '#22c55e';
      else if (r < 0.66) ctx.fillStyle = '#16a34a';
      else ctx.fillStyle = '#15803d';
      
      const width = 1 + Math.random() * 2;
      const height = 2 + Math.random() * 4;
      ctx.fillRect(x, y, width, height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(30, 10);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  const dirtTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#9a6b41'; // Base dirt color
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for dirt texture
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random();
      if (r < 0.33) ctx.fillStyle = '#8b5a2b';
      else if (r < 0.66) ctx.fillStyle = '#a0522d';
      else ctx.fillStyle = '#cd853f';
      
      const width = 1 + Math.random() * 3;
      const height = 1 + Math.random() * 3;
      ctx.fillRect(x, y, width, height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(30, 10);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  const trunkTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#451a03'; // Base bark color
    ctx.fillRect(0, 0, 256, 256);
    
    // Bark lines
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.5 ? '#78350f' : '#280d00';
      ctx.fillRect(x, y, 1 + Math.random() * 2, 5 + Math.random() * 20);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  const leavesTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#064e3b'; // Base leaves color
    ctx.fillRect(0, 0, 256, 256);
    
    // Leaves noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.5 ? '#065f46' : '#047857';
      ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  const grassData = useMemo(() => {
    const data = [];
    for (let i = 0; i < GRASS_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * GROUND_LENGTH,
        y: 0,
        z: -3 - (Math.random() * 30), // Put grass in the background
        scale: Math.random() * 0.5 + 0.2
      });
    }
    return data;
  }, []);

  const treeData = useMemo(() => {
    const data = [];
    for (let i = 0; i < TREE_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * MOUNTAIN_LENGTH,
        y: 0,
        z: -15 - Math.random() * 40, // Deep into background
        scale: 1.5 + Math.random() * 2.5, // Much larger trees
        rot: Math.random() * Math.PI,
      });
    }
    return data;
  }, []);
  useEffect(() => {
    return () => {
      grassTexture.dispose();
      dirtTexture.dispose();
      trunkTexture.dispose();
      leavesTexture.dispose();
    };
  }, [grassTexture, dirtTexture, trunkTexture, leavesTexture]);
  useFrame((state, delta) => {

    if (status !== 'playing' && status !== 'menu') return;
    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta; // All ground objects move at exact same speed in 3D

    // Animate floor texture so it moves with the objects
    grassTexture.offset.x += (moveDistance / (GROUND_LENGTH * 2)) * 30; // 30 is the texture repeat
    dirtTexture.offset.x += (moveDistance / (GROUND_LENGTH * 2)) * 30;

    if (grassRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < GRASS_COUNT; i++) {
        const d = grassData[i];
        d.x -= moveDistance;
        if (d.x < -GROUND_LENGTH / 2) {
          d.x += GROUND_LENGTH;
          d.z = -3 - (Math.random() * 30);
        }
        const sway = Math.sin(state.clock.elapsedTime * 3 + i) * 0.15;
        dummy.position.set(d.x, d.y + 0.2 * d.scale, d.z);
        dummy.rotation.set(0, 0, sway);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        grassRef.current.setMatrixAt(i, dummy.matrix);
      }
      grassRef.current.instanceMatrix.needsUpdate = true;
    }

    if (treeTrunkRef.current && treeLeaves1Ref.current && treeLeaves2Ref.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < TREE_COUNT; i++) {
        const d = treeData[i];
        d.x -= moveDistance;
        if (d.x < -MOUNTAIN_LENGTH / 2) {
          d.x += MOUNTAIN_LENGTH;
          d.z = -15 - Math.random() * 40;
        }
        
        // Trunk
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.translateY(1.0 * d.scale);
        dummy.scale.set(d.scale * 0.4, d.scale * 2.0, d.scale * 0.4);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);
        
        // Leaves 1 (Bottom)
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.translateY(1.5 * d.scale);
        dummy.scale.set(d.scale * 1.5, d.scale * 1.0, d.scale * 1.5);
        dummy.updateMatrix();
        treeLeaves1Ref.current.setMatrixAt(i, dummy.matrix);

        // Leaves 2 (Top)
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot + Math.PI/4, 0);
        dummy.translateY(2.2 * d.scale);
        dummy.scale.set(d.scale * 1.0, d.scale * 1.0, d.scale * 1.0);
        dummy.updateMatrix();
        treeLeaves2Ref.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeLeaves1Ref.current.instanceMatrix.needsUpdate = true;
      treeLeaves2Ref.current.instanceMatrix.needsUpdate = true;
    }

  });

  return (
    <group>
      {/* Primary floor with dirt texture for the player path */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_LENGTH * 2, 20]} />
        <meshStandardMaterial map={dirtTexture} roughness={1} />
      </mesh>
      
      {/* Deep background floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]}>
        <planeGeometry args={[MOUNTAIN_LENGTH * 2, 140]} />
        <meshStandardMaterial map={grassTexture} roughness={1} />
      </mesh>
      
      <instancedMesh frustumCulled={false} ref={grassRef} args={[undefined, undefined, GRASS_COUNT]} receiveShadow>
        <cylinderGeometry args={[0.02, 0.1, 0.6, 3]} />
        <meshStandardMaterial map={leavesTexture} />
      </instancedMesh>

      <instancedMesh frustumCulled={false} ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.4, 0.6, 1, 8]} />
        <meshStandardMaterial map={trunkTexture} roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeLeaves1Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial map={leavesTexture} roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeLeaves2Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial map={leavesTexture} roughness={0.9} />
      </instancedMesh>

      

      

      
    
      {/* Front Mountains */}
      <Mountains baseColor="#14532d" topColor="#166534" count={25} length={200} zOffset={-75} speedFactor={0.25} minScaleY={3} maxScaleY={8} />
      {/* Middle Mountains */}
      <Mountains baseColor="#064e3b" topColor="#065f46" count={50} length={300} zOffset={-100} speedFactor={0.15} minScaleY={8} maxScaleY={16} />
      {/* Back Mountains */}
      <Mountains baseColor="#022c22" topColor="#064e3b" count={40} length={400} zOffset={-140} speedFactor={0.08} minScaleY={20} maxScaleY={45} />

    </group>
  );
}
