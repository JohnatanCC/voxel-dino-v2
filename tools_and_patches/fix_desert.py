import re

with open('src/components/Ground.tsx', 'r') as f:
    code = f.read()

# Remove bushes
code = re.sub(r'const BUSH_COUNT = 15;\n', '', code)
code = re.sub(r'  const bushRef = useRef.*?;\n', '', code)
code = re.sub(r'  // Generate random bushes \(dead vegetation\)\n  const bushData = useMemo[\s\S]*?\]\);\n', '', code)
code = re.sub(r'    if \(bushRef\.current\) \{[\s\S]*?bushRef\.current\.instanceMatrix\.needsUpdate = true;\n    \}\n', '', code)
code = re.sub(r'      \{\/\* Background Dead Bushes \*\/\}\n      <instancedMesh frustumCulled=\{false\} ref=\{bushRef\} args=\{\[undefined, undefined, BUSH_COUNT\]\} receiveShadow>\n        <dodecahedronGeometry args=\{\[0\.7, 0\]\} \/>\n        <meshStandardMaterial color="#78350f" roughness=\{1\} flatShading \/>\n      <\/instancedMesh>\n', '', code)

# Make cacti farther away and darker
code = code.replace("z: -3 - Math.random() * 8, // Ensures they are in front of mountains (-15 to -35)", "z: -12 - Math.random() * 10,")
code = code.replace("d.z = -3 - Math.random() * 8; // Match initial depth range", "d.z = -12 - Math.random() * 10;")
code = code.replace('color="#22c55e"', 'color="#166534"')

with open('src/components/Ground.tsx', 'w') as f:
    f.write(code)

