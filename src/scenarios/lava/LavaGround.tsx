import { useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Clouds } from '../../components/environment/Clouds';
import { LavaLife } from './LavaLife';

const GROUND_LENGTH = 100;
const BACKGROUND_LENGTH = 180;
const VOLCANO_COUNT = 6;
const SMOKE_PER_VOLCANO = 4;
const EMBER_COUNTS = { low: 40, medium: 90, high: 140 } as const;
// Burning trees in the mid-distance layer: dark trunk silhouettes against flames light up the scene
// and give the (dark) obstacles a warm backdrop to read against.
const TREE_COUNTS = { low: 5, medium: 8, high: 11 } as const;
const TREE_LAYER_LENGTH = 150;
const TREE_LAYER_SPEED = 0.55; // parallax: slower than the lane

const dummy = new THREE.Object3D();

// Basalt slab with glowing crack lines. Used as both `map` and `emissiveMap`, so only the
// bright cracks glow while the dark rock stays dark.
function createBasaltTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3a251e';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#46302a' : '#2c1a15';
    ctx.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 6, 2 + Math.random() * 6);
  }

  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segments = 4 + Math.floor(Math.random() * 5);
    for (let s = 0; s < segments; s++) {
      x += (Math.random() - 0.5) * 90;
      y += (Math.random() - 0.5) * 90;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = Math.random() > 0.3 ? '#f97316' : '#fbbf24';
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 6);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function createLavaTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i++) {
    const c = Math.random();
    ctx.fillStyle = c > 0.7 ? '#fde047' : c > 0.35 ? '#f97316' : '#b91c1c';
    ctx.fillRect(Math.random() * size, Math.random() * size, 3 + Math.random() * 10, 2 + Math.random() * 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 4);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

export function LavaGround() {
  const status = useGameStore((s) => s.status);
  const graphicsQuality = useGameStore((s) => s.graphicsQuality);
  const emberCount = EMBER_COUNTS[graphicsQuality];

  const volcanoRef = useRef<THREE.InstancedMesh>(null);
  const craterRef = useRef<THREE.InstancedMesh>(null);
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const emberRef = useRef<THREE.InstancedMesh>(null);
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeBranchRef = useRef<THREE.InstancedMesh>(null);
  const flameRef = useRef<THREE.InstancedMesh>(null);
  const flameCoreRef = useRef<THREE.InstancedMesh>(null);
  const treeGlowRef = useRef<THREE.InstancedMesh>(null);
  const treeCount = TREE_COUNTS[graphicsQuality];
  const craterMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const rockTexture = useMemo(createBasaltTexture, []);
  const lavaTexture = useMemo(createLavaTexture, []);

  useEffect(() => () => {
    rockTexture.dispose();
    lavaTexture.dispose();
  }, [rockTexture, lavaTexture]);

  const volcanoData = useMemo(() => {
    const data = [];
    for (let i = 0; i < VOLCANO_COUNT; i++) {
      const height = 14 + Math.random() * 12;
      data.push({
        x: (i / VOLCANO_COUNT - 0.5) * BACKGROUND_LENGTH + Math.random() * 12,
        height,
        width: height * (1.5 + Math.random() * 0.5),
        z: -58 - Math.random() * 18,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, []);

  const treeData = useMemo(() => {
    const data = [];
    for (let i = 0; i < TREE_COUNTS.high; i++) {
      data.push({
        x: ((i + Math.random() * 0.8) / TREE_COUNTS.high - 0.5) * TREE_LAYER_LENGTH,
        z: -16 - Math.random() * 14,
        h: 6 + Math.random() * 4,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, []);

  const emberData = useMemo(() => {
    const data = [];
    for (let i = 0; i < EMBER_COUNTS.high; i++) {
      data.push({
        x: (Math.random() - 0.5) * 70,
        y: Math.random() * 12,
        z: -12 + Math.random() * 14,
        rise: 1.2 + Math.random() * 2.4,
        drift: 0.5 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2,
        size: 0.06 + Math.random() * 0.1,
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (craterMatRef.current) {
      craterMatRef.current.color.setHSL(0.06 + Math.sin(t * 2) * 0.01, 1, 0.5 + Math.sin(t * 3.1) * 0.08);
    }

    // Embers keep drifting even on the menu so the scene never looks frozen.
    if (emberRef.current) {
      for (let i = 0; i < emberCount; i++) {
        const d = emberData[i];
        d.y += d.rise * delta;
        d.x -= d.drift * delta;
        if (d.y > 14 || d.x < -35) {
          d.y = 0;
          d.x = (Math.random() - 0.5) * 70;
        }
        const flicker = 0.6 + Math.sin(t * 8 + d.offset) * 0.4;
        dummy.position.set(d.x + Math.sin(t * 1.5 + d.offset) * 0.6, d.y, d.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(d.size * flicker);
        dummy.updateMatrix();
        emberRef.current.setMatrixAt(i, dummy.matrix);
      }
      emberRef.current.instanceMatrix.needsUpdate = true;
    }

    if (status !== 'playing' && status !== 'menu') return;
    const move = useGameStore.getState().getCurrentSpeed() * delta;

    rockTexture.offset.x += (move / (GROUND_LENGTH * 2)) * 20;
    lavaTexture.offset.x += (move * 0.35) / (BACKGROUND_LENGTH * 2) * 30;
    lavaTexture.offset.y = Math.sin(t * 0.4) * 0.05;

    if (treeTrunkRef.current && treeBranchRef.current && flameRef.current && flameCoreRef.current && treeGlowRef.current) {
      for (let i = 0; i < treeCount; i++) {
        const tr = treeData[i];
        tr.x -= move * TREE_LAYER_SPEED;
        if (tr.x < -TREE_LAYER_LENGTH / 2) tr.x += TREE_LAYER_LENGTH;

        dummy.rotation.set(0, 0, 0);
        dummy.position.set(tr.x, tr.h / 2, tr.z);
        dummy.scale.set(0.8, tr.h, 0.8);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);

        // Two charred branches
        for (let b = 0; b < 2; b++) {
          const side = b === 0 ? -1 : 1;
          dummy.position.set(tr.x + side * 0.85, tr.h * 0.6 + 0.6, tr.z);
          dummy.rotation.set(0, 0, -side * 0.9);
          dummy.scale.set(0.35, 2.6, 0.35);
          dummy.updateMatrix();
          treeBranchRef.current.setMatrixAt(i * 2 + b, dummy.matrix);
        }

        // Three flames (top + one per branch tip), each with a hotter core
        const anchors = [
          [0, tr.h, 1.0],
          [-1.7, tr.h * 0.6 + 1.5, 0.75],
          [1.7, tr.h * 0.6 + 1.5, 0.8],
        ];
        for (let f = 0; f < 3; f++) {
          const [ax, ay, base] = anchors[f];
          const ph = t * 9 + tr.offset + f * 2.1;
          const w = base * (1 + Math.sin(ph) * 0.15);
          const hgt = base * 2.6 * (1 + Math.sin(ph * 1.3 + 1) * 0.25);
          const sway = Math.sin(t * 5 + tr.offset + f) * 0.12;
          dummy.rotation.set(0, t * 2 + f, sway);
          dummy.position.set(tr.x + ax, ay + hgt / 2, tr.z);
          dummy.scale.set(w, hgt, w);
          dummy.updateMatrix();
          flameRef.current.setMatrixAt(i * 3 + f, dummy.matrix);

          dummy.position.set(tr.x + ax, ay + hgt * 0.32, tr.z + 0.05);
          dummy.scale.set(w * 0.55, hgt * 0.62, w * 0.55);
          dummy.updateMatrix();
          flameCoreRef.current.setMatrixAt(i * 3 + f, dummy.matrix);
        }

        // Soft halo so the fire lights the air around it
        const halo = 5 + Math.sin(t * 4 + tr.offset) * 0.4;
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(tr.x, tr.h * 0.85, tr.z);
        dummy.scale.set(halo, halo, halo);
        dummy.updateMatrix();
        treeGlowRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeBranchRef.current.instanceMatrix.needsUpdate = true;
      flameRef.current.instanceMatrix.needsUpdate = true;
      flameCoreRef.current.instanceMatrix.needsUpdate = true;
      treeGlowRef.current.instanceMatrix.needsUpdate = true;
    }

    if (volcanoRef.current && craterRef.current && smokeRef.current) {
      for (let i = 0; i < VOLCANO_COUNT; i++) {
        const v = volcanoData[i];
        v.x -= move * 0.18;
        if (v.x < -BACKGROUND_LENGTH / 2) v.x += BACKGROUND_LENGTH;

        dummy.position.set(v.x, v.height / 2 - 1, v.z);
        dummy.rotation.set(0, Math.PI / 4, 0);
        dummy.scale.set(v.width, v.height, v.width);
        dummy.updateMatrix();
        volcanoRef.current.setMatrixAt(i, dummy.matrix);

        // Glowing crater cap on the top 18%
        const cap = 0.18;
        dummy.position.set(v.x, v.height * (1 - cap / 2) - 1, v.z);
        dummy.scale.set(v.width * cap * 1.04, v.height * cap, v.width * cap * 1.04);
        dummy.updateMatrix();
        craterRef.current.setMatrixAt(i, dummy.matrix);

        // Smoke plume drifting up and fading out of the crater
        for (let s = 0; s < SMOKE_PER_VOLCANO; s++) {
          const life = ((t * 0.12 + s / SMOKE_PER_VOLCANO + v.offset) % 1);
          const size = (2.5 + life * 7) * (v.height / 20);
          dummy.position.set(v.x + life * 5 + Math.sin(life * 6 + v.offset) * 1.2, v.height - 1 + life * 16, v.z);
          dummy.rotation.set(0, life * 3, 0);
          dummy.scale.set(size, size * 0.7, size);
          dummy.updateMatrix();
          smokeRef.current.setMatrixAt(i * SMOKE_PER_VOLCANO + s, dummy.matrix);
        }
      }
      volcanoRef.current.instanceMatrix.needsUpdate = true;
      craterRef.current.instanceMatrix.needsUpdate = true;
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Basalt floor with glowing cracks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_LENGTH * 2, 60]} />
        <meshStandardMaterial map={rockTexture} emissiveMap={rockTexture} emissive="#ff7a1a" emissiveIntensity={0.7} roughness={1} />
      </mesh>

      {/* Distant lava river */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -40]}>
        <planeGeometry args={[BACKGROUND_LENGTH * 2, 26]} />
        <meshBasicMaterial map={lavaTexture} color="#ffb066" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -70]}>
        <planeGeometry args={[BACKGROUND_LENGTH * 2, 60]} />
        <meshStandardMaterial color="#1a0f0d" roughness={1} />
      </mesh>

      {/* Volcanoes: dark cone + glowing crater cap + smoke */}
      <instancedMesh frustumCulled={false} ref={volcanoRef} args={[undefined, undefined, VOLCANO_COUNT]}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color="#3d2520" roughness={0.95} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={craterRef} args={[undefined, undefined, VOLCANO_COUNT]}>
        <coneGeometry args={[1, 1, 4]} />
        <meshBasicMaterial ref={craterMatRef} color="#f97316" />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={smokeRef} args={[undefined, undefined, VOLCANO_COUNT * SMOKE_PER_VOLCANO]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial color="#3b2622" transparent opacity={0.45} depthWrite={false} />
      </instancedMesh>

      {/* Burning trees (second background layer) */}
      <instancedMesh frustumCulled={false} ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNTS.high]} count={treeCount}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#24140f" roughness={1} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeBranchRef} args={[undefined, undefined, TREE_COUNTS.high * 2]} count={treeCount * 2}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#24140f" roughness={1} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={flameRef} args={[undefined, undefined, TREE_COUNTS.high * 3]} count={treeCount * 3}>
        <coneGeometry args={[1, 1, 5]} />
        <meshBasicMaterial color="#ff5a12" toneMapped={false} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={flameCoreRef} args={[undefined, undefined, TREE_COUNTS.high * 3]} count={treeCount * 3}>
        <coneGeometry args={[1, 1, 5]} />
        <meshBasicMaterial color="#ffd23a" toneMapped={false} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeGlowRef} args={[undefined, undefined, TREE_COUNTS.high]} count={treeCount}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      {/* Fire embers rising through the air */}
      <instancedMesh frustumCulled={false} ref={emberRef} args={[undefined, undefined, EMBER_COUNTS.high]} count={emberCount}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#fb923c" toneMapped={false} />
      </instancedMesh>

      {/* Herd, pterosaurs, eruptions, meteors and lane-side props */}
      <LavaLife volcanoes={volcanoData} />

      {/* Warm glow near the horizon */}
      <pointLight position={[10, 4, -8]} color="#ff5a1f" intensity={30} distance={40} />

      {/* Ash clouds */}
      <Clouds color="#4a2a25" count={8} length={180} speedFactor={0.1} opacity={0.55} />
    </group>
  );
}
