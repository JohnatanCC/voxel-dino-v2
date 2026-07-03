import re

with open('src/components/environment/Mountains.tsx', 'r') as f:
    code = f.read()

replacement = """      // Top
      const factor = 0.3; // Top 30%
      dummy.position.set(d.x, d.y + (1 - factor) * d.scaleY / 2, d.z);
      dummy.scale.set(d.scaleX * factor * 1.05, d.scaleY * factor, d.scaleZ * factor * 1.05);
      dummy.updateMatrix();
      mountainTopRef.current.setMatrixAt(i, dummy.matrix);"""

code = re.sub(r'      \/\/ Top\n      dummy\.position\.set\(d\.x, d\.y \+ d\.scaleY \/ 2 \+ 0\.1, d\.z\);\n      dummy\.scale\.set\(d\.scaleX \* 0\.4, 0\.2, d\.scaleZ \* 0\.4\);\n      dummy\.updateMatrix\(\);\n      mountainTopRef\.current\.setMatrixAt\(i, dummy\.matrix\);', replacement, code)

with open('src/components/environment/Mountains.tsx', 'w') as f:
    f.write(code)

