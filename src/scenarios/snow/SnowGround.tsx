import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { Mountains } from '../../components/environment/Mountains';
import * as THREE from 'three';

const GROUND_LENGTH = 120;
const TREE_COUNT = 25;
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

function Aurora() {
  const auroraRef1 = useRef<THREE.Mesh>(null);
  const auroraRef2 = useRef<THREE.Mesh>(null);

  // Generate smooth gradient textures that fade out to transparent on all 4 edges
  const greenTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Horizontal gradient
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.25, 'rgba(16, 185, 129, 0.95)');
    grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.95)');
    grad.addColorStop(0.75, 'rgba(16, 185, 129, 0.95)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 64);

    // Vertical mask gradient to fade top/bottom
    const mask = document.createElement('canvas');
    mask.width = 256;
    mask.height = 64;
    const mctx = mask.getContext('2d')!;
    const vGrad = mctx.createLinearGradient(0, 0, 0, 64);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(0.3, 'rgba(0,0,0,1)');
    vGrad.addColorStop(0.7, 'rgba(0,0,0,1)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = vGrad;
    mctx.fillRect(0, 0, 256, 64);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  const cyanTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Horizontal gradient
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.25, 'rgba(6, 182, 212, 0.85)');
    grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.85)');
    grad.addColorStop(0.75, 'rgba(6, 182, 212, 0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 64);

    // Vertical mask gradient to fade top/bottom
    const mask = document.createElement('canvas');
    mask.width = 256;
    mask.height = 64;
    const mctx = mask.getContext('2d')!;
    const vGrad = mctx.createLinearGradient(0, 0, 0, 64);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(0.3, 'rgba(0,0,0,1)');
    vGrad.addColorStop(0.7, 'rgba(0,0,0,1)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = vGrad;
    mctx.fillRect(0, 0, 256, 64);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Clean up textures when unmounting
  useEffect(() => {
    return () => {
      greenTexture.dispose();
      cyanTexture.dispose();
    };
  }, [greenTexture, cyanTexture]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (auroraRef1.current) {
      auroraRef1.current.rotation.z = Math.sin(time * 0.08) * 0.03;
      auroraRef1.current.position.y = 40 + Math.sin(time * 0.15) * 0.3;
      auroraRef1.current.position.x = Math.sin(time * 0.05) * 8;
    }
    if (auroraRef2.current) {
      auroraRef2.current.rotation.z = Math.cos(time * 0.06) * 0.02;
      auroraRef2.current.position.y = 36 + Math.cos(time * 0.12) * 0.2;
      auroraRef2.current.position.x = -20 + Math.cos(time * 0.04) * 6;
    }
  });

  return (
    <group>
      {/* Aurora Band 1 (Emerald Green) - positioned behind all mountains at Z = -210 */}
      <mesh ref={auroraRef1} position={[0, 40, -120]} rotation={[-90, 0.1, 0]}>
        <planeGeometry args={[300, 60]} />
        <meshBasicMaterial
          map={greenTexture}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Aurora Band 2 (Cyan / Cyan-Blue) - positioned behind all mountains at Z = -215 */}
      <mesh ref={auroraRef2} position={[-20, 36, -130]} rotation={[-90, -0.1, 0]}>
        <planeGeometry args={[360, 65]} />
        <meshBasicMaterial
          map={cyanTexture}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}


