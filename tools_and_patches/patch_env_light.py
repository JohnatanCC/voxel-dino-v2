import re

with open('src/components/EnvironmentManager.tsx', 'r') as f:
    code = f.read()

# Change day color for swamp to dark slate/greenish
code = code.replace("scenario === 'swamp' ? '#94a3b8'", "scenario === 'swamp' ? '#1e293b'") # slate-800
# Night color for swamp
code = code.replace("scenario === 'swamp' ? new THREE.Color('#475569')", "scenario === 'swamp' ? new THREE.Color('#0f172a')") # slate-900

# Fix light intensities for swamp
intensity_logic = """
    if (phase < 0.4) {
      // Day
      targetColor.copy(dayColor);
      if (scenario === 'swamp') {
        lightIntensity = 0.5;
        ambientIntensity = 0.2;
      }
    } else if (phase < 0.5) {
      // Day to Sunset to Night
      const t = (phase - 0.4) / 0.1;
      if (t < 0.5) {
        targetColor.lerpColors(dayColor, sunsetColor, t * 2);
      } else {
        targetColor.lerpColors(sunsetColor, nightColor, (t - 0.5) * 2);
      }
      if (scenario === 'swamp') {
        lightIntensity = 0.5 - t * 0.2;
        ambientIntensity = 0.2 - t * 0.1;
      } else {
        lightIntensity = 1.5 - t * 1.2; // dim down to 0.3
        ambientIntensity = 0.4 - t * 0.2; // dim down to 0.2
      }
    } else if (phase < 0.9) {
      // Night
      targetColor.copy(nightColor);
      lightIntensity = scenario === 'swamp' ? 0.2 : 0.3;
      ambientIntensity = scenario === 'swamp' ? 0.1 : 0.2;
    } else {
      // Night to Sunrise to Day
      const t = (phase - 0.9) / 0.1;
      if (t < 0.5) {
        targetColor.lerpColors(nightColor, sunsetColor, t * 2);
      } else {
        targetColor.lerpColors(sunsetColor, dayColor, (t - 0.5) * 2);
      }
      if (scenario === 'swamp') {
        lightIntensity = 0.2 + t * 0.3;
        ambientIntensity = 0.1 + t * 0.1;
      } else {
        lightIntensity = 0.3 + t * 1.2;
        ambientIntensity = 0.2 + t * 0.2;
      }
    }
"""

old_intensity_logic = """
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
"""

code = code.replace(old_intensity_logic, intensity_logic)

# Increase rim light for swamp
code = code.replace("rimLightRef.current.intensity = scenario === 'swamp' ? 1.5 : 0;", "rimLightRef.current.intensity = scenario === 'swamp' ? 2.5 : 0;")

with open('src/components/EnvironmentManager.tsx', 'w') as f:
    f.write(code)

