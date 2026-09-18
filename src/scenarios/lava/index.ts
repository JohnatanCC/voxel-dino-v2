import { ScenarioConfig } from '../types';
import { LavaGround } from './LavaGround';
import { LavaObstacles } from './LavaObstacles';

export const lavaConfig: ScenarioConfig = {
  id: 'lava',
  name: 'Lava',
  bgColor: '#b8420f',
  skyColorDay: '#b8420f',
  skyColorNight: '#3b0d0d',
  lightIntensityDay: 1.2,
  lightIntensityNight: 0.7,
  ambientIntensityDay: 0.95,
  ambientIntensityNight: 0.6,
  fogNear: 40,
  fogFar: 110,
  GroundComponent: LavaGround,
  ObstaclesComponent: LavaObstacles,
};
