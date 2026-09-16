import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGameStore, FogDensity } from '../../store/gameStore';

const FOG_OPTIONS: FogDensity[] = ['off', 'minimum', 'low', 'medium', 'high'];

export function PauseMenu() {
  const { scenario, fogSettings, setFogDensity } = useGameStore();

  const cycleFog = (direction: 1 | -1) => {
    const idx = FOG_OPTIONS.indexOf(fogSettings[scenario]);
    const nextIdx = (idx + direction + FOG_OPTIONS.length) % FOG_OPTIONS.length;
    setFogDensity(scenario, FOG_OPTIONS[nextIdx]);
  };

  const fogLabel = fogSettings[scenario] === 'off' ? 'OFF' : fogSettings[scenario] === 'minimum' ? 'MIN' : fogSettings[scenario];

  return (
    <motion.div key="paused"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 p-4"
    >
      <div className="text-center pointer-events-auto bg-white/95 backdrop-blur border-2 border-[#535353] p-6 sm:p-10 rounded shadow-[8px_8px_0px_#bcbcbc] max-w-[95vw] sm:max-w-sm w-full flex flex-col items-center gap-4">
        <h2 className="text-3xl sm:text-5xl game-font text-[#535353] mb-2 tracking-tighter">PAUSED</h2>

        <div className="flex items-center gap-4 mt-2 mb-4 w-full justify-center">
          <button onClick={() => cycleFog(-1)} className="text-[#535353] hover:text-amber-500 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="game-font text-[#535353] text-base uppercase tracking-widest w-24 text-center">
            FOG: {fogLabel}
          </div>
          <button onClick={() => cycleFog(1)} className="text-[#535353] hover:text-amber-500 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={() => useGameStore.getState().resetGame()}
            className="flex-1 bg-red-500 text-white game-font py-2 sm:py-3 px-4 voxel-btn text-sm sm:text-lg"
          >
            MENU
          </button>
          <button
            onClick={() => useGameStore.getState().togglePause()}
            className="flex-1 bg-[#535353] text-white game-font py-2 sm:py-3 px-4 voxel-btn text-sm sm:text-lg"
          >
            RESUME
          </button>
        </div>
      </div>
    </motion.div>
  );
}
