import { ScenarioConfig } from '../types';
import { SwampGround } from './SwampGround';
import { SwampObstacles } from './SwampObstacles';
import { SwampEnvironment } from './SwampEnvironment';

export const swampConfig: ScenarioConfig = {
  id: 'swamp',
  name: 'Swamp',
  bgColor: '#64748b',
  skyColorDay: '#1e293b',
  skyColorNight: '#1e293b',
  lightIntensityDay: 0.5,
  lightIntensityNight: 0.45,
  ambientIntensityDay: 0.2,
  ambientIntensityNight: 0.25,
  rimLightIntensity: 2.5,
  fogNear: 15,
  fogFar: 55,
  GroundComponent: SwampGround,
  ObstaclesComponent: SwampObstacles,
  EnvironmentComponent: SwampEnvironment,
};
