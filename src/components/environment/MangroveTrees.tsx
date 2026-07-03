import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export interface MangroveTreesProps {
  zSpread?: number;
  count?: number;
  length?: number;
  speedFactor?: number;
  zOffset?: number;
  scaleMult?: number;
  trunkColor?: string;
  leavesColor?: string;
}

export function MangroveTrees({
  count = 20,
  length = 150,
  speedFactor = 0.2, // This is the parallax factor
  zOffset = -35,
  scaleMult = 1,
  trunkColor = "#44403c",
  leavesColor = "#064e3b",
  zSpread = 20
}: MangroveTreesProps) {
  const { status, speed } = useGameStore();

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const rootRef = useRef<THREE.InstancedMesh>(null);
  const root2Ref = useRef<THREE.InstancedMesh>(null);
  const root3Ref = useRef<THREE.InstancedMesh>(null);
  const root4Ref = useRef<THREE.InstancedMesh>(null);
  const leavesRef = useRef<THREE.InstancedMesh>(null);

  const treeData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const scale = (2 + Math.random() * 3) * scaleMult;
      data.push({
        x: (Math.random() - 0.5) * length,
        y: -1.5,
        z: zOffset - Math.random() * zSpread,
        scale: scale,
        rot: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, [count, length, zOffset, scaleMult, zSpread]);

  useFrame((_, delta) => {
    if (status !== 'playing' && status !== 'menu') return;
    if (!trunkRef.current || !rootRef.current || !leavesRef.current) return;

    const moveDistance = useGameStore.getState().getCurrentSpeed() * delta * speedFactor;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const d = treeData[i];
      d.x -= moveDistance;
      
      if (d.x < -length / 2) {
        d.x += length;
        d.z = zOffset - Math.random() * zSpread;
      }

      // Trunk
      const trunkHeight = d.scale * 6.0;
      dummy.position.set(d.x, d.y + trunkHeight / 2, d.z);
      dummy.rotation.set(0, d.rot, 0);
      dummy.scale.set(d.scale, trunkHeight, d.scale);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);

      // Roots (stilt roots)
      const rootHeight = d.scale * 4.0;
      const rootSpread = d.scale * 1.5;
      const rootThickness = d.scale * 0.4;
      
      // Root 1
      dummy.position.set(d.x + rootSpread, d.y + rootHeight/2 - 1, d.z);
      dummy.rotation.set(0, d.rot, Math.PI / 8);
      dummy.scale.set(rootThickness, rootHeight, rootThickness);
      dummy.updateMatrix();
      rootRef.current.setMatrixAt(i, dummy.matrix);
      
      // Root 2
      dummy.position.set(d.x - rootSpread, d.y + rootHeight/2 - 1, d.z);
      dummy.rotation.set(0, d.rot, -Math.PI / 8);
      dummy.scale.set(rootThickness, rootHeight, rootThickness);
      dummy.updateMatrix();
      if (root2Ref.current) root2Ref.current.setMatrixAt(i, dummy.matrix);

      // Root 3
      dummy.position.set(d.x, d.y + rootHeight/2 - 1, d.z + rootSpread);
      dummy.rotation.set(-Math.PI / 8, d.rot, 0);
      dummy.scale.set(rootThickness, rootHeight, rootThickness);
      dummy.updateMatrix();
      if (root3Ref.current) root3Ref.current.setMatrixAt(i, dummy.matrix);

      // Root 4
      dummy.position.set(d.x, d.y + rootHeight/2 - 1, d.z - rootSpread);
      dummy.rotation.set(Math.PI / 8, d.rot, 0);
      dummy.scale.set(rootThickness, rootHeight, rootThickness);
      dummy.updateMatrix();
      if (root4Ref.current) root4Ref.current.setMatrixAt(i, dummy.matrix);

      // Leaves
      dummy.position.set(d.x, d.y + trunkHeight, d.z);
      dummy.rotation.set(0, d.rot, 0);
      dummy.scale.set(d.scale * 4, d.scale * 3, d.scale * 4);
      dummy.updateMatrix();
      leavesRef.current.setMatrixAt(i, dummy.matrix);
    }

    trunkRef.current.instanceMatrix.needsUpdate = true;
    rootRef.current.instanceMatrix.needsUpdate = true;
    if (root2Ref.current) root2Ref.current.instanceMatrix.needsUpdate = true;
    if (root3Ref.current) root3Ref.current.instanceMatrix.needsUpdate = true;
    if (root4Ref.current) root4Ref.current.instanceMatrix.needsUpdate = true;
    leavesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 6]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={rootRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={root2Ref} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={root3Ref} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={root4Ref} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </instancedMesh>
      
      <instancedMesh ref={leavesRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={leavesColor} roughness={0.9} />
      </instancedMesh>
    </>
  );
}
