import { create } from 'zustand';
import { ObstacleType } from '../scenarios/types';

export type FogDensity = 'off' | 'minimum' | 'low' | 'medium' | 'high';
export type GameStatus = 'menu' | 'playing' | 'gameover' | 'paused' | 'levelcleared';
export type CameraMode = '2D' | '2.5D';
export type GameScenario = 'desert' | 'forest' | 'swamp' | 'snow';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface LevelConfig {
  id: number;
  map: GameScenario;
  levelNumber: number;
  maxScore: number;
  allowedObstacles: ObstacleType[];
  eggsToCollect: number;
}

export const LEVELS: LevelConfig[] = [
  // Desert Levels (1-5)
  { id: 1, map: 'desert', levelNumber: 1, maxScore: 10000, allowedObstacles: ['cactus-small', 'cactus-large', 'skull'], eggsToCollect: 3 },
  { id: 2, map: 'desert', levelNumber: 2, maxScore: 15000, allowedObstacles: ['cactus-small', 'cactus-large', 'skull', 'mummy'], eggsToCollect: 3 },
  { id: 3, map: 'desert', levelNumber: 3, maxScore: 20000, allowedObstacles: ['cactus-small', 'cactus-large', 'skull', 'mummy', 'bird'], eggsToCollect: 3 },
  { id: 4, map: 'desert', levelNumber: 4, maxScore: 25000, allowedObstacles: ['cactus-small', 'cactus-large', 'skull', 'mummy', 'bird'], eggsToCollect: 3 },
  { id: 5, map: 'desert', levelNumber: 5, maxScore: 30000, allowedObstacles: ['cactus-small', 'cactus-large', 'skull', 'mummy', 'bird', 'stump-low', 'stump-high', 'swamp-log'], eggsToCollect: 3 },

  // Forest Levels (1-4)
  { id: 6, map: 'forest', levelNumber: 1, maxScore: 10000, allowedObstacles: ['stump-low', 'puddle'], eggsToCollect: 3 },
  { id: 7, map: 'forest', levelNumber: 2, maxScore: 15000, allowedObstacles: ['stump-low', 'puddle', 'stump-high'], eggsToCollect: 3 },
  { id: 8, map: 'forest', levelNumber: 3, maxScore: 20000, allowedObstacles: ['stump-low', 'puddle', 'stump-high', 'tree-hole'], eggsToCollect: 3 },
  { id: 9, map: 'forest', levelNumber: 4, maxScore: 25000, allowedObstacles: ['stump-low', 'puddle', 'stump-high', 'tree-hole', 'bird'], eggsToCollect: 3 },

  // Swamp Levels (1-2)
  { id: 10, map: 'swamp', levelNumber: 1, maxScore: 10000, allowedObstacles: ['swamp-log', 'puddle'], eggsToCollect: 3 },
  { id: 11, map: 'swamp', levelNumber: 2, maxScore: 15000, allowedObstacles: ['swamp-log', 'puddle', 'croc', 'swamp-fly', 'bird'], eggsToCollect: 3 },

  // Snow Levels (1-3)
  { id: 12, map: 'snow', levelNumber: 1, maxScore: 10000, allowedObstacles: ['rock-small', 'firebox'], eggsToCollect: 3 },
  { id: 13, map: 'snow', levelNumber: 2, maxScore: 15000, allowedObstacles: ['rock-small', 'firebox', 'rock-large', 'snowman'], eggsToCollect: 3 },
  { id: 14, map: 'snow', levelNumber: 3, maxScore: 20000, allowedObstacles: ['rock-small', 'firebox', 'rock-large', 'snowman'], eggsToCollect: 3 },
];

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  createdAt: number;
}

export interface SkinConfig {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'ultra-rare' | 'legendary' | 'exclusive';
  price: number;
  baseColor: string;
  spotsColor: string;
  spikesColor: string;
  collarColor: string;
  isRainbow?: boolean;
}

export type EggRarity = 'common' | 'rare' | 'ultraRare';

