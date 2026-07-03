import re

with open('src/components/EnvironmentManager.tsx', 'r') as f:
    code = f.read()

replacement = """    const dayColor = new THREE.Color(scenario === 'forest' ? '#38bdf8' : (scenario === 'swamp' ? '#cbd5e1' : (scenario === 'snow' ? '#bae6fd' : '#fde68a')));
    const nightColor = scenario === 'swamp' ? new THREE.Color('#334155') : (scenario === 'snow' ? new THREE.Color('#020617') : new THREE.Color('#1e1b4b'));
    
    const CYCLE_DURATION = 200;
    const phase = scenario === 'swamp' ? 0.7 : ((gameTime % CYCLE_DURATION) / CYCLE_DURATION);
    
    let targetColor = new THREE.Color();
    let lightIntensity = 1.5;
    let ambientIntensity = 0.4;
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
    
    if (phase < 0.4) {
      // Day
      targetColor.copy(dayColor);
    } else if (phase < 0.5) {
      // Day to Sunset to Night
      const t = (phase - 0.4) / 0.1;
      if (t < 0.5) {
        targetColor.lerpColors(dayColor, sunsetColor, t * 2);
      } else {
        targetColor.lerpColors(sunsetColor, nightColor, (t - 0.5) * 2);
      }
      lightIntensity = 1.5 - t * 1.2; // dim down to 0.3
      ambientIntensity = 0.4 - t * 0.2; // dim down to 0.2
    } else if (phase < 0.9) {
      // Night
      targetColor.copy(nightColor);
      lightIntensity = 0.3;
      ambientIntensity = 0.2;
    } else {
      // Night to Sunrise to Day
      const t = (phase - 0.9) / 0.1;
      if (t < 0.5) {
        targetColor.lerpColors(nightColor, sunsetColor, t * 2);
      } else {
        targetColor.lerpColors(sunsetColor, dayColor, (t - 0.5) * 2);
      }
      lightIntensity = 0.3 + t * 1.2;
      ambientIntensity = 0.2 + t * 0.2;
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
    const uiColor = new THREE.Color();
    const dayUiColor = new THREE.Color('#535353');
    const nightUiColor = new THREE.Color('#e5e7eb');
    
    if (phase < 0.4) {
      uiColor.copy(dayUiColor);
    } else if (phase < 0.5) {
      const t = (phase - 0.4) / 0.1;
      uiColor.lerpColors(dayUiColor, nightUiColor, t);
    } else if (phase < 0.9) {
      uiColor.copy(nightUiColor);
    } else {
      const t = (phase - 0.9) / 0.1;
      uiColor.lerpColors(nightUiColor, dayUiColor, t);
    }
    root.style.setProperty('--game-ui-color', uiColor.getStyle());"""

code = re.sub(r'    const dayColor = new THREE\.Color.*?root\.style\.setProperty\(\'--game-ui-color\', uiColor\.getStyle\(\)\);', replacement, code, flags=re.DOTALL)

# Completely remove sun mesh from JSX
mesh_replacement = """    <>
      <Aurora />
      <ambientLight ref={ambientLightRef} intensity={0.4} />"""

code = re.sub(r'    <>\n      <Aurora />\n      \{/\* Sun \*/\}\n      <mesh ref=\{sunRef\} position=\{\[20, 15, -30\]\}>\n        <boxGeometry args=\{\[4, 4, 1\]\} />\n        <meshBasicMaterial ref=\{sunMaterialRef\} color="#fef08a" />\n      </mesh>\n      <ambientLight ref=\{ambientLightRef\} intensity=\{0.4\} />', mesh_replacement, code)

# Clean up any leftover sunRef or sunMaterialRef definitions
code = re.sub(r'  const sunRef = useRef<THREE\.Mesh>\(null\);\n  const sunMaterialRef = useRef<THREE\.MeshBasicMaterial>\(null\);\n', '', code)
code = re.sub(r'    if \(sunRef\.current\) \{.*?\}\n', '', code, flags=re.DOTALL)
code = re.sub(r'    if \(sunMaterialRef\.current\) \{.*?\}\n', '', code, flags=re.DOTALL)

with open('src/components/EnvironmentManager.tsx', 'w') as f:
    f.write(code)

