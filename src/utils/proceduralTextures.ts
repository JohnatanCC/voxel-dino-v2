import * as THREE from 'three';

interface NoiseTextureOptions {
  size?: number;
  baseColor: string;
  speckleColors: string[];
  speckleCount?: number;
  speckleSize?: [number, number];
  repeat?: [number, number];
}

/** Base color plus scattered rectangular speckles — same technique the ground textures use (sand, bark, grass). */
export function createNoiseTexture({
  size = 256,
  baseColor,
  speckleColors,
  speckleCount = 2000,
  speckleSize = [1, 3],
  repeat = [1, 1],
}: NoiseTextureOptions): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < speckleCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = speckleColors[Math.floor(Math.random() * speckleColors.length)];
    const w = speckleSize[0] + Math.random() * (speckleSize[1] - speckleSize[0]);
    const h = speckleSize[0] + Math.random() * (speckleSize[1] - speckleSize[0]);
    ctx.fillRect(x, y, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

interface StripeTextureOptions {
  size?: number;
  colorA: string;
  colorB: string;
  stripes?: number;
  vertical?: boolean;
  repeat?: [number, number];
}

/** Alternating bands — used for ridged/segmented skin (cactus ribs, worm rings). */
export function createStripeTexture({
  size = 256,
  colorA,
  colorB,
  stripes = 8,
  vertical = true,
  repeat = [1, 1],
}: StripeTextureOptions): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const bandSize = size / stripes;

  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    if (vertical) ctx.fillRect(i * bandSize, 0, bandSize, size);
    else ctx.fillRect(0, i * bandSize, size, bandSize);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}
