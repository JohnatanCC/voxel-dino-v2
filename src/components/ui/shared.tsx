import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Dino } from '../Dino';
import { SkinConfig } from '../../store/gameStore';

export function RotatingDinoPreview({ skinId }: { skinId: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.0;
    }
  });
  return (
    <group ref={ref} position={[0, -0.25, 0]} scale={0.9}>
      <Dino previewMode={true} skinId={skinId} />
    </group>
  );
}

export function MiniDinoPixelArt({ skin }: { skin: SkinConfig }) {
  const base = skin.baseColor;
  const spots = skin.spotsColor;
  const spikes = skin.spikesColor;
  const collar = skin.collarColor;

  const grid = [
    ['O', 'O', 'P', 'B', 'B', 'B', 'B', 'O'],
    ['O', 'P', 'B', 'B', 'B', 'E', 'B', 'O'],
    ['P', 'B', 'S', 'B', 'B', 'K', 'B', 'O'],
    ['O', 'B', 'B', 'B', 'B', 'B', 'B', 'O'],
    ['O', 'O', 'B', 'B', 'B', 'O', 'O', 'O'],
    ['O', 'O', 'C', 'C', 'C', 'O', 'O', 'O'],
    ['O', 'O', 'B', 'S', 'B', 'O', 'O', 'O'],
    ['O', 'O', 'B', 'B', 'B', 'O', 'O', 'O'],
  ];

  return (
    <svg viewBox="0 0 8 8" className="w-12 h-12 md:w-14 md:h-14" style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) =>
        row.map((cell, x) => {
          if (cell === 'O') return null;
          let color = base;
          if (cell === 'S') color = spots;
          if (cell === 'P') color = spikes;
          if (cell === 'C') color = collar;
          if (cell === 'E') color = '#ffffff';
          if (cell === 'K') color = '#000000';

          if (skin.isRainbow) {
            const hues = [0, 45, 90, 135, 180, 225, 270, 315];
            if (cell !== 'E' && cell !== 'K') {
              color = `hsl(${hues[(x + y) % 8]}, 90%, 55%)`;
            }
          }

          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1.02"
              height="1.02"
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
}
