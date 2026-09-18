import { motion } from 'motion/react';
import { useGameStore } from '../../store/gameStore';
import { EGG_COIN_VALUES, COIN_VALUE } from '../../config/balance';
import { DinoCoinIcon } from './shared';

const EGG_ROWS = [
  { key: 'common' as const, label: 'Comum', color: '#4ade80', value: EGG_COIN_VALUES.common },
  { key: 'rare' as const, label: 'Raro', color: '#60a5fa', value: EGG_COIN_VALUES.rare },
  { key: 'ultraRare' as const, label: 'Ultra Raro', color: '#c084fc', value: EGG_COIN_VALUES.ultraRare },
];

export function GameOverScreen() {
  const { score, startGame, currentRunEggs, currentRunCoins } = useGameStore();

  const rows = EGG_ROWS.map(row => ({ ...row, count: currentRunEggs[row.key] })).filter(row => row.count > 0);
  const trackCoins = currentRunCoins * COIN_VALUE;
  const totalCoins = rows.reduce((sum, row) => sum + row.count * row.value, 0) + trackCoins;

  return (
    <motion.div key="gameover"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none z-20 p-6 select-none"
    >
      <div className="flex flex-col items-center text-center">
        <motion.h2
          initial={{ y: -40, scale: 0.5 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="text-4xl sm:text-6xl game-font text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] uppercase tracking-tighter"
        >
          GAME OVER
        </motion.h2>
        <p className="game-font text-white/70 text-xs sm:text-sm tracking-[0.2em] uppercase mt-1">
          Distância: {Math.floor(score)}m
        </p>
      </div>

      <div className="w-full max-w-xs pointer-events-auto">
        {rows.length > 0 || trackCoins > 0 ? (
          <div className="bg-slate-900/85 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-slate-700/40">
            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 text-center mb-3">
              Recompensas da corrida
            </div>
            <div className="flex flex-col gap-2">
              {rows.map(row => (
                <div key={row.key} className="flex items-center justify-between text-xs sm:text-sm text-white">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                    {row.label} ({row.count})
                  </span>
                  <span className="font-bold text-amber-300 flex items-center gap-1">+{row.count * row.value} <DinoCoinIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></span>
                </div>
              ))}
              {trackCoins > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-white">
                  <span className="flex items-center gap-2">
                    <DinoCoinIcon className="w-3 h-3 shrink-0" />
                    Moedas ({currentRunCoins})
                  </span>
                  <span className="font-bold text-amber-300 flex items-center gap-1">+{trackCoins} <DinoCoinIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 font-black text-amber-300 text-xs sm:text-sm">
              <span>Total</span>
              <span className="flex items-center gap-1">+{totalCoins} <DinoCoinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></span>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-white/50">Nenhuma recompensa coletada nesta corrida.</p>
        )}
      </div>

      <div className="flex gap-3 w-full max-w-xs pointer-events-auto">
        <button
          onClick={startGame}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 game-font text-xs sm:text-sm py-3 rounded-xl shadow-lg voxel-btn"
        >
          TENTAR NOVAMENTE
        </button>
        <button
          onClick={() => useGameStore.getState().resetGame()}
          className="flex-1 bg-slate-800/90 hover:bg-slate-700 text-white game-font text-xs sm:text-sm py-3 rounded-xl border border-white/10 voxel-btn"
        >
          MENU
        </button>
      </div>
    </motion.div>
  );
}
