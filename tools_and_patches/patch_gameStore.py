import re

with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

# Replace FogDensity type
code = code.replace("export type FogDensity = 'low' | 'medium' | 'high';", "export type FogDensity = 'off' | 'minimum' | 'low' | 'medium' | 'high';")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)

