import re

with open('src/components/ForestGround.tsx', 'r') as f:
    code = f.read()

code = code.replace("z: -8 - Math.random() * 35", "z: -15 - Math.random() * 40")
code = code.replace("d.z = -3 - Math.random() * 25", "d.z = -15 - Math.random() * 40") # Wait, is it this? let me check

with open('src/components/ForestGround.tsx', 'w') as f:
    f.write(code)

