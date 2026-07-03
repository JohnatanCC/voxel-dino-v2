import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

replacement = """
const CrocodileObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  
  const state = useRef({
     phase: 'waiting',
     timer: 0
  });

  const zPos = useRef(-4);

  useImperativeHandle(ref, () => innerRef.current!);
  
  useFrame(({ clock }, delta) => {
    if (innerRef.current) {
       const time = clock.getElapsedTime();
       
       if (state.current.phase !== 'waiting') {
           state.current.timer += delta;
       }
       
       if (state.current.phase === 'waiting') {
           // distance to player
           if (innerRef.current.position.x < 15 && innerRef.current.position.x > 0) {
               state.current.phase = 'attacking';
               state.current.timer = 0;
           }
           zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05);
       } else if (state.current.phase === 'attacking') {
           zPos.current = THREE.MathUtils.lerp(zPos.current, 0, 0.2); // lunge forward fast
           if (state.current.timer > 2.0) { // stay in place for 2 seconds
               state.current.phase = 'retreating';
               state.current.timer = 0;
           }
       } else if (state.current.phase === 'retreating') {
           zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05); // retreat slowly
           if (state.current.timer > 1.0) {
               state.current.phase = 'waiting';
               state.current.timer = 0;
           }
       }
       
       innerRef.current.position.y = Math.sin(time * 2) * 0.1 - 0.2;
       innerRef.current.position.z = zPos.current;
       
       if (tailRef.current) {
           tailRef.current.rotation.y = Math.sin(time * (state.current.phase === 'attacking' ? 15 : 3)) * 0.15;
       }
       
       if (jawRef.current) {
           if (state.current.phase === 'attacking' && zPos.current > -1) {
               // Biting animation only when close
               jawRef.current.rotation.z = Math.abs(Math.sin(time * 15)) * 0.4;
           } else {
               jawRef.current.rotation.z = 0;
           }
       }
    }
  });

  return (
    <group ref={innerRef} position={[x, -0.2, -4]} rotation={[0, Math.PI / 2, 0]}>
"""

code = re.sub(
    r'const CrocodileObstacle = forwardRef.*?return \(\n    <group ref=\{innerRef\} position=\{\[x, -0\.2, -4\]\} rotation=\{\[0, Math\.PI / 2, 0\]\}>',
    replacement.strip(),
    code,
    flags=re.DOTALL
)

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

