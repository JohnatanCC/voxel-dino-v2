import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

code = code.replace("<mesh receiveShadow>\n           <cylinderGeometry args={[3, 3, 0.1, 16]} />", "<mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>\n           <cylinderGeometry args={[3, 3, 0.1, 16]} />")

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

