import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

# 1. Interval to 3.0
code = code.replace("if (time - lastAttack.current > 2.0)", "if (time - lastAttack.current > 3.0)")

# 2. Add rotation to group
code = code.replace("<group ref={innerRef} position={[x, -0.2, -4]}>", "<group ref={innerRef} position={[x, -0.2, -4]} rotation={[0, Math.PI / 2, 0]}>")

# 3. Remove receiveShadow from croc meshes
# We want to remove receiveShadow, but we also want to maybe make the croc color not #b91c1c (red)? Or maybe it's red?
# The user didn't ask to change the color, just remove the shadow.
code = code.replace("castShadow receiveShadow material={crocMaterial}", "castShadow material={crocMaterial}")

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

