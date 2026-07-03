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
  const isSandstorm = useGameStore((state) => state.isSandstorm);
  const scenario = useGameStore((state) => state.scenario);
  const fogSettings = useGameStore((state) => state.fogSettings);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

  const config = SCENARIOS[scenario];
  let bgColor = config.bgColor;
  if (isSandstorm && scenario === 'desert') bgColor = '#d4a373';

  const fogDensity = fogSettings[scenario] || 'medium';
  const { near: fogNear, far: fogFar } = getFogValues(scenario, isSandstorm, fogDensity);

  // Prevent default scrolling for game keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        useGameStore.getState().setDevMode(false);
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-screen bg-game-bg text-game-text font-sans overflow-hidden flex flex-col relative">
      <UI />
      
      <Canvas shadows={graphicsQuality !== 'low'} dpr={graphicsQuality === 'low' ? 1 : graphicsQuality === 'medium' ? 1.5 : 2} camera={{ position: [6, 4.5, 22], fov: 35 }} className="flex-1 w-full h-full relative z-0">
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
  );
}
