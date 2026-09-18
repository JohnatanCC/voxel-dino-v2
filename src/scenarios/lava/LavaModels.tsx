import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Lava pool: glowing puddle on the ground (jump over it) ---

const poolLavaMaterial = new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#ff5a00', emissiveIntensity: 1.6, roughness: 0.3 });
const poolRimMaterial = new THREE.MeshStandardMaterial({ color: '#5a3426', roughness: 1 });
const poolBubbleMaterial = new THREE.MeshBasicMaterial({ color: '#fde047', toneMapped: false });

const poolRimGeo = new THREE.BoxGeometry(0.5, 0.42, 1.9);
const poolRimSideGeo = new THREE.BoxGeometry(1, 0.32, 0.36);
const poolBubbleGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);

export const LavaPool = forwardRef<THREE.Group, { x: number; scale?: number }>(({ x, scale = 1 }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const bubbleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const length = 2.6 * scale + 0.6;

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    poolLavaMaterial.emissiveIntensity = 1.5 + Math.sin(t * 4 + x) * 0.35;
    bubbleRefs.current.forEach((b, i) => {
      if (!b) return;
      const phase = (t * (0.8 + i * 0.25) + i * 0.7) % 1;
      b.position.y = 0.2 + phase * 0.42;
      b.scale.setScalar(Math.sin(phase * Math.PI) * 1.1 + 0.05);
    });
  });

  return (
    <group ref={innerRef} position={[x, 0, 0]}>
      {/* Glowing surface */}
      <mesh position={[0, 0.16, 0]} castShadow={false} material={poolLavaMaterial}>
        <boxGeometry args={[length, 0.3, 1.7]} />
      </mesh>
      {/* Dark rock rim: ends and sides */}
      <mesh position={[-length / 2 - 0.1, 0.21, 0]} material={poolRimMaterial} geometry={poolRimGeo} castShadow />
      <mesh position={[length / 2 + 0.1, 0.21, 0]} material={poolRimMaterial} geometry={poolRimGeo} castShadow />
      <mesh position={[0, 0.16, 0.95]} scale={[length, 1, 1]} material={poolRimMaterial} geometry={poolRimSideGeo} castShadow />
      <mesh position={[0, 0.16, -0.95]} scale={[length, 1, 1]} material={poolRimMaterial} geometry={poolRimSideGeo} castShadow />
      {/* Bubbles popping on the surface */}
      {[-0.35, 0.05, 0.4].map((f, i) => (
        <mesh
          key={i}
          ref={(el) => { bubbleRefs.current[i] = el; }}
          position={[f * length, 0.3, (i - 1) * 0.35]}
          material={poolBubbleMaterial}
          geometry={poolBubbleGeo}
        />
      ))}
    </group>
  );
});

// --- Magma beetle: giant spiked insect walking toward the player ---

const bugShellMaterial = new THREE.MeshStandardMaterial({ color: '#8f3f22', roughness: 0.6, metalness: 0.1, emissive: '#3d1204', emissiveIntensity: 0.5 });
const bugCrackMaterial = new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#ff5a00', emissiveIntensity: 1.6 });
const bugSpikeMaterial = new THREE.MeshStandardMaterial({ color: '#f3a52a', emissive: '#b8400c', emissiveIntensity: 0.7, roughness: 0.4 });
const bugLegMaterial = new THREE.MeshStandardMaterial({ color: '#6b2f1c', roughness: 0.8 });
const bugEyeMaterial = new THREE.MeshBasicMaterial({ color: '#fde047', toneMapped: false });

const bugAbdomenGeo = new THREE.BoxGeometry(1.6, 0.95, 1.3);
const bugThoraxGeo = new THREE.BoxGeometry(0.95, 0.75, 1.0);
const bugHeadGeo = new THREE.BoxGeometry(0.62, 0.5, 0.7);
const bugMandibleGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
const bugSpikeGeo = new THREE.ConeGeometry(0.17, 0.8, 4);
const bugCrackGeo = new THREE.BoxGeometry(1.0, 0.04, 0.09);
const bugLegGeo = new THREE.BoxGeometry(0.1, 0.75, 0.1);
const bugEyeGeo = new THREE.BoxGeometry(0.1, 0.12, 0.12);

const BUG_LEG_SLOTS: { x: number; z: number }[] = [
  { x: -0.55, z: 0.6 }, { x: 0.1, z: 0.65 }, { x: 0.7, z: 0.6 },
  { x: -0.55, z: -0.6 }, { x: 0.1, z: -0.65 }, { x: 0.7, z: -0.6 },
];
const BUG_SPIKES = [-0.55, -0.2, 0.15, 0.5, 0.82];

export const LavaBug = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const legRefs = useRef<(THREE.Mesh | null)[]>([]);

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    legRefs.current.forEach((leg, i) => {
      if (!leg) return;
      leg.rotation.x = Math.sin(t * 14 + (i % 2 === 0 ? 0 : Math.PI)) * 0.5 * (i < 3 ? 1 : -1);
    });
    if (innerRef.current) innerRef.current.position.y = Math.abs(Math.sin(t * 14)) * 0.05;
  });

  // Faces -x (toward the player), like the other ground creatures.
  return (
    <group ref={innerRef} position={[x, 0, 0]}>
      <mesh position={[0.35, 0.95, 0]} material={bugShellMaterial} geometry={bugAbdomenGeo} castShadow receiveShadow />
      <mesh position={[-0.75, 0.85, 0]} material={bugShellMaterial} geometry={bugThoraxGeo} castShadow receiveShadow />
      <mesh position={[-1.4, 0.8, 0]} material={bugShellMaterial} geometry={bugHeadGeo} castShadow />
      <mesh position={[-1.7, 0.66, 0.16]} rotation={[0, 0.4, 0]} material={bugLegMaterial} geometry={bugMandibleGeo} />
      <mesh position={[-1.7, 0.66, -0.16]} rotation={[0, -0.4, 0]} material={bugLegMaterial} geometry={bugMandibleGeo} />
      <mesh position={[-1.68, 0.92, 0.2]} material={bugEyeMaterial} geometry={bugEyeGeo} />
      <mesh position={[-1.68, 0.92, -0.2]} material={bugEyeMaterial} geometry={bugEyeGeo} />

      {/* Back spikes */}
      {BUG_SPIKES.map((sx, i) => (
        <mesh key={i} position={[sx, 1.75 - Math.abs(sx) * 0.12, 0]} rotation={[0, 0, sx < 0 ? 0.25 : -0.05]} material={bugSpikeMaterial} geometry={bugSpikeGeo} castShadow />
      ))}
      {/* Lava cracks across the shell */}
      <mesh position={[0.35, 1.43, 0.3]} material={bugCrackMaterial} geometry={bugCrackGeo} />
      <mesh position={[0.35, 1.43, -0.3]} material={bugCrackMaterial} geometry={bugCrackGeo} />
      <mesh position={[-0.75, 1.24, 0]} scale={[0.7, 1, 1]} material={bugCrackMaterial} geometry={bugCrackGeo} />

      {BUG_LEG_SLOTS.map((slot, i) => (
        <mesh
          key={i}
          ref={(el) => { legRefs.current[i] = el; }}
          position={[slot.x, 0.38, slot.z]}
          material={bugLegMaterial}
          geometry={bugLegGeo}
          castShadow
        />
      ))}
    </group>
  );
});
