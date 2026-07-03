with open('src/components/ForestObstacles.tsx', 'r') as f:
    code = f.read()

puddle_code = """
const Puddle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const hitboxRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => hitboxRef.current!);

  useFrame(({ clock }) => {
    if (hitboxRef.current && visualRef.current) {
       visualRef.current.position.x = hitboxRef.current.position.x;
       
       const time = clock.getElapsedTime();
       const croc = visualRef.current.children[1] as THREE.Mesh;
       if (croc) {
          croc.position.y = Math.sin(time * 3) * 0.1 + 0.2;
       }
    }
  });

  return (
    <>
      <group ref={hitboxRef} position={[x, 0, 0]}>
         {/* Invisible Hitbox */}
         <mesh position={[0, 0.5, 0]} visible={false}>
           <boxGeometry args={[4, 1, 4]} />
         </mesh>
      </group>
      
      <group ref={visualRef} position={[x, 0, 0]}>
        {/* Water Plane */}
        <mesh position={[0, 0.05, 0]} receiveShadow material={waterMaterial}>
          <cylinderGeometry args={[2, 2, 0.1, 16]} />
        </mesh>
        
        {/* Croc Head in Forest */}
        <mesh position={[0.5, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.3, 0.4]} />
          <meshStandardMaterial color="#064e3b" roughness={0.8} />
        </mesh>
      </group>
    </>
  );
});

"""

code = code.replace("const PowerupBox =", puddle_code + "const PowerupBox =")

with open('src/components/ForestObstacles.tsx', 'w') as f:
    f.write(code)

