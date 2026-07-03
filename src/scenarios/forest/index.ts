import { ScenarioConfig } from '../types';
import { ForestGround } from './ForestGround';
import { ForestObstacles } from './ForestObstacles';

export const forestConfig: ScenarioConfig = {
  id: 'forest',
  name: 'Forest',
  bgColor: '#38bdf8',
  skyColorDay: '#38bdf8',
  skyColorNight: '#1e1b4b',
  lightIntensityDay: 1.5,
  lightIntensityNight: 0.3,
  ambientIntensityDay: 0.4,
  ambientIntensityNight: 0.2,
  fogNear: 30,
  fogFar: 80,
  GroundComponent: ForestGround,
  ObstaclesComponent: ForestObstacles,
};
