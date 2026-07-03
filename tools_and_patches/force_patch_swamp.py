with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

import re

# Let's just find where CrocodileObstacle starts and where PowerupBox starts.
start_idx = code.find("const CrocodileObstacle =")
end_idx = code.find("const PowerupBox =")

if start_idx != -1 and end_idx != -1:
    old_croc = code[start_idx:end_idx]
    
    puddle_code = """
const CrocodileObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const zPos = useRef(-4);
  const lastAttack = useRef(0);
  
  useImperativeHandle(ref, () => innerRef.current!);
  
  useFrame(({ clock }) => {
    if (innerRef.current) {
       const time = clock.getElapsedTime();
       
       if (time - lastAttack.current > 2.0) {
           zPos.current = 0;
           lastAttack.current = time;
       }
       
       zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05);
       
       innerRef.current.position.y = Math.sin(time * 3) * 0.1 - 0.2;
       innerRef.current.position.z = zPos.current;
    }
  });

  return (
    <group ref={innerRef} position={[x, -0.2, -4]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[3, 0.5, 1]} />
      </mesh>
      <mesh position={[0.5, 0.7, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
      </mesh>
      <mesh position={[-0.5, 0.7, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
      </mesh>
      <mesh position={[2.0, 0.3, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[1.5, 0.3, 0.6]} />
      </mesh>
      <mesh position={[-2.0, 0.45, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[1.2, 0.4, 0.8]} />
      </mesh>
      <mesh position={[-3.0, 0.35, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[1.0, 0.3, 0.7]} />
      </mesh>
      <mesh position={[-1.7, 0.7, 0.3]} material={crocEyeMaterial}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
      </mesh>
      <mesh position={[-1.7, 0.7, -0.3]} material={crocEyeMaterial}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
      </mesh>
      <mesh position={[-1.75, 0.7, 0.4]} material={new THREE.MeshBasicMaterial({color: 'black'})}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
      <mesh position={[-1.75, 0.7, -0.4]} material={new THREE.MeshBasicMaterial({color: 'black'})}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
    </group>
  );
});

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
    code = code[:start_idx] + puddle_code + code[end_idx:]

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

