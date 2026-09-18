import { ComponentType, Ref } from 'react';
import * as THREE from 'three';

export type ObstacleType = 'bird' | 'cactus-small' | 'cactus-large' | 'powerup' | 'stump-low' | 'stump-high' | 'snowman' | 'swamp-log' | 'swamp-fly' | 'croc' | 'tree-hole' | 'egg' | 'sand-worm' | 'mushroom' | 'leech' | 'ice-spike' | 'lava-pool' | 'lava-bug' | 'lava-rex';
export type PowerupType = 'wings' | 'super' | 'ghost' | 'jaw' | 'earth' | 'dragon' | 'life';

export const DINO_HITBOX_OFFSET = -0.15;

export const OBSTACLE_HITBOX_OFFSETS: Record<string, number> = {
  'cactus-small': -0.25,
  'cactus-large': -0.3,
  'bird': -0.15,
  'stump-low': -0.15,
  'stump-high': -0.2,
  'snowman': -0.2,
  'swamp-log': -0.2,
  'swamp-fly': -0.15,
  'croc': -0.2,
  'tree-hole': -0.2,
  'powerup': -0.1,
  'egg': -0.15,
  'sand-worm': -0.2,
  'mushroom': -0.2,
  'leech': -0.05,
  'ice-spike': -0.25,
  'lava-pool': -0.1,
  'lava-bug': -0.2,
  'lava-rex': -0.1
};

export interface ObstacleData {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  scale?: number;
  powerupType?: PowerupType;
  eggRarity?: 'common' | 'rare' | 'ultraRare';
  ref: React.RefObject<THREE.Group | null>;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  bgColor: string;
  skyColorDay: string;
  skyColorNight: string;
  lightIntensityDay: number;
  lightIntensityNight: number;
  ambientIntensityDay: number;
  ambientIntensityNight: number;
  rimLightIntensity?: number;
  fogNear: number;
  fogFar: number;
  GroundComponent: ComponentType;
  ObstaclesComponent: ComponentType<{ ref: Ref<ObstacleData[]> }>;
  EnvironmentComponent?: ComponentType;
}
