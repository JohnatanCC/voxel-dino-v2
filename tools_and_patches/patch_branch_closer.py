import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

code = code.replace("const branchOffsetX = Math.cos(d.rot) * 0.8 * d.scale; // Push center of branch outwards", "const branchOffsetX = Math.cos(d.rot) * 0.2 * d.scale;")
code = code.replace("const branchOffsetZ = -Math.sin(d.rot) * 0.8 * d.scale;", "const branchOffsetZ = -Math.sin(d.rot) * 0.2 * d.scale;")

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

