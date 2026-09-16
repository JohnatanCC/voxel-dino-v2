import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../store/gameStore';
import { POWERUP_ACCENT_COLORS } from '../../config/balance';

interface PowerupInfo {
  name: string;
  desc: string;
  type: string;
}

export function PowerupToast() {
  const cinematicPowerup = useGameStore((state) => state.cinematicPowerup);
  const [current, setCurrent] = useState<PowerupInfo | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (cinematicPowerup) {
      setCurrent(cinematicPowerup);
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1600);
      return () => clearTimeout(timer);
    }
  }, [cinematicPowerup]);

  if (!current) return null;

  const color = POWERUP_ACCENT_COLORS[current.type] || '#fbbf24';

  return (
    <div className="absolute top-20 sm:top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-sm rounded-xl pl-3 pr-4 py-2.5 shadow-lg border-l-4 select-none"
            style={{ borderColor: color }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <div className="text-left">
              <h2 className="game-font font-black text-xs sm:text-sm text-white uppercase tracking-wide">{current.name}</h2>
              <p className="text-[10px] sm:text-xs text-white/60">{current.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
