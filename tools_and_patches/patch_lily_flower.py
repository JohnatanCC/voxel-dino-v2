import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

# Add flower ref
code = code.replace("const lilyPadRimRef = useRef<THREE.InstancedMesh>(null);", "const lilyPadRimRef = useRef<THREE.InstancedMesh>(null);\n  const lilyPadFlowerRef = useRef<THREE.InstancedMesh>(null);")

# Update update loop to include flower
lily_update_old = """      // Rim
        dummy.position.set(d.x, d.y + 0.05, d.z);
        dummy.scale.set(d.scale * 1.01, 0.1, d.scale * 1.01);
        dummy.updateMatrix();
        lilyPadRimRef.current.setMatrixAt(i, dummy.matrix);
      }
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
      lilyPadRimRef.current.instanceMatrix.needsUpdate = true;
    }"""

lily_update_new = """      // Rim
        dummy.position.set(d.x, d.y + 0.05, d.z);
        dummy.scale.set(d.scale * 1.01, 0.1, d.scale * 1.01);
        dummy.updateMatrix();
        lilyPadRimRef.current.setMatrixAt(i, dummy.matrix);
        
        // Flower (only on some)
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

code = code.replace(lily_update_old, lily_update_new)

# Add flower mesh
lily_mesh_old = """      <instancedMesh frustumCulled={false} ref={lilyPadRimRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshStandardMaterial color="#047857" roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>"""

lily_mesh_new = """      <instancedMesh frustumCulled={false} ref={lilyPadRimRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 16, 1, true]} />
        <meshStandardMaterial color="#047857" roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={lilyPadFlowerRef} args={[undefined, undefined, LILY_PAD_COUNT]} receiveShadow>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#fdf2f8" roughness={0.5} />
      </instancedMesh>"""
      
code = code.replace(lily_mesh_old, lily_mesh_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)
