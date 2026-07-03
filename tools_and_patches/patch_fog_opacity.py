import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

code = code.replace("opacity={0.15}", "opacity={0.4}")
code = code.replace("color=\"#94a3b8\"", "color=\"#cbd5e1\"")

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

