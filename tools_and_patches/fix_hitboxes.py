import re

# Fix Forest Puddle
with open('src/components/ForestObstacles.tsx', 'r') as f:
    code = f.read()
code = code.replace("<mesh position={[0, 0.5, 0]} visible={false}>\n           <boxGeometry args={[4, 1, 4]} />", "<mesh position={[0, 1.5, 0]} visible={false}>\n           <boxGeometry args={[4, 3, 4]} />")
with open('src/components/ForestObstacles.tsx', 'w') as f:
    f.write(code)

# Fix Swamp Puddle
with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()
code = code.replace("<mesh position={[0, 0.5, 0]} visible={false}>\n           <boxGeometry args={[4, 1, 4]} />", "<mesh position={[0, 1.5, 0]} visible={false}>\n           <boxGeometry args={[4, 3, 4]} />")

# Fix Crocodile Hitbox
# The CrocodileObstacle currently returns a single <group ref={innerRef}> that contains the meshes.
# We should add an invisible hitbox inside it so that the bounding box is taller, OR 
# wait, if the crocodile moves in Z from -4 to 0, its hitbox needs to move with it. 
# Since we return the group which moves in Z, adding a taller invisible mesh inside it will fix the height!
replacement_croc = """
  return (
    <group ref={innerRef} position={[x, -0.2, -4]} rotation={[0, Math.PI / 2, 0]}>
      {/* Invisible Hitbox */}
      <mesh position={[0, 1.5, 0]} visible={false}>
        <boxGeometry args={[4, 3, 2]} />
      </mesh>
"""
code = code.replace("  return (\n    <group ref={innerRef} position={[x, -0.2, -4]} rotation={[0, Math.PI / 2, 0]}>\n", replacement_croc)

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

