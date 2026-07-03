import re

with open('src/components/Dino.tsx', 'r') as f:
    code = f.read()

# 1. Add hitboxRef
code = code.replace(
    "const rightLegRef = useRef<THREE.Mesh>(null);",
    "const rightLegRef = useRef<THREE.Mesh>(null);\n  const hitboxRef = useRef<THREE.Group>(null);"
)

# 2. Update ref combining
code = code.replace(
    "ref.current = innerRef.current;",
    "ref.current = hitboxRef.current;"
)
code = code.replace(
    "ref(innerRef.current);",
    "ref(hitboxRef.current);"
)

# 3. Add hitbox group inside innerRef
replacement = """      <group ref={innerRef} position={[DINO_X, 0, 0]} scale={0.7}>
        {/* Hitbox */}
        <group ref={hitboxRef} position={[-0.1, 1.2, 0]}>
           <mesh visible={false}>
             <boxGeometry args={[1.2, 1.5, 0.8]} />
           </mesh>
        </group>
"""
code = code.replace("      <group ref={innerRef} position={[DINO_X, 0, 0]} scale={0.7}>", replacement)

with open('src/components/Dino.tsx', 'w') as f:
    f.write(code)

