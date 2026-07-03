import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

replacement = """      {/* Parallax Mangrove Trees Layer */}
      <MangroveTrees count={35} zOffset={-55} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={45} zOffset={-85} speedFactor={0.15} scaleMult={2.5} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={55} zOffset={-125} speedFactor={0.05} scaleMult={4.0} trunkColor="#1c1917" leavesColor="#020617" />"""

code = re.sub(r'      {/\* Parallax Mangrove Trees Layer \*/}.*?<MangroveTrees.*?<MangroveTrees.*?<MangroveTrees.*?/>', replacement, code, flags=re.DOTALL)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

