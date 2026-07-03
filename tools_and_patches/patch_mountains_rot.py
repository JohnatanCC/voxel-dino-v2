import re

with open('src/components/environment/Mountains.tsx', 'r') as f:
    code = f.read()

code = code.replace("rotY: Math.random() * Math.PI / 4 // subtle rotation", "rotY: Math.PI / 4 // face camera directly")

with open('src/components/environment/Mountains.tsx', 'w') as f:
    f.write(code)

