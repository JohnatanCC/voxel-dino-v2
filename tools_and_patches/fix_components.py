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

    # Remove all lines that contain <instancedMesh and the corresponding closing tags for mountainRef, mountainTopRef, cloudRef
    # The regex must match <instancedMesh ... ref={mountainRef} ...> ... </instancedMesh>
    
    code = re.sub(r'<instancedMesh[^>]*ref=\{mountainRef\}[^>]*>[\s\S]*?<\/instancedMesh>', '', code)
    code = re.sub(r'<instancedMesh[^>]*ref=\{mountainTopRef\}[^>]*>[\s\S]*?<\/instancedMesh>', '', code)
    code = re.sub(r'<instancedMesh[^>]*ref=\{cloudRef\}[^>]*>[\s\S]*?<\/instancedMesh>', '', code)

    # In ForestGround, SnowGround, SwampGround, mountains didn't have parallax. 
    # The new <Mountains /> components I inserted provide parallax.

    with open(file, 'w') as f:
        f.write(code)

