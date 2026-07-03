import re

# 1. Adjust fog near/far for swamp in App.tsx
with open('src/App.tsx', 'r') as f:
    app_code = f.read()

app_code = app_code.replace("    near = 25;\n    far = 65;\n  } else if (scenario === 'forest') {", "    near = 15;\n    far = 50;\n  } else if (scenario === 'forest') {")

with open('src/App.tsx', 'w') as f:
    f.write(app_code)


# 2. Adjust tree counts in SwampGround.tsx
with open('src/components/SwampGround.tsx', 'r') as f:
    swamp_code = f.read()

trees_old = """      <MangroveTrees count={15} zOffset={-40} zSpread={15} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={25} zOffset={-70} zSpread={25} speedFactor={0.15} scaleMult={2.2} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={20} zOffset={-110} zSpread={30} speedFactor={0.05} scaleMult={4.0} trunkColor="#1c1917" leavesColor="#020617" />"""

trees_new = """      <MangroveTrees count={12} zOffset={-40} zSpread={15} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={10} zOffset={-70} zSpread={25} speedFactor={0.15} scaleMult={2.2} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={8} zOffset={-110} zSpread={30} speedFactor={0.05} scaleMult={4.0} trunkColor="#1c1917" leavesColor="#020617" />"""

swamp_code = swamp_code.replace(trees_old, trees_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(swamp_code)

