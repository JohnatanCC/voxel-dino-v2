import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { MangroveTrees } from '../../components/environment/MangroveTrees';
import { Clouds } from '../../components/environment/Clouds';

const GROUND_LENGTH = 100;
const BACKGROUND_LENGTH = 150;
const LILY_PAD_COUNT = 40;
const FIREFLY_COUNT = 30;
const TREE_COUNT = 15;
const CLOUD_COUNT = 15;
const RAIN_COUNT = 200;
const MOSS_COUNT = 40;
const FROG_COUNT = 8;

export function SwampGround() {
  const { status, speed } = useGameStore();
  
  const floorRef = useRef<THREE.Mesh>(null);
  const waterMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lilyPadRef = useRef<THREE.InstancedMesh>(null);
  const lilyPadTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#10b981'; // Brighter Base green
    ctx.fillRect(0, 0, 256, 256);
    // Draw veins
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(128, 128);
      const angle = (i / 16) * Math.PI * 2;
      ctx.lineTo(128 + Math.cos(angle) * 128, 128 + Math.sin(angle) * 128);
      ctx.stroke();
    }
    // Draw some noise
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#065f46' : '#10b981';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);
  const lilyPadRimRef = useRef<THREE.InstancedMesh>(null);
  const fireflyRef = useRef<THREE.InstancedMesh>(null);
  
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeRoot1Ref = useRef<THREE.InstancedMesh>(null);
  const treeRoot2Ref = useRef<THREE.InstancedMesh>(null);
  const treeRoot3Ref = useRef<THREE.InstancedMesh>(null);
  const treeBranchRef = useRef<THREE.InstancedMesh>(null);
  const treeVineRef = useRef<THREE.InstancedMesh>(null);
  const treeLeavesRef = useRef<THREE.InstancedMesh>(null);
    const rainRef = useRef<THREE.InstancedMesh>(null);
  const frogRef = useRef<THREE.InstancedMesh>(null);
  

  const waterTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2dd4bf'; // Light teal water
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for water texture
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? '#5eead4' : '#ccfbf1';
      const width = 2 + Math.random() * 6;
      const height = 1 + Math.random() * 2;
      ctx.fillRect(x, y, width, height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);


  const fogTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  const lilyPadData = useMemo(() => {
    const data = [];
    for (let i = 0; i < LILY_PAD_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * BACKGROUND_LENGTH,
        y: 0.01,
        z: -10 + (Math.random() - 0.5) * 35, // Spread further back
        scale: (Math.random() * 0.5 + 0.3) * 2.0, // 2x larger
        rot: Math.random() * Math.PI,
      });
    }
    return data;
  }, []);


  const fireflyData = useMemo(() => {
    const data = [];
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * GROUND_LENGTH,
        y: 0.5 + Math.random() * 3,
        z: -2 - Math.random() * 20,
        offset: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2
      });
    }
    return data;
  }, []);

  const treeData = useMemo(() => {
    const data = [];
    for (let i = 0; i < TREE_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * BACKGROUND_LENGTH,
        y: -1,
        z: -25 - Math.random() * 45,
        scale: 0.8 + Math.random() * 1.5,
        rot: Math.random() * Math.PI * 2,
        hasVine: Math.random() > 0.2,
        hasLeaves: Math.random() > 0.5 // Variation with leaves
      });
    }
    return data;
  }, []);


  const rainData = useMemo(() => {
    const data = [];
    for (let i = 0; i < RAIN_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * 50,
        y: Math.random() * 20,
        z: (Math.random() - 0.5) * 20 - 5,
        speed: 15 + Math.random() * 10
      });
    }
    return data;
  }, []);

  
  

  const frogData = useMemo(() => {
    const data = [];
    for (let i = 0; i < FROG_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * BACKGROUND_LENGTH,
        y: 0,
        z: -5 - Math.random() * 15,
        jumpSpeed: 2 + Math.random() * 3,
        jumpHeight: 1 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (rainRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < RAIN_COUNT; i++) {
        const d = rainData[i];
        d.y -= useGameStore.getState().getCurrentSpeed() * delta;
        if (d.y < -1) {
          d.y = 20;
          d.x = (Math.random() - 0.5) * 50;
        }
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(0.02, 0.4, 0.02);
        dummy.updateMatrix();
        rainRef.current.setMatrixAt(i, dummy.matrix);
      }
      rainRef.current.instanceMatrix.needsUpdate = true;
    }

    if (status !== 'playing' && status !== 'menu') return;
    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta;

    
    waterTexture.offset.x += (moveDistance / (GROUND_LENGTH * 2)) * 20;

    if (lilyPadRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < LILY_PAD_COUNT; i++) {
        const d = lilyPadData[i];
        d.x -= moveDistance * 0.85; // slightly slower for background perspective
        if (d.x < -BACKGROUND_LENGTH / 2) {
          d.x += BACKGROUND_LENGTH;
          d.z = -10 + (Math.random() - 0.5) * 35;
        }
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale, 0.05, d.scale);
        dummy.updateMatrix();
        lilyPadRef.current.setMatrixAt(i, dummy.matrix);
        
        if (lilyPadRimRef.current) {
          dummy.position.set(d.x, d.y + 0.05, d.z);
          dummy.scale.set(d.scale * 1.0, 0.2, d.scale * 1.0);
          dummy.updateMatrix();
          lilyPadRimRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
      if (lilyPadRimRef.current) {
         lilyPadRimRef.current.instanceMatrix.needsUpdate = true;
      }
    }


    if (fireflyRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < FIREFLY_COUNT; i++) {
        const d = fireflyData[i];
        d.x -= moveDistance * 0.9;
        if (d.x < -GROUND_LENGTH / 2) {
          d.x += GROUND_LENGTH;
        }
        const floatY = Math.sin(state.clock.elapsedTime * d.speed + d.offset) * 0.5;
        dummy.position.set(d.x, d.y + floatY, d.z);
        dummy.scale.setScalar(0.1);
        dummy.updateMatrix();
        fireflyRef.current.setMatrixAt(i, dummy.matrix);
      }
      fireflyRef.current.instanceMatrix.needsUpdate = true;
    }

    
    

    if (frogRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < FROG_COUNT; i++) {
        const d = frogData[i];
        d.x -= moveDistance * 0.8;
        if (d.x < -BACKGROUND_LENGTH / 2) {
          d.x += BACKGROUND_LENGTH;
          d.z = -5 - Math.random() * 15;
        }
        // Jump animation
        const jumpPhase = (state.clock.elapsedTime * d.jumpSpeed + d.offset) % (Math.PI * 2);
        let yPos = 0;
        if (jumpPhase < Math.PI) { // jumping up
           yPos = Math.sin(jumpPhase) * d.jumpHeight;
           d.x -= 0.05; // move slightly forward during jump
        }
        dummy.position.set(d.x, yPos + 0.2, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.setScalar(0.4);
        dummy.updateMatrix();
        frogRef.current.setMatrixAt(i, dummy.matrix);
      }
      frogRef.current.instanceMatrix.needsUpdate = true;
    }

    if (treeTrunkRef.current && treeBranchRef.current && treeVineRef.current && treeLeavesRef.current && treeRoot1Ref.current) {
      const treeMoveDistance = moveDistance;
      const dummy = new THREE.Object3D();
      for (let i = 0; i < TREE_COUNT; i++) {
        const d = treeData[i];
        d.x -= treeMoveDistance;
        if (d.x < -BACKGROUND_LENGTH / 2) {
          d.x += BACKGROUND_LENGTH;
          d.z = -25 - Math.random() * 45;
          d.rot = Math.random() * Math.PI * 2;
          d.scale = 0.8 + Math.random() * 1.5;
          d.hasVine = Math.random() > 0.2;
          d.hasLeaves = Math.random() > 0.5;
        }
        
        // Trunk
        const trunkHeight = d.scale * 5.0;
        dummy.position.set(d.x, d.y + trunkHeight / 2, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale, trunkHeight, d.scale);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);
        
        // Roots
        const rootSpread = d.scale * 1.5;
        const rootHeight = d.scale * 3.0;
        const rootThickness = d.scale * 0.3;
        
        dummy.position.set(d.x + rootSpread, d.y + rootHeight/2 - 1, d.z);
        dummy.rotation.set(0, d.rot, Math.PI / 6);
        dummy.scale.set(rootThickness, rootHeight, rootThickness);
        dummy.updateMatrix();
        treeRoot1Ref.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(d.x - rootSpread, d.y + rootHeight/2 - 1, d.z);
        dummy.rotation.set(0, d.rot, -Math.PI / 6);
        dummy.scale.set(rootThickness, rootHeight, rootThickness);
        dummy.updateMatrix();
        treeRoot2Ref.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(d.x, d.y + rootHeight/2 - 1, d.z + rootSpread);
        dummy.rotation.set(-Math.PI / 6, d.rot, 0);
        dummy.scale.set(rootThickness, rootHeight, rootThickness);
        dummy.updateMatrix();
        treeRoot3Ref.current.setMatrixAt(i, dummy.matrix);

        // Branch
        const branchLen = d.scale * 2.0;
        const branchOffsetX = Math.cos(d.rot) * 0.2 * d.scale;
        const branchOffsetZ = -Math.sin(d.rot) * 0.2 * d.scale;
        dummy.position.set(d.x + branchOffsetX, d.y + trunkHeight * 0.6, d.z + branchOffsetZ);
        dummy.rotation.set(0, d.rot, -Math.PI / 4);
        dummy.scale.set(d.scale, branchLen, d.scale);
        dummy.updateMatrix();
        treeBranchRef.current.setMatrixAt(i, dummy.matrix);

        // Vine
        if (d.hasVine) {
          const vineLen = d.scale * 2.5;
          const tipX = branchOffsetX + Math.cos(d.rot) * branchLen * 0.35;
          const tipZ = branchOffsetZ - Math.sin(d.rot) * branchLen * 0.35;
          const tipY = d.y + trunkHeight * 0.7 + branchLen * 0.35;
          dummy.position.set(d.x + tipX, tipY - vineLen * 0.5, d.z + tipZ);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(d.scale, vineLen, d.scale);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        treeVineRef.current.setMatrixAt(i, dummy.matrix);

        // Leaves (spherical)
        if (d.hasLeaves) {
          dummy.position.set(d.x, d.y + trunkHeight + d.scale * 0.5, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(d.scale * 2.5, d.scale * 1.2, d.scale * 2.5);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        treeLeavesRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeRoot1Ref.current.instanceMatrix.needsUpdate = true;
      treeRoot2Ref.current.instanceMatrix.needsUpdate = true;
      treeRoot3Ref.current.instanceMatrix.needsUpdate = true;
      treeBranchRef.current.instanceMatrix.needsUpdate = true;
      treeVineRef.current.instanceMatrix.needsUpdate = true;
      treeLeavesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Water Floor */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_LENGTH * 2, 60]} />
        <meshStandardMaterial ref={waterMatRef} map={waterTexture} roughness={0.05} metalness={0.5} emissive="#1e3a8a" emissiveIntensity={0.2} color="#ffffff" />
      </mesh>
      
      {/* Distant water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]}>
        <planeGeometry args={[BACKGROUND_LENGTH * 2, 250]} />
        <meshStandardMaterial map={waterTexture} roughness={0.05} metalness={0.5} emissive="#1e3a8a" emissiveIntensity={0.2} color="#ffffff" />
      </mesh>
      
      {/* Vitoria Regia (Lily Pads) */}
      <instancedMesh frustumCulled={false} ref={lilyPadRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial map={lilyPadTexture} roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={lilyPadRimRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshStandardMaterial color="#34d399" roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>



      {/* Frogs */}
      <instancedMesh frustumCulled={false} ref={frogRef} args={[undefined, undefined, FROG_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[1, 0.8, 1]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} />
      </instancedMesh>

      {/* Trees */}
      <instancedMesh frustumCulled={false} ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.3, 0.6, 1, 6]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      
      {/* Roots */}
      <instancedMesh frustumCulled={false} ref={treeRoot1Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeRoot2Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeRoot3Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>

      <instancedMesh frustumCulled={false} ref={treeBranchRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.1, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      
      {/* Leaves */}
      <instancedMesh frustumCulled={false} ref={treeLeavesRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[1.4, 8, 8]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} />
      </instancedMesh>

      {/* Vines (Moss) */}
      <instancedMesh frustumCulled={false} ref={treeVineRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1, 3]} />
        <meshStandardMaterial color="#065f46" roughness={0.9} />
      </instancedMesh>

      {/* Fireflies */}
      <instancedMesh frustumCulled={false} ref={fireflyRef} args={[undefined, undefined, FIREFLY_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#fef08a" />
      </instancedMesh>

            
      
      
      {/* Rain */}
      <instancedMesh frustumCulled={false} ref={rainRef} args={[undefined, undefined, RAIN_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#cbd5e1" opacity={0.4} transparent />
      </instancedMesh>

      {/* Parallax Mangrove Trees Layer */}
      {/* Parallax Mangrove Trees Layer */}
      <MangroveTrees count={10} zOffset={-50} zSpread={15} speedFactor={0.25} scaleMult={0.8} trunkColor="#44403c" leavesColor="#064e3b" />
    </group>

  );
}
