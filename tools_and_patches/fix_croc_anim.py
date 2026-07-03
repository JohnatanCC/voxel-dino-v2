import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

replacement = """
const CrocodileObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  
  const state = useRef({
     phase: 'idle',
     timer: 0
  });

  const zPos = useRef(-4);

  useImperativeHandle(ref, () => innerRef.current!);
  
  useFrame(({ clock }, delta) => {
    if (innerRef.current) {
       const time = clock.getElapsedTime();
       
       state.current.timer += delta;
       
       if (state.current.phase === 'idle') {
           if (state.current.timer > 3.0) { // 3 seconds idle
               state.current.phase = 'attacking';
               state.current.timer = 0;
           }
           zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05); // retreat slowly
       } else if (state.current.phase === 'attacking') {
           zPos.current = THREE.MathUtils.lerp(zPos.current, 0, 0.15); // lunge forward fast
           if (state.current.timer > 2.0) { // stay attacking for 2 seconds
               state.current.phase = 'retreating';
               state.current.timer = 0;
           }
       } else if (state.current.phase === 'retreating') {
           zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05); // retreat slowly
           if (state.current.timer > 1.0) {
               state.current.phase = 'idle';
               state.current.timer = 0;
           }
       }
       
       innerRef.current.position.y = Math.sin(time * 2) * 0.1 - 0.2;
       innerRef.current.position.z = zPos.current;
       
       // Animations
       if (tailRef.current) {
           tailRef.current.rotation.y = Math.sin(time * (state.current.phase === 'attacking' ? 15 : 3)) * 0.15;
       }
       
       if (jawRef.current) {
           if (state.current.phase === 'attacking') {
               // Biting animation
               jawRef.current.rotation.z = Math.abs(Math.sin(time * 15)) * 0.4;
           } else {
               jawRef.current.rotation.z = 0;
           }
       }
    }
  });

  return (
    <group ref={innerRef} position={[x, -0.2, -4]} rotation={[0, Math.PI / 2, 0]}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]} castShadow material={crocMaterial}>
        <boxGeometry args={[3, 0.5, 1]} />
      </mesh>
      {/* Spikes */}
      <mesh position={[0.5, 0.7, 0]} castShadow material={crocMaterial}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
      </mesh>
      <mesh position={[-0.5, 0.7, 0]} castShadow material={crocMaterial}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
      </mesh>
      
      {/* Tail Group */}
      <group position={[1.5, 0.3, 0]} ref={tailRef}>
          <mesh position={[0.75, 0, 0]} castShadow material={crocMaterial}>
            <boxGeometry args={[1.5, 0.3, 0.6]} />
          </mesh>
      </group>

      {/* Head Base */}
      <mesh position={[-2.0, 0.45, 0]} castShadow material={crocMaterial}>
        <boxGeometry args={[1.2, 0.4, 0.8]} />
      </mesh>
      
      {/* Upper Snout */}
      <mesh position={[-3.0, 0.45, 0]} castShadow material={crocMaterial}>
        <boxGeometry args={[1.0, 0.2, 0.7]} />
      </mesh>
      
      {/* Lower Jaw (articulated) */}
      <group position={[-2.5, 0.35, 0]} ref={jawRef}>
          <mesh position={[-0.5, -0.1, 0]} castShadow material={crocMaterial}>
            <boxGeometry args={[1.0, 0.15, 0.6]} />
          </mesh>
      </group>

      {/* Eyes */}
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
"""

code = re.sub(
    r'const CrocodileObstacle = forwardRef.*?\}\);\n\}\);',
    replacement.strip() + '\n',
    code,
    flags=re.DOTALL
)

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

