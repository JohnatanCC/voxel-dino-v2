import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

code = code.replace("z: -10 - Math.random() * 35", "z: -15 - Math.random() * 40")
code = code.replace("d.z = -10 - Math.random() * 35", "d.z = -15 - Math.random() * 40")
code = code.replace("d.z = -5 - Math.random() * 40", "d.z = -15 - Math.random() * 40")

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

