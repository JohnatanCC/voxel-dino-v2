import re

with open('src/components/environment/MangroveTrees.tsx', 'r') as f:
    code = f.read()

code = code.replace("export interface MangroveTreesProps {", "export interface MangroveTreesProps {\n  zSpread?: number;")
code = code.replace("  leavesColor = \"#064e3b\"", "  leavesColor = \"#064e3b\",\n  zSpread = 20")
code = code.replace("zOffset - Math.random() * 20", "zOffset - Math.random() * zSpread")
code = code.replace("[count, length, zOffset, scaleMult]", "[count, length, zOffset, scaleMult, zSpread]")

with open('src/components/environment/MangroveTrees.tsx', 'w') as f:
    f.write(code)

