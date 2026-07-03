import re

with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

code = code.replace("fogSettings: { desert: 'minimum', forest: 'minimum', swamp: 'minimum', snow: 'minimum' }", "fogSettings: { desert: 'minimum', forest: 'minimum', swamp: 'low', snow: 'minimum' }")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)
