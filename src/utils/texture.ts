import * as THREE from 'three';

// Helper to lighten/darken hex colors
function alterColor(hex: string, percent: number): string {
  // Remove '#' if present
  const cleanHex = hex.replace("#", "");
  
  // Parse colors
  const num = parseInt(cleanHex, 16);
  const amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = ((num >> 8) & 0x00ff) + amt;
  let B = (num & 0x0000ff) + amt;

  // Clamp values
  R = Math.max(0, Math.min(255, R));
  G = Math.max(0, Math.min(255, G));
  B = Math.max(0, Math.min(255, B));

  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function createVoxelTexture(
  baseColor: string,
  spotsColor: string,
  pattern: 'classic' | 'kitsune' | 'rainbow' | 'plain' = 'classic'
): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    // Fallback for SSR/non-browser environment
    return new THREE.Texture() as THREE.CanvasTexture;
  }

  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Fill base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Draw pattern/noise
  if (pattern === 'classic') {
    // Add pixelated noise/shading
    for (let x = 0; x < size; x += 4) {
      for (let y = 0; y < size; y += 4) {
        const rand = Math.random();
        if (rand > 0.85) {
          ctx.fillStyle = spotsColor;
          ctx.fillRect(x, y, 4, 4);
        } else if (rand > 0.65) {
          ctx.fillStyle = alterColor(baseColor, -12); // slightly darker shadow
          ctx.fillRect(x, y, 4, 4);
        } else if (rand < 0.1) {
          ctx.fillStyle = alterColor(baseColor, 10); // slightly lighter highlight
          ctx.fillRect(x, y, 4, 4);
        }
      }
    }
  } else if (pattern === 'kitsune') {
    // Shading with soft off-white/fur look
    for (let x = 0; x < size; x += 2) {
      for (let y = 0; y < size; y += 2) {
        const rand = Math.random();
        if (rand > 0.9) {
          ctx.fillStyle = '#f1f5f9'; // Slate-100 highlight
          ctx.fillRect(x, y, 2, 2);
        } else if (rand < 0.1) {
          ctx.fillStyle = '#e2e8f0'; // Slate-200 shadow
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Draw some elegant cyan accents
    ctx.fillStyle = spotsColor;
    ctx.fillRect(4, 4, 4, 4);
    ctx.fillRect(24, 24, 4, 4);
  } else if (pattern === 'rainbow') {
    // Cyberpunk pattern texture
    ctx.fillStyle = '#0f172a'; // Slate-900 background
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size; i += 4) {
      ctx.fillStyle = `hsl(${(i / size) * 360}, 90%, 55%)`;
      ctx.fillRect(i, 0, 2, size);
      ctx.fillRect(0, i, size, 2);
    }
  }

  // Draw ambient occlusion (shadow borders on bottom and left, highlights on top)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  // Bottom border shadow
  ctx.fillRect(0, size - 2, size, 2);
  // Left border shadow
  ctx.fillRect(0, 0, 2, size);

  // Top border highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(0, 0, size, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
}
