import re

with open('src/components/UI.tsx', 'r') as f:
    code = f.read()

replacement = """                  FOG: {fogSettings[scenario] === 'off' ? 'OFF' : fogSettings[scenario] === 'minimum' ? 'MIN' : fogSettings[scenario]}"""

code = re.sub(r'                  FOG: \{fogSettings\[scenario\]\}', replacement, code)

with open('src/components/UI.tsx', 'w') as f:
    f.write(code)

