import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

# 1. Add MangroveTrees import
code = code.replace("import { Mountains } from './environment/Mountains';", "import { MangroveTrees } from './environment/MangroveTrees';")

# 2. Add roots for existing trees in SwampGround
# First, refs
code = code.replace("const treeTrunkRef = useRef<THREE.InstancedMesh>(null);", "const treeTrunkRef = useRef<THREE.InstancedMesh>(null);\\n  const treeRoot1Ref = useRef<THREE.InstancedMesh>(null);\\n  const treeRoot2Ref = useRef<THREE.InstancedMesh>(null);\\n  const treeRoot3Ref = useRef<THREE.InstancedMesh>(null);")

# Update tree movement logic
tree_update_old = """    if (treeTrunkRef.current && treeBranchRef.current && treeVineRef.current && treeLeavesRef.current) {
      const treeMoveDistance = moveDistance;
      const dummy = new THREE.Object3D();
      for (let i = 0; i < TREE_COUNT; i++) {
        const d = treeData[i];
        d.x -= treeMoveDistance;
        if (d.x < -BACKGROUND_LENGTH / 2) {
          d.x += BACKGROUND_LENGTH;
          d.z = -5 - Math.random() * 30;
          d.rot = Math.random() * Math.PI * 2;
          d.scale = 0.8 + Math.random() * 1.5;
          d.hasVine = Math.random() > 0.2;
          d.hasLeaves = Math.random() > 0.5;
        }
        
        // Trunk
        const trunkHeight = d.scale * 5.0;
        dummy.position.set(d.x, d.y + trunkHeight / 2, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale, trunkHeight, d.scale);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);
        
        // Branch
        const branchLen = d.scale * 2.0;
        const branchOffsetX = Math.cos(d.rot) * 0.4 * d.scale;
        const branchOffsetZ = -Math.sin(d.rot) * 0.4 * d.scale;
        dummy.position.set(d.x + branchOffsetX, d.y + trunkHeight * 0.7, d.z + branchOffsetZ);
        dummy.rotation.set(0, d.rot, -Math.PI / 4);
        dummy.scale.set(d.scale, branchLen, d.scale);
        dummy.updateMatrix();
        treeBranchRef.current.setMatrixAt(i, dummy.matrix);

        // Vine
        if (d.hasVine) {
          const vineLen = d.scale * 2.5;
          const tipX = branchOffsetX + Math.cos(d.rot) * branchLen * 0.35;
          const tipZ = branchOffsetZ - Math.sin(d.rot) * branchLen * 0.35;
          const tipY = d.y + trunkHeight * 0.7 + branchLen * 0.35;
          dummy.position.set(d.x + tipX, tipY - vineLen * 0.5, d.z + tipZ);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(d.scale, vineLen, d.scale);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        treeVineRef.current.setMatrixAt(i, dummy.matrix);

        // Leaves
        if (d.hasLeaves) {
          dummy.position.set(d.x, d.y + trunkHeight + d.scale, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(d.scale * 2.5, d.scale * 2.5, d.scale * 2.5);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        treeLeavesRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeBranchRef.current.instanceMatrix.needsUpdate = true;
      treeVineRef.current.instanceMatrix.needsUpdate = true;
      treeLeavesRef.current.instanceMatrix.needsUpdate = true;
    }"""

