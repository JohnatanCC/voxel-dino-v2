import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

# 1. Remove moss texture, moss data, moss ref
code = re.sub(r'  const mossTexture = useMemo\(\(\) => \{.*?\n  \}, \[\]\);\n', '', code, flags=re.DOTALL)
code = re.sub(r'  const mossData = useMemo\(\(\) => \{.*?\n  \}, \[\]\);\n', '', code, flags=re.DOTALL)

# Remove mossRef definition
code = code.replace("  const mossRef = useRef<THREE.InstancedMesh>(null);\n", "")

# Remove moss update loop
code = re.sub(r'    if \(mossRef\.current\) \{.*?mossRef\.current\.instanceMatrix\.needsUpdate = true;\n    \}\n', '', code, flags=re.DOTALL)

# Remove moss instances mesh
code = re.sub(r'      \{/\* Moss on ground \*/\}\n      <instancedMesh frustumCulled=\{false\} ref=\{mossRef\}.*?</instancedMesh>\n', '', code, flags=re.DOTALL)

# Change vine material from mossTexture to color
code = code.replace('<meshStandardMaterial map={mossTexture} roughness={0.9} />', '<meshStandardMaterial color="#065f46" roughness={0.9} />')

# 2. Improve Lily Pads
# Add rim ref
code = code.replace("const lilyPadRef = useRef<THREE.InstancedMesh>(null);", "const lilyPadRef = useRef<THREE.InstancedMesh>(null);\n  const lilyPadRimRef = useRef<THREE.InstancedMesh>(null);")

# Update LilyPad loop
lily_update_old = """    if (lilyPadRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < LILY_PAD_COUNT; i++) {
        const d = lilyPadData[i];
        d.x -= moveDistance;
        if (d.x < -BACKGROUND_LENGTH / 2) {
          d.x += BACKGROUND_LENGTH;
          d.z = -10 + (Math.random() - 0.5) * 35;
        }
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale, 0.05, d.scale);
        dummy.updateMatrix();
        lilyPadRef.current.setMatrixAt(i, dummy.matrix);
      }
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
    }"""

lily_update_new = """    if (lilyPadRef.current && lilyPadRimRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < LILY_PAD_COUNT; i++) {
        const d = lilyPadData[i];
        d.x -= moveDistance;
        if (d.x < -BACKGROUND_LENGTH / 2) {
          d.x += BACKGROUND_LENGTH;
          d.z = -10 + (Math.random() - 0.5) * 35;
        }
        // Base
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale, 0.05, d.scale);
        dummy.updateMatrix();
        lilyPadRef.current.setMatrixAt(i, dummy.matrix);
        
        // Rim
        dummy.position.set(d.x, d.y + 0.05, d.z);
        dummy.scale.set(d.scale * 1.01, 0.1, d.scale * 1.01);
        dummy.updateMatrix();
        lilyPadRimRef.current.setMatrixAt(i, dummy.matrix);
      }
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
      lilyPadRimRef.current.instanceMatrix.needsUpdate = true;
    }"""
    
code = code.replace(lily_update_old, lily_update_new)

# Update lily pad meshes
lily_mesh_old = """      {/* Lily Pads */}
      <instancedMesh frustumCulled={false} ref={lilyPadRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <meshStandardMaterial color="#059669" roughness={0.8} />
      </instancedMesh>"""

lily_mesh_new = """      {/* Vitoria Regia (Lily Pads) */}
      <instancedMesh frustumCulled={false} ref={lilyPadRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial color="#059669" roughness={0.8} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={lilyPadRimRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshStandardMaterial color="#047857" roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>"""
      
code = code.replace(lily_mesh_old, lily_mesh_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

