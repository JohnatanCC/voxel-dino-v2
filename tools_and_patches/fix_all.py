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

    # In SnowGround.tsx, there's a leftover mountain loop because the original author used dummy instead of dummyTop maybe, or something different.
    code = re.sub(r'    if \(mountainRef\.current[\s\S]*?mountainTopRef\.current\.instanceMatrix\.needsUpdate = true;\n    }\n', '', code)
    
    # Also remove any stray CLOUD_COUNT and CLOUD_LENGTH usages. Sometimes they are in useEffect or generate data blocks.
    # Like cloudsData in Ground, ForestGround, SnowGround, SwampGround
    code = re.sub(r'  // Generate random clouds[\s\S]*?\]\);\n', '', code)
    
    # And there might be some random references to them in useMemo. 
    code = re.sub(r'const cloudsData = useMemo[\s\S]*?\]\);\n', '', code)

    # Clean up CLOUD_COUNT usages that might be in empty arrays or loops
    code = re.sub(r'for \(let i = 0; i < CLOUD_COUNT; i\+\+\) \{[\s\S]*?\}', '', code)
    
    with open(file, 'w') as f:
        f.write(code)

