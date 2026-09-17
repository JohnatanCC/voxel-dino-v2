import * as THREE from 'three';

// Static, single-instance stand-ins for the InstancedMesh-driven background decorations
// (ForestGround, MangroveTrees, SwampGround, SnowGround) — those scroll hundreds of copies
// imperatively via useFrame and can't be dropped into a single preview as-is. These mirror
// their exact proportions/colors at scale 1 so the asset library shows the real shape.

export function BackgroundTreeModel() {
  return (
    <group>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.6, 2.0, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function SnowyTreeModel() {
  return (
    <group>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.6, 2.0, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

export function MangroveTreeModel() {
  const trunkColor = '#44403c';
  const leavesColor = '#064e3b';
  const trunkHeight = 6.0;
  const rootHeight = 4.0;
  const rootSpread = 1.5;
  const rootThickness = 0.4;

  return (
    <group>
      <mesh position={[0, trunkHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, trunkHeight, 6]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[rootSpread, rootHeight / 2 - 1, 0]} rotation={[0, 0, Math.PI / 8]} castShadow receiveShadow>
        <cylinderGeometry args={[rootThickness * 0.5, rootThickness * 0.5, rootHeight, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[-rootSpread, rootHeight / 2 - 1, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow receiveShadow>
        <cylinderGeometry args={[rootThickness * 0.5, rootThickness * 0.5, rootHeight, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, rootHeight / 2 - 1, rootSpread]} rotation={[-Math.PI / 8, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[rootThickness * 0.5, rootThickness * 0.5, rootHeight, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, rootHeight / 2 - 1, -rootSpread]} rotation={[Math.PI / 8, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[rootThickness * 0.5, rootThickness * 0.5, rootHeight, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, trunkHeight, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={leavesColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

let lilyPadTexture: THREE.CanvasTexture | null = null;
function getLilyPadTexture() {
  if (!lilyPadTexture) lilyPadTexture = new THREE.CanvasTexture(createLilyPadCanvas());
  return lilyPadTexture;
}

export function LilyPadModel() {
  return (
    <group>
      <mesh position={[0, 0, 0]} scale={[1, 0.05, 1]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial map={getLilyPadTexture()} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, 0]} scale={[1, 0.2, 1]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshStandardMaterial color="#34d399" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function createLilyPadCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#047857';
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.moveTo(128, 128);
    const angle = (i / 16) * Math.PI * 2;
    ctx.lineTo(128 + Math.cos(angle) * 128, 128 + Math.sin(angle) * 128);
    ctx.stroke();
  }
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#065f46' : '#10b981';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  return canvas;
}
