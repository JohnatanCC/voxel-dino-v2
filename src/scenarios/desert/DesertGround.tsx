import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Mountains } from '../../components/environment/Mountains';
import { Clouds } from '../../components/environment/Clouds';

const GROUND_LENGTH = 100;
const DUST_COUNT = 40;
const MOUNTAIN_LENGTH = 150;
const CACTUS_COUNT = 25;

const SANDSTORM_COUNT = 300;

export function DesertGround() {
  const { status, speed, isSandstorm } = useGameStore();
  
  const floorRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.InstancedMesh>(null);
  const sandstormRef = useRef<THREE.InstancedMesh>(null);
      const cactusRef = useRef<THREE.InstancedMesh>(null);
  const cactusLeftArmRef = useRef<THREE.InstancedMesh>(null);
  const cactusRightArmRef = useRef<THREE.InstancedMesh>(null);
  const cactusLeftArmHRef = useRef<THREE.InstancedMesh>(null);
  const cactusRightArmHRef = useRef<THREE.InstancedMesh>(null);
  const cactusSpikeRef = useRef<THREE.InstancedMesh>(null);
  const cactusFlowerRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate random dust/rocks for the ground
  const dustData = useMemo(() => {
    const data = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * GROUND_LENGTH,
        y: 0,
        z: (Math.random() - 0.5) * 4,
        scale: Math.random() * 0.2 + 0.1
      });
    }
    return data;
  }, []);

  // Generate random sandstorm particles
  const sandstormData = useMemo(() => {
    const data = [];
    for (let i = 0; i < SANDSTORM_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * GROUND_LENGTH,
        y: Math.random() * 8, // Flowing in the air
        z: -1 - Math.random() * 15,
        scale: Math.random() * 0.15 + 0.05,
        speedX: 10 + Math.random() * 20, // fast wind
        speedY: (Math.random() - 0.5) * 2,
      });
    }
    return data;
  }, []);

  // Generate random background cacti
  const cactusData = useMemo(() => {
    const data = [];
    for (let i = 0; i < CACTUS_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * MOUNTAIN_LENGTH,
        y: 0, // Base at 0, handle height in instance
        z: -12 - Math.random() * 10,
        scale: 0.8 + Math.random() * 1.5,
        hasLeftArm: Math.random() > 0.3,
        hasRightArm: Math.random() > 0.3,
        hasFlower: Math.random() > 0.6,
        rot: (i % 3) * Math.PI / 4,
      });
    }
    return data;
  }, []);




  const sandTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fcd34d'; // Base sand color
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for sand texture
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random();
      if (r < 0.33) ctx.fillStyle = '#fbbf24';
      else if (r < 0.66) ctx.fillStyle = '#f59e0b';
      else ctx.fillStyle = '#d97706';
      
      const width = 1 + Math.random() * 2;
      const height = 1 + Math.random() * 2;
      ctx.fillRect(x, y, width, height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 10);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  const mountainTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#d4a373'; // Base mountain color
    ctx.fillRect(0, 0, 256, 256);
    
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.5 ? '#cc955b' : '#bc8348';
      ctx.fillRect(x, y, 4 + Math.random() * 8, 4 + Math.random() * 8);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, []);

  useEffect(() => {
    return () => {
      sandTexture.dispose();
      mountainTexture.dispose();
    };
  }, [sandTexture, mountainTexture]);

  // Update instanced meshes
  useFrame((_, delta) => {
    // Clouds move regardless of game status

    if (status !== 'playing' && status !== 'menu') return;
    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta;
    
    sandTexture.offset.x += (moveDistance / (GROUND_LENGTH * 2)) * 20;

    if (dustRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < DUST_COUNT; i++) {
        const d = dustData[i];
        d.x -= moveDistance;
        if (d.x < -GROUND_LENGTH / 2) {
          d.x += GROUND_LENGTH;
          d.z = (Math.random() - 0.5) * 4;
        }
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        dustRef.current.setMatrixAt(i, dummy.matrix);
      }
      dustRef.current.instanceMatrix.needsUpdate = true;
    }

    if (isSandstorm && sandstormRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < SANDSTORM_COUNT; i++) {
        const d = sandstormData[i];
        d.x -= (moveDistance + d.speedX * delta);
        d.y += d.speedY * delta;
        if (d.x < -GROUND_LENGTH / 2) {
          d.x += GROUND_LENGTH;
          d.y = Math.random() * 8;
        }
        if (d.y > 8 || d.y < 0) {
          d.speedY *= -1; // bounce logic vertically
        }
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        sandstormRef.current.setMatrixAt(i, dummy.matrix);
      }
      sandstormRef.current.instanceMatrix.needsUpdate = true;
    }


    if (cactusRef.current && cactusLeftArmRef.current && cactusRightArmRef.current && cactusLeftArmHRef.current && cactusRightArmHRef.current && cactusFlowerRef.current && cactusSpikeRef.current) {
      const cactusMoveDistance = moveDistance; // deeper parallax
      const dummy = new THREE.Object3D();
      for (let i = 0; i < CACTUS_COUNT; i++) {
        const d = cactusData[i];
        d.x -= cactusMoveDistance;
        if (d.x < -MOUNTAIN_LENGTH / 2) {
          d.x += MOUNTAIN_LENGTH;
          d.z = -12 - Math.random() * 10;
        }
        
        // Main body
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.translateY(1.2 * d.scale);
        dummy.scale.set(d.scale, d.scale, d.scale);
        dummy.updateMatrix();
        cactusRef.current.setMatrixAt(i, dummy.matrix);
        
        // Left Arm (Vertical part)
        if (d.hasLeftArm) {
          dummy.position.set(d.x, 0, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.translateX(-0.7 * d.scale);
          dummy.translateY(1.3 * d.scale);
          dummy.scale.set(d.scale, d.scale, d.scale);
          dummy.updateMatrix();
          cactusLeftArmRef.current.setMatrixAt(i, dummy.matrix);
          
          // Left Arm (Horizontal part)
          dummy.position.set(d.x, 0, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.translateX(-0.55 * d.scale);
          dummy.translateY(0.8 * d.scale);
          dummy.scale.set(d.scale, d.scale, d.scale);
          dummy.updateMatrix();
          cactusLeftArmHRef.current.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          cactusLeftArmRef.current.setMatrixAt(i, dummy.matrix);
          cactusLeftArmHRef.current.setMatrixAt(i, dummy.matrix);
        }

        // Right Arm (Vertical part)
        if (d.hasRightArm) {
          dummy.position.set(d.x, 0, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.translateX(0.7 * d.scale);
          dummy.translateY(1.9 * d.scale);
          dummy.scale.set(d.scale, d.scale, d.scale);
          dummy.updateMatrix();
          cactusRightArmRef.current.setMatrixAt(i, dummy.matrix);
          
          // Right Arm (Horizontal part)
          dummy.position.set(d.x, 0, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.translateX(0.55 * d.scale);
          dummy.translateY(1.3 * d.scale);
          dummy.scale.set(d.scale, d.scale, d.scale);
          dummy.updateMatrix();
          cactusRightArmHRef.current.setMatrixAt(i, dummy.matrix);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          cactusRightArmRef.current.setMatrixAt(i, dummy.matrix);
          cactusRightArmHRef.current.setMatrixAt(i, dummy.matrix);
        }
        
        // Flower (on top of main body or right arm)
        const fIndex = i * 3;
        if (d.hasFlower) {
          // Trunk flower
          dummy.position.set(d.x, 0, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.translateY(2.45 * d.scale);
          dummy.scale.set(d.scale, d.scale, d.scale);
          dummy.updateMatrix();
          cactusFlowerRef.current.setMatrixAt(fIndex, dummy.matrix);

          // Left arm flower
          if (d.hasLeftArm) {
            dummy.position.set(d.x, 0, d.z);
            dummy.rotation.set(0, d.rot, 0);
            dummy.translateX(-0.7 * d.scale);
            dummy.translateY(1.95 * d.scale);
            dummy.scale.set(d.scale, d.scale, d.scale);
            dummy.updateMatrix();
            cactusFlowerRef.current.setMatrixAt(fIndex + 1, dummy.matrix);
          } else {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            cactusFlowerRef.current.setMatrixAt(fIndex + 1, dummy.matrix);
          }

          // Right arm flower
          if (d.hasRightArm) {
            dummy.position.set(d.x, 0, d.z);
            dummy.rotation.set(0, d.rot, 0);
            dummy.translateX(0.7 * d.scale);
            dummy.translateY(2.55 * d.scale);
            dummy.scale.set(d.scale, d.scale, d.scale);
            dummy.updateMatrix();
            cactusFlowerRef.current.setMatrixAt(fIndex + 2, dummy.matrix);
          } else {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            cactusFlowerRef.current.setMatrixAt(fIndex + 2, dummy.matrix);
          }
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          cactusFlowerRef.current.setMatrixAt(fIndex, dummy.matrix);
          cactusFlowerRef.current.setMatrixAt(fIndex + 1, dummy.matrix);
          cactusFlowerRef.current.setMatrixAt(fIndex + 2, dummy.matrix);
        }
        // Spikes
        const sIndex = i * 2;
        // Spike 1: [0, 1.8, 0.28]
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.translateY(1.8 * d.scale);
        dummy.translateZ(0.28 * d.scale);
        dummy.scale.set(d.scale, d.scale, d.scale);
        dummy.updateMatrix();
        cactusSpikeRef.current.setMatrixAt(sIndex, dummy.matrix);

        // Spike 2: [-0.28, 1.2, 0]
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.translateX(-0.28 * d.scale);
        dummy.translateY(1.2 * d.scale);
        dummy.scale.set(d.scale, d.scale, d.scale);
        dummy.updateMatrix();
        cactusSpikeRef.current.setMatrixAt(sIndex + 1, dummy.matrix);

      }
      cactusRef.current.instanceMatrix.needsUpdate = true;
      cactusLeftArmRef.current.instanceMatrix.needsUpdate = true;
      cactusRightArmRef.current.instanceMatrix.needsUpdate = true;
      cactusLeftArmHRef.current.instanceMatrix.needsUpdate = true;
      cactusRightArmHRef.current.instanceMatrix.needsUpdate = true;
      cactusFlowerRef.current.instanceMatrix.needsUpdate = true;
      cactusSpikeRef.current.instanceMatrix.needsUpdate = true;
    }

  });

  return (
    <group>
      {/* Main Ground Plane */}
      <mesh 
        ref={floorRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.05, 0]} 
        receiveShadow
      >
        <planeGeometry args={[GROUND_LENGTH * 2, 50]} />
        <meshStandardMaterial map={sandTexture} roughness={1} />
      </mesh>
      
      {/* Far Ground Plane for background objects to rest on */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, -15]} 
      >
        <planeGeometry args={[MOUNTAIN_LENGTH * 2, 150]} />
        <meshStandardMaterial map={sandTexture} roughness={1} />
      </mesh>
      
      {/* Ground Details (Rocks/Dust) */}
      <instancedMesh frustumCulled={false} ref={dustRef} args={[undefined, undefined, DUST_COUNT]} receiveShadow>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial color="#d97706" />
      </instancedMesh>

      {/* Sandstorm Particles */}
      {isSandstorm && (
        <instancedMesh frustumCulled={false} ref={sandstormRef} args={[undefined, undefined, SANDSTORM_COUNT]} receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#d4a373" transparent opacity={0.6} />
        </instancedMesh>
      )}


      {/* Cacti Main Body */}
      <instancedMesh frustumCulled={false} ref={cactusRef} args={[undefined, undefined, CACTUS_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 2.4, 0.5]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>
      {/* Cacti Arms Vertical */}
      <instancedMesh frustumCulled={false} ref={cactusLeftArmRef} args={[undefined, undefined, CACTUS_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={cactusRightArmRef} args={[undefined, undefined, CACTUS_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>
      {/* Cacti Arms Horizontal */}
      <instancedMesh frustumCulled={false} ref={cactusLeftArmHRef} args={[undefined, undefined, CACTUS_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={cactusRightArmHRef} args={[undefined, undefined, CACTUS_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>
      {/* Cacti Flowers */}
      <instancedMesh frustumCulled={false} ref={cactusFlowerRef} args={[undefined, undefined, CACTUS_COUNT * 3]} receiveShadow castShadow>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#ec4899" roughness={0.5} />
      </instancedMesh>
      {/* Cacti Spikes */}
      <instancedMesh frustumCulled={false} ref={cactusSpikeRef} args={[undefined, undefined, CACTUS_COUNT * 2]} receiveShadow castShadow>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </instancedMesh>

      {/* Background Mountains */}
      <Mountains baseColor="#d4a373" topColor="#bc8348" />

      {/* Clouds */}
      
    </group>
  );
}
