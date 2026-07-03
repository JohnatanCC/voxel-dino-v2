import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

# 1. Remove flower
code = re.sub(r'  const lilyPadFlowerRef = useRef<THREE.InstancedMesh>\(null\);\n', '', code)

lily_update_old = """        // Flower (only on some)
        if (lilyPadFlowerRef.current) {
          if (i % 3 === 0) { // Every 3rd lily pad gets a flower
            dummy.position.set(d.x + d.scale * 0.3, d.y + 0.15, d.z - d.scale * 0.2);
            dummy.scale.set(d.scale * 0.3, 0.1, d.scale * 0.3);
            dummy.rotation.set(0, d.rot * 2, 0);
          } else {
            dummy.position.set(0, -100, 0);
            dummy.scale.setScalar(0);
          }
          dummy.updateMatrix();
          lilyPadFlowerRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
      lilyPadRimRef.current.instanceMatrix.needsUpdate = true;
      if (lilyPadFlowerRef.current) {
        lilyPadFlowerRef.current.instanceMatrix.needsUpdate = true;
      }
    }"""

lily_update_new = """      }
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
      lilyPadRimRef.current.instanceMatrix.needsUpdate = true;
    }"""

code = code.replace(lily_update_old, lily_update_new)

flower_mesh_old = """      <instancedMesh frustumCulled={false} ref={lilyPadFlowerRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#fdf2f8" roughness={0.5} />
      </instancedMesh>"""
code = code.replace(flower_mesh_old, "")

# 2. Improve Vitória-Régia rim
# Real Vitoria Regia rims are vertical and have a reddish underside, but double side green is okay. Let's make it a bit taller and thinner.
rim_old = """      <instancedMesh frustumCulled={false} ref={lilyPadRimRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshStandardMaterial color="#047857" roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>"""
rim_new = """      <instancedMesh frustumCulled={false} ref={lilyPadRimRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshStandardMaterial color="#065f46" roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>"""
code = code.replace(rim_old, rim_new)

# Update Rim scale inside loop
rim_update_old = """        dummy.position.set(d.x, d.y + 0.05, d.z);
        dummy.scale.set(d.scale * 1.01, 0.1, d.scale * 1.01);"""
rim_update_new = """        dummy.position.set(d.x, d.y + 0.05, d.z);
        dummy.scale.set(d.scale * 1.0, 0.2, d.scale * 1.0);"""
code = code.replace(rim_update_old, rim_update_new)

# 3. Water improvements (animate texture)
# Wait, animating texture requires useFrame.
# Let's add waterTexture offset update.
# First, add a ref for water material
water_mat_ref_str = "const waterMatRef = useRef<THREE.MeshStandardMaterial>(null);"
if water_mat_ref_str not in code:
    code = code.replace("const floorRef = useRef<THREE.Mesh>(null);", "const floorRef = useRef<THREE.Mesh>(null);\n  const waterMatRef = useRef<THREE.MeshStandardMaterial>(null);")

use_frame_old = """  useFrame((state, delta) => {
    if (status !== 'playing' && status !== 'menu') return;
    
    const moveDistance = speed * delta;"""
use_frame_new = """  useFrame((state, delta) => {
    if (status !== 'playing' && status !== 'menu') return;
    
    if (waterMatRef.current && waterMatRef.current.map) {
      waterMatRef.current.map.offset.x += 0.1 * delta;
      waterMatRef.current.map.offset.y += 0.05 * delta;
    }
    
    const moveDistance = speed * delta;"""
code = code.replace(use_frame_old, use_frame_new)

water_mesh_old = """      {/* Water Floor */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_LENGTH * 2, 60]} />
        <meshStandardMaterial map={waterTexture} roughness={0.1} metalness={0.1} />
      </mesh>"""
water_mesh_new = """      {/* Water Floor */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_LENGTH * 2, 60]} />
        <meshStandardMaterial ref={waterMatRef} map={waterTexture} roughness={0.05} metalness={0.3} color="#0f172a" />
      </mesh>"""
code = code.replace(water_mesh_old, water_mesh_new)

water_dist_mesh_old = """      {/* Distant water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]}>
        <planeGeometry args={[BACKGROUND_LENGTH * 2, 250]} />
        <meshStandardMaterial map={waterTexture} roughness={0.1} metalness={0.1} />
      </mesh>"""
water_dist_mesh_new = """      {/* Distant water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]}>
        <planeGeometry args={[BACKGROUND_LENGTH * 2, 250]} />
        <meshStandardMaterial map={waterTexture} roughness={0.05} metalness={0.3} color="#0f172a" />
      </mesh>"""
code = code.replace(water_dist_mesh_old, water_dist_mesh_new)

# 4. Improve Tree Branches
branch_update_old = """        // Branch
        const branchLen = d.scale * 2.0;
        const branchOffsetX = Math.cos(d.rot) * 0.4 * d.scale;
        const branchOffsetZ = -Math.sin(d.rot) * 0.4 * d.scale;
        dummy.position.set(d.x + branchOffsetX, d.y + trunkHeight * 0.7, d.z + branchOffsetZ);"""
branch_update_new = """        // Branch
        const branchLen = d.scale * 2.0;
        const branchOffsetX = Math.cos(d.rot) * 0.8 * d.scale; // Push center of branch outwards
        const branchOffsetZ = -Math.sin(d.rot) * 0.8 * d.scale;
        dummy.position.set(d.x + branchOffsetX, d.y + trunkHeight * 0.6, d.z + branchOffsetZ);"""
code = code.replace(branch_update_old, branch_update_new)

# Also make tree leaves flatter (canopy style)
tree_leaves_mesh_old = """      {/* Leaves */}
      <instancedMesh frustumCulled={false} ref={treeLeavesRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[1.2, 10, 10]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} />
      </instancedMesh>"""
tree_leaves_mesh_new = """      {/* Leaves */}
      <instancedMesh frustumCulled={false} ref={treeLeavesRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[1.4, 8, 8]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} />
      </instancedMesh>"""
code = code.replace(tree_leaves_mesh_old, tree_leaves_mesh_new)

tree_leaves_update_old = """        dummy.position.set(d.x, d.y + trunkHeight + d.scale, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale * 2, d.scale * 2, d.scale * 2);"""
tree_leaves_update_new = """        dummy.position.set(d.x, d.y + trunkHeight + d.scale * 0.5, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale * 2.5, d.scale * 1.2, d.scale * 2.5);"""
code = code.replace(tree_leaves_update_old, tree_leaves_update_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

