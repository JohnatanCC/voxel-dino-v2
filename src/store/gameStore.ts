import { create } from 'zustand';
import { ObstacleType } from '../scenarios/types';
import {
  INITIAL_SPEED,
  MAX_SPEED,
  ACCELERATION_PER_FRAME,
  INITIAL_LIVES,
  MAX_LIVES,
  BIOME_ORDER,
  BIOME_CYCLE_SCORE,
  BIOME_TRANSITION_SWAP_TIME,
  BIOME_TRANSITION_END_TIME,
  BIOME_TRANSITION_INVINCIBILITY_MS,
  EGG_COIN_VALUES,
  rollEggRarity,
} from '../config/balance';

export type FogDensity = 'off' | 'minimum' | 'low' | 'medium' | 'high';
export type GameStatus = 'menu' | 'playing' | 'gameover' | 'paused';
export type CameraMode = '2D' | '2.5D';
export type GameScenario = 'desert' | 'forest' | 'swamp' | 'snow';
export type GraphicsQuality = 'low' | 'medium' | 'high';

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
  { id: 'dino-brown', name: 'T-Rex de Bronze', rarity: 'common', price: 1000, baseColor: '#8B5A2B', spotsColor: '#5C3815', spikesColor: '#D2B48C', collarColor: '#ef4444' },
  { id: 'dino-blue', name: 'T-Rex Aquático', rarity: 'rare', price: 1000, baseColor: '#1E3A8A', spotsColor: '#3B82F6', spikesColor: '#60A5FA', collarColor: '#eab308' },
  { id: 'dino-purple', name: 'T-Rex do Vazio', rarity: 'ultra-rare', price: 1000, baseColor: '#6D28D9', spotsColor: '#A78BFA', spikesColor: '#EC4899', collarColor: '#10b981' },
  { id: 'dino-gold', name: 'T-Rex Dourado', rarity: 'legendary', price: 1000, baseColor: '#F59E0B', spotsColor: '#D97706', spikesColor: '#FEF08A', collarColor: '#ffffff' },
  { id: 'dino-green-free', name: 'T-Rex Esmeralda', rarity: 'common', price: 0, baseColor: '#22c55e', spotsColor: '#15803d', spikesColor: '#16a34a', collarColor: '#fbbf24' },
  { id: 'dino-red-free', name: 'T-Rex Rubi', rarity: 'common', price: 0, baseColor: '#ef4444', spotsColor: '#b91c1c', spikesColor: '#dc2626', collarColor: '#ffffff' },
  { id: 'dino-pink-free', name: 'T-Rex Quartz', rarity: 'common', price: 0, baseColor: '#ec4899', spotsColor: '#be185d', spikesColor: '#db2777', collarColor: '#5b21b6' },
  { id: 'dino-yellow-free', name: 'T-Rex Topázio', rarity: 'common', price: 0, baseColor: '#eab308', spotsColor: '#ca8a04', spikesColor: '#ca8a04', collarColor: '#ef4444' },
  { id: 'dino-rainbow', name: 'T-Rex Cibernético', rarity: 'legendary', price: 10000, baseColor: '#1e293b', spotsColor: '#22d3ee', spikesColor: '#0f172a', collarColor: '#a855f7', isRainbow: true },
  { id: 'dino-kitsune', name: 'T-Rex Kitsune', rarity: 'exclusive', price: 0, baseColor: '#ffffff', spotsColor: '#00a2ff', spikesColor: '#00a2ff', collarColor: '#0055ff' },
  { id: 'dino-duck', name: 'Pato Dino', rarity: 'exclusive', price: 0, baseColor: '#fde047', spotsColor: '#fb923c', spikesColor: '#78350f', collarColor: '#ef4444' },
  { id: 'dino-shark', name: 'Tubarão Dino', rarity: 'exclusive', price: 0, baseColor: '#3182ce', spotsColor: '#f7fafc', spikesColor: '#2b6cb0', collarColor: '#ec4899' },
  { id: 'dino-gospel', name: 'Gospel Dino', rarity: 'ultra-rare', price: 1000, baseColor: '#fefce8', spotsColor: '#fbbf24', spikesColor: '#f59e0b', collarColor: '#fde68a' },
  { id: 'dino-rabbit', name: 'Coelho Dino ', rarity: 'exclusive', price: 0, baseColor: '#3b82f6', spotsColor: '#ffffff', spikesColor: '#1d4ed8', collarColor: '#f472b6' }
];

interface GameState {
  status: GameStatus;
  gameId: number;
  score: number;
  highScore: number;
  speed: number;
  cameraMode: CameraMode;
  scenario: GameScenario;
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
}

const INITIAL_FOG_SETTINGS: Record<GameScenario, FogDensity> = { desert: 'minimum', forest: 'minimum', swamp: 'low', snow: 'minimum' };

