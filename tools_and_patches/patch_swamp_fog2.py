import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

# Add fogRef
if "const fogRef" not in code:
    code = code.replace("const frogRef = useRef<THREE.InstancedMesh>(null);", "const frogRef = useRef<THREE.InstancedMesh>(null);\n  const fogRef = useRef<THREE.InstancedMesh>(null);")

# Add fogData
fog_data_code = """
  const fogData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 40; i++) {
      data.push({
        x: (Math.random() - 0.5) * 200,
        y: 2 + Math.random() * 4,
        z: -62 + (Math.random() - 0.5) * 10, // Second layer
        scale: 15 + Math.random() * 15,
        speed: 0.1 + Math.random() * 0.2,
      });
    }
    return data;
  }, []);
"""
if "const fogData" not in code:
    code = code.replace("const frogData = useMemo(() => {", fog_data_code + "\n  const frogData = useMemo(() => {")

# Add fog update loop
fog_update_code = """
    if (fogRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 40; i++) {
        const d = fogData[i];
        d.x -= (moveDistance * 0.15) + (d.speed * delta); // Parallax for second layer + drift
        if (d.x < -100) d.x += 200;
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(d.scale, d.scale, d.scale);
        dummy.updateMatrix();
        fogRef.current.setMatrixAt(i, dummy.matrix);
      }
      fogRef.current.instanceMatrix.needsUpdate = true;
    }
"""
if "fogRef.current.instanceMatrix.needsUpdate" not in code:
    code = code.replace("if (frogRef.current) {", fog_update_code + "\n    if (frogRef.current) {")

# Add fog mesh
fog_mesh_code = """      {/* Fog/Clouds (low hanging fog) */}
      <instancedMesh frustumCulled={false} ref={fogRef} args={[undefined, undefined, 40]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial alphaMap={fogTexture} transparent opacity={0.15} depthWrite={false} color="#94a3b8" blending={THREE.AdditiveBlending} />
      </instancedMesh>"""
if "alphaMap={fogTexture}" not in code:
    code = code.replace("{/* Fog/Clouds (low hanging fog) */}", fog_mesh_code)

# Adjust mangrove tags
code = code.replace('<MangroveTrees count={35} zOffset={-55} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />', '<MangroveTrees count={35} zOffset={-55} zSpread={5} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />')
code = code.replace('<MangroveTrees count={70} zOffset={-62} speedFactor={0.15} scaleMult={2.2} trunkColor="#292524" leavesColor="#022c22" />', '<MangroveTrees count={70} zOffset={-62} zSpread={10} speedFactor={0.15} scaleMult={2.2} trunkColor="#292524" leavesColor="#022c22" />')

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

