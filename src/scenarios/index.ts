import { ScenarioConfig } from './types';
import { desertConfig } from './desert';
import { forestConfig } from './forest';
import { swampConfig } from './swamp';
import { snowConfig } from './snow';

export const SCENARIOS: Record<string, ScenarioConfig> = {
  desert: desertConfig,
  forest: forestConfig,
  swamp: swampConfig,
  snow: snowConfig,
};

export type ScenarioType = keyof typeof SCENARIOS;
