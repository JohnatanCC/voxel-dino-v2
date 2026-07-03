import re

with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

# Fix create((set) => ({  to  create((set, get) => ({
code = code.replace("create<GameState>((set) => ({", "create<GameState>((set, get) => ({")

# Add devMode: false, to the initial state
code = code.replace("  dinoColor: '#535353',\n  gameTime: 0,", "  dinoColor: '#535353',\n  devMode: False,\n  gameTime: 0,")

# Oh wait, python replace! I should do devMode: false, not False
code = code.replace("devMode: False,", "devMode: false,")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)

