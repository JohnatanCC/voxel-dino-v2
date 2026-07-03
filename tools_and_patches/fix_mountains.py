import re

files = [
    'src/components/ForestGround.tsx',
    'src/components/SnowGround.tsx',
    'src/components/SwampGround.tsx'
]

for file in files:
    with open(file, 'r') as f:
        code = f.read()

    # Match the entire mountainsData block correctly
    code = re.sub(r'  const mountainsData = useMemo\(\(\) => \{[\s\S]*?return data;\n  \}, \[\]\);\n', '', code)
    
    with open(file, 'w') as f:
        f.write(code)