function eggsToCoins(currentRunEggs: Record<EggRarity, number>): number {
  return currentRunEggs.common * EGG_COIN_VALUES.common
    + currentRunEggs.rare * EGG_COIN_VALUES.rare
    + currentRunEggs.ultraRare * EGG_COIN_VALUES.ultraRare;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'menu',
  gameId: 0,
  score: 0,
  highScore: parseInt(localStorage.getItem('trex-highscore') || '0'),
  speed: INITIAL_SPEED,
  cameraMode: '2D',
  scenario: 'desert',
  graphicsQuality: typeof window !== 'undefined' ? (localStorage.getItem('trex-graphics-quality') || 'medium') as GraphicsQuality : 'medium',
  lives: INITIAL_LIVES,
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
  fogSettings: INITIAL_FOG_SETTINGS,

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

  startGame: () => {
    set((state) => {
      const updates: Partial<GameState> = {
        status: 'playing',
        score: 0,
        speed: INITIAL_SPEED,
        gameId: state.gameId + 1,
        gameTime: 0,
        activePowerup: 'none',
        powerupEndTime: 0,
        cinematicPowerup: null,
        scenario: 'desert',
        isSandstorm: true,
        lives: INITIAL_LIVES,
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
        currentRunEggs: { common: 0, rare: 0, ultraRare: 0 },
        eggsInTail: [],
        eggSpawnScores: [],
        shouldSpawnEgg: false,
        pendingEggRarity: null
      };

      if (state.mummySlowUntil > 0 && state.originalFogDensity) {
        updates.fogSettings = { ...state.fogSettings, [state.scenario]: state.originalFogDensity };
      }

      return updates;
    });

    // Seed the first batch of egg spawn milestones for this run.
    get().generateEggSpawnPattern();
  },
  endGame: () => set((state) => {
    const newHighScore = Math.max(Math.floor(state.score), state.highScore);
    localStorage.setItem('trex-highscore', newHighScore.toString());

    const newCoins = state.coins + eggsToCoins(state.currentRunEggs);
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
  resetGame: () => set((state) => ({
    status: 'menu',
    score: 0,
    speed: INITIAL_SPEED,
    gameTime: 0,
    activePowerup: state.activePowerup,
    isSandstorm: true,
    floatingTexts: [],
    isTransitioning: false,
    transitionStartTime: 0,
    pendingScenario: null,
    fogSettings: INITIAL_FOG_SETTINGS,
    coldTimer: 30,
    mummySlowUntil: 0,
    originalFogDensity: null,
    eatingUntil: 0,
    currentRunEggs: { common: 0, rare: 0, ultraRare: 0 },
    eggsInTail: [],
    eggSpawnScores: [],
    shouldSpawnEgg: false,
    pendingEggRarity: null
  })),
  togglePause: () => set((state) => {
    if (state.status === 'playing') return { status: 'paused' };
    if (state.status === 'paused') return { status: 'playing' };
    return {};
  }),
  incrementScore: (points) => {
    set((state) => {
      const newScore = state.score + points;

      let newSpeed = INITIAL_SPEED + (ACCELERATION_PER_FRAME * (state.gameTime * 60));
      if (newSpeed > MAX_SPEED) newSpeed = MAX_SPEED;

      // Egg spawning checks (milestones seeded by generateEggSpawnPattern)
      let eggSpawnScores = [...state.eggSpawnScores];
      let shouldSpawnEgg = state.shouldSpawnEgg;
      let pendingEggRarity = state.pendingEggRarity;

      if (eggSpawnScores.length > 0 && newScore >= eggSpawnScores[0] && !shouldSpawnEgg) {
        eggSpawnScores.shift();
        shouldSpawnEgg = true;
        pendingEggRarity = rollEggRarity();
      }

      return {
        score: newScore,
        speed: newSpeed,
        eggSpawnScores,
        shouldSpawnEgg,
        pendingEggRarity
      };
    });

    // Refill the milestone queue once it's exhausted and the last egg has
    // already been consumed by the obstacle spawner.
    const state = get();
    if (state.eggSpawnScores.length === 0 && !state.shouldSpawnEgg) {
      state.generateEggSpawnPattern();
    }
  },
  increaseSpeed: (amount) => set((state) => ({ speed: state.speed + amount })),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setScenario: (scenario) => set({ scenario, isSandstorm: scenario === 'desert' }),
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

      const newCoins = state.coins + eggsToCoins(state.currentRunEggs);
      localStorage.setItem('trex-coins', newCoins.toString());
      updates.coins = newCoins;

      return updates;
    }
    return { lives: newLives };
  }),
  gainLife: () => set((state) => ({ lives: Math.min(state.lives + 1, MAX_LIVES) })),
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
      if (elapsed >= BIOME_TRANSITION_SWAP_TIME && state.scenario !== state.pendingScenario) {
        updates.scenario = state.pendingScenario;
        updates.isSandstorm = state.pendingScenario === 'desert';
        updates.invincibleUntil = performance.now() + BIOME_TRANSITION_INVINCIBILITY_MS;
      }
      if (elapsed >= BIOME_TRANSITION_END_TIME) {
        updates.isTransitioning = false;
        updates.pendingScenario = null;
      }
    } else if (state.status === 'playing') {
      // Infinite mode: biomes auto-cycle as the score climbs.
      const targetIndex = Math.floor(state.score / BIOME_CYCLE_SCORE) % BIOME_ORDER.length;
      const targetScenario = BIOME_ORDER[targetIndex];
      if (targetScenario !== state.scenario) {
        updates.isTransitioning = true;
        updates.pendingScenario = targetScenario;
        updates.transitionStartTime = newTime;
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
    if (cleanCode === 'CDINO') {
      const state = get();
      if (state.ownedSkins.includes('dino-rabbit')) return true; // Already owned
      const newOwned = [...state.ownedSkins, 'dino-rabbit'];
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
}));
