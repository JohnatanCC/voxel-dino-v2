import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

tree_leaves_update_old = """          dummy.position.set(d.x, d.y + trunkHeight + d.scale, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(d.scale * 2.0, d.scale * 2.0, d.scale * 2.0);"""
tree_leaves_update_new = """          dummy.position.set(d.x, d.y + trunkHeight + d.scale * 0.5, d.z);
          dummy.rotation.set(0, d.rot, 0);
          dummy.scale.set(d.scale * 2.5, d.scale * 1.2, d.scale * 2.5);"""
code = code.replace(tree_leaves_update_old, tree_leaves_update_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

