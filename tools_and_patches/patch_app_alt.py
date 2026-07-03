import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

replacement = """  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        useGameStore.getState().setDevMode(false);
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) {"""

code = code.replace("""  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) {""", replacement)

with open('src/App.tsx', 'w') as f:
    f.write(code)

