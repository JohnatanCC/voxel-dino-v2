import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

replacement = """
       if (state.current.phase === 'waiting') {
           // distance to player
           if (innerRef.current.position.x < 10 && innerRef.current.position.x > 0) {
               state.current.phase = 'attacking';
               state.current.timer = 0;
           }
           zPos.current = THREE.MathUtils.lerp(zPos.current, -4, 0.05);
       } else if (state.current.phase === 'attacking') {
           zPos.current = THREE.MathUtils.lerp(zPos.current, 0, 0.2); // lunge forward fast
           if (innerRef.current.position.x < -2) { // retreat after passing player
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
"""

# We need to replace the logic inside the useFrame
code = re.sub(
    r"if \(state\.current\.phase === 'waiting'\) \{.*?(?=innerRef\.current\.position\.y = )",
    replacement.strip() + "\n       ",
    code,
    flags=re.DOTALL
)

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