tree_update_new = """    if (treeTrunkRef.current && treeBranchRef.current && treeVineRef.current && treeLeavesRef.current && treeRoot1Ref.current) {
      const treeMoveDistance = moveDistance;
      const dummy = new THREE.Object3D();
      for (let i = 0; i < TREE_COUNT; i++) {
        const d = treeData[i];
        d.x -= treeMoveDistance;
        if (d.x < -BACKGROUND_LENGTH / 2) {
          d.x += BACKGROUND_LENGTH;
          d.z = -5 - Math.random() * 40;
          d.rot = Math.random() * Math.PI * 2;
          d.scale = 0.8 + Math.random() * 1.5;
          d.hasVine = Math.random() > 0.2;
          d.hasLeaves = Math.random() > 0.5;
        }
        
        // Trunk
        const trunkHeight = d.scale * 5.0;
        dummy.position.set(d.x, d.y + trunkHeight / 2, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale, trunkHeight, d.scale);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);
        
        // Roots
        const rootSpread = d.scale * 1.5;
        const rootHeight = d.scale * 3.0;
        const rootThickness = d.scale * 0.3;
        
        dummy.position.set(d.x + rootSpread, d.y + rootHeight/2 - 1, d.z);
        dummy.rotation.set(0, d.rot, Math.PI / 6);
        dummy.scale.set(rootThickness, rootHeight, rootThickness);
        dummy.updateMatrix();
        treeRoot1Ref.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(d.x - rootSpread, d.y + rootHeight/2 - 1, d.z);
        dummy.rotation.set(0, d.rot, -Math.PI / 6);
        dummy.scale.set(rootThickness, rootHeight, rootThickness);
        dummy.updateMatrix();
        treeRoot2Ref.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(d.x, d.y + rootHeight/2 - 1, d.z + rootSpread);
        dummy.rotation.set(-Math.PI / 6, d.rot, 0);
        dummy.scale.set(rootThickness, rootHeight, rootThickness);
        dummy.updateMatrix();
        treeRoot3Ref.current.setMatrixAt(i, dummy.matrix);

        // Branch
        const branchLen = d.scale * 2.0;
        const branchOffsetX = Math.cos(d.rot) * 0.4 * d.scale;
        const branchOffsetZ = -Math.sin(d.rot) * 0.4 * d.scale;
        dummy.position.set(d.x + branchOffsetX, d.y + trunkHeight * 0.7, d.z + branchOffsetZ);
        dummy.rotation.set(0, d.rot, -Math.PI / 4);
        dummy.scale.set(d.scale, branchLen, d.scale);
        dummy.updateMatrix();
        treeBranchRef.current.setMatrixAt(i, dummy.matrix);

        // Vine
        if (d.hasVine) {
          const vineLen = d.scale * 2.5;
          const tipX = branchOffsetX + Math.cos(d.rot) * branchLen * 0.35;
          const tipZ = branchOffsetZ - Math.sin(d.rot) * branchLen * 0.35;
          const tipY = d.y + trunkHeight * 0.7 + branchLen * 0.35;
          dummy.position.set(d.x + tipX, tipY - vineLen * 0.5, d.z + tipZ);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(d.scale, vineLen, d.scale);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        treeVineRef.current.setMatrixAt(i, dummy.matrix);

        // Leaves (spherical)
        if (d.hasLeaves) {
          dummy.position.set(d.x, d.y + trunkHeight + d.scale, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(d.scale * 2.0, d.scale * 2.0, d.scale * 2.0);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        treeLeavesRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeRoot1Ref.current.instanceMatrix.needsUpdate = true;
      treeRoot2Ref.current.instanceMatrix.needsUpdate = true;
      treeRoot3Ref.current.instanceMatrix.needsUpdate = true;
      treeBranchRef.current.instanceMatrix.needsUpdate = true;
      treeVineRef.current.instanceMatrix.needsUpdate = true;
      treeLeavesRef.current.instanceMatrix.needsUpdate = true;
    }"""
    
code = code.replace(tree_update_old, tree_update_new)

# 3. Add mesh components
tree_meshes_old = """      {/* Trees */}
      <instancedMesh frustumCulled={false} ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.3, 0.6, 1, 6]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeBranchRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.1, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      
      {/* Leaves */}
      <instancedMesh frustumCulled={false} ref={treeLeavesRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={mossTexture} roughness={0.9} />
      </instancedMesh>"""

tree_meshes_new = """      {/* Trees */}
      <instancedMesh frustumCulled={false} ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.3, 0.6, 1, 6]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      
      {/* Roots */}
      <instancedMesh frustumCulled={false} ref={treeRoot1Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeRoot2Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={treeRoot3Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>

      <instancedMesh frustumCulled={false} ref={treeBranchRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.1, 0.2, 1, 5]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </instancedMesh>
      
      {/* Leaves */}
      <instancedMesh frustumCulled={false} ref={treeLeavesRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[1.2, 10, 10]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} />
      </instancedMesh>"""

code = code.replace(tree_meshes_old, tree_meshes_new)

# 4. Add parallax mangrove trees at the end
mangrove_trees_code = """
      {/* Parallax Mangrove Trees Layer */}
      <MangroveTrees count={35} zOffset={-35} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={45} zOffset={-55} speedFactor={0.15} scaleMult={2.5} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={55} zOffset={-85} speedFactor={0.05} scaleMult={4.0} trunkColor="#1c1917" leavesColor="#020617" />
    </group>
"""
code = code.replace("    </group>", mangrove_trees_code)

# 5. Fix initial Z position for treeData so it's further back
code = code.replace("z: -5 - Math.random() * 30,", "z: -10 - Math.random() * 35,")

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

