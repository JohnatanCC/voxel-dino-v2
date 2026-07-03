import re

with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

# I need to add graphicsQuality to the initial state object
if "graphicsQuality: 'medium'," not in code:
    code = code.replace("difficulty: 'easy',", "difficulty: 'easy',\n  graphicsQuality: 'medium',")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)
