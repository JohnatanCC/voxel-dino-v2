import assert from 'assert';

// Polyfill localStorage for Node environment before importing the store
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

if (typeof global.performance === 'undefined') {
  (global as any).performance = { now: () => Date.now() };
}

// Dynamically import the store to ensure global polyfills are applied first
const { useGameStore } = await import('../src/store/gameStore');

console.log("🚀 Starting gameStore unit tests...");

// Test Case 1: Initial State
try {
  const state = useGameStore.getState();
  assert.strictEqual(state.status, 'menu');
  assert.strictEqual(state.score, 0);
  console.log("✅ Test 1: Initial state verified.");
} catch (e) {
  console.error("❌ Test 1 failed:", e);
  process.exit(1);
}

// Test Case 2: Start Game (Medium Difficulty)
try {
  const store = useGameStore;
  
  store.getState().resetGame();
  store.getState().setDifficulty('medium');
  store.getState().startGame();
  
  const state = store.getState();
  assert.strictEqual(state.status, 'playing');
  assert.strictEqual(state.score, 0);
  assert.strictEqual(state.lives, 3);
  assert.strictEqual(state.speed, 9); // Medium starting speed is 9
  console.log("✅ Test 2: Start Game (Medium Difficulty) verified.");
} catch (e) {
  console.error("❌ Test 2 failed:", e);
  process.exit(1);
}

// Test Case 3: Lose Life and Game Over
try {
  const store = useGameStore;
  
  store.getState().resetGame();
  store.getState().setDifficulty('medium');
  store.getState().startGame();
  
  // Lose 1st life
  store.getState().loseLife();
  assert.strictEqual(store.getState().lives, 2);
  assert.strictEqual(store.getState().status, 'playing');
  
  // Lose 2nd life
  store.getState().loseLife();
  assert.strictEqual(store.getState().lives, 1);
  assert.strictEqual(store.getState().status, 'playing');
  
  // Lose 3rd life (Game Over)
  store.getState().loseLife();
  assert.strictEqual(store.getState().lives, 0);
  assert.strictEqual(store.getState().status, 'gameover');
  console.log("✅ Test 3: Lose Life and Game Over transitions verified.");
} catch (e) {
  console.error("❌ Test 3 failed:", e);
  process.exit(1);
}

// Test Case 4: Increment Score & Speed Increase
try {
  const store = useGameStore;
  store.getState().resetGame();
  store.getState().setDifficulty('medium');
  store.getState().startGame();
  
  const initialSpeed = store.getState().speed;
  
  // Simulate progress
  store.getState().addGameTime(1); // 1 second
  store.getState().incrementScore(100);
  
  assert.ok(store.getState().score > 0);
  assert.ok(store.getState().speed > initialSpeed); // Speed must accelerate
  console.log("✅ Test 4: Score increment and speed acceleration verified.");
} catch (e) {
  console.error("❌ Test 4 failed:", e);
  process.exit(1);
}

console.log("🎉 All tests passed successfully!");
process.exit(0);
