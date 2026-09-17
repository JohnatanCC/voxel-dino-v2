import { ScenarioConfig } from '../types';
import { DesertGround } from './DesertGround';
import { DesertObstacles } from './DesertObstacles';

export const desertConfig: ScenarioConfig = {
  id: 'desert',
  name: 'Desert',
  bgColor: '#fde68a',
  skyColorDay: '#fde68a',
  skyColorNight: '#312e81',
  lightIntensityDay: 1.5,
  lightIntensityNight: 0.65,
  ambientIntensityDay: 0.4,
  ambientIntensityNight: 0.4,
  fogNear: 45,
  fogFar: 120,
  GroundComponent: DesertGround,
  ObstaclesComponent: DesertObstacles,
};
