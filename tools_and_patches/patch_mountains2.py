import re

with open('src/components/environment/Mountains.tsx', 'r') as f:
    code = f.read()

code = code.replace("zOffset = -15", "zOffset = -35")
code = code.replace("zOffset - Math.random() * 20", "zOffset - Math.random() * 15")

with open('src/components/environment/Mountains.tsx', 'w') as f:
    f.write(code)

