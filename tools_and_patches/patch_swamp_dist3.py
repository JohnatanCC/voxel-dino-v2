import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

code = code.replace("z: -15 - Math.random() * 40", "z: -25 - Math.random() * 45")
code = code.replace("d.z = -15 - Math.random() * 40", "d.z = -25 - Math.random() * 45")

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

