import re

with open('src/components/EnvironmentManager.tsx', 'r') as f:
    code = f.read()

replacement = """    const dayColor = new THREE.Color(scenario === 'forest' ? '#38bdf8' : (scenario === 'swamp' ? '#cbd5e1' : (scenario === 'snow' ? '#bae6fd' : '#fde68a')));
    const nightColor = scenario === 'swamp' ? new THREE.Color('#334155') : (scenario === 'snow' ? new THREE.Color('#020617') : new THREE.Color('#1e1b4b'));
    
    // Always night
    const phase = 0.7;
    
    let targetColor = new THREE.Color(nightColor);
    let lightIntensity = 0.3;
    let ambientIntensity = 0.2;
    let isLightning = false;
    
    // Swamp lightning effect
    if (scenario === 'swamp') {
      const timeSecs = state.clock.getElapsedTime();
      // Random-looking bursts of lightning
      const flash = Math.sin(timeSecs * 10) * Math.sin(timeSecs * 3.1) * Math.sin(timeSecs * 7.2);
      if (flash > 0.95 && Math.random() > 0.4) {
        isLightning = true;
      }
    }
    
    if (isLightning) {
      targetColor.set('#e2e8f0'); // Flash of white/grey
      lightIntensity = 3.0;
      ambientIntensity = 1.0;
    }
    
    scene.background = targetColor;
    if (scene.fog) {
       scene.fog.color.copy(targetColor);
    }
    
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = lightIntensity;
      directionalLightRef.current.color.copy(targetColor);
    }
    
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = ambientIntensity;
    }
    
    if (rimLightRef.current) {
      rimLightRef.current.intensity = scenario === 'swamp' ? 1.5 : 0;
    }
    
    // Update CSS variable for UI color
    const root = document.documentElement;
    const uiColor = new THREE.Color('#e5e7eb');
    root.style.setProperty('--game-ui-color', uiColor.getStyle());"""

code = re.sub(r'    const dayColor = new THREE\.Color.*?root\.style\.setProperty\(\'--game-ui-color\', uiColor\.getStyle\(\)\);', replacement, code, flags=re.DOTALL)

# Remove the sun mesh
mesh_replacement = """    <>
      <Aurora />
      <ambientLight ref={ambientLightRef} intensity={0.4} />"""

code = re.sub(r'    <>\n      <Aurora />\n      \{/\* Sun \*/\}\n      <mesh ref=\{sunRef\} position=\{\[20, 15, -30\]\}>\n        <boxGeometry args=\{\[4, 4, 1\]\} />\n        <meshBasicMaterial ref=\{sunMaterialRef\} color="#fef08a" />\n      </mesh>\n      <ambientLight ref=\{ambientLightRef\} intensity=\{0.4\} />', mesh_replacement, code)

with open('src/components/EnvironmentManager.tsx', 'w') as f:
    f.write(code)

