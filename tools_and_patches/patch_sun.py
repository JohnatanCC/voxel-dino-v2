import re

with open('src/components/EnvironmentManager.tsx', 'r') as f:
    code = f.read()

# Remove Sun mesh
code = re.sub(r'      \{/\* Sun \*/\}\s*<mesh ref=\{sunRef\} position=\{\[20, 15, -30\]\}>\s*<boxGeometry args=\{\[4, 4, 1\]\} />\s*<meshBasicMaterial ref=\{sunMaterialRef\} color="#fef08a" />\s*</mesh>\s*', '', code)

# Fix missing sunRef and sunMaterialRef from EnvironmentManager
code = re.sub(r'  const sunRef = useRef<THREE.Mesh>\(null\);\s*const sunMaterialRef = useRef<THREE.MeshBasicMaterial>\(null\);\s*', '', code)

with open('src/components/EnvironmentManager.tsx', 'w') as f:
    f.write(code)