export const SKINS: SkinConfig[] = [
  { id: 'dino-classic', name: 'T-Rex Clássico', rarity: 'common', price: 0, baseColor: '#535353', spotsColor: '#3f3f46', spikesColor: '#333333', collarColor: '#0ea5e9' },
  { id: 'dino-brown', name: 'T-Rex de Bronze', rarity: 'common', price: 2500, baseColor: '#8B5A2B', spotsColor: '#5C3815', spikesColor: '#D2B48C', collarColor: '#ef4444' },
  { id: 'dino-blue', name: 'T-Rex Aquático', rarity: 'rare', price: 5000, baseColor: '#1E3A8A', spotsColor: '#3B82F6', spikesColor: '#60A5FA', collarColor: '#eab308' },
  { id: 'dino-purple', name: 'T-Rex do Vazio', rarity: 'ultra-rare', price: 7500, baseColor: '#6D28D9', spotsColor: '#A78BFA', spikesColor: '#EC4899', collarColor: '#10b981' },
  { id: 'dino-gold', name: 'T-Rex Dourado', rarity: 'legendary', price: 150000, baseColor: '#F59E0B', spotsColor: '#D97706', spikesColor: '#FEF08A', collarColor: '#ffffff' },
  { id: 'dino-green-free', name: 'T-Rex Esmeralda', rarity: 'common', price: 0, baseColor: '#22c55e', spotsColor: '#15803d', spikesColor: '#16a34a', collarColor: '#fbbf24' },
  { id: 'dino-red-free', name: 'T-Rex Rubi', rarity: 'common', price: 0, baseColor: '#ef4444', spotsColor: '#b91c1c', spikesColor: '#dc2626', collarColor: '#ffffff' },
  { id: 'dino-pink-free', name: 'T-Rex Quartz', rarity: 'common', price: 0, baseColor: '#ec4899', spotsColor: '#be185d', spikesColor: '#db2777', collarColor: '#5b21b6' },
  { id: 'dino-yellow-free', name: 'T-Rex Topázio', rarity: 'common', price: 0, baseColor: '#eab308', spotsColor: '#ca8a04', spikesColor: '#ca8a04', collarColor: '#ef4444' },
  { id: 'dino-kitsune', name: 'T-Rex Divino (Kitsune)', rarity: 'exclusive', price: 0, baseColor: '#ffffff', spotsColor: '#00a2ff', spikesColor: '#00a2ff', collarColor: '#0055ff' },
  { id: 'dino-rainbow', name: 'T-Rex Cibernético', rarity: 'exclusive', price: 0, baseColor: '#ffffff', spotsColor: '#ffffff', spikesColor: '#000000', collarColor: '#a855f7', isRainbow: true },
  { id: 'dino-duck', name: 'Pato Divino (DuckDino)', rarity: 'exclusive', price: 0, baseColor: '#fde047', spotsColor: '#fb923c', spikesColor: '#78350f', collarColor: '#ef4444' },
  { id: 'dino-shark', name: 'SharkDino (Jeff)', rarity: 'exclusive', price: 0, baseColor: '#3182ce', spotsColor: '#f7fafc', spikesColor: '#2b6cb0', collarColor: '#ec4899' }
];

