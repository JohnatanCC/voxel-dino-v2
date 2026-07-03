import re

files = [
    'src/components/Ground.tsx',
    'src/components/ForestGround.tsx',
    'src/components/SnowGround.tsx',
    'src/components/SwampGround.tsx'
]

for file in files:
    with open(file, 'r') as f:
        code = f.read()

    # Fix the broken cloudData block
    code = re.sub(r'  const cloudData = useMemo\(\(\) => \{\n    const data = \[\];\n    \);\n    \}\n    return data;\n  \}, \[\]\);\n', '', code)
    code = re.sub(r'  const cloudData = useMemo\(\(\) => \{\n    const data = \[\];\n    return data;\n  \}, \[\]\);\n', '', code)
    
    # Fix broken end of files if any (like 281, 1 error)
    # The mountain loop replacement might have broken curly braces at the end of useFrame
    # Let's just restore them fully from memory or fix the braces.
    
    with open(file, 'w') as f:
        f.write(code)

