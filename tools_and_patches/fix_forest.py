import re

with open('src/components/ForestObstacles.tsx', 'r') as f:
    code = f.read()

code = code.replace("boxGeometry args={[5, 4, 2]}", "boxGeometry args={[2, 4, 5]}")
code = code.replace("mesh position={[2, 1.5, 0]}", "mesh position={[0, 1.5, 2.5]}")
code = code.replace("mesh position={[-2, 1.5, 0]}", "mesh position={[0, 1.5, -2.5]}")

with open('src/components/ForestObstacles.tsx', 'w') as f:
    f.write(code)

