import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { AnimatePresence } from 'motion/react';
import { Camera } from 'lucide-react';
import { playBackgroundMusic, stopBackgroundMusic, pauseBackgroundMusic, playPowerupMusic } from '../utils/audio';
import { POWERUP_DURATION } from '../config/balance';
import { Hud } from './ui/Hud';
import { MainMenu } from './ui/MainMenu';
import { SettingsModal } from './ui/SettingsModal';
import { GameOverScreen } from './ui/GameOverScreen';
import { PauseMenu } from './ui/PauseMenu';
import { ShopOverlay } from './ui/ShopOverlay';
import { AssetLibraryOverlay } from './ui/AssetLibraryOverlay';
import { TouchControls } from './ui/TouchControls';
import { PowerupToast } from './ui/PowerupToast';

export function UI() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isExtraOpen, setIsExtraOpen] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsMobilePortrait(isTouch && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const { status, startGame, scenario, cinematicPowerup, devMode, setDevMode, isTransitioning, transitionStartTime, gameTime, activePowerup } = useGameStore();

  // Cinematic Powerup Auto-Clear Effect
  useEffect(() => {
    if (cinematicPowerup) {
      const timer = setTimeout(() => {
        useGameStore.setState({ cinematicPowerup: null });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [cinematicPowerup]);

  useEffect(() => {
    if (status === 'playing') {
      // Skip if a powerup theme is currently playing — the activePowerup effect below
      // owns music while one is active and will hand back to this scenario when it ends.
      if (useGameStore.getState().activePowerup === 'none') {
        playBackgroundMusic(scenario);
      }
    } else if (status === 'paused') {
      pauseBackgroundMusic();
    } else if (status === 'menu' || status === 'gameover') {
      playBackgroundMusic('menu');
    } else {
      stopBackgroundMusic();
    }

    return () => stopBackgroundMusic();
  }, [status, scenario]);

  // Powerup pickup: override the current track with that powerup's own short theme,
  // then hand back to the scenario/menu track once it wears off.
  useEffect(() => {
    if (status !== 'playing') return;
    if (activePowerup !== 'none') {
      playPowerupMusic(activePowerup);
    } else {
      playBackgroundMusic(scenario);
    }
  }, [activePowerup, status]);

  // Global shortcuts: start game / toggle pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') && (status === 'menu' || status === 'gameover')) {
        startGame();
      }
      if (e.key === 'Escape' || e.key === 'p') {
        useGameStore.getState().togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, startGame]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
      {/* Landscape Warning for Mobile */}
      {isMobilePortrait && (
        <div className="fixed inset-0 z-50 bg-[#fde047] flex-col items-center justify-center p-8 text-center pointer-events-auto flex">
          <div className="text-6xl mb-4 rotate-90">📱</div>
          <h2 className="text-3xl game-font text-[#535353] mb-4">ROTATE YOUR DEVICE</h2>
          <p className="text-[#535353] font-bold">Please turn your device horizontally to play the game.</p>
        </div>
      )}

      <Hud />
      <PowerupToast />

      <AnimatePresence>
        {status === 'menu' && !devMode && (
          <MainMenu
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenExtra={() => setIsExtraOpen(true)}
          />
        )}

        {/* Secret Powerup Button */}
        {status === 'menu' && !devMode && (
           <button key="secret-btn"
             onClick={() => {
                const powerups = ['wings', 'super', 'ghost', 'jaw', 'earth', 'dragon'] as const;
                const rand = powerups[Math.floor(Math.random() * powerups.length)];
                useGameStore.getState().activatePowerup(rand, POWERUP_DURATION);
             }}
             className="absolute bottom-4 left-4 z-30 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center font-bold text-xl backdrop-blur transition-colors pointer-events-auto border border-white/30"
           >
             ?
           </button>
        )}
        {/* Floating Dev Mode Button */}
        {(status === 'menu' || devMode) && (
          <button key="dev-btn"
            onClick={() => setDevMode(!devMode)}
            className={`absolute bottom-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur transition-colors pointer-events-auto border ${devMode ? 'bg-amber-500/80 text-white border-amber-300' : 'bg-black/20 hover:bg-black/40 text-white border-white/30'}`}
            title={devMode ? "Exit Free Camera (Alt)" : "Free Camera"}
          >
            <Camera className="w-5 h-5" />
          </button>
        )}

        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

        {status === 'gameover' && <GameOverScreen />}

        {status === 'paused' && !devMode && <PauseMenu />}
      </AnimatePresence>

      {/* 2.5D Overlay Visual Element */}
      <div className="absolute bottom-48 left-20 w-48 h-12 bg-black opacity-[0.03] rounded-full blur-xl pointer-events-none hidden md:block"></div>

      <TouchControls />

      {/* Fade Transition Overlay (biome change) */}
      {isTransitioning && (
        <div
          className="absolute inset-0 bg-[#f8fafc] pointer-events-none z-50 transition-opacity"
          style={{
            opacity: gameTime - transitionStartTime < 2.0
              ? (gameTime - transitionStartTime) / 2.0
              : 1 - ((gameTime - transitionStartTime - 2.0) / 1.0)
          }}
        />
      )}

      {/* Shop Overlay Panel */}
      <AnimatePresence>
        {isShopOpen && <ShopOverlay onClose={() => setIsShopOpen(false)} />}
      </AnimatePresence>

      {/* Asset Library Overlay Panel */}
      <AnimatePresence>
        {isExtraOpen && <AssetLibraryOverlay onClose={() => setIsExtraOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
