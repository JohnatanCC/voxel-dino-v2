import re

with open('src/components/SwampGround.tsx', 'r') as f:
    code = f.read()

# Fix lilyPadRimRef update missing
lily_update_old = """        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale, 0.05, d.scale);
        dummy.updateMatrix();
        lilyPadRef.current.setMatrixAt(i, dummy.matrix);
      }
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
    }"""
    
lily_update_new = """        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(0, d.rot, 0);
        dummy.scale.set(d.scale, 0.05, d.scale);
        dummy.updateMatrix();
        lilyPadRef.current.setMatrixAt(i, dummy.matrix);
        
        if (lilyPadRimRef.current) {
          dummy.position.set(d.x, d.y + 0.05, d.z);
          dummy.scale.set(d.scale * 1.0, 0.2, d.scale * 1.0);
          dummy.updateMatrix();
          lilyPadRimRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
      if (lilyPadRimRef.current) {
         lilyPadRimRef.current.instanceMatrix.needsUpdate = true;
      }
    }"""
    
code = code.replace(lily_update_old, lily_update_new)

# Improve water texture to dark blue
water_tex_old = """    ctx.fillStyle = '#0f766e'; // Teal water
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for water texture
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = Math.random() * 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#115e59' : '#134e4a';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }"""

water_tex_new = """    ctx.fillStyle = '#1e3a8a'; // Dark blue base
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for water texture (water ripples)
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = Math.random() * 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#172554' : '#1e40af';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }"""
    
code = code.replace(water_tex_old, water_tex_new)

# Fix water material colors
water_mesh_old = '<meshStandardMaterial ref={waterMatRef} map={waterTexture} roughness={0.05} metalness={0.3} color="#0f172a" />'
water_mesh_new = '<meshStandardMaterial ref={waterMatRef} map={waterTexture} roughness={0.05} metalness={0.3} color="#ffffff" />'
code = code.replace(water_mesh_old, water_mesh_new)

water_mesh_old2 = '<meshStandardMaterial map={waterTexture} roughness={0.05} metalness={0.3} color="#0f172a" />'
water_mesh_new2 = '<meshStandardMaterial map={waterTexture} roughness={0.05} metalness={0.3} color="#ffffff" />'
code = code.replace(water_mesh_old2, water_mesh_new2)

# Improve MangroveTrees layer 2
mangrove_old = '<MangroveTrees count={45} zOffset={-70} speedFactor={0.15} scaleMult={2.5} trunkColor="#292524" leavesColor="#022c22" />'
mangrove_new = '<MangroveTrees count={70} zOffset={-62} speedFactor={0.15} scaleMult={2.2} trunkColor="#292524" leavesColor="#022c22" />'
code = code.replace(mangrove_old, mangrove_new)

# Improve Vitoria-Regia realistic look (give it a slice or different geometry)
# Adding a leaf texture with veins to the lilypad.
vitoria_old = """  const lilyPadRef = useRef<THREE.InstancedMesh>(null);"""
vitoria_new = """  const lilyPadRef = useRef<THREE.InstancedMesh>(null);
  const lilyPadTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#059669'; // Base green
    ctx.fillRect(0, 0, 256, 256);
    // Draw veins
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(128, 128);
      const angle = (i / 16) * Math.PI * 2;
      ctx.lineTo(128 + Math.cos(angle) * 128, 128 + Math.sin(angle) * 128);
      ctx.stroke();
    }
    // Draw some noise
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#065f46' : '#10b981';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);"""
code = code.replace(vitoria_old, vitoria_new)

vitoria_mesh_old = '<meshStandardMaterial color="#059669" roughness={0.8} />'
vitoria_mesh_new = '<meshStandardMaterial map={lilyPadTexture} roughness={0.9} />'
code = code.replace(vitoria_mesh_old, vitoria_mesh_new)

# Add a reddish outer rim to the Vitoria Regia
vitoria_rim_old = '<meshStandardMaterial color="#065f46" roughness={0.9} side={THREE.DoubleSide} />'
vitoria_rim_new = '<meshStandardMaterial color="#991b1b" roughness={0.9} side={THREE.BackSide} />'
# Wait, double side might be needed if we want green inside and red outside. InstancedMesh has one material.
# So let's use DoubleSide but color it reddish brown (#78350f or #7f1d1d) for a realistic look.
vitoria_rim_new_2 = '<meshStandardMaterial color="#7f1d1d" roughness={1.0} side={THREE.DoubleSide} />'
code = code.replace(vitoria_rim_old, vitoria_rim_new_2)

with open('src/components/SwampGround.tsx', 'w') as f:
    f.write(code)
