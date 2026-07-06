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

// Test Case 5: Egg Collection and Conversion on End Game
try {
  const store = useGameStore;
  store.getState().resetGame();
  
  // Set initial state
  store.setState({ coins: 100 });
  
  // Collect eggs
  store.getState().collectEgg('common');
  store.getState().collectEgg('rare');
  store.getState().collectEgg('ultraRare');
  
  const stateAfterCollect = store.getState();
  assert.strictEqual(stateAfterCollect.eggsInTail.length, 3);
  assert.strictEqual(stateAfterCollect.currentRunEggs.common, 1);
  assert.strictEqual(stateAfterCollect.currentRunEggs.rare, 1);
  assert.strictEqual(stateAfterCollect.currentRunEggs.ultraRare, 1);
  
  // Eject one egg (Ultra Rare should be the last one, so it gets removed)
  store.getState().loseEgg();
  assert.strictEqual(store.getState().eggsInTail.length, 2);
  assert.strictEqual(store.getState().currentRunEggs.ultraRare, 0);
  
  // End Game converts remaining eggs (common = 50, rare = 150) -> +200 coins
  store.getState().endGame();
  assert.strictEqual(store.getState().coins, 300); // 100 base + 200 converted
  console.log("✅ Test 5: Egg collection, damage loss, and Game Over conversion verified.");
} catch (e) {
  console.error("❌ Test 5 failed:", e);
  process.exit(1);
}

// Test Case 6: Skin Shop Transactions and Equipping
try {
  const store = useGameStore;
  store.getState().resetGame();
  
  // Set coin state
  store.setState({ coins: 3000, ownedSkins: ['dino-classic'], equippedSkin: 'dino-classic' });
  
  // Try to buy a skin we can afford (dino-brown costs 2500)
  const buySuccess = store.getState().buySkin('dino-brown');
  assert.strictEqual(buySuccess, true);
  assert.strictEqual(store.getState().coins, 500);
  assert.ok(store.getState().ownedSkins.includes('dino-brown'));
  
  // Try to buy a skin we cannot afford (dino-blue costs 5000)
  const buyFail = store.getState().buySkin('dino-blue');
  assert.strictEqual(buyFail, false);
  
  // Equip the skin
  store.getState().equipSkin('dino-brown');
  assert.strictEqual(store.getState().equippedSkin, 'dino-brown');
  console.log("✅ Test 6: Skin buying rules, funds check, and equipping verified.");
} catch (e) {
  console.error("❌ Test 6 failed:", e);
  process.exit(1);
}

// Test Case 7: Promo Code Redemption
try {
  const store = useGameStore;
  store.getState().resetGame();
  
  // Redeem a valid promo code
  const codeSuccess = store.getState().redeemCode('VOXELTREX');
  assert.strictEqual(codeSuccess, true);
  assert.ok(store.getState().ownedSkins.includes('dino-rainbow'));

  // Redeem kitsune promo code
  const kitsuneSuccess = store.getState().redeemCode('Exclusivepride#0507D');
  assert.strictEqual(kitsuneSuccess, true);
  assert.ok(store.getState().ownedSkins.includes('dino-kitsune'));
  
  // Redeem an invalid code
  const codeFail = store.getState().redeemCode('INVALID');
  assert.strictEqual(codeFail, false);
  console.log("✅ Test 7: Promo code validation and skin unlocking verified.");
} catch (e) {
  console.error("❌ Test 7 failed:", e);
  process.exit(1);
}

// Test Case 8: Egg Spawning Threshold
try {
  const store = useGameStore;
  store.getState().resetGame();
  
  store.getState().startGame();
  // We should have pre-generated egg targets
  const state = store.getState();
  assert.ok(state.eggSpawnScores.length >= 1 && state.eggSpawnScores.length <= 3);
  assert.strictEqual(state.shouldSpawnEgg, false);
  
  // Force score past the first target score
  const firstTarget = state.eggSpawnScores[0];
  store.getState().incrementScore(firstTarget);
  
  assert.strictEqual(store.getState().shouldSpawnEgg, true);
  assert.ok(store.getState().pendingEggRarity !== null);
  console.log("✅ Test 8: Egg spawn target generation and score checks verified.");
} catch (e) {
  console.error("❌ Test 8 failed:", e);
  process.exit(1);
}

console.log("🎉 All tests passed successfully!");
process.exit(0);
