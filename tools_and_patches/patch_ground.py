import re

with open('src/components/Ground.tsx', 'r') as f:
    code = f.read()

# Add imports
code = code.replace("import { useGameStore } from '../store/gameStore';", 
"import { useGameStore } from '../store/gameStore';\nimport { Mountains } from './environment/Mountains';\nimport { Clouds } from './environment/Clouds';")

# Remove internal mountain and cloud references
code = re.sub(r'const mountainRef = useRef.*?;\n', '', code)
code = re.sub(r'const mountainTopRef = useRef.*?;\n', '', code)
code = re.sub(r'const cloudRef = useRef.*?;\n', '', code)

code = re.sub(r'const MOUNTAIN_COUNT = 20;\n', '', code)
code = re.sub(r'const CLOUD_COUNT = 8;\n', '', code)
code = re.sub(r'const CLOUD_LENGTH = 150;\n', '', code)

code = re.sub(r'  // Generate random background mountains\n  const mountainsData = useMemo[\s\S]*?\]\);\n', '', code)
code = re.sub(r'  // Generate random clouds\n  const cloudsData = useMemo[\s\S]*?\]\);\n', '', code)

# Remove animation loop for mountains and clouds
code = re.sub(r'    if \(mountainRef\.current[\s\S]*?mountainTopRef\.current\.instanceMatrix\.needsUpdate = true;\n    }\n', '', code)
code = re.sub(r'    if \(cloudRef\.current[\s\S]*?cloudRef\.current\.instanceMatrix\.needsUpdate = true;\n    }\n', '', code)

# In the render, remove instancedMesh for mountains and clouds
code = re.sub(r'      \{\/\* Mountains \*\/\}\n      <instancedMesh ref=\{mountainRef\}[\s\S]*?<\/instancedMesh>\n', '', code)
code = re.sub(r'      \{\/\* Clouds \*\/\}\n      <instancedMesh ref=\{cloudRef\}[\s\S]*?<\/instancedMesh>\n', '', code)

# Add <Mountains /> and <Clouds /> right after <mesh ref={floorRef} ...>
# Wait, it's easier to just find a place to insert them.
replacement = """      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[GROUND_LENGTH * 2, 80]} />
        <meshStandardMaterial map={sandTexture} roughness={1} />
      </mesh>
      
      <Mountains baseColor="#b45309" topColor="#d97706" />
      <Clouds color="#fef3c7" opacity={0.6} />
"""
code = re.sub(r'      <mesh ref=\{floorRef\} rotation=\{\[-Math.PI / 2, 0, 0\]\} position=\{\[0, -0.1, 0\]\}>\n        <planeGeometry args=\{\[GROUND_LENGTH \* 2, 80\]\} />\n        <meshStandardMaterial map=\{sandTexture\} roughness=\{1\} />\n      </mesh>', replacement, code)

with open('src/components/Ground.tsx', 'w') as f:
    f.write(code)
