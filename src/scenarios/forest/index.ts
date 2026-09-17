import { ScenarioConfig } from '../types';
import { ForestGround } from './ForestGround';
import { ForestObstacles } from './ForestObstacles';

export const forestConfig: ScenarioConfig = {
  id: 'forest',
  name: 'Forest',
  bgColor: '#38bdf8',
  skyColorDay: '#38bdf8',
  skyColorNight: '#312e81',
  lightIntensityDay: 1.5,
  lightIntensityNight: 0.65,
  ambientIntensityDay: 0.4,
  ambientIntensityNight: 0.4,
  fogNear: 30,
  fogFar: 80,
  GroundComponent: ForestGround,
  ObstaclesComponent: ForestObstacles,
};
