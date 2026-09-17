import { ScenarioConfig } from '../types';
import { SnowGround } from './SnowGround';
import { SnowObstacles } from './SnowObstacles';


export const snowConfig: ScenarioConfig = {
  id: 'snow',
  name: 'Snow',
  bgColor: '#bae6fd',
  skyColorDay: '#bae6fd',
  skyColorNight: '#0f172a',
  lightIntensityDay: 1.5,
  lightIntensityNight: 0.65,
  ambientIntensityDay: 0.4,
  ambientIntensityNight: 0.4,
  fogNear: 20,
  fogFar: 80,
  GroundComponent: SnowGround,
  ObstaclesComponent: SnowObstacles,

};
