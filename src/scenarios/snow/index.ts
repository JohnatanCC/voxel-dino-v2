import { ScenarioConfig } from '../types';
import { SnowGround } from './SnowGround';
import { SnowObstacles } from './SnowObstacles';
import { SnowEnvironment } from './SnowEnvironment';

export const snowConfig: ScenarioConfig = {
  id: 'snow',
  name: 'Snow',
  bgColor: '#bae6fd',
  skyColorDay: '#bae6fd',
  skyColorNight: '#020617',
  lightIntensityDay: 1.5,
  lightIntensityNight: 0.3,
  ambientIntensityDay: 0.4,
  ambientIntensityNight: 0.2,
  fogNear: 20,
  fogFar: 80,
  GroundComponent: SnowGround,
  ObstaclesComponent: SnowObstacles,
  EnvironmentComponent: SnowEnvironment,
};