export function SnowGround() {
  const floorRef = useRef<THREE.Mesh>(null);
  const snowstormRef = useRef<THREE.InstancedMesh>(null);

  // Instanced Meshes for Layer 2 Forest-style Snowy Trees
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeLeaves1Ref = useRef<THREE.InstancedMesh>(null);
  const treeLeaves1SnowRef = useRef<THREE.InstancedMesh>(null);
  const treeLeaves2Ref = useRef<THREE.InstancedMesh>(null);
  const treeLeaves2SnowRef = useRef<THREE.InstancedMesh>(null);

  const snowTexture = useMemo(() => createSnowTexture(), []);

  const treeData = useMemo(() => {
    return Array.from({ length: TREE_COUNT }, () => ({
      x: (Math.random() - 0.5) * GROUND_LENGTH,
      z: -12 - Math.random() * 8, // Layer 2 trees
      scale: 1.2 + Math.random() * 1.0,
      rot: Math.random() * Math.PI,
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
    const { status } = useGameStore.getState();
    if (status !== 'playing' && status !== 'menu') return;

    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta;

    if (floorRef.current) {
      const material = floorRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.offset.y -= moveDistance / 40;
      }
    }

    const dummy = new THREE.Object3D();

    // Scroll Layer 2 Snowy Trees
    if (treeTrunkRef.current && treeLeaves1Ref.current && treeLeaves1SnowRef.current && treeLeaves2Ref.current && treeLeaves2SnowRef.current) {
      for (let i = 0; i < TREE_COUNT; i++) {
        const d = treeData[i];
        d.x -= moveDistance;
        if (d.x < -GROUND_LENGTH / 2) {
          d.x += GROUND_LENGTH;
          d.z = -12 - Math.random() * 8;
        }

        // Trunk
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.translateY(1.0 * d.scale);
        dummy.scale.set(d.scale * 0.4, d.scale * 2.0, d.scale * 0.4);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);

        // Leaves 1 (Bottom Sphere)
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.translateY(1.5 * d.scale);
        dummy.scale.set(d.scale * 1.5, d.scale * 1.0, d.scale * 1.5);
        dummy.updateMatrix();
        treeLeaves1Ref.current.setMatrixAt(i, dummy.matrix);

        // Leaves 1 Snow (Sitting on top of Leaves 1)
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.translateY(1.7 * d.scale);
        dummy.scale.set(d.scale * 1.3, d.scale * 0.9, d.scale * 1.3);
        dummy.updateMatrix();
        treeLeaves1SnowRef.current.setMatrixAt(i, dummy.matrix);

        // Leaves 2 (Top Sphere)
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot + Math.PI / 4, 0);
        dummy.translateY(2.2 * d.scale);
        dummy.scale.set(d.scale * 1.0, d.scale * 1.0, d.scale * 1.0);
        dummy.updateMatrix();
        treeLeaves2Ref.current.setMatrixAt(i, dummy.matrix);

        // Leaves 2 Snow (Sitting on top of Leaves 2)
        dummy.position.set(d.x, 0, d.z);
        dummy.rotation.set(0, d.rot + Math.PI / 4, 0);
        dummy.translateY(2.35 * d.scale);
        dummy.scale.set(d.scale * 0.85, d.scale * 0.85, d.scale * 0.85);
        dummy.updateMatrix();
        treeLeaves2SnowRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeLeaves1Ref.current.instanceMatrix.needsUpdate = true;
      treeLeaves1SnowRef.current.instanceMatrix.needsUpdate = true;
      treeLeaves2Ref.current.instanceMatrix.needsUpdate = true;
      treeLeaves2SnowRef.current.instanceMatrix.needsUpdate = true;
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
      {/* Background Aurora - deep behind the mountains */}
      <Aurora />

      {/* Main Ground */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_LENGTH * 2, 50]} />
        <meshStandardMaterial map={snowTexture} roughness={0.8} />
      </mesh>

      {/* Deep background floor (Snowy) - fills the Z-depth gap up to Z = -120 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]} receiveShadow>
        <planeGeometry args={[GROUND_LENGTH * 2, 140]} />
        <meshStandardMaterial map={snowTexture} roughness={0.8} />
      </mesh>

      {/* Layer 2: Forest-style Snowy Trees */}
      <instancedMesh frustumCulled={false} ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.4, 0.6, 1, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeLeaves1Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeLeaves1SnowRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} flatShading />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeLeaves2Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeLeaves2SnowRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} flatShading />
      </instancedMesh>

      {/* Front Mountains (Snowy) */}
      <Mountains baseColor="#475569" topColor="#ffffff" count={25} length={200} zOffset={-65} speedFactor={0.25} minScaleY={2.2} maxScaleY={6.0} />
      {/* Middle Mountains (Snowy) */}
      <Mountains baseColor="#334155" topColor="#ffffff" count={50} length={300} zOffset={-90} speedFactor={0.15} minScaleY={5.5} maxScaleY={11.0} />
      {/* Back Mountains (Snowy) */}
      <Mountains baseColor="#1e293b" topColor="#ffffff" count={40} length={400} zOffset={-100} speedFactor={0.08} minScaleY={12.0} maxScaleY={28.0} />

      {/* Snowstorm */}
      <instancedMesh frustumCulled={false} ref={snowstormRef} args={[undefined, undefined, SNOWSTORM_COUNT]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </instancedMesh>
    </group>
  );
}
