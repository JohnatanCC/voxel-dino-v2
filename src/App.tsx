import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { useGameStore, GameScenario, FogDensity } from './store/gameStore';
import { Game } from './components/Game';
import { UI } from './components/UI';
import { EnvironmentManager } from './components/EnvironmentManager';
import { SCENARIOS } from './scenarios';

function getFogValues(scenario: GameScenario, isSandstorm: boolean, density: FogDensity) {
  const config = SCENARIOS[scenario];
  let near = config.fogNear;
  let far = config.fogFar;
  
  if (isSandstorm && scenario === 'desert') {
    near = 15;
    far = 45;
  }

  // Apply density multipliers
  if (density === 'off') {
    near = 1000;
    far = 2000;
  } else if (density === 'minimum') {
    near *= 2.5;
    far *= 2.5;
  } else if (density === 'low') {
    near *= 1.5;
    far *= 1.5;
  } else if (density === 'high') {
    near *= 0.5;
    far *= 0.6;
  }

  return { near, far };
}

export default function App() {
  const status = useGameStore((state) => state.status);
  const activePowerup = useGameStore((state) => state.activePowerup);
  const isSandstorm = useGameStore((state) => state.isSandstorm);
  const scenario = useGameStore((state) => state.scenario);
  const fogSettings = useGameStore((state) => state.fogSettings);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

  const config = SCENARIOS[scenario];
  let bgColor = config.bgColor;
  if (isSandstorm && scenario === 'desert') bgColor = '#d4a373';

  const fogDensity = fogSettings[scenario] || 'medium';
  let { near: fogNear, far: fogFar } = getFogValues(scenario, isSandstorm, fogDensity);
  if (activePowerup === 'earth') {
    fogNear *= 0.25;
    fogFar *= 0.35;
  }

  // Prevent default scrolling for game keys
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code) && status === 'playing') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [status]);

  const canvasClassName = "absolute inset-0 w-full h-full z-0 transition-all duration-300";

  return (
    <div className="w-full h-screen bg-[#1e293b] text-game-text font-sans overflow-hidden relative select-none">
      <UI />
      
      <div className={canvasClassName}>
        <Canvas 
          key={graphicsQuality}
          shadows={graphicsQuality !== 'low'} 
          dpr={graphicsQuality === 'low' ? 1 : graphicsQuality === 'medium' ? 1.5 : 2} 
          camera={{ position: [6, 4.5, 22], fov: 35 }} 
          className="w-full h-full relative z-0"
        >
          <color attach="background" args={[bgColor]} />
          <fog attach="fog" args={[bgColor, fogNear, fogFar]} />
          
          <EnvironmentManager />
          
          {/* Soft fill light */}
          <directionalLight position={[-10, 5, -10]} intensity={0.3} color="#93c5fd" />
          <Suspense fallback={null}>
            <Game />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
