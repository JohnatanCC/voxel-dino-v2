import re

with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

code = code.replace("fogSettings: { desert: 'low', forest: 'low', swamp: 'minimum', snow: 'low' }", "fogSettings: { desert: 'minimum', forest: 'minimum', swamp: 'minimum', snow: 'minimum' }")
code = code.replace("fogSettings: { desert: 'low', forest: 'low', swamp: 'low', snow: 'low' }", "fogSettings: { desert: 'minimum', forest: 'minimum', swamp: 'minimum', snow: 'minimum' }")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)

