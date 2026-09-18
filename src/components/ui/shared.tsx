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

// Custom coin icon for the game's currency ("Dino Coin"): a gold coin embossed
// with a 3-toe dino footprint, replacing the generic 🪙 emoji everywhere coins show up.
export function DinoCoinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="dinoCoinGradient" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff6d6" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.6" fill="url(#dinoCoinGradient)" stroke="#78350f" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="#78350f" strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="1.1 1.5" />
      <g fill="#78350f" fillOpacity="0.85">
        <ellipse cx="12" cy="14.6" rx="3.1" ry="2.3" />
        <ellipse cx="9.3" cy="10.3" rx="1.15" ry="1.6" transform="rotate(-18 9.3 10.3)" />
        <ellipse cx="12" cy="9.2" rx="1.2" ry="1.75" />
        <ellipse cx="14.7" cy="10.3" rx="1.15" ry="1.6" transform="rotate(18 14.7 10.3)" />
      </g>
    </svg>
  );
}

// Pixel-art dino face used as the game's logo icon.
export function DinoFaceIcon({ className = 'w-6 h-6' }: { className?: string }) {
  const palette: Record<string, string> = {
    B: '#22c55e',
    S: '#15803d',
    D: '#14532d',
    W: '#ffffff',
    K: '#111111',
  };
  const grid = [
    '..S.S.S..',
    '.BBBBBBB.',
    'BBBBBBBBB',
    'BBWKBWKBB',
    'BBBBBBBBB',
    'BBBDBDBBB',
    'BBBBBBBBB',
    '.BWBWBWB.',
    '..BBBBB..',
  ];

  return (
    <svg viewBox="0 0 9 9" className={className} style={{ imageRendering: 'pixelated' }} shapeRendering="crispEdges" aria-hidden="true">
      {grid.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={palette[cell]} />
        )
      )}
    </svg>
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
