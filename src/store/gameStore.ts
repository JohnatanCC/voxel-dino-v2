import { create } from 'zustand';

export type FogDensity = 'off' | 'minimum' | 'low' | 'medium' | 'high';
export type GameStatus = 'menu' | 'playing' | 'gameover' | 'paused';
export type CameraMode = '2D' | '2.5D';
export type GameScenario = 'desert' | 'forest' | 'swamp' | 'snow';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
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
  isSandstorm: boolean;
  cameraShake: number;
  floatingTexts: FloatingText[];
  isTransitioning: boolean;
  transitionStartTime: number;
  pendingScenario: GameScenario | null;
  coldTimer: number; // For snow scenario
  weakJumpUntil: number;
  slowUntil: number;
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
  graphicsQuality: 'medium',
  lives: 3,
  dinoColor: '#535353',
  devMode: false,
  gameTime: 0,
  activePowerup: 'none',
  powerupEndTime: 0,
  invincibleUntil: 0,
  heavyJumpUntil: 0,
  weakJumpUntil: 0,
  slowUntil: 0,
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
  startGame: () => set((state) => {
    let startingLives = 1;
    if (state.difficulty === 'easy') startingLives = 5;
    if (state.difficulty === 'medium') startingLives = 3;
    
    let initialSpeed = 9;
    if (state.difficulty === 'easy') initialSpeed = 7.5;
    if (state.difficulty === 'hard') initialSpeed = 12;
    
    const updates: Partial<GameState> = { 
      status: 'playing', 
      score: 0, 
      speed: initialSpeed, 
      gameId: state.gameId + 1, 
      gameTime: 0, 
      activePowerup: state.activePowerup, 
      isSandstorm: state.scenario === 'desert', 
      lives: startingLives, 
      invincibleUntil: 0, 
      heavyJumpUntil: 0, 
      weakJumpUntil: 0,
      slowUntil: 0, 
      coldTimer: 30, 
      floatingTexts: [], 
      mummySlowUntil: 0, 
      originalFogDensity: null, 
      eatingUntil: 0,
      isTransitioning: false,
      transitionStartTime: 0,
      pendingScenario: null
    };

    if (state.mummySlowUntil > 0 && state.originalFogDensity) {
      updates.fogSettings = { ...state.fogSettings, [state.scenario]: state.originalFogDensity };
    }

    return updates;
  }),
  endGame: () => set((state) => {
    const newHighScore = Math.max(Math.floor(state.score), state.highScore);
    localStorage.setItem('trex-highscore', newHighScore.toString());
    return { status: 'gameover', highScore: newHighScore, score: Math.floor(state.score), activePowerup: 'none', floatingTexts: [] };
  }),
  getCurrentSpeed: () => {
    const state = get();
    let s = state.speed;
    if (performance.now() < state.mummySlowUntil) s /= 1.5;
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
    return { status: 'menu', score: 0, speed: initialSpeed, gameTime: 0, activePowerup: state.activePowerup, isSandstorm: true, floatingTexts: [], isTransitioning: false, transitionStartTime: 0, pendingScenario: null,
  fogSettings: { desert: 'minimum', forest: 'minimum', swamp: 'low', snow: 'minimum' }, coldTimer: 30, mummySlowUntil: 0, originalFogDensity: null, eatingUntil: 0 };
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
    
    let initialSpeed = 9;
    if (state.difficulty === 'easy') initialSpeed = 7.5;
    if (state.difficulty === 'hard') initialSpeed = 12;
    
    const acceleration = 0.001; // Constant acceleration as requested
    
    // gameTime is in seconds. Assuming 60 frames per second.
    const framesElapsed = state.gameTime * 60;
    
    let newSpeed = initialSpeed + (acceleration * framesElapsed);
    if (newSpeed > 37.5) newSpeed = 37.5; // Max speed cap of 37.5 (2.5x of 15)
    
    // Check for mixed mode transition
    if (state.isMixedMode && state.status === 'playing') {
       const previousThreshold = Math.floor(state.score / 10000);
       const currentThreshold = Math.floor(newScore / 10000);
       if (currentThreshold > previousThreshold && !state.isTransitioning) {
         // Switch scenario
         const scenarios: GameScenario[] = ['desert', 'forest', 'swamp'];
         const currentIndex = scenarios.indexOf(state.scenario);
         const nextScenario = scenarios[(currentIndex + 1) % scenarios.length];
         
         // Trigger a floating text to announce transition
         state.addFloatingText('NEW AREA!', 5, 5, 0, '#333333');
         
         return { 
           score: newScore, 
           speed: newSpeed,
           pendingScenario: nextScenario,
           isTransitioning: true,
           transitionStartTime: state.gameTime
         };
       }
    }
    
    return { score: newScore, speed: newSpeed };
  }),
  increaseSpeed: (amount) => set((state) => ({ speed: state.speed + amount })),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setScenario: (scenario) => set({ scenario, isSandstorm: scenario === 'desert' }),
  setMixedMode: (isMixed) => set({ isMixedMode: isMixed }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
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
  activatePowerup: (powerup, duration) => set((state) => ({ activePowerup: powerup, powerupEndTime: state.gameTime + duration })),
  deactivatePowerup: () => set({ activePowerup: 'none' }),
  triggerCameraShake: (intensity: number) => set({ cameraShake: intensity }),
  updateCameraShake: () => set((state) => ({ cameraShake: Math.max(0, state.cameraShake - 0.05) })),
  addFloatingText: (text, x, y, z, color = '#ffffff') => set((state) => {
    const newText: FloatingText = { id: Math.random().toString(36).substr(2, 9), text, x, y, z, color, createdAt: performance.now() };
    return { floatingTexts: [...state.floatingTexts, newText] };
  }),
  removeFloatingText: (id) => set((state) => ({ floatingTexts: state.floatingTexts.filter(t => t.id !== id) })),
  setFogDensity: (scenario, density) => set((state) => ({ fogSettings: { ...state.fogSettings, [scenario]: density } })),
}));
