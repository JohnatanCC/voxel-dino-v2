import re

with open('src/components/ForestGround.tsx', 'r') as f:
    code = f.read()

replacement = """      {/* Front Mountains */}
      <Mountains baseColor="#14532d" topColor="#166534" count={25} length={200} zOffset={-55} speedFactor={0.25} minScaleY={3} maxScaleY={8} />
      {/* Middle Mountains */}
      <Mountains baseColor="#064e3b" topColor="#065f46" count={50} length={300} zOffset={-80} speedFactor={0.15} minScaleY={8} maxScaleY={16} />
      {/* Back Mountains */}
      <Mountains baseColor="#022c22" topColor="#064e3b" count={40} length={400} zOffset={-120} speedFactor={0.08} minScaleY={20} maxScaleY={45} />"""

code = re.sub(r'      <Mountains baseColor="#064e3b".*?>\n      <Mountains baseColor="#022c22".*?>\n      <Mountains baseColor="#14532d".*?>', replacement, code, flags=re.DOTALL)

with open('src/components/ForestGround.tsx', 'w') as f:
    f.write(code)

