import re

with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

code = code.replace("weakJumpUntil: number;", "weakJumpUntil: number;\n  slowUntil: number;\n  setSlowUntil: (time: number) => void;")
code = code.replace("weakJumpUntil: 0,", "weakJumpUntil: 0,\n  slowUntil: 0,")
code = code.replace("setWeakJumpUntil: (time) => set({ weakJumpUntil: time }),", "setWeakJumpUntil: (time) => set({ weakJumpUntil: time }),\n  setSlowUntil: (time) => set({ slowUntil: time }),")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)
