import { useFrame } from '@react-three/fiber';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { PowerupType } from '../types';
import { POWERUP_ACCENT_COLORS } from '../../config/balance';

// One shared powerup box for all biomes (previously duplicated 4x, one per scenario file,
// all rendering the exact same generic glyph regardless of type — a player could not tell
// wings from ghost from jaw apart until they'd already grabbed one). Now each type gets its
// own color (reusing POWERUP_ACCENT_COLORS, already used by the HUD) and its own icon,
// drawn as a small voxel-pixel grid on the front/back faces — same technique as the shop's
// 2D pixel-art skin previews, just built out of tiny boxes instead of SVG rects.

const powerupBoxGeo = new THREE.BoxGeometry(1, 1, 1);
const iconPixelGeo = new THREE.BoxGeometry(1, 1, 0.4);
const iconMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });

const LIFE_COLOR = '#ef4444';

const POWERUP_BODY_MATERIALS: Record<PowerupType, THREE.MeshStandardMaterial> = {
  wings: makeBodyMaterial(POWERUP_ACCENT_COLORS.wings),
  super: makeBodyMaterial(POWERUP_ACCENT_COLORS.super),
  ghost: makeBodyMaterial(POWERUP_ACCENT_COLORS.ghost),
  jaw: makeBodyMaterial(POWERUP_ACCENT_COLORS.jaw),
  earth: makeBodyMaterial(POWERUP_ACCENT_COLORS.earth),
  dragon: makeBodyMaterial(POWERUP_ACCENT_COLORS.dragon),
  life: makeBodyMaterial(LIFE_COLOR),
};

function makeBodyMaterial(color: string) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.8 });
}

// 5x5 pixel grids, one distinct silhouette per powerup type — 'X' is a filled cell.
const ICON_GRIDS: Record<PowerupType, string[]> = {
  life: ['..X..', '..X..', 'XXXXX', '..X..', '..X..'], // cross
  super: ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'], // star burst
  wings: ['X...X', 'XX.XX', 'XXXXX', '..X..', '..X..'], // wings spread + body
  ghost: ['.XXX.', 'XXXXX', 'XXXXX', 'X.X.X', 'X.X.X'], // rounded head, wavy hem
  jaw: ['X...X', 'X...X', 'XX.XX', '.X.X.', '.....'], // fangs
  earth: ['XXXXX', '.XXX.', '.XXX.', '..X..', '.....'], // drill point
  dragon: ['..X..', '.XXX.', '.XXX.', 'XXXXX', '.XXX.'], // flame
};

const ICON_CELL = 0.1;

function PowerupIcon({ type, z }: { type: PowerupType; z: number }) {
  const grid = ICON_GRIDS[type];
  const rows = grid.length;
  const cols = grid[0].length;
  const totalW = cols * ICON_CELL;
  const totalH = rows * ICON_CELL;

  return (
    <group position={[0, 0, z]}>
      {grid.flatMap((row, r) =>
        [...row].map((cell, c) => {
          if (cell !== 'X') return null;
          const px = c * ICON_CELL - totalW / 2 + ICON_CELL / 2;
          const py = totalH / 2 - r * ICON_CELL - ICON_CELL / 2;
          return (
            <mesh
              key={`${r}-${c}`}
              position={[px, py, 0]}
              scale={[ICON_CELL * 0.85, ICON_CELL * 0.85, 1]}
              geometry={iconPixelGeo}
              material={iconMaterial}
            />
          );
        })
      )}
    </group>
  );
}

export const PowerupBox = forwardRef<THREE.Group, { x: number; y: number; type?: PowerupType }>(({ x, y, type }, ref) => {
  const innerRef = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      innerRef.current.rotation.y = time * 2;
      innerRef.current.position.y = y + Math.sin(time * 5) * 0.2;
    }
  });

  const resolvedType = type ?? 'super';
  const bodyMaterial = POWERUP_BODY_MATERIALS[resolvedType];

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      <mesh castShadow receiveShadow material={bodyMaterial} geometry={powerupBoxGeo} />
      <PowerupIcon type={resolvedType} z={0.51} />
      <group rotation={[0, Math.PI, 0]}>
        <PowerupIcon type={resolvedType} z={0.51} />
      </group>
    </group>
  );
});
