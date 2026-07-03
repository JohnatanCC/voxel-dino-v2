import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

code = code.replace("ctx.fillStyle = '#0f766e'; // Teal water", "ctx.fillStyle = '#2dd4bf'; // Light teal water")
code = code.replace("ctx.fillStyle = Math.random() > 0.5 ? '#115e59' : '#0d9488';", "ctx.fillStyle = Math.random() > 0.5 ? '#5eead4' : '#ccfbf1';")
code = code.replace("color=\"#0f766e\"", "color=\"#2dd4bf\"")
code = code.replace("emissive=\"#0f766e\"", "emissive=\"#2dd4bf\"")

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

