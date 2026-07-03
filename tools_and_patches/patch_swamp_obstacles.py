import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

puddle_code = """
const CrocodileObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const zPos = useRef(-4);
  const lastAttack = useRef(0);
  
  useImperativeHandle(ref, () => innerRef.current!);
  
  useFrame(({ clock }) => {
    if (innerRef.current) {
       const time = clock.getElapsedTime();
       
       // Attack logic
       if (time - lastAttack.current > 2.0) {
           zPos.current = 0; // jump forward
           lastAttack.current = time;
       }
       
       // Recede back
       zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05);
       
       innerRef.current.position.y = Math.sin(time * 3) * 0.1 - 0.2;
       innerRef.current.position.z = zPos.current;
    }
  });

  return (
    <group ref={innerRef} position={[x, -0.2, -4]}>
      {/* Improved Crocodile Model */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[3, 0.5, 1]} />
      </mesh>
      {/* Scales/Spikes */}
      <mesh position={[0.5, 0.7, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
      </mesh>
      <mesh position={[-0.5, 0.7, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
      </mesh>
      {/* Tail */}
      <mesh position={[2.0, 0.3, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[1.5, 0.3, 0.6]} />
      </mesh>
      {/* Head */}
      <mesh position={[-2.0, 0.45, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[1.2, 0.4, 0.8]} />
      </mesh>
      {/* Snout */}
      <mesh position={[-3.0, 0.35, 0]} castShadow receiveShadow material={crocMaterial}>
        <boxGeometry args={[1.0, 0.3, 0.7]} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-1.7, 0.7, 0.3]} material={crocEyeMaterial}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
      </mesh>
      <mesh position={[-1.7, 0.7, -0.3]} material={crocEyeMaterial}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
      </mesh>
      {/* Pupil */}
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
  const innerRef = useRef<THREE.Group>(null);
  useImperativeHandle(ref, () => innerRef.current!);
  
  return (
    <group ref={innerRef} position={[x, -0.49, 0]}>
       <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
         <cylinderGeometry args={[2.5, 2.5, 0.1, 16]} />
         <meshStandardMaterial color="#0f766e" transparent opacity={0.8} roughness={0.1} metalness={0.8} />
       </mesh>
    </group>
  );
});
"""

# Replace the CrocodileObstacle
code = re.sub(r'const CrocodileObstacle = forwardRef.*?\}\);', puddle_code, code, flags=re.DOTALL)

push_code = """
        const gap = minGap + Math.random() * (useGameStore.getState().getCurrentSpeed() * 1.0);
        const newObsX = SPAWN_DISTANCE + gap;
        
        const newObs = generateObstacle(newObsX);
        if (newObs.type === 'puddle') {
            // Spawn both puddle and croc
            filtered.push(newObs);
            filtered.push({
                id: idCounter.current++,
                type: 'croc',
                x: newObsX + 2, // Croc is slightly behind the puddle center
                y: 0,
                ref: { current: null }
            });
        } else {
            filtered.push(newObs);
        }
        
        nextSpawnX.current = newObsX;
"""

code = code.replace("""        const gap = minGap + Math.random() * (useGameStore.getState().getCurrentSpeed() * 1.0);
        const newObsX = SPAWN_DISTANCE + gap;
        filtered.push(generateObstacle(newObsX));
        nextSpawnX.current = newObsX;""", push_code)


render_puddle_code = """
        if (obs.type === 'puddle') {
           return <PuddleObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'croc') {
           return <CrocodileObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
"""
code = code.replace("""        if (obs.type === 'puddle') {
           return <CrocodileObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }""", render_puddle_code)

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

