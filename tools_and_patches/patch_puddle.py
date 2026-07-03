import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

puddle_code = """
const PuddleObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
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
         {/* Invisible Hitbox that definitely intersects player */}
         <mesh position={[0, 0.5, 0]} visible={false}>
           <boxGeometry args={[4, 1, 4]} />
         </mesh>
      </group>
      
      <group ref={visualRef} position={[x, -0.49, 0]}>
         <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
           <cylinderGeometry args={[3, 3, 0.1, 16]} />
           <meshStandardMaterial color="#0f766e" transparent opacity={0.8} roughness={0.1} metalness={0.8} />
         </mesh>
      </group>
    </>
  );
});
"""

code = re.sub(r'const PuddleObstacle = forwardRef.*?\}\);', puddle_code, code, flags=re.DOTALL)

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

