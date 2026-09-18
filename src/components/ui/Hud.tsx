import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Camera } from 'lucide-react';
import { POWERUP_DURATION, POWERUP_ACCENT_COLORS } from '../../config/balance';

const POWERUP_LABELS: Record<string, string> = {
  wings: 'Anjo',
  super: 'SUPERDINO',
  ghost: 'Fantasma',
  jaw: 'Feroz',
  earth: 'Escavador',
  dragon: 'Dragão',
};

const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

function LivesIndicator({ lives }: { lives: number }) {
  return (
    <div className="flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-xl backdrop-blur-sm">
      {Array.from({ length: lives }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill="#f87171" className="w-3 h-3 md:w-3.5 md:h-3.5">
          <path d={HEART_PATH} />
        </svg>
      ))}
    </div>
  );
}

function SpeedIndicator() {
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    let frame: number;
    const update = () => {
      const state = useGameStore.getState();
      setSpeed(state.getCurrentSpeed());
      if (state.status === 'playing') {
        frame = requestAnimationFrame(update);
      }
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-xl backdrop-blur-sm">
      <span className="game-font font-black text-[8px] md:text-[10px] text-emerald-300 uppercase tracking-wider whitespace-nowrap">
        {speed.toFixed(1)} m/s
      </span>
    </div>
  );
}

function PowerupIndicator({ type }: { type: string }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let frame: number;
    const update = () => {
      const state = useGameStore.getState();
      const remaining = state.powerupEndTime - state.gameTime;
      const pct = Math.max(0, Math.min(100, (remaining / POWERUP_DURATION) * 100));
      setProgress(pct);
      if (pct > 0 && state.status === 'playing') {
        frame = requestAnimationFrame(update);
      }
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  const color = POWERUP_ACCENT_COLORS[type] || '#fbbf24';

  return (
    <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-xl shadow border border-slate-700/25 backdrop-blur-sm">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="game-font font-black text-[8px] md:text-[10px] text-white uppercase tracking-wider whitespace-nowrap">
        {POWERUP_LABELS[type] || type}
      </span>
      <div className="w-12 md:w-20 h-1.5 bg-black/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color, transition: 'width 0.1s linear' }} />
      </div>
    </div>
  );
}

export function Hud() {
  const { status, score, highScore, scenario, coldTimer, currentRunEggs, lives, activePowerup, devMode } = useGameStore();

  if (status === 'menu') return null;

  return (
    <div className="flex justify-between items-start p-4 sm:p-8 z-10 relative">
      {/* Score + active powerup (Middle Top) */}
      {status === 'playing' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="game-font font-black text-xs md:text-lg text-white bg-slate-900/80 px-4 py-1 rounded-xl shadow border border-slate-700/25 uppercase tracking-wider backdrop-blur-sm">
              {Math.floor(score)}m
            </span>
            <span className="game-font font-black text-[9px] md:text-xs text-amber-300/90 bg-slate-900/60 px-3 py-1 rounded-xl shadow border border-slate-700/25 uppercase tracking-wider backdrop-blur-sm">
              MELHOR: {Math.floor(highScore)}m
            </span>
          </div>
          {activePowerup !== 'none' && <PowerupIndicator key={activePowerup} type={activePowerup} />}
        </div>
      )}

      {/* Lives + Speed (Top Left) */}
      <div className="flex flex-col gap-1">
        {status === 'playing' && <LivesIndicator lives={lives} />}
        {status === 'playing' && <SpeedIndicator />}
      </div>

      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-4 sm:gap-6 game-font text-xs sm:text-lg text-[var(--game-ui-color)]">
          {/* Eggs (the game over card shows its own detailed breakdown) */}
          <div className="flex flex-col items-end gap-1 game-font">
            {(status === 'playing' || status === 'paused') && (currentRunEggs.common > 0 || currentRunEggs.rare > 0 || currentRunEggs.ultraRare > 0) && (
               <div className="flex items-center gap-1.5 bg-black/10 px-2 py-0.5 rounded backdrop-blur-sm text-xs sm:text-sm">
                 <span>🥚</span>
                 {currentRunEggs.common > 0 && <span className="text-green-500 font-extrabold">{currentRunEggs.common}</span>}
                 {currentRunEggs.rare > 0 && <span className="text-blue-500 font-extrabold">{currentRunEggs.rare}</span>}
                 {currentRunEggs.ultraRare > 0 && <span className="text-purple-500 font-extrabold">{currentRunEggs.ultraRare}</span>}
               </div>
            )}
          </div>

          {/* Pause Button */}
          {(status === 'playing' || status === 'paused') && (
            <button
              onClick={() => useGameStore.getState().togglePause()}
              className="opacity-60 hover:opacity-100 transition-opacity"
              title={status === 'playing' ? 'Pause' : 'Resume'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                {status === 'playing' ? (
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                ) : (
                  <path d="M8 5v14l11-7z"/>
                )}
              </svg>
            </button>
          )}
          <button
            onClick={() => useGameStore.getState().setDevMode(!devMode)}
            className="opacity-60 hover:opacity-100 transition-opacity ml-2"
            title={devMode ? "Exit Free Camera (Alt)" : "Free Camera"}
          >
            <Camera className={`w-4 h-4 sm:w-5 sm:h-5 ${devMode ? 'text-amber-500' : 'text-[var(--game-ui-color)]'}`} />
          </button>
        </div>
        {/* Cold Meter */}
        {scenario === 'snow' && status === 'playing' && (
          <div className="flex flex-col items-end gap-1 mt-2">
            <span className="game-font text-[10px] sm:text-xs text-blue-400 font-bold">FRIO: {Math.ceil(coldTimer)}s</span>
            <div className="w-24 sm:w-32 h-2.5 bg-slate-800 rounded-none overflow-hidden border border-slate-700/20">
              <div
                className={`h-full ${coldTimer < 10 ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`}
                style={{ width: `${(coldTimer / 30) * 100}%`, transition: 'width 0.1s linear' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
