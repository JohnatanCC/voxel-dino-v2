import re

with open('src/components/SwampObstacles.tsx', 'r') as f:
    code = f.read()

# Let's add some spikes to the crocodile back
spikes = """
      {/* Spikes on back */}
      <mesh position={[0, 0.7, 0]} castShadow material={new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.9 })}>
        <coneGeometry args={[0.3, 0.6, 4]} />
      </mesh>
      <mesh position={[0.8, 0.6, 0]} castShadow material={new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.9 })}>
        <coneGeometry args={[0.2, 0.4, 4]} />
      </mesh>
      <mesh position={[-0.8, 0.6, 0]} castShadow material={new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.9 })}>
        <coneGeometry args={[0.2, 0.4, 4]} />
      </mesh>
"""

# Insert spikes after the main body
code = code.replace("        <boxGeometry args={[3, 0.5, 1]} />\n      </mesh>", "        <boxGeometry args={[3, 0.5, 1]} />\n      </mesh>" + spikes)

with open('src/components/SwampObstacles.tsx', 'w') as f:
    f.write(code)

