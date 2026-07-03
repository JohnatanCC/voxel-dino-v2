import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

# Change waterTexture to brighter blues
code = code.replace("ctx.fillStyle = '#1e3a8a';", "ctx.fillStyle = '#1d4ed8'; // Brighter dark blue base so it shows in dark lighting")
code = code.replace("ctx.fillStyle = Math.random() > 0.5 ? '#172554' : '#1e40af';", "ctx.fillStyle = Math.random() > 0.5 ? '#1e40af' : '#2563eb';")

# Give water material a slightly emissive property or just brighter color
water_mesh_old = '<meshStandardMaterial ref={waterMatRef} map={waterTexture} roughness={0.05} metalness={0.3} color="#ffffff" />'
water_mesh_new = '<meshStandardMaterial ref={waterMatRef} map={waterTexture} roughness={0.05} metalness={0.5} emissive="#1e3a8a" emissiveIntensity={0.2} color="#ffffff" />'
code = code.replace(water_mesh_old, water_mesh_new)

water_mesh_old2 = '<meshStandardMaterial map={waterTexture} roughness={0.05} metalness={0.3} color="#ffffff" />'
water_mesh_new2 = '<meshStandardMaterial map={waterTexture} roughness={0.05} metalness={0.5} emissive="#1e3a8a" emissiveIntensity={0.2} color="#ffffff" />'
code = code.replace(water_mesh_old2, water_mesh_new2)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)

