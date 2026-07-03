import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

code = code.replace('zOffset={-85}', 'zOffset={-70}')
code = code.replace('zOffset={-125}', 'zOffset={-100}')

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

