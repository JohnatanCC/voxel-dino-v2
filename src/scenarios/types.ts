import { ComponentType, Ref } from 'react';
import * as THREE from 'three';

export type ObstacleType = 'bird' | 'cactus-small' | 'cactus-large' | 'powerup' | 'stump-low' | 'stump-high' | 'puddle' | 'rock-large' | 'snowman' | 'rock-small' | 'firebox' | 'swamp-log' | 'swamp-fly' | 'skull' | 'croc' | 'tree-hole' | 'mummy';
export type PowerupType = 'wings' | 'super' | 'ghost' | 'jaw' | 'earth' | 'life';

export const DINO_HITBOX_OFFSET = -0.15;

export const OBSTACLE_HITBOX_OFFSETS: Record<string, number> = {
  'cactus-small': -0.25,
  'cactus-large': -0.3,
  'bird': -0.15,
  'stump-low': -0.15,
  'stump-high': -0.2,
  'puddle': -0.05,
  'rock-large': -0.2,
  'rock-small': -0.15,
  'snowman': -0.2,
  'firebox': -0.1,
  'swamp-log': -0.2,
  'swamp-fly': -0.15,
  'skull': -0.15,
  'croc': -0.2,
  'tree-hole': -0.2,
  'powerup': -0.1,
  'mummy': -0.15
};

export interface ObstacleData {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  powerupType?: PowerupType;
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
