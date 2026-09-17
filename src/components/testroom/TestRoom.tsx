import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGameStore, GameScenario } from '../../store/gameStore';
import { SCENARIOS } from '../../scenarios';
import { playBackgroundMusic, stopBackgroundMusic } from '../../utils/audio';
import { TestRoomPlayer } from './TestRoomPlayer';
import { TestRoomCamera } from './TestRoomCamera';
import { TestRoomObstacles } from './TestRoomObstacles';

const BIOME_KEYS: Record<string, GameScenario> = {
  '1': 'desert',
  '2': 'forest',
  '3': 'swamp',
  '4': 'snow',
};

export function TestRoom() {
  const [biome, setBiome] = useState<GameScenario>('desert');
  const playerGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const next = BIOME_KEYS[e.key];
      if (next) setBiome(next);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ground/EnvironmentManager both read `scenario` from the store directly.
  useEffect(() => {
    useGameStore.setState({ scenario: biome, isSandstorm: false });
  }, [biome]);

  // Music follows the selected biome, same track-per-scenario used by the real runner.
  useEffect(() => {
    playBackgroundMusic(biome);
    return () => stopBackgroundMusic();
  }, [biome]);

  const Ground = SCENARIOS[biome].GroundComponent;

  return (
    <group>
      <Ground />
      <TestRoomObstacles biome={biome} />
      <TestRoomPlayer groupRef={playerGroupRef} />
      <TestRoomCamera targetRef={playerGroupRef} />
    </group>
  );
}
