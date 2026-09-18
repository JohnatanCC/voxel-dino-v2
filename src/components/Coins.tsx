import { createRef, RefObject, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { ObstacleData } from '../scenarios/types';
import { SPAWN_DISTANCE, DESPAWN_DISTANCE } from '../scenarios/helpers';
import { spawnParticles } from './VFXRenderer';
import { playCoinSound } from '../utils/audio';
import {
  COIN_ROW_MIN,
  COIN_ROW_MAX,
  COIN_SPACING,
  COIN_ROW_GAP_MIN,
  COIN_ROW_GAP_MAX,
} from '../config/balance';

const POOL_SIZE = 20;
const COIN_SPAWN_X = SPAWN_DISTANCE + 16;
const PICKUP_RADIUS = 0.55;
const MIN_Y = 0.9;
const MAX_Y = 3.6;

const coinRimMaterial = new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.6 });
const coinFaceMaterial = new THREE.MeshStandardMaterial({ color: '#fde68a', emissive: '#fbbf24', emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.5 });
const coinRimGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.14, 12);
const coinFaceGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.17, 12);

type CoinPattern = 'low' | 'high' | 'arc' | 'rampUp' | 'rampDown' | 'wave';

// Rows always follow one of these shapes (never random heights), so a player can read
// the row and plan a jump — the same reason obstacles are spaced instead of scattered.
function pickPattern(): CoinPattern {
  const r = Math.random();
  if (r < 0.28) return 'low';
  if (r < 0.5) return 'arc';
  if (r < 0.64) return 'high';
  if (r < 0.76) return 'rampUp';
  if (r < 0.88) return 'rampDown';
  return 'wave';
}

function heightAt(pattern: CoinPattern, i: number, count: number): number {
  const t = count > 1 ? i / (count - 1) : 0;
  switch (pattern) {
    case 'low': return 1.2;
    case 'high': return 3.2;
    case 'arc': return 1.2 + Math.sin(t * Math.PI) * 2.4;
    case 'rampUp': return 1.2 + t * 2.2;
    case 'rampDown': return 3.4 - t * 2.2;
    case 'wave': return 2.3 + Math.sin(i * 1.3) * 0.9;
  }
}

interface CoinSlot {
  id: number;
  x: number;
  y: number;
  active: boolean;
  ref: RefObject<THREE.Group | null>;
}

interface CoinsProps {
  obstaclesRef: RefObject<ObstacleData[]>;
  dinoRef: RefObject<THREE.Group | null>;
}

export function Coins({ obstaclesRef, dinoRef }: CoinsProps) {
  const gameId = useGameStore((s) => s.gameId);
  const [pool] = useState<CoinSlot[]>(() =>
    Array.from({ length: POOL_SIZE }, (_, i) => ({
      id: i,
      x: -1000,
      y: 0,
      active: false,
      ref: createRef<THREE.Group>(),
    }))
  );
  const distanceToNextRow = useRef(30);
  const dinoBox = useRef(new THREE.Box3());
  const coinPos = useRef(new THREE.Vector3());

  useEffect(() => {
    pool.forEach((c) => {
      c.active = false;
      c.x = -1000;
      if (c.ref.current) c.ref.current.visible = false;
    });
    distanceToNextRow.current = 30;
  }, [gameId, pool]);

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.status !== 'playing') return;

    const moveDistance = store.getCurrentSpeed() * delta;
    const time = state.clock.elapsedTime;

    const dino = dinoRef.current;
    let hasBox = false;
    if (dino) {
      dinoBox.current.setFromObject(dino);
      hasBox = !dinoBox.current.isEmpty();
    }

    for (const coin of pool) {
      if (!coin.active) continue;
      coin.x -= moveDistance;
      const g = coin.ref.current;

      if (coin.x < DESPAWN_DISTANCE) {
        coin.active = false;
        if (g) g.visible = false;
        continue;
      }
      if (g) {
        g.position.set(coin.x, coin.y + Math.sin(time * 3 + coin.id) * 0.06, 0);
        g.rotation.y = time * 3.2 + coin.id * 0.5;
      }

      if (hasBox) {
        coinPos.current.set(coin.x, coin.y, 0);
        if (dinoBox.current.distanceToPoint(coinPos.current) < PICKUP_RADIUS) {
          coin.active = false;
          if (g) g.visible = false;
          store.collectCoin();
          playCoinSound();
          spawnParticles('sparkle', [coin.x, coin.y, 0], 8, '#fbbf24');
        }
      }
    }

    // Spawn the next row once the previous one (plus its gap) has scrolled past.
    distanceToNextRow.current -= moveDistance;
    if (distanceToNextRow.current > 0 || store.isTransitioning) return;

    const count = COIN_ROW_MIN + Math.floor(Math.random() * (COIN_ROW_MAX - COIN_ROW_MIN + 1));
    const rowLength = (count - 1) * COIN_SPACING;

    // Don't drop a row on top of an obstacle: skip and retry a bit further on.
    const blocked = (obstaclesRef.current ?? []).some(
      (o) => o.type !== 'egg' && o.x > COIN_SPAWN_X - 3 && o.x < COIN_SPAWN_X + rowLength + 3
    );
    const free = pool.filter((c) => !c.active);
    if (blocked || free.length < count) {
      distanceToNextRow.current = 4;
      return;
    }

    const pattern = pickPattern();
    for (let i = 0; i < count; i++) {
      const c = free[i];
      c.active = true;
      c.x = COIN_SPAWN_X + i * COIN_SPACING;
      c.y = Math.min(MAX_Y, Math.max(MIN_Y, heightAt(pattern, i, count)));
      if (c.ref.current) {
        c.ref.current.position.set(c.x, c.y, 0);
        c.ref.current.visible = true;
      }
    }
    distanceToNextRow.current = rowLength + COIN_ROW_GAP_MIN + Math.random() * (COIN_ROW_GAP_MAX - COIN_ROW_GAP_MIN);
  });

  return (
    <group>
      {pool.map((c) => (
        <group key={c.id} ref={c.ref} visible={false}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={coinRimMaterial} geometry={coinRimGeo} />
            <mesh material={coinFaceMaterial} geometry={coinFaceGeo} />
          </group>
        </group>
      ))}
    </group>
  );
}
