import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

code = code.replace("near = 15;\n    far = 50;\n  } else if (scenario === 'forest') {", "near = 5;\n    far = 40;\n  } else if (scenario === 'forest') {")

with open('src/App.tsx', 'w') as f:
    f.write(code)

