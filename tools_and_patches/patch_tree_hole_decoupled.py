import re

with open('src/components/ForestObstacles.tsx', 'r') as f:
    code = f.read()

tree_hole_code = """
const TreeHoleObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const hitboxRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => hitboxRef.current!);

  useFrame(() => {
    if (hitboxRef.current && visualRef.current) {
       visualRef.current.position.x = hitboxRef.current.position.x;
    }
  });
  
  return (
    <>
      <group ref={hitboxRef} position={[x, 0, 0]}>
        {/* Hitbox at the top */}
        <mesh position={[0, 4.5, 0]} visible={false}>
           <boxGeometry args={[1.5, 6, 2]} />
        </mesh>
      </group>
      
      <group ref={visualRef} position={[x, 0, 0]}>
        {/* Canopy / Arch connecting */}
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
           <boxGeometry args={[5, 4, 2]} />
           <meshStandardMaterial color="#3f2715" roughness={0.9} />
        </mesh>
        <mesh position={[0, 7, 0]} castShadow receiveShadow>
           <sphereGeometry args={[4, 8, 8]} />
           <meshStandardMaterial color="#16a34a" roughness={0.9} />
        </mesh>
        
        {/* Roots / side trunks */}
        <mesh position={[2, 1.5, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.6, 1.2, 3, 5]} />
           <meshStandardMaterial color="#3f2715" roughness={0.9} />
        </mesh>
        <mesh position={[-2, 1.5, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.6, 1.2, 3, 5]} />
           <meshStandardMaterial color="#3f2715" roughness={0.9} />
        </mesh>
      </group>
    </>
  );
});
"""

# replace the old TreeHoleObstacle definition
code = re.sub(r'const TreeHoleObstacle = forwardRef.*?\}\);', tree_hole_code, code, flags=re.DOTALL)

with open('src/components/ForestObstacles.tsx', 'w') as f:
    f.write(code)

