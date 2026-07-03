import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

# Remove fog meshes entirely to reduce clutter and density
code = re.sub(r'const fogRef = useRef<THREE\.InstancedMesh>\(null\);', '', code)
code = re.sub(r'const fogData = useMemo\(\(\) => \{.*?\n  \}, \[\]\);', '', code, flags=re.DOTALL)
code = re.sub(r'if \(fogRef\.current\) \{.*?\n    \}', '', code, flags=re.DOTALL)
code = re.sub(r'\{/\* Fog/Clouds \(low hanging fog\) \*/\}.*?</instancedMesh>', '', code, flags=re.DOTALL)

# Also reduce tree density and push layers back
trees_old = """      <MangroveTrees count={12} zOffset={-40} zSpread={15} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={10} zOffset={-70} zSpread={25} speedFactor={0.15} scaleMult={2.2} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={8} zOffset={-110} zSpread={30} speedFactor={0.05} scaleMult={4.0} trunkColor="#1c1917" leavesColor="#020617" />"""

trees_new = """      {/* Parallax Mangrove Trees Layer */}
      <MangroveTrees count={10} zOffset={-45} zSpread={10} speedFactor={0.25} scaleMult={1.2} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={8} zOffset={-80} zSpread={15} speedFactor={0.15} scaleMult={1.6} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={5} zOffset={-120} zSpread={20} speedFactor={0.05} scaleMult={2.0} trunkColor="#1c1917" leavesColor="#020617" />"""

code = code.replace(trees_old, trees_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

