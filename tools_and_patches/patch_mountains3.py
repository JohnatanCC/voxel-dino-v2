import re

with open('src/components/environment/Mountains.tsx', 'r') as f:
    code = f.read()

replacement_data = """  const mountainsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const scaleY = minScaleY + Math.random() * (maxScaleY - minScaleY);
      const baseScale = 6 + Math.random() * 8; // Make scaleX and scaleZ equal
      data.push({
        x: (Math.random() - 0.5) * length,
        y: scaleY / 2 - 1,
        z: zOffset - Math.random() * 20,
        scaleX: baseScale,
        scaleY: scaleY,
        scaleZ: baseScale,
        rotY: Math.random() * Math.PI / 4 // subtle rotation
      });
    }
    return data;
  }, [count, length, minScaleY, maxScaleY, zOffset]);"""

code = re.sub(r'  const mountainsData = useMemo\(\(\) => \{[\s\S]*?\}, \[count, length, minScaleY, maxScaleY, zOffset\]\);', replacement_data, code)


replacement_update = """      // Base
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(0, d.rotY || 0, 0);
      dummy.scale.set(d.scaleX, d.scaleY, d.scaleZ);
      dummy.updateMatrix();
      mountainRef.current.setMatrixAt(i, dummy.matrix);

      // Top
      const factor = 0.3; // Top 30%
      dummy.position.set(d.x, d.y + (1 - factor) * d.scaleY / 2, d.z);
      dummy.rotation.set(0, d.rotY || 0, 0);
      dummy.scale.set(d.scaleX * factor * 1.05, d.scaleY * factor, d.scaleZ * factor * 1.05);
      dummy.updateMatrix();
      mountainTopRef.current.setMatrixAt(i, dummy.matrix);"""

code = re.sub(r'      \/\/ Base\n      dummy\.position\.set\(d\.x, d\.y, d\.z\);\n      dummy\.scale\.set\(d\.scaleX, d\.scaleY, d\.scaleZ\);\n      dummy\.updateMatrix\(\);\n      mountainRef\.current\.setMatrixAt\(i, dummy\.matrix\);\n\n      \/\/ Top\n      const factor = 0\.3; \/\/ Top 30%\n      dummy\.position\.set\(d\.x, d\.y \+ \(1 - factor\) \* d\.scaleY \/ 2, d\.z\);\n      dummy\.scale\.set\(d\.scaleX \* factor \* 1\.05, d\.scaleY \* factor, d\.scaleZ \* factor \* 1\.05\);\n      dummy\.updateMatrix\(\);\n      mountainTopRef\.current\.setMatrixAt\(i, dummy\.matrix\);', replacement_update, code)

# Let's push the mountains back slightly more to look better
code = code.replace("zOffset = -35", "zOffset = -45")

with open('src/components/environment/Mountains.tsx', 'w') as f:
    f.write(code)

