import re

with open('src/components/ForestGround.tsx', 'r') as f:
    code = f.read()

# 1. Update tree data Z position
code = code.replace("z: -3 - Math.random() * 25", "z: -8 - Math.random() * 35")

# 2. Update grass count for better coverage
code = code.replace("const GRASS_COUNT = 300;", "const GRASS_COUNT = 600;")

# 3. Update grass scale
code = code.replace("scale: Math.random() * 0.4 + 0.3", "scale: Math.random() * 0.5 + 0.2")

# 4. Update grass z
code = code.replace("z: -5 - (Math.random() * 20)", "z: -3 - (Math.random() * 30)")
code = code.replace("d.z = -5 - (Math.random() * 20)", "d.z = -3 - (Math.random() * 30)")

# 5. Make grass look more natural with cylinder geometry
code = code.replace("<boxGeometry args={[0.15, 0.5, 0.15]} />", "<cylinderGeometry args={[0.02, 0.1, 0.6, 3]} />")

# 6. Make trunks cylindrical and leaves spherical
code = code.replace("""<instancedMesh frustumCulled={false} ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={trunkTexture} roughness={0.9} />
      </instancedMesh>""", """<instancedMesh frustumCulled={false} ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <cylinderGeometry args={[0.4, 0.6, 1, 8]} />
        <meshStandardMaterial map={trunkTexture} roughness={0.9} />
      </instancedMesh>""")

code = code.replace("""<instancedMesh frustumCulled={false} ref={treeLeaves1Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={leavesTexture} roughness={0.9} />
      </instancedMesh>""", """<instancedMesh frustumCulled={false} ref={treeLeaves1Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial map={leavesTexture} roughness={0.9} />
      </instancedMesh>""")

code = code.replace("""<instancedMesh frustumCulled={false} ref={treeLeaves2Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={leavesTexture} roughness={0.9} />
      </instancedMesh>""", """<instancedMesh frustumCulled={false} ref={treeLeaves2Ref} args={[undefined, undefined, TREE_COUNT]} receiveShadow castShadow>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial map={leavesTexture} roughness={0.9} />
      </instancedMesh>""")


# 7. Add Mountains
mountains_code = """
      <Mountains baseColor="#064e3b" topColor="#065f46" count={40} zOffset={-45} speedFactor={0.15} />
      <Mountains baseColor="#022c22" topColor="#064e3b" count={25} zOffset={-70} speedFactor={0.08} minScaleY={10} maxScaleY={25} />
      <Mountains baseColor="#14532d" topColor="#166534" count={20} zOffset={-25} speedFactor={0.25} minScaleY={2} maxScaleY={6} />
"""
code = code.replace("</group>", mountains_code + "\n    </group>")

with open('src/components/ForestGround.tsx', 'w') as f:
    f.write(code)
