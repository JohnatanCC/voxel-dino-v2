import re

with open('src/components/Game.tsx', 'r') as f:
    code = f.read()

# Add OrbitControls import
code = code.replace("import { Text } from '@react-three/drei';", "import { Text, OrbitControls } from '@react-three/drei';")

# Add OrbitControls component inside the Game component return, at the very end.
replacement = """      {scenario === 'snow' && (
        <>
          <SnowObstacles ref={obstaclesRef} />
          <SnowGround />
        </>
      )}
      {devMode && <OrbitControls makeDefault />}
    </group>
"""

code = code.replace("""      {scenario === 'snow' && (
        <>
          <SnowObstacles ref={obstaclesRef} />
          <SnowGround />
        </>
      )}
    </group>""", replacement)

with open('src/components/Game.tsx', 'w') as f:
    f.write(code)

