import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

replacement = """  // Apply density multipliers
  if (density === 'off') {
    near = 1000;
    far = 2000;
  } else if (density === 'minimum') {
    near *= 2.5;
    far *= 2.5;
  } else if (density === 'low') {
    near *= 1.5;
    far *= 1.5;
  } else if (density === 'high') {
    near *= 0.5;
    far *= 0.6;
  }"""

code = re.sub(r'  // Apply density multipliers\n  if \(density === \'low\'\) \{\n    near \*= 1\.5;\n    far \*= 1\.5;\n  \} else if \(density === \'high\'\) \{\n    near \*= 0\.5;\n    far \*= 0\.6;\n  \}', replacement, code)

with open('src/App.tsx', 'w') as f:
    f.write(code)

