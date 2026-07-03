import re

with open('src/components/ForestObstacles.tsx', 'r') as f:
    code = f.read()

replacement = """
        {/* Mud Edge */}
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[2.2, 2.2, 0.05, 16]} />
          <meshStandardMaterial color="#451a03" roughness={1} />
        </mesh>
        {/* Water Plane */}
        <mesh position={[0, 0.04, 0]} receiveShadow material={waterMaterial}>
          <cylinderGeometry args={[1.9, 1.9, 0.05, 16]} />
        </mesh>
        
        {/* Some decorative rocks in the puddle */}
        <mesh position={[1.2, 0.1, 0.5]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
        <mesh position={[-0.8, 0.1, -1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
        <mesh position={[0.5, 0.1, 1.5]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
"""

code = re.sub(
    r'\{/\* Water Plane \*/\}.*?\{/\* Croc Head in Forest \*/\}.*?<\/mesh>',
    replacement.strip(),
    code,
    flags=re.DOTALL
)

with open('src/components/ForestObstacles.tsx', 'w') as f:
    f.write(code)

