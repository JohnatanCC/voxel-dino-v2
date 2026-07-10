import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';
import { useRef } from 'react';
import { SCENARIOS } from '../scenarios';

const sunsetColor = new THREE.Color('#f87171');

export function EnvironmentManager() {
  const { scene } = useThree();
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame((state) => {
    const { gameTime, scenario } = useGameStore.getState();
    const config = SCENARIOS[scenario];
    
    const dayColor = new THREE.Color(config.skyColorDay);
    const nightColor = new THREE.Color(config.skyColorNight);
    
    const CYCLE_DURATION = 200;
    const phase = (gameTime % CYCLE_DURATION) / CYCLE_DURATION;
    
    let targetColor = new THREE.Color();
    let lightIntensity = 1.5;
    let ambientIntensity = 0.4;
    
    if (phase < 0.4) {
      // Day
      targetColor.copy(dayColor);
      lightIntensity = config.lightIntensityDay;
      ambientIntensity = config.ambientIntensityDay;
    } else if (phase < 0.5) {
      // Day to Sunset to Night
      const t = (phase - 0.4) / 0.1;
      if (t < 0.5) {
        targetColor.lerpColors(dayColor, sunsetColor, t * 2);
      } else {
        targetColor.lerpColors(sunsetColor, nightColor, (t - 0.5) * 2);
      }
      
      lightIntensity = THREE.MathUtils.lerp(config.lightIntensityDay, config.lightIntensityNight, t);
      ambientIntensity = THREE.MathUtils.lerp(config.ambientIntensityDay, config.ambientIntensityNight, t);
    } else if (phase < 0.9) {
      // Night
      targetColor.copy(nightColor);
      lightIntensity = config.lightIntensityNight;
      ambientIntensity = config.ambientIntensityNight;
    } else {
      // Night to Sunrise to Day
      const t = (phase - 0.9) / 0.1;
      if (t < 0.5) {
        targetColor.lerpColors(nightColor, sunsetColor, t * 2);
      } else {
        targetColor.lerpColors(sunsetColor, dayColor, (t - 0.5) * 2);
      }
      
      lightIntensity = THREE.MathUtils.lerp(config.lightIntensityNight, config.lightIntensityDay, t);
      ambientIntensity = THREE.MathUtils.lerp(config.ambientIntensityNight, config.ambientIntensityDay, t);
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
      rimLightRef.current.intensity = config.rimLightIntensity || 0;
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
    root.style.setProperty('--game-ui-color', uiColor.getStyle());
  });

  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.4} />
      <directionalLight
        ref={directionalLightRef}
        castShadow={graphicsQuality !== 'low'}
        position={[10, 20, 10]}
        intensity={1.5}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight 
        ref={rimLightRef} 
        position={[-15, 10, -20]} 
        intensity={0} 
        color="#bae6fd" 
      />
    </>
  );
}
