import { ComponentType, Ref } from 'react';
import * as THREE from 'three';

export type ObstacleType = 'bird' | 'cactus-small' | 'cactus-large' | 'powerup' | 'stump-low' | 'stump-high' | 'puddle' | 'rock-large' | 'snowman' | 'rock-small' | 'firebox' | 'swamp-log' | 'swamp-fly' | 'skull' | 'croc' | 'tree-hole';
export type PowerupType = 'wings' | 'super' | 'ghost' | 'jaw' | 'earth' | 'life';

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
