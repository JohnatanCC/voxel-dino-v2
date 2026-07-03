import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

code = code.replace("<mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>", "<mesh receiveShadow>")

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

