import { useEffect, useState } from 'react';
import { useGameStore, SKINS } from '../store/gameStore';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Camera, Settings, X } from 'lucide-react';
import { playBackgroundMusic, stopBackgroundMusic, pauseBackgroundMusic } from '../utils/audio';
import { Canvas } from '@react-three/fiber';
import { Dino } from './Dino';

function PowerupBar() {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    let frame: number;
    const update = () => {
      const state = useGameStore.getState();
      const remaining = state.powerupEndTime - state.gameTime;
      setProgress(Math.max(0, Math.min(100, (remaining / 12) * 100)));
      if (remaining > 0 && state.status === 'playing') {
        frame = requestAnimationFrame(update);
      }
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-16 sm:w-24 h-1.5 bg-black/20 rounded-full overflow-hidden border border-amber-500/30">
      <div 
        className="h-full bg-amber-500" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}

export function UI() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [selectedSkinId, setSelectedSkinId] = useState('dino-classic');
  const [couponCode, setCouponCode] = useState('');

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

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  
  
  const { status, score, highScore, speed, startGame, cameraMode, setCameraMode, activePowerup, scenario, setScenario, difficulty, setDifficulty, lives, isTransitioning, transitionStartTime, gameTime, coldTimer, fogSettings, setFogDensity, dinoColor, setDinoColor, devMode, setDevMode, coins, ownedSkins, equippedSkin, currentRunEggs } = useGameStore();

  const vignetteColor = activePowerup === 'super' ? 'rgba(253, 224, 71, 0.3)' : 
                  activePowerup === 'jaw' ? 'rgba(239, 68, 68, 0.3)' : 
                  activePowerup === 'ghost' ? 'rgba(168, 85, 247, 0.3)' :
                  activePowerup === 'wings' ? 'rgba(147, 197, 253, 0.3)' :
                  activePowerup === 'earth' ? 'rgba(217, 119, 6, 0.3)' : 'transparent';

  const [isJumpPressed, setIsJumpPressed] = useState(false);
  const [isDuckPressed, setIsDuckPressed] = useState(false);

  useEffect(() => {
    if (status === 'playing') {
      playBackgroundMusic(scenario);
    } else if (status === 'paused') {
      pauseBackgroundMusic();
    } else if (status === 'menu' || status === 'gameover') {
      playBackgroundMusic('menu');
    } else {
      stopBackgroundMusic();
    }
    
    return () => stopBackgroundMusic();
  }, [status, scenario]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') && (status === 'menu' || status === 'gameover')) {
        startGame();
      }
      if (e.key === 'Escape' || e.key === 'p') {
        useGameStore.getState().togglePause();
      }
      
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') {
        setIsJumpPressed(true);
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        setIsDuckPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') {
        setIsJumpPressed(false);
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        setIsDuckPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status, startGame]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
      {/* Frost Screen Overlay */}
      {scenario === 'snow' && status === 'playing' && coldTimer < 20 && (
         <div 
           className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${coldTimer < 8 ? 'animate-pulse' : ''}`}
           style={{
             opacity: 1.0 - (coldTimer / 20),
             boxShadow: 'inset 0 0 50px rgba(186, 230, 253, 0.5), inset 0 0 100px rgba(186, 230, 253, 0.3)',
             border: coldTimer < 8 ? '4px solid rgba(239, 68, 68, 0.4)' : '4px solid rgba(186, 230, 253, 0.3)',
           }}
         />
      )}
      {/* Landscape Warning for Mobile */}
      {isMobilePortrait && (
        <div className="fixed inset-0 z-50 bg-[#fde047] flex-col items-center justify-center p-8 text-center pointer-events-auto flex">
          <div className="text-6xl mb-4 rotate-90">📱</div>
          <h2 className="text-3xl game-font text-[#535353] mb-4">ROTATE YOUR DEVICE</h2>
          <p className="text-[#535353] font-bold">Please turn your device horizontally to play the game.</p>
        </div>
      )}

      {/* Top Bar: Scores */}
      {status !== 'menu' && (
      <div className="flex justify-between items-start p-4 sm:p-8 z-10">
        <div className="flex flex-col gap-1">
          {status !== 'playing' && status !== 'paused' && (
            <>
              <h1 className="text-xl sm:text-4xl game-font tracking-tighter text-[var(--game-ui-color)]">VOXEL DINO 3D</h1>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] opacity-40 text-[var(--game-ui-color)]">Procedural {scenario} v1.0</p>
            </>
          )}
          {activePowerup && activePowerup !== 'none' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-1 flex flex-col gap-1"
            >
              <span className="text-[10px] sm:text-xs uppercase font-bold text-amber-500 game-font tracking-widest">
                {activePowerup}
              </span>
              <PowerupBar />
            </motion.div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-4 sm:gap-6 game-font text-xs sm:text-lg text-[var(--game-ui-color)]">
            {/* Lives */}
            <div className="text-red-500 text-sm sm:text-lg tracking-tighter flex gap-0.5">
              
                {Array.from({ length: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center relative">
                    <AnimatePresence>
                      {i < lives && (
                        <motion.span
                          key={`heart-${i}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 1.5, opacity: 0, rotate: 15 }}
                          className="inline-block absolute"
                        >
                          ♥
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              
              {lives <= 0 && <span>☠️</span>}
            </div>
            
            {/* Scores & Coins & Eggs */}
            <div className="flex flex-col items-end gap-1 game-font">
              <div className="flex gap-3 opacity-80">
                <span className="hidden sm:inline">HI {highScore.toString().padStart(5, '0')}</span>
                <span>{Math.floor(score).toString().padStart(5, '0')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold opacity-90">
                <span className="text-amber-500">🪙 {coins}</span>
                {(currentRunEggs.common > 0 || currentRunEggs.rare > 0 || currentRunEggs.ultraRare > 0) && (
                   <div className="flex items-center gap-1.5 bg-black/10 px-2 py-0.5 rounded backdrop-blur-sm">
                     <span>🥚</span>
                     {currentRunEggs.common > 0 && <span className="text-green-500 font-extrabold">{currentRunEggs.common}</span>}
                     {currentRunEggs.rare > 0 && <span className="text-blue-500 font-extrabold">{currentRunEggs.rare}</span>}
                     {currentRunEggs.ultraRare > 0 && <span className="text-purple-500 font-extrabold">{currentRunEggs.ultraRare}</span>}
                   </div>
                )}
              </div>
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
              onClick={() => setDevMode(!devMode)}
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
              <div className="w-24 sm:w-32 h-2 bg-slate-800 rounded-full overflow-hidden border border-[#535353]/30">
                <div 
                  className={`h-full ${coldTimer < 10 ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`}
                  style={{ width: `${(coldTimer / 30) * 100}%`, transition: 'width 0.1s linear' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Center Overlay Menus */}
      <AnimatePresence>
        {status === 'menu' && !devMode && (
          <motion.div key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 p-4"
          >
            {/* Title */}
            <div className="text-center mb-4 sm:mb-12 mix-blend-difference menu-title-wrapper">
              <h1 className="text-5xl sm:text-8xl game-font text-white tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-title">
                VOXEL DINO
              </h1>
              <p className="text-white mt-0 sm:mt-2 game-font text-sm sm:text-xl opacity-80 tracking-widest drop-shadow-md menu-subtitle">
                v0.6.0
              </p>
            </div>

            <div className="pointer-events-auto flex flex-col gap-2 sm:gap-6 items-center menu-controls-container">
              {/* Scenario Selector */}
              <div className="flex items-center gap-4">
                <button 
                   onClick={() => {
                      const opts = ['mixed', 'desert', 'forest', 'swamp', 'snow'];
                      const current = useGameStore.getState().isMixedMode ? 'mixed' : scenario;
                      const idx = opts.indexOf(current);
                      const prev = opts[(idx - 1 + opts.length) % opts.length];
                      if (prev === 'mixed') {
                         useGameStore.getState().setMixedMode(true);
                      } else {
                         setScenario(prev as any);
                         useGameStore.getState().setMixedMode(false);
                      }
                   }}
                   className="text-white hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-btn"
                ><ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" /></button>
                <div className="game-font text-white text-lg sm:text-2xl uppercase tracking-widest w-24 sm:w-32 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-text">
                   {useGameStore.getState().isMixedMode ? 'Mixed' : scenario}
                </div>
                <button 
                   onClick={() => {
                      const opts = ['mixed', 'desert', 'forest', 'swamp', 'snow'];
                      const current = useGameStore.getState().isMixedMode ? 'mixed' : scenario;
                      const idx = opts.indexOf(current);
                      const next = opts[(idx + 1) % opts.length];
                      if (next === 'mixed') {
                         useGameStore.getState().setMixedMode(true);
                      } else {
                         setScenario(next as any);
                         useGameStore.getState().setMixedMode(false);
                      }
                   }}
                   className="text-white hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-btn"
                ><ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" /></button>
              </div>

              {/* Camera Mode */}
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setCameraMode(cameraMode === '2D' ? '2.5D' : '2D')}
                   className="text-white hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-btn"
                ><ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" /></button>
                <div className="game-font text-white text-base sm:text-xl uppercase tracking-widest w-20 sm:w-24 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-text">
                   {cameraMode}
                </div>
                <button 
                   onClick={() => setCameraMode(cameraMode === '2D' ? '2.5D' : '2D')}
                   className="text-white hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-btn"
                ><ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" /></button>
              </div>

              {/* Difficulty Selector */}
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => {
                      const opts = ['easy', 'medium', 'hard'];
                      const idx = opts.indexOf(difficulty);
                      const prev = opts[(idx - 1 + opts.length) % opts.length];
                      setDifficulty(prev as any);
                   }}
                   className="text-white hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-btn"
                ><ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" /></button>
                <div className="game-font text-white text-base sm:text-xl uppercase tracking-widest w-24 sm:w-32 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-text">
                   {difficulty}
                </div>
                <button 
                   onClick={() => {
                      const opts = ['easy', 'medium', 'hard'];
                      const idx = opts.indexOf(difficulty);
                      const next = opts[(idx + 1) % opts.length];
                      setDifficulty(next as any);
                   }}
                   className="text-white hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] menu-selector-btn"
                ><ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" /></button>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-white hover:text-amber-300 transition-colors flex items-center justify-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-2 menu-settings-btn"
              >
                <Settings className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
              
              {/* Start Button */}
              <button
                onClick={startGame}
                className="mt-2 sm:mt-6 bg-white text-[#535353] hover:bg-amber-300 hover:text-black transition-colors game-font py-2 sm:py-4 px-8 sm:px-12 rounded-full text-xl sm:text-2xl shadow-[0_0_15px_rgba(0,0,0,0.2)] menu-start-btn"
              >
                START
              </button>

              {/* Loja Button */}
              <button
                onClick={() => setIsShopOpen(true)}
                className="mt-2 sm:mt-3 bg-amber-500 text-white hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all game-font py-1.5 sm:py-3 px-6 sm:px-10 rounded-full text-lg sm:text-xl shadow-[0_0_15px_rgba(0,0,0,0.2)]"
              >
                LOJA
              </button>
              
              {/* Install PWA Button */}
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="mt-2 sm:mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#535353] transition-colors game-font py-2 px-6 rounded-full text-sm sm:text-base shadow-md menu-install-btn"
                >
                  INSTALL APP
                </button>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Secret Powerup Button */}
        {status === 'menu' && !devMode && (
           <button key="secret-btn"
             onClick={() => {
                const powerups = ['wings', 'super', 'ghost', 'jaw', 'earth'];
                const rand = powerups[Math.floor(Math.random() * powerups.length)];
                useGameStore.getState().activatePowerup(rand as any, 12);
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

        
        
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto bg-black/60 backdrop-blur-sm">
            <div className="bg-[#2a2a2a] border-4 border-[#535353] p-8 max-w-md w-full relative shadow-[8px_8px_0px_rgba(0,0,0,0.5)] flex flex-col items-center">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-2 right-2 text-white/50 hover:text-white"
              >
                <X className="w-8 h-8" />
              </button>
              
              <h2 className="text-3xl game-font text-white mb-8 tracking-tighter">CONFIGURAÇÕES</h2>
              
              <div className="flex flex-col gap-8 w-full">
                {/* Graphics */}
                <div className="flex flex-col items-center gap-2">
                  <span className="game-font text-white/70 text-sm tracking-widest uppercase">Gráficos</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                          const opts = ['low', 'medium', 'high'];
                          const current = useGameStore.getState().graphicsQuality;
                          const idx = opts.indexOf(current);
                          useGameStore.getState().setGraphicsQuality(opts[(idx - 1 + opts.length) % opts.length] as any);
                      }}
                      className="text-white hover:text-amber-300 transition-colors"
                    ><ChevronLeft className="w-8 h-8" /></button>
                    <div className="game-font text-white text-xl uppercase tracking-widest w-24 text-center">
                      {useGameStore.getState().graphicsQuality}
                    </div>
                    <button
                      onClick={() => {
                          const opts = ['low', 'medium', 'high'];
                          const current = useGameStore.getState().graphicsQuality;
                          const idx = opts.indexOf(current);
                          useGameStore.getState().setGraphicsQuality(opts[(idx + 1) % opts.length] as any);
                      }}
                      className="text-white hover:text-amber-300 transition-colors"
                    ><ChevronRight className="w-8 h-8" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'gameover' && (
          <motion.div key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none z-20 p-6 sm:p-12 pb-16 sm:pb-24 select-none"
          >
            {/* Top section: Game Over Title & Stats */}
            <div className="flex flex-col items-center mt-6 sm:mt-12 text-center">
              <motion.h2 
                initial={{ y: -50, scale: 0.5 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="text-5xl sm:text-7xl game-font text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] uppercase tracking-tighter"
              >
                GAME OVER
              </motion.h2>
              <p className="text-white font-bold text-base sm:text-lg game-font tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Distance: {Math.floor(score)}m
              </p>
            </div>

            {/* Middle section: Translucent Egg Conversion Stats */}
            <div className="max-w-xs w-full pointer-events-auto my-4">
              {(currentRunEggs.common > 0 || currentRunEggs.rare > 0 || currentRunEggs.ultraRare > 0) ? (
                 <div className="bg-black/60 border-2 border-amber-500/50 backdrop-blur-md p-4 rounded shadow-2xl text-white text-xs sm:text-sm">
                   <div className="font-bold mb-2 text-amber-400 uppercase tracking-wider text-center game-font">Conversão de Ovos</div>
                   <ul className="space-y-1">
                     {currentRunEggs.common > 0 && <li className="flex justify-between"><span>🟢 Comum ({currentRunEggs.common}):</span> <span className="font-bold text-amber-300">+{currentRunEggs.common * 50} 🪙</span></li>}
                     {currentRunEggs.rare > 0 && <li className="flex justify-between"><span>🔵 Raro ({currentRunEggs.rare}):</span> <span className="font-bold text-amber-300">+{currentRunEggs.rare * 150} 🪙</span></li>}
                     {currentRunEggs.ultraRare > 0 && <li className="flex justify-between"><span>🟣 Ultra Raro ({currentRunEggs.ultraRare}):</span> <span className="font-bold text-amber-300">+{currentRunEggs.ultraRare * 250} 🪙</span></li>}
                   </ul>
                   <hr className="border-white/10 my-2" />
                   <div className="flex justify-between font-extrabold text-amber-300 text-sm">
                     <span>Total Ganho:</span>
                     <span>+{currentRunEggs.common * 50 + currentRunEggs.rare * 150 + currentRunEggs.ultraRare * 250} 🪙</span>
                   </div>
                 </div>
              ) : (
                 <p className="text-center text-xs sm:text-sm text-white/60 bg-black/40 backdrop-blur-sm p-3 border border-white/10 rounded italic">
                   Nenhum ovo coletado nesta corrida.
                 </p>
              )}
            </div>

            {/* Bottom section: Action buttons side-by-side */}
            <div className="flex flex-row gap-4 items-center justify-center pointer-events-auto max-w-md w-full px-4">
              <button
                onClick={startGame}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white game-font py-3 sm:py-4 px-6 voxel-btn text-base sm:text-lg border-2 border-yellow-300 shadow-[0_4px_14px_rgba(245,158,11,0.4)] transition-all"
              >
                RETRY
              </button>
              <button
                onClick={() => useGameStore.getState().resetGame()}
                className="flex-1 bg-black/75 hover:bg-black/90 border-2 border-white/40 text-white transition-colors game-font py-3 sm:py-4 px-6 voxel-btn text-base sm:text-lg shadow-xl"
              >
                MENU
              </button>
            </div>
          </motion.div>
        )}

        {status === 'paused' && !devMode && (
          <motion.div key="paused"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 p-4"
          >
            <div className="text-center pointer-events-auto bg-white/95 backdrop-blur border-2 border-[#535353] p-6 sm:p-10 rounded shadow-[8px_8px_0px_#bcbcbc] max-w-[95vw] sm:max-w-sm w-full flex flex-col items-center gap-4">
              <h2 className="text-3xl sm:text-5xl game-font text-[#535353] mb-2 tracking-tighter">PAUSED</h2>
              
              <div className="flex items-center gap-4 mt-2 mb-4 w-full justify-center">
                <button
                  onClick={() => {
                    const opts = ['off', 'minimum', 'low', 'medium', 'high'] as const;
                    const idx = opts.indexOf(fogSettings[scenario]);
                    const prev = opts[(idx - 1 + opts.length) % opts.length];
                    setFogDensity(scenario, prev);
                  }}
                  className="text-[#535353] hover:text-amber-500 transition-colors"
                ><ChevronLeft className="w-6 h-6" /></button>
                <div className="game-font text-[#535353] text-base uppercase tracking-widest w-24 text-center">
                  FOG: {fogSettings[scenario] === 'off' ? 'OFF' : fogSettings[scenario] === 'minimum' ? 'MIN' : fogSettings[scenario]}
                </div>
                <button
                  onClick={() => {
                    const opts = ['off', 'minimum', 'low', 'medium', 'high'] as const;
                    const idx = opts.indexOf(fogSettings[scenario]);
                    const next = opts[(idx + 1) % opts.length];
                    setFogDensity(scenario, next);
                  }}
                  className="text-[#535353] hover:text-amber-500 transition-colors"
                ><ChevronRight className="w-6 h-6" /></button>
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
        )}
      </AnimatePresence>

      {/* 2.5D Overlay Visual Element */}
      <div className="absolute bottom-48 left-20 w-48 h-12 bg-black opacity-[0.03] rounded-full blur-xl pointer-events-none hidden md:block"></div>

      {/* Invisible Touch Areas for Mobile Controls */}
      {status === 'playing' && !devMode && (
        <div className="absolute inset-0 z-0 flex pointer-events-auto">
          <div 
            className="flex-1 h-full touch-none"
            onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); }}
            onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onPointerLeave={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onPointerCancel={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div 
            className="flex-1 h-full touch-none"
            onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); }}
            onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onPointerLeave={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onPointerCancel={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      )}

      {/* Controls Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-end pointer-events-none z-10">
        
        {/* Left Control - Duck */}
        <div className="pointer-events-auto">
          <div 
            className={`flex items-center justify-center cursor-pointer opacity-50 hover:opacity-80 select-none transition-transform duration-100 ${isDuckPressed ? 'scale-90' : 'scale-100'}`}
            onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); }}
            onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onPointerLeave={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-black/20 text-white backdrop-blur-sm border border-white/20`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            </div>
          </div>
        </div>

        {/* Right Control - Jump */}
        <div className="pointer-events-auto">
          <div 
            className={`flex items-center justify-center cursor-pointer opacity-50 hover:opacity-80 select-none transition-transform duration-100 ${isJumpPressed ? 'scale-90' : 'scale-100'}`}
            onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); }}
            onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onPointerLeave={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-black/20 text-white backdrop-blur-sm border border-white/20`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Fade Transition Overlay */}
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
        {isShopOpen && (
          <motion.div
            key="shop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 pointer-events-auto"
          >
             <div className="bg-[#f7f7f7] border-4 border-[#535353] w-full max-w-5xl h-[90vh] md:h-[80vh] rounded-lg shadow-2xl flex flex-col p-4 text-[#535353] overflow-hidden">
               {/* Shop Header */}
               <div className="flex justify-between items-center border-b-4 border-[#535353] pb-3 mb-4">
                 <h2 className="text-2xl sm:text-4xl game-font uppercase tracking-tight">Loja de Skins</h2>
                 <div className="flex items-center gap-4">
                   <div className="bg-white border-2 border-[#535353] px-3 py-1.5 rounded game-font font-bold text-sm sm:text-base text-amber-500">
                     🪙 {coins} Moedas
                   </div>
                   <button 
                     onClick={() => setIsShopOpen(false)}
                     className="bg-red-500 text-white border-2 border-black hover:bg-red-600 p-1.5 rounded transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
               </div>

               {/* Shop Body */}
               <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
                 {/* Left Column: Skins list */}
                 <div className="md:col-span-7 flex flex-col overflow-hidden">
                   <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-full pr-1.5 flex-1">
                     {SKINS.map((skin) => {
                       const isOwned = ownedSkins.includes(skin.id);
                       const isEquipped = equippedSkin === skin.id;
                       
                       // Card style
                       const cardBorderColor = isEquipped ? 'border-amber-500 bg-amber-50/50' : 'border-[#535353] hover:border-amber-500 hover:bg-gray-50';
                       const cardBorderWidth = isEquipped ? 'border-4' : 'border-2';
                       
                       return (
                         <div 
                           key={skin.id}
                           onClick={() => setSelectedSkinId(skin.id)}
                           className={`cursor-pointer rounded p-2 sm:p-3 flex flex-col items-center justify-between transition-all select-none relative ${cardBorderColor} ${cardBorderWidth}`}
                         >
                           {isEquipped && (
                             <span className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] sm:text-[10px] game-font px-1.5 py-0.5 rounded uppercase font-bold z-20">
                               Equipado
                             </span>
                           )}
                           
                           {/* Skin Name */}
                           <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center line-clamp-1 mb-1">
                             {skin.name}
                           </div>
                           
                           {/* Mini 3D Preview */}
                           <div className="w-full h-16 sm:h-20 bg-gray-100/50 rounded overflow-hidden relative border border-gray-200">
                             <Canvas dpr={1} camera={{ position: [0, 1.1, 3.2], fov: 40 }} gl={{ antialias: false }}>
                               <ambientLight intensity={1.5} />
                               <directionalLight position={[2, 2, 2]} intensity={1.5} />
                               <Dino previewMode={true} skinId={skin.id} />
                             </Canvas>
                           </div>
                           
                           {/* Price or status */}
                           <div className="text-[9px] sm:text-[11px] game-font font-bold mt-2">
                             {isOwned ? (
                               <span className="text-green-600">ADQUIRIDO</span>
                             ) : skin.rarity === 'exclusive' ? (
                               <span className="text-purple-600">EXCLUSIVA</span>
                             ) : (
                               <span className="text-amber-600">🪙 {skin.price}</span>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 {/* Right Column: Details & Actions */}
                 <div className="md:col-span-5 border-t-4 md:border-t-0 md:border-l-4 border-dashed border-[#535353] pt-4 md:pt-0 pl-0 md:pl-4 flex flex-col justify-between overflow-y-auto">
                   {(() => {
                     const selectedSkin = SKINS.find(s => s.id === selectedSkinId) || SKINS[0];
                     const isOwned = ownedSkins.includes(selectedSkin.id);
                     const isEquipped = equippedSkin === selectedSkin.id;
                     
                     // Rarity badge color
                     const badgeColor = 
                       selectedSkin.rarity === 'exclusive' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                       selectedSkin.rarity === 'legendary' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                       selectedSkin.rarity === 'ultra-rare' ? 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300' :
                       selectedSkin.rarity === 'rare' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-800 border-gray-300';
                     
                     return (
                       <div className="flex flex-col flex-1 justify-between gap-4">
                         {/* Large Visual Preview */}
                         <div className="flex flex-col items-center">
                           <div className="w-full h-40 sm:h-48 bg-gray-200/50 rounded-lg overflow-hidden border-2 border-[#535353] relative">
                             <Canvas camera={{ position: [0, 1.1, 3.5], fov: 40 }}>
                               <ambientLight intensity={1.5} />
                               <directionalLight position={[2, 2, 2]} intensity={1.5} />
                               <Dino previewMode={true} skinId={selectedSkin.id} />
                             </Canvas>
                           </div>
                           
                           {/* Details */}
                           <div className="mt-3 text-center w-full">
                             <h3 className="text-xl sm:text-2xl game-font uppercase">{selectedSkin.name}</h3>
                             <span className={`inline-block border text-[10px] sm:text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full mt-1.5 tracking-widest ${badgeColor}`}>
                               {selectedSkin.rarity === 'ultra-rare' ? 'Ultra Rara' : selectedSkin.rarity}
                             </span>
                           </div>
                         </div>
                         
                         {/* Action Buttons */}
                         <div className="flex flex-col gap-3 mt-auto">
                           {isOwned ? (
                             <button
                               disabled={isEquipped}
                               onClick={() => {
                                 useGameStore.getState().equipSkin(selectedSkin.id);
                               }}
                               className={`w-full py-2.5 sm:py-3 game-font text-sm sm:text-base font-bold transition-all voxel-btn ${
                                 isEquipped 
                                   ? 'bg-amber-500 text-white cursor-default shadow-none pointer-events-none' 
                                   : 'bg-[#535353] text-white hover:bg-black'
                               }`}
                             >
                               {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                             </button>
                           ) : selectedSkin.rarity === 'exclusive' ? (
                             <div className="text-center bg-purple-50 border border-purple-200 p-2.5 rounded text-xs text-purple-700 italic">
                               Esta skin é exclusiva e não pode ser comprada. Resgate usando um código promocional abaixo!
                             </div>
                           ) : (
                             <button
                               onClick={() => {
                                 const success = useGameStore.getState().buySkin(selectedSkin.id);
                                 if (success) {
                                   useGameStore.getState().addFloatingText('COMPRADO!', 0, 5, 0, '#22c55e');
                                 } else {
                                   alert('Moedas insuficientes!');
                                 }
                               }}
                               className="w-full py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-white game-font text-sm sm:text-base font-bold transition-all voxel-btn"
                             >
                               COMPRAR - 🪙 {selectedSkin.price}
                             </button>
                           )}

                           {/* Coupon Redeem Input */}
                           <div className="border-t border-[#535353]/20 pt-3 mt-1 flex flex-col gap-1.5">
                             <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Resgatar Código Especial:</label>
                             <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 value={couponCode}
                                 onChange={(e) => setCouponCode(e.target.value)}
                                 placeholder="Código Especial"
                                 className="flex-1 border-2 border-[#535353] px-2.5 py-1 sm:py-1.5 game-font text-xs bg-white rounded focus:outline-none placeholder-gray-400"
                               />
                               <button
                                 onClick={() => {
                                   if (!couponCode) return;
                                   const cleanCoupon = couponCode.trim();
                                   const ok = useGameStore.getState().redeemCode(cleanCoupon);
                                   if (ok) {
                                      useGameStore.getState().addFloatingText('CÓDIGO ACEITO!', 0, 5, 0, '#a855f7');
                                      setCouponCode('');
                                      if (cleanCoupon.toUpperCase() === 'EXCLUSIVEPRIDE#0507D') {
                                         setSelectedSkinId('dino-kitsune');
                                         useGameStore.getState().equipSkin('dino-kitsune');
                                      } else if (['PATO', 'QUACK', 'DUCKDINO'].includes(cleanCoupon.toUpperCase())) {
                                         setSelectedSkinId('dino-duck');
                                         useGameStore.getState().equipSkin('dino-duck');
                                      } else if (['JEFF', 'SHARK', 'SHARKDINO'].includes(cleanCoupon.toUpperCase())) {
                                         setSelectedSkinId('dino-shark');
                                         useGameStore.getState().equipSkin('dino-shark');
                                      } else {
                                         setSelectedSkinId('dino-rainbow');
                                         useGameStore.getState().equipSkin('dino-rainbow');
                                      }
                                   } else {
                                      alert('Código inválido ou já resgatado!');
                                   }
                                 }}
                                 className="bg-[#535353] text-white hover:bg-black px-3.5 py-1 sm:py-1.5 rounded game-font text-xs font-bold transition-colors"
                               >
                                 OK
                               </button>
                             </div>
                           </div>

                           {/* Egg Converter Conversion rate explanation box */}
                           <div className="bg-gray-100 border border-gray-300 p-2.5 rounded text-[10px] text-gray-500 leading-tight">
                             <div className="font-bold text-gray-700 mb-0.5">🪙 RECOMPENSAS DE OVOS:</div>
                             <div>🟢 Comum = 50 moedas | 🔵 Raro = 150 moedas | 🟣 Ultra Raro = 250 moedas</div>
                             <div className="mt-1 italic">Os ovos coletados em jogo são automaticamente convertidos no final da corrida!</div>
                           </div>
                         </div>
                       </div>
                     );
                   })()}
                 </div>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
