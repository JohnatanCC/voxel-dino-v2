import re

with open('src/components/SnowGround.tsx', 'r') as f:
    code = f.read()

# Remove the mountainTop2Ref JSX
code = re.sub(r'            \{\/\* Mountain Tops \*\/\}\n            <instancedMesh[^>]*ref=\{mountainTop2Ref\}[^>]*>[\s\S]*?<\/instancedMesh>\n', '', code)

with open('src/components/SnowGround.tsx', 'w') as f:
    f.write(code)

