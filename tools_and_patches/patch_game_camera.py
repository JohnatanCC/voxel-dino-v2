import re

with open('src/components/Game.tsx', 'r') as f:
    code = f.read()

# Add imports
if 'OrbitControls' not in code:
    code = code.replace("import { Box } from '@react-three/drei';", "import { Box, OrbitControls } from '@react-three/drei';")
    if 'OrbitControls' not in code:
        code = code.replace("import { EnvironmentManager } from './EnvironmentManager';", "import { EnvironmentManager } from './EnvironmentManager';\nimport { OrbitControls } from '@react-three/drei';")

# Add devMode to destructuring
code = code.replace("const { status, speed, incrementScore, increaseSpeed, endGame, cameraMode, scenario } = useGameStore();", "const { status, speed, incrementScore, increaseSpeed, endGame, cameraMode, scenario, devMode } = useGameStore();")

# Modify camera update logic
replacement = """  useFrame((state, delta) => {
    if (devMode) return;
    const isMobile = window.innerWidth < 768;"""

code = re.sub(r'  useFrame\(\(state, delta\) => \{\n    const isMobile = window\.innerWidth < 768;', replacement, code)

# Add OrbitControls component
replacement2 = """      </group>
      {devMode && <OrbitControls />}
    </>"""
code = re.sub(r'      <\/group>\n    <\/>', replacement2, code)

with open('src/components/Game.tsx', 'w') as f:
    f.write(code)

