import re

with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

code = code.replace("increaseSpeed: (amount: number) => void;", "increaseSpeed: (amount: number) => void;\n  getCurrentSpeed: () => number;")

code = code.replace("addGameTime: (delta: number) => void;", "addGameTime: (delta: number) => void;\n  getCurrentSpeed: () => number;")

code = code.replace("resetGame: () => set((state) => {", "getCurrentSpeed: () => {\n    const state = get();\n    let s = state.speed;\n    if (performance.now() < state.slowUntil) s *= 0.5;\n    return s;\n  },\n  resetGame: () => set((state) => {")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)

