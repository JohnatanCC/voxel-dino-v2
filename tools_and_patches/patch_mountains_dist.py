import re

with open('src/components/ForestGround.tsx', 'r') as f:
    code = f.read()

replacement = """      <Mountains baseColor="#064e3b" topColor="#065f46" count={40} zOffset={-75} speedFactor={0.15} />
      <Mountains baseColor="#022c22" topColor="#064e3b" count={25} zOffset={-100} speedFactor={0.08} minScaleY={10} maxScaleY={25} />
      <Mountains baseColor="#14532d" topColor="#166534" count={20} zOffset={-55} speedFactor={0.25} minScaleY={2} maxScaleY={6} />"""

code = re.sub(r'      <Mountains baseColor="#064e3b".*?>\n      <Mountains baseColor="#022c22".*?>\n      <Mountains baseColor="#14532d".*?>', replacement, code, flags=re.DOTALL)

with open('src/components/ForestGround.tsx', 'w') as f:
    f.write(code)

