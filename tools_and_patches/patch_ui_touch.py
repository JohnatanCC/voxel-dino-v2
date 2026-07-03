import re

with open('src/components/UI.tsx', 'r') as f:
    code = f.read()

replacement = """      {/* Invisible Touch Areas for Mobile Controls */}
      {status === 'playing' && !devMode && ("""

code = code.replace("""      {/* Invisible Touch Areas for Mobile Controls */}
      {status === 'playing' && (""", replacement)

with open('src/components/UI.tsx', 'w') as f:
    f.write(code)

