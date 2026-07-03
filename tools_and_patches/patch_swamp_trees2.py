import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

trees_old = """      {/* Parallax Mangrove Trees Layer */}
      <MangroveTrees count={10} zOffset={-45} zSpread={10} speedFactor={0.25} scaleMult={1.2} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={8} zOffset={-80} zSpread={15} speedFactor={0.15} scaleMult={1.6} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={5} zOffset={-120} zSpread={20} speedFactor={0.05} scaleMult={2.0} trunkColor="#1c1917" leavesColor="#020617" />"""

trees_new = """      {/* Parallax Mangrove Trees Layer */}
      <MangroveTrees count={12} zOffset={-45} zSpread={10} speedFactor={0.25} scaleMult={1.2} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={10} zOffset={-80} zSpread={15} speedFactor={0.15} scaleMult={1.8} trunkColor="#292524" leavesColor="#022c22" />"""

code = code.replace(trees_old, trees_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

