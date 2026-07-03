import re

with open('src/components/environment/Mountains.tsx', 'r') as f:
    code = f.read()

replacement_data = """  const mountainsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const scaleY = minScaleY + Math.random() * (maxScaleY - minScaleY);
      const baseScale = scaleY * (0.8 + Math.random() * 0.6); // Scale width proportionally to height
      data.push({
        x: (Math.random() - 0.5) * length,
        y: scaleY / 2 - 1,
        z: zOffset - Math.random() * 15,
        scaleX: baseScale,
        scaleY: scaleY,
        scaleZ: baseScale,
        rotY: Math.PI / 4 // face camera directly
      });
    }
    return data;
  }, [count, length, minScaleY, maxScaleY, zOffset]);"""

code = re.sub(r'  const mountainsData = useMemo\(\(\) => \{[\s\S]*?\}, \[count, length, minScaleY, maxScaleY, zOffset\]\);', replacement_data, code)

with open('src/components/environment/Mountains.tsx', 'w') as f:
    f.write(code)

