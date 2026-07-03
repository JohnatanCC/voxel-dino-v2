import re

with open('src/components/ForestObstacles.tsx', 'r') as f:
    code = f.read()

# Remove EVERYTHING from the first const Puddle up to export const ForestObstacles,
# and insert exactly what we need.

start_idx = code.find("const Puddle = forwardRef")
end_idx = code.find("export const ForestObstacles =")

if start_idx != -1 and end_idx != -1:
    clean_code = """
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

const PowerupBox = forwardRef<THREE.Group, { x: number; y: number; type?: PowerupType }>(({ x, y, type }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  
  useImperativeHandle(ref, () => innerRef.current!);

  useFrame(({ clock }) => {
    if (innerRef.current) {
      const time = clock.getElapsedTime();
      innerRef.current.rotation.y = time * 2;
      innerRef.current.position.y = y + Math.sin(time * 5) * 0.2;
    }
  });

  const isLife = type === 'life';
  const color = isLife ? "#ef4444" : "#fbbf24";

  return (
    <group ref={innerRef} position={[x, y, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      {isLife ? (
        <group position={[0, 0, 0.51]}>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.5, 0.15, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.15, 0.5, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      ) : (
        <group position={[0, 0, 0.51]}>
           <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.4, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0.2, 0.1, 0]}><boxGeometry args={[0.1, 0.2, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.3, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, -0.15, 0]}><boxGeometry args={[0.1, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      )}
      {isLife ? (
        <group position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.5, 0.15, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.15, 0.5, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      ) : (
        <group position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
           <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.4, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0.2, 0.1, 0]}><boxGeometry args={[0.1, 0.2, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, 0, 0]}><boxGeometry args={[0.3, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
           <mesh position={[0, -0.15, 0]}><boxGeometry args={[0.1, 0.1, 0.05]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      )}
    </group>
  );
});

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
    code = code[:start_idx] + clean_code + code[end_idx:]
    with open('src/components/ForestObstacles.tsx', 'w') as f:
        f.write(code)

