import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

trees_old = """      {/* Parallax Mangrove Trees Layer */}
      <MangroveTrees count={12} zOffset={-45} zSpread={10} speedFactor={0.25} scaleMult={1.2} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={10} zOffset={-80} zSpread={15} speedFactor={0.15} scaleMult={1.8} trunkColor="#292524" leavesColor="#022c22" />"""

trees_new = """      {/* Parallax Mangrove Trees Layer */}
      <MangroveTrees count={10} zOffset={-50} zSpread={15} speedFactor={0.25} scaleMult={0.8} trunkColor="#44403c" leavesColor="#064e3b" />"""

code = code.replace(trees_old, trees_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

