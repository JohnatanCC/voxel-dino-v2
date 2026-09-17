import { useMemo } from 'react';
import * as THREE from 'three';

interface WingsProps {
  wingLeftRef: React.RefObject<THREE.Group | null>;
  wingRightRef: React.RefObject<THREE.Group | null>;
  position?: [number, number, number];
  accentColor?: string;
}

const wingOuterGeo = new THREE.BoxGeometry(0.15, 0.9, 1.6);
const wingMidGeo = new THREE.BoxGeometry(0.08, 0.6, 1.2);
const wingInnerGeo = new THREE.BoxGeometry(0.08, 0.4, 0.9);

// One consistent 3-layer feathered wing design shared by every skin (Gospel keeps its own
// permanent wings and doesn't use this) — only the accent color changes per skin, so each
// still reads as "that skin's" wings rather than a generic bolt-on.
export function Wings({ wingLeftRef, wingRightRef, position = [-0.4, 1.2, 0], accentColor = '#ffffff' }: WingsProps) {
  const outerMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.3, metalness: 0.1 }), [accentColor]);
  const midMaterial = useMemo(() => {
    const c = new THREE.Color(accentColor).lerp(new THREE.Color('#ffffff'), 0.35);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 });
  }, [accentColor]);
  const innerMaterial = useMemo(() => {
    const c = new THREE.Color(accentColor).lerp(new THREE.Color('#ffffff'), 0.6);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 });
  }, [accentColor]);

  return (
    <group position={position}>
      <group ref={wingLeftRef} position={[0, 0, 0.5]}>
        <mesh position={[0, 0.2, 0.6]} rotation={[0, Math.PI / 6, 0]} castShadow geometry={wingOuterGeo} material={outerMaterial} />
        <mesh position={[-0.05, -0.1, 0.8]} rotation={[0.1, Math.PI / 8, 0]} castShadow geometry={wingMidGeo} material={midMaterial} />
        <mesh position={[-0.08, -0.3, 1.0]} rotation={[0.2, Math.PI / 10, 0]} castShadow geometry={wingInnerGeo} material={innerMaterial} />
      </group>
      <group ref={wingRightRef} position={[0, 0, -0.5]}>
        <mesh position={[0, 0.2, -0.6]} rotation={[0, -Math.PI / 6, 0]} castShadow geometry={wingOuterGeo} material={outerMaterial} />
        <mesh position={[-0.05, -0.1, -0.8]} rotation={[-0.1, -Math.PI / 8, 0]} castShadow geometry={wingMidGeo} material={midMaterial} />
        <mesh position={[-0.08, -0.3, -1.0]} rotation={[-0.2, -Math.PI / 10, 0]} castShadow geometry={wingInnerGeo} material={innerMaterial} />
      </group>
    </group>
  );
}
