import re

with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

code = code.replace("dinoColor: string;", "dinoColor: string;\n  devMode: boolean;")
code = code.replace("setDinoColor: (color: string) => void;", "setDinoColor: (color: string) => void;\n  setDevMode: (active: boolean) => void;")

code = code.replace("dinoColor: '#1f2937',", "dinoColor: '#1f2937',\n  devMode: false,")
code = code.replace("setDinoColor: (color) => set({ dinoColor: color }),", "setDinoColor: (color) => set({ dinoColor: color }),\n  setDevMode: (active) => set({ devMode: active }),")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)