interface GameState {
  status: GameStatus;
  gameId: number;
  score: number;
  highScore: number;
  speed: number;
  cameraMode: CameraMode;
  scenario: GameScenario;
  isMixedMode: boolean;
  difficulty: GameDifficulty;
  graphicsQuality: GraphicsQuality;
  lives: number;
  dinoColor: string;
  devMode: boolean;
  gameTime: number;
  activePowerup: 'none' | 'wings' | 'super' | 'ghost' | 'jaw' | 'earth';
  powerupEndTime: number;
  cinematicPowerup: { name: string; desc: string; type: string } | null;
  isSandstorm: boolean;
  cameraShake: number;
  floatingTexts: FloatingText[];
  isTransitioning: boolean;
  transitionStartTime: number;
  pendingScenario: GameScenario | null;
  coldTimer: number; // For snow scenario
  weakJumpUntil: number;
  slowUntil: number;
  slowmoUntil: number;
  setSlowUntil: (time: number) => void; // For snow scenario snowman obstacle
  mummySlowUntil: number;
  originalFogDensity: FogDensity | null;
  setMummySlowUntil: (time: number) => void;
  setOriginalFogDensity: (density: FogDensity | null) => void;
  eatingUntil: number;
  setEatingUntil: (time: number) => void;
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  togglePause: () => void;
  incrementScore: (points: number) => void;
  increaseSpeed: (amount: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  setScenario: (scenario: GameScenario) => void;
  setMixedMode: (isMixed: boolean) => void;
  setDifficulty: (diff: GameDifficulty) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  loseLife: () => void;
  gainLife: () => void;
  invincibleUntil: number;
  setInvincibleUntil: (time: number) => void;
  heavyJumpUntil: number;
  setHeavyJumpUntil: (time: number) => void;
  setWeakJumpUntil: (time: number) => void;
  resetColdTimer: () => void;
  setDinoColor: (color: string) => void;
  setDevMode: (active: boolean) => void;
  addGameTime: (delta: number) => void;
  getCurrentSpeed: () => number;
  activatePowerup: (powerup: 'wings' | 'super' | 'ghost' | 'jaw' | 'earth', duration: number) => void;
  deactivatePowerup: () => void;
  triggerCameraShake: (intensity: number) => void;
  updateCameraShake: () => void;
  addFloatingText: (text: string, x: number, y: number, z: number, color?: string) => void;
  removeFloatingText: (id: string) => void;
  fogSettings: Record<GameScenario, FogDensity>;
  setFogDensity: (scenario: GameScenario, density: FogDensity) => void;

  // Economy & Skins additions
  coins: number;
  ownedSkins: string[];
  equippedSkin: string;
  currentRunEggs: Record<EggRarity, number>;
  eggsInTail: { id: string; rarity: EggRarity }[];
  eggSpawnScores: number[];
  shouldSpawnEgg: boolean;
  pendingEggRarity: EggRarity | null;
  collectEgg: (rarity: EggRarity) => void;
  loseEgg: () => void;
  buySkin: (skinId: string) => boolean;
  equipSkin: (skinId: string) => void;
  redeemCode: (code: string) => boolean;
  generateEggSpawnPattern: () => void;

  // Levels additions
  currentLevelId: number;
  highestUnlockedLevelId: number;
  levelStars: Record<number, number>;
  levelHighScores: Record<number, number>;
  selectLevel: (levelId: number) => void;
  clearLevel: () => void;
  getCurrentLevel: () => LevelConfig;
}

const INITIAL_SPEED = 9; // 15 * 0.6 (easy default)

export const useGameStore = create<GameState>((set, get) => ({
  status: 'menu',
  gameId: 0,
  score: 0,
  highScore: parseInt(localStorage.getItem('trex-highscore') || '0'),
  speed: INITIAL_SPEED,
  cameraMode: '2D',
  scenario: 'desert',
  isMixedMode: true,
  difficulty: 'medium',
  graphicsQuality: typeof window !== 'undefined' ? (localStorage.getItem('trex-graphics-quality') || 'medium') as GraphicsQuality : 'medium',
  lives: 3,
  dinoColor: (() => {
    const eq = typeof window !== 'undefined' ? (localStorage.getItem('trex-equipped-skin') || 'dino-classic') : 'dino-classic';
    const skin = SKINS.find(s => s.id === eq) || SKINS[0];
    return skin.baseColor;
  })(),
  devMode: false,
  gameTime: 0,
  activePowerup: 'none',
  powerupEndTime: 0,
  cinematicPowerup: null,
  invincibleUntil: 0,
  heavyJumpUntil: 0,
  weakJumpUntil: 0,
  slowUntil: 0,
  slowmoUntil: 0,
  mummySlowUntil: 0,
  originalFogDensity: null,
  setMummySlowUntil: (time) => set({ mummySlowUntil: time }),
  setOriginalFogDensity: (density) => set({ originalFogDensity: density }),
  eatingUntil: 0,
  setEatingUntil: (time) => set({ eatingUntil: time }),
  coldTimer: 30,
  isSandstorm: true,
  cameraShake: 0,
  floatingTexts: [],
  isTransitioning: false,
  transitionStartTime: 0,
  pendingScenario: null,
  fogSettings: { desert: 'minimum', forest: 'minimum', swamp: 'low', snow: 'minimum' },

  // Economy and Skins initial state
  coins: parseInt(localStorage.getItem('trex-coins') || '0'),
  ownedSkins: (() => {
    try {
      return JSON.parse(localStorage.getItem('trex-owned-skins') || '["dino-classic"]');
    } catch {
      return ["dino-classic"];
    }
  })(),
  equippedSkin: localStorage.getItem('trex-equipped-skin') || 'dino-classic',
  currentRunEggs: { common: 0, rare: 0, ultraRare: 0 },
  eggsInTail: [],
  eggSpawnScores: [],
  shouldSpawnEgg: false,
  pendingEggRarity: null,

  // Levels initial state
  currentLevelId: parseInt(localStorage.getItem('trex-current-level') || '1'),
  highestUnlockedLevelId: parseInt(localStorage.getItem('trex-unlocked-level') || '1'),
  levelStars: (() => {
    try {
      return JSON.parse(localStorage.getItem('trex-level-stars') || '{}');
    } catch {
      return {};
    }
  })(),
  levelHighScores: (() => {
    try {
      return JSON.parse(localStorage.getItem('trex-level-highscores') || '{}');
    } catch {
      return {};
    }
  })(),

  startGame: () => set((state) => {
    // Retrieve selected level
    const currentLevel = LEVELS.find(l => l.id === state.currentLevelId) || LEVELS[0];

    // Auto-set difficulty based on level number
    let levelDifficulty: GameDifficulty = 'medium';
    if (currentLevel.levelNumber === 1 || currentLevel.levelNumber === 2) {
      levelDifficulty = 'easy';
    } else if (currentLevel.levelNumber === 3 || currentLevel.levelNumber === 4) {
      levelDifficulty = 'medium';
    } else if (currentLevel.levelNumber >= 5) {
      levelDifficulty = 'hard';
    }

    let startingLives = 1;
    if (levelDifficulty === 'easy') startingLives = 5;
    if (levelDifficulty === 'medium') startingLives = 3;
    
    let initialSpeed = 9;
    if (levelDifficulty === 'easy') initialSpeed = 7.5;
    if (levelDifficulty === 'hard') initialSpeed = 12;

    // Reset current run eggs and tail
    const currentRunEggs = { common: 0, rare: 0, ultraRare: 0 };
    const eggsInTail: { id: string; rarity: EggRarity }[] = [];

    // Pre-determine egg milestones at 25%, 50%, and 75% of the maxScore
    const scores = [
      Math.round(currentLevel.maxScore * 0.25),
      Math.round(currentLevel.maxScore * 0.50),
      Math.round(currentLevel.maxScore * 0.75)
    ];
    
    const updates: Partial<GameState> = { 
      status: 'playing', 
      score: 0, 
      speed: initialSpeed, 
      gameId: state.gameId + 1, 
      gameTime: 0, 
      activePowerup: 'none',
      powerupEndTime: 0,
      cinematicPowerup: null,
      scenario: currentLevel.map,
      isSandstorm: currentLevel.map === 'desert', 
      lives: startingLives, 
      difficulty: levelDifficulty,
      invincibleUntil: 0, 
      heavyJumpUntil: 0, 
      weakJumpUntil: 0,
      slowUntil: 0, 
      slowmoUntil: 0,
      coldTimer: 30, 
      floatingTexts: [], 
      mummySlowUntil: 0, 
      originalFogDensity: null, 
      eatingUntil: 0,
      isTransitioning: false,
      transitionStartTime: 0,
      pendingScenario: null,
      currentRunEggs,
      eggsInTail,
      eggSpawnScores: scores,
      shouldSpawnEgg: false,
      pendingEggRarity: null
    };

    if (state.mummySlowUntil > 0 && state.originalFogDensity) {
      updates.fogSettings = { ...state.fogSettings, [state.scenario]: state.originalFogDensity };
    }

    return updates;
  }),
  endGame: () => set((state) => {
    const newHighScore = Math.max(Math.floor(state.score), state.highScore);
    localStorage.setItem('trex-highscore', newHighScore.toString());

    // Convert eggs to coins
    const commonVal = state.currentRunEggs.common * 50;
    const rareVal = state.currentRunEggs.rare * 150;
    const ultraRareVal = state.currentRunEggs.ultraRare * 250;
    const totalCoinsGained = commonVal + rareVal + ultraRareVal;
    const newCoins = state.coins + totalCoinsGained;
    localStorage.setItem('trex-coins', newCoins.toString());

    return { 
      status: 'gameover', 
      highScore: newHighScore, 
      score: Math.floor(state.score), 
      activePowerup: 'none', 
      floatingTexts: [],
      coins: newCoins
    };
  }),
  getCurrentSpeed: () => {
    const state = get();
    if (state.status === 'gameover') return 0;
    let s = state.speed;
    if (performance.now() < state.slowmoUntil) s *= 0.3;
    else if (performance.now() < state.mummySlowUntil) s /= 1.5;
    else if (performance.now() < state.slowUntil) s *= 0.5;
    
    if (state.scenario === 'snow' && state.coldTimer <= 0) {
      s *= 0.8;
    }
    return s;
  },
  resetGame: () => set((state) => {
    let initialSpeed = 9;
    if (state.difficulty === 'easy') initialSpeed = 7.5;
    if (state.difficulty === 'hard') initialSpeed = 12;
    return { 
      status: 'menu', 
      score: 0, 
      speed: initialSpeed, 
      gameTime: 0, 
      activePowerup: state.activePowerup, 
      isSandstorm: true, 
      floatingTexts: [], 
      isTransitioning: false, 
      transitionStartTime: 0, 
      pendingScenario: null,
      fogSettings: { desert: 'minimum', forest: 'minimum', swamp: 'low', snow: 'minimum' }, 
      coldTimer: 30, 
      mummySlowUntil: 0, 
      originalFogDensity: null, 
      eatingUntil: 0,
      currentRunEggs: { common: 0, rare: 0, ultraRare: 0 },
      eggsInTail: [],
      eggSpawnScores: [],
      shouldSpawnEgg: false,
      pendingEggRarity: null
    };
  }),
  togglePause: () => set((state) => {
    if (state.status === 'playing') return { status: 'paused' };
    if (state.status === 'paused') return { status: 'playing' };
    return {};
  }),
  incrementScore: (points) => set((state) => {
    let multiplier = 1;
    if (state.difficulty === 'hard') multiplier = 1.2;
    if (state.difficulty === 'easy') multiplier = 0.6;
    const newScore = state.score + (points * multiplier);
    
    // Retrieve current level config
    const currentLevel = LEVELS.find(l => l.id === state.currentLevelId) || LEVELS[0];

    // Check if target score is reached
    if (newScore >= currentLevel.maxScore) {
      // Level completed! Calculate stars based on collected eggs in tail (max 3)
      const stars = Math.min(3, state.eggsInTail.length);
      
      // Update level completion records
      const levelStars = { ...state.levelStars, [state.currentLevelId]: Math.max(state.levelStars[state.currentLevelId] || 0, stars) };
      const levelHighScores = { ...state.levelHighScores, [state.currentLevelId]: Math.max(state.levelHighScores[state.currentLevelId] || 0, Math.floor(newScore)) };
      
      localStorage.setItem('trex-level-stars', JSON.stringify(levelStars));
      localStorage.setItem('trex-level-highscores', JSON.stringify(levelHighScores));

      // Unlock next level if this was the highest unlocked
      let highestUnlockedLevelId = state.highestUnlockedLevelId;
      if (state.currentLevelId === state.highestUnlockedLevelId && state.currentLevelId < LEVELS.length) {
        highestUnlockedLevelId = state.currentLevelId + 1;
        localStorage.setItem('trex-unlocked-level', highestUnlockedLevelId.toString());
      }

      // Convert eggs in tail to coins (50 for common, 150 for rare, 250 for ultra-rare)
      const commonVal = state.currentRunEggs.common * 50;
      const rareVal = state.currentRunEggs.rare * 150;
      const ultraRareVal = state.currentRunEggs.ultraRare * 250;
      const totalCoinsGained = commonVal + rareVal + ultraRareVal;
      const newCoins = state.coins + totalCoinsGained;
      localStorage.setItem('trex-coins', newCoins.toString());

      return {
        status: 'levelcleared',
        score: Math.floor(newScore),
        levelStars,
        levelHighScores,
        highestUnlockedLevelId,
        coins: newCoins,
        activePowerup: 'none',
        floatingTexts: []
      };
    }
    
    let initialSpeed = 9;
    if (state.difficulty === 'easy') initialSpeed = 7.5;
    if (state.difficulty === 'hard') initialSpeed = 12;
    
    const acceleration = 0.001; // Constant acceleration as requested
    
    // gameTime is in seconds. Assuming 60 frames per second.
    const framesElapsed = state.gameTime * 60;
    
    let newSpeed = initialSpeed + (acceleration * framesElapsed);
    if (newSpeed > 37.5) newSpeed = 37.5; // Max speed cap of 37.5 (2.5x of 15)

    // Egg spawning checks (milestones already set in startGame)
    let eggSpawnScores = [...state.eggSpawnScores];
    let shouldSpawnEgg = state.shouldSpawnEgg;
    let pendingEggRarity = state.pendingEggRarity;

    if (eggSpawnScores.length > 0 && newScore >= eggSpawnScores[0] && !shouldSpawnEgg) {
       eggSpawnScores.shift();
       shouldSpawnEgg = true;
       
       const rand = Math.random();
       if (rand < 0.6) {
          pendingEggRarity = 'common';
       } else if (rand < 0.9) {
          pendingEggRarity = 'rare';
       } else {
          pendingEggRarity = 'ultraRare';
       }
    }
    
    return { 
      score: newScore, 
      speed: newSpeed,
      eggSpawnScores,
      shouldSpawnEgg,
      pendingEggRarity
    };
  }),
  increaseSpeed: (amount) => set((state) => ({ speed: state.speed + amount })),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setScenario: (scenario) => set({ scenario, isSandstorm: scenario === 'desert' }),
  setMixedMode: (isMixed) => set({ isMixedMode: isMixed }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setGraphicsQuality: (quality) => {
    localStorage.setItem('trex-graphics-quality', quality);
    set({ graphicsQuality: quality });
  },
  loseLife: () => set((state) => {
    const newLives = state.lives - 1;
    if (newLives <= 0) {
      const newHighScore = Math.max(Math.floor(state.score), state.highScore);
      localStorage.setItem('trex-highscore', newHighScore.toString());
      
      const updates: Partial<GameState> = { 
        status: 'gameover', 
        highScore: newHighScore, 
        score: Math.floor(state.score), 
        activePowerup: 'none', 
        lives: 0,
        mummySlowUntil: 0,
        originalFogDensity: null,
        eatingUntil: 0
      };

      if (state.mummySlowUntil > 0 && state.originalFogDensity) {
        updates.fogSettings = { ...state.fogSettings, [state.scenario]: state.originalFogDensity };
      }

      // Convert eggs on death
      const commonVal = state.currentRunEggs.common * 50;
      const rareVal = state.currentRunEggs.rare * 150;
      const ultraRareVal = state.currentRunEggs.ultraRare * 250;
      const totalCoinsGained = commonVal + rareVal + ultraRareVal;
      const newCoins = state.coins + totalCoinsGained;
      localStorage.setItem('trex-coins', newCoins.toString());
      updates.coins = newCoins;

      return updates;
    }
    return { lives: newLives };
  }),
  gainLife: () => set((state) => {
    let maxLives = 1;
    if (state.difficulty === 'easy') maxLives = 5;
    if (state.difficulty === 'medium') maxLives = 3;
    return { lives: Math.min(state.lives + 1, maxLives) };
  }),
  setInvincibleUntil: (time) => set({ invincibleUntil: time }),
  setHeavyJumpUntil: (time) => set({ heavyJumpUntil: time }),
  setWeakJumpUntil: (time) => set({ weakJumpUntil: time }),
  setSlowUntil: (time) => set({ slowUntil: time }),
  resetColdTimer: () => set((state) => {
    const updates: Partial<GameState> = { coldTimer: 30 };
    if (state.scenario === 'snow' && state.coldTimer <= 0 && state.originalFogDensity) {
      updates.fogSettings = { ...state.fogSettings, snow: state.originalFogDensity };
      updates.originalFogDensity = null;
    }
    return updates;
  }),
  setDinoColor: (color) => set({ dinoColor: color }),
  setDevMode: (active) => set({ devMode: active }),
  addGameTime: (delta) => set((state) => {
    const newTime = state.gameTime + delta;
    const updates: Partial<GameState> = { gameTime: newTime };
    
    if (state.mummySlowUntil > 0 && performance.now() >= state.mummySlowUntil) {
      if (state.originalFogDensity) {
        updates.fogSettings = { ...state.fogSettings, [state.scenario]: state.originalFogDensity };
      }
      updates.mummySlowUntil = 0;
      updates.originalFogDensity = null;
    }
    
    if (state.activePowerup !== 'none' && newTime > state.powerupEndTime) {
      updates.activePowerup = 'none';
    }
    
    if (state.scenario === 'snow' && state.status === 'playing') {
      const newColdTimer = Math.max(0, state.coldTimer - delta);
      updates.coldTimer = newColdTimer;
      if (newColdTimer <= 0 && state.coldTimer > 0) {
        if (!state.originalFogDensity) {
          updates.originalFogDensity = state.fogSettings.snow;
        }
        updates.fogSettings = { ...state.fogSettings, snow: 'high' };
        
        // Add floating text
        const newText: FloatingText = { id: Math.random().toString(36).substr(2, 9), text: 'FROZEN!', x: 0, y: 5, z: 0, color: '#3b82f6', createdAt: performance.now() };
        updates.floatingTexts = [...state.floatingTexts, newText];
      }
    }
    
    if (state.isTransitioning && state.pendingScenario) {
      const elapsed = newTime - state.transitionStartTime;
      if (elapsed >= 2.0 && state.scenario !== state.pendingScenario) {
        updates.scenario = state.pendingScenario;
        updates.isSandstorm = state.pendingScenario === 'desert';
        updates.invincibleUntil = performance.now() + 2000; // 2 seconds of invincibility after transition
      }
      if (elapsed >= 3.0) {
        updates.isTransitioning = false;
        updates.pendingScenario = null;
      }
    }
    
    return updates;
  }),
  activatePowerup: (powerup, duration) => set((state) => {
    const info: Record<string, { name: string; desc: string }> = {
      jaw: { name: 'Feroz', desc: 'Coma pássaros à vontade' },
      ghost: { name: 'Fantasma', desc: 'Voe e atravesse' },
      wings: { name: 'Anjo', desc: 'Bata sua asa uma vez' },
      earth: { name: 'Escavador', desc: 'Entre no chão por um tempo' },
      super: { name: 'SUPERDINO', desc: 'DESTRUA TUDO!!!' },
    };
    const pInfo = info[powerup] || { name: powerup.toUpperCase(), desc: '' };
    return { 
      activePowerup: powerup, 
      powerupEndTime: state.gameTime + duration,
      cinematicPowerup: { ...pInfo, type: powerup },
      slowmoUntil: performance.now() + 1500
    };
  }),
  deactivatePowerup: () => set({ activePowerup: 'none' }),
  triggerCameraShake: (intensity: number) => set({ cameraShake: intensity }),
  updateCameraShake: () => set((state) => ({ cameraShake: Math.max(0, state.cameraShake - 0.05) })),
  addFloatingText: (text, x, y, z, color = '#ffffff') => set((state) => {
    const newText: FloatingText = { id: Math.random().toString(36).substr(2, 9), text, x, y, z, color, createdAt: performance.now() };
    return { floatingTexts: [...state.floatingTexts, newText] };
  }),
  removeFloatingText: (id) => set((state) => ({ floatingTexts: state.floatingTexts.filter(t => t.id !== id) })),
  setFogDensity: (scenario, density) => set((state) => ({ fogSettings: { ...state.fogSettings, [scenario]: density } })),

  // Economy & Skins Action Implementations
  collectEgg: (rarity) => set((state) => {
    const newEggs = { ...state.currentRunEggs, [rarity]: state.currentRunEggs[rarity] + 1 };
    const newEgg = { id: Math.random().toString(36).substr(2, 9), rarity };
    return {
      currentRunEggs: newEggs,
      eggsInTail: [...state.eggsInTail, newEgg]
    };
  }),
  loseEgg: () => set((state) => {
    if (state.eggsInTail.length === 0) return {};
    const newTail = [...state.eggsInTail];
    const lostEgg = newTail.pop()!;
    const newEggs = { ...state.currentRunEggs, [lostEgg.rarity]: Math.max(0, state.currentRunEggs[lostEgg.rarity] - 1) };
    return {
      eggsInTail: newTail,
      currentRunEggs: newEggs
    };
  }),
  buySkin: (skinId) => {
    const state = get();
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return false;
    if (state.ownedSkins.includes(skinId)) return false;
    if (state.coins < skin.price) return false;

    const newCoins = state.coins - skin.price;
    const newOwned = [...state.ownedSkins, skinId];

    localStorage.setItem('trex-coins', newCoins.toString());
    localStorage.setItem('trex-owned-skins', JSON.stringify(newOwned));

    set({
      coins: newCoins,
      ownedSkins: newOwned
    });
    return true;
  },
  equipSkin: (skinId) => {
    const state = get();
    if (!state.ownedSkins.includes(skinId)) return;

    localStorage.setItem('trex-equipped-skin', skinId);
    set({ equippedSkin: skinId });
  },
  redeemCode: (code) => {
    const trimmed = code.trim();
    if (trimmed === 'Exclusivepride#0507D' || trimmed.toUpperCase() === 'EXCLUSIVEPRIDE#0507D') {
      const state = get();
      if (state.ownedSkins.includes('dino-kitsune')) return true;
      const newOwned = [...state.ownedSkins, 'dino-kitsune'];
      localStorage.setItem('trex-owned-skins', JSON.stringify(newOwned));
      set({ ownedSkins: newOwned });
      return true;
    }
    const cleanCode = trimmed.toUpperCase();
    if (cleanCode === 'VOXELTREX' || cleanCode === 'GEMINI') {
      const state = get();
      if (state.ownedSkins.includes('dino-rainbow')) return true; // Already owned
      const newOwned = [...state.ownedSkins, 'dino-rainbow'];
      localStorage.setItem('trex-owned-skins', JSON.stringify(newOwned));
      set({ ownedSkins: newOwned });
      return true;
    }
    if (cleanCode === 'PATO' || cleanCode === 'QUACK' || cleanCode === 'DUCKDINO') {
      const state = get();
      if (state.ownedSkins.includes('dino-duck')) return true; // Already owned
      const newOwned = [...state.ownedSkins, 'dino-duck'];
      localStorage.setItem('trex-owned-skins', JSON.stringify(newOwned));
      set({ ownedSkins: newOwned });
      return true;
    }
    if (cleanCode === 'JEFF' || cleanCode === 'SHARK' || cleanCode === 'SHARKDINO') {
      const state = get();
      if (state.ownedSkins.includes('dino-shark')) return true; // Already owned
      const newOwned = [...state.ownedSkins, 'dino-shark'];
      localStorage.setItem('trex-owned-skins', JSON.stringify(newOwned));
      set({ ownedSkins: newOwned });
      return true;
    }
    return false;
  },
  generateEggSpawnPattern: () => {
    const state = get();
    const curr10k = Math.floor(state.score / 10000);
    const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 eggs
    const base = curr10k * 10000;
    const scores = [];
    for (let i = 0; i < count; i++) {
       const scoreOffset = 500 + Math.random() * 9000;
       scores.push(Math.round(base + scoreOffset));
    }
    scores.sort((a, b) => a - b);
    set({ eggSpawnScores: scores, shouldSpawnEgg: false, pendingEggRarity: null });
  },
  selectLevel: (levelId) => {
    const level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
    localStorage.setItem('trex-current-level', levelId.toString());
    set({
      currentLevelId: levelId,
      scenario: level.map,
      isSandstorm: level.map === 'desert'
    });
  },
  clearLevel: () => set((state) => {
    return {};
  }),
  getCurrentLevel: () => {
    const state = get();
    return LEVELS.find(l => l.id === state.currentLevelId) || LEVELS[0];
  }
}));
