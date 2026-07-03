import re

# 1. EnvironmentManager - restore fog brightness
with open('src/components/EnvironmentManager.tsx', 'r') as f:
    env_code = f.read()

env_code = env_code.replace("const phase = scenario === 'swamp' ? 0.7 : ((gameTime % CYCLE_DURATION) / CYCLE_DURATION);", "const phase = (gameTime % CYCLE_DURATION) / CYCLE_DURATION;")
env_code = env_code.replace("const dayColor = new THREE.Color(scenario === 'forest' ? '#38bdf8' : (scenario === 'swamp' ? '#cbd5e1' : (scenario === 'snow' ? '#bae6fd' : '#fde68a')));", "const dayColor = new THREE.Color(scenario === 'forest' ? '#38bdf8' : (scenario === 'swamp' ? '#94a3b8' : (scenario === 'snow' ? '#bae6fd' : '#fde68a')));")
env_code = env_code.replace("const nightColor = scenario === 'swamp' ? new THREE.Color('#334155') : (scenario === 'snow' ? new THREE.Color('#020617') : new THREE.Color('#1e1b4b'));", "const nightColor = scenario === 'swamp' ? new THREE.Color('#475569') : (scenario === 'snow' ? new THREE.Color('#020617') : new THREE.Color('#1e1b4b'));")

with open('src/components/EnvironmentManager.tsx', 'w') as f:
    f.write(env_code)


# 2. SwampGround - water color, lily pad color, tree density
with open('src/components/SwampGround.tsx', 'r') as f:
    swamp_code = f.read()

# Water Texture Color
water_tex_old = """    ctx.fillStyle = '#1d4ed8'; // Brighter dark blue base so it shows in dark lighting
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for water texture (water ripples)
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = Math.random() * 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#1e40af' : '#2563eb';"""
water_tex_new = """    ctx.fillStyle = '#0f766e'; // Teal/greenish base
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for water texture (water ripples)
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = Math.random() * 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#115e59' : '#0d9488';"""
swamp_code = swamp_code.replace(water_tex_old, water_tex_new)

# Lily pad rim
lily_rim_old = '<meshStandardMaterial color="#7f1d1d" roughness={1.0} side={THREE.DoubleSide} />'
lily_rim_new = '<meshStandardMaterial color="#34d399" roughness={0.9} side={THREE.DoubleSide} />'
swamp_code = swamp_code.replace(lily_rim_old, lily_rim_new)

# Lily pad texture
lily_tex_old = "ctx.fillStyle = '#059669'; // Base green"
lily_tex_new = "ctx.fillStyle = '#10b981'; // Brighter Base green"
swamp_code = swamp_code.replace(lily_tex_old, lily_tex_new)

# Trees density
trees_old = """      <MangroveTrees count={35} zOffset={-55} zSpread={5} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={70} zOffset={-62} zSpread={10} speedFactor={0.15} scaleMult={2.2} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={55} zOffset={-100} speedFactor={0.05} scaleMult={4.0} trunkColor="#1c1917" leavesColor="#020617" />"""

trees_new = """      <MangroveTrees count={15} zOffset={-40} zSpread={15} speedFactor={0.25} scaleMult={1.5} trunkColor="#44403c" leavesColor="#064e3b" />
      <MangroveTrees count={25} zOffset={-70} zSpread={25} speedFactor={0.15} scaleMult={2.2} trunkColor="#292524" leavesColor="#022c22" />
      <MangroveTrees count={20} zOffset={-110} zSpread={30} speedFactor={0.05} scaleMult={4.0} trunkColor="#1c1917" leavesColor="#020617" />"""

swamp_code = swamp_code.replace(trees_old, trees_new)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(swamp_code)

