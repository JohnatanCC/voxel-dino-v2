import re

with open('src/components/SnowGround.tsx', 'r') as f:
    code = f.read()

# Remove the mountainRef block
code = re.sub(r'    if \(mountainRef\.current[\s\S]*?if \(mountainTop2Ref\.current\) mountainTop2Ref\.current\.instanceMatrix\.needsUpdate = true;\n    }\n', '', code)

# Remove the mountainData block
code = re.sub(r'  const mountainData = useMemo[\s\S]*?\]\);\n', '', code)

# Remove mountainTop2Ref declaration
code = re.sub(r'  const mountainTop2Ref = useRef.*?;\n', '', code)

# Remove CLOUD_COUNT in SnowGround 
code = re.sub(r'for \(let i = 0; i < CLOUD_COUNT; i\+\+\) \{[\s\S]*?\}', '', code)
code = re.sub(r'  const cloudData = useMemo[\s\S]*?\]\);\n', '', code)

# Check if there is any other error.
with open('src/components/SnowGround.tsx', 'w') as f:
    f.write(code)

