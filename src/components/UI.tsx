import { useEffect, useState, useRef } from 'react';
import { useGameStore, SKINS, LEVELS, SkinConfig } from '../store/gameStore';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Camera, Settings, X } from 'lucide-react';
import { playBackgroundMusic, stopBackgroundMusic, pauseBackgroundMusic } from '../utils/audio';
import { Canvas, useFrame } from '@react-three/fiber';
import { Dino } from './Dino';
import * as THREE from 'three';

function RotatingDinoPreview({ skinId }: { skinId: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.0;
    }
  });
  return (
    <group ref={ref} position={[0, -0.25, 0]} scale={0.9}>
      <Dino previewMode={true} skinId={skinId} />
    </group>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill={filled ? "#f1c40f" : "rgba(0,0,0,0.15)"} 
      className="w-3 h-3 md:w-4 md:h-4 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function MiniDinoPixelArt({ skin }: { skin: SkinConfig }) {
  const base = skin.baseColor;
  const spots = skin.spotsColor;
  const spikes = skin.spikesColor;
  const collar = skin.collarColor;
  
  const grid = [
    ['O', 'O', 'P', 'B', 'B', 'B', 'B', 'O'],
    ['O', 'P', 'B', 'B', 'B', 'E', 'B', 'O'],
    ['P', 'B', 'S', 'B', 'B', 'K', 'B', 'O'],
    ['O', 'B', 'B', 'B', 'B', 'B', 'B', 'O'],
    ['O', 'O', 'B', 'B', 'B', 'O', 'O', 'O'],
    ['O', 'O', 'C', 'C', 'C', 'O', 'O', 'O'],
    ['O', 'O', 'B', 'S', 'B', 'O', 'O', 'O'],
    ['O', 'O', 'B', 'B', 'B', 'O', 'O', 'O'],
  ];

  return (
    <svg viewBox="0 0 8 8" className="w-12 h-12 md:w-14 md:h-14" style={{ imageRendering: 'pixelated' }}>
      {grid.map((row, y) => 
        row.map((cell, x) => {
          if (cell === 'O') return null;
          let color = base;
          if (cell === 'S') color = spots;
          if (cell === 'P') color = spikes;
          if (cell === 'C') color = collar;
          if (cell === 'E') color = '#ffffff';
          if (cell === 'K') color = '#000000';
          
          if (skin.isRainbow) {
            const hues = [0, 45, 90, 135, 180, 225, 270, 315];
            if (cell !== 'E' && cell !== 'K') {
              color = `hsl(${hues[(x + y) % 8]}, 90%, 55%)`;
            }
          }
          
          return (
            <rect 
              key={`${x}-${y}`} 
              x={x} 
              y={y} 
              width="1.02" 
              height="1.02" 
              fill={color} 
            />
          );
        })
      )}
    </svg>
  );
}

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
    <div className="w-16 sm:w-24 h-2 bg-black/30 rounded-none overflow-hidden border border-amber-500/20">
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
  const [levelPage, setLevelPage] = useState(0);

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

  const { status, score, highScore, speed, startGame, cameraMode, setCameraMode, activePowerup, cinematicPowerup, scenario, setScenario, difficulty, setDifficulty, lives, isTransitioning, transitionStartTime, gameTime, coldTimer, fogSettings, setFogDensity, dinoColor, setDinoColor, devMode, setDevMode, coins, ownedSkins, equippedSkin, currentRunEggs, currentLevelId, highestUnlockedLevelId, levelStars, levelHighScores, selectLevel } = useGameStore();

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
      <div className="flex justify-between items-start p-4 sm:p-8 z-10 relative">
        {/* Level Progress Bar (Middle Top) */}
        {status === 'playing' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none">
             <span className="game-font font-black text-[9px] md:text-xs text-white bg-slate-900/80 px-4 py-1 rounded-xl shadow border border-slate-700/25 uppercase tracking-wider backdrop-blur-sm">
               PROGRESSO: {Math.floor(score)} / {LEVELS.find(l => l.id === currentLevelId)?.maxScore || 10000}m
             </span>
             <div className="w-40 md:w-60 h-2.5 bg-black/40 border border-white/20 rounded-none overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-100"
                  style={{ width: `${Math.min(100, (score / (LEVELS.find(l => l.id === currentLevelId)?.maxScore || 10000)) * 100)}%` }}
                />
             </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          {status !== 'playing' && status !== 'paused' && (
            <>
              <h1 className="text-xl sm:text-4xl game-font tracking-tighter text-[var(--game-ui-color)]">VOXEL DINO 3D</h1>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] opacity-40 text-[var(--game-ui-color)]">Procedural {scenario} v1.0</p>
            </>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-4 sm:gap-6 game-font text-xs sm:text-lg text-[var(--game-ui-color)]">
            {/* Scores & Coins & Eggs */}
            <div className="flex flex-col items-end gap-1 game-font">
              {(currentRunEggs.common > 0 || currentRunEggs.rare > 0 || currentRunEggs.ultraRare > 0) && (
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
      )}

      <AnimatePresence>
        {status === 'menu' && !devMode && (
          <motion.div key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-20"
          >
            {/* Top-Right: Settings Button */}
            <div className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-3">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-[#5c3a21] hover:bg-[#8c6239] active:translate-y-[2px] text-[#fdf6e2] p-2.5 rounded-xl border-4 border-[#8c6239] shadow-lg cursor-pointer transition-all"
                title="Opções"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom-Left (Desktop) / Top-Left (Mobile): Floating Skin Selector Card */}
            <div className="absolute top-4 left-4 md:top-auto md:bottom-4 w-48 md:w-56 z-20 pointer-events-auto bg-[#fdf6e2] rounded-[20px] border-4 md:border-8 border-[#8c6239] border-double p-2.5 md:p-3.5 flex flex-col items-center shadow-2xl pt-5 md:pt-6">
              {/* Wooden Board Header */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#5c3a21] text-[#fdf6e2] font-black text-[8px] md:text-[10px] px-4 py-1 rounded-xl shadow border border-[#8c6239] game-font uppercase tracking-wider text-center whitespace-nowrap z-25">
                Escolha sua Skin
              </div>

              <div className="my-1 w-full flex flex-col items-center bg-[#fdfdf7] border-2 md:border-4 border-[#8c6239]/40 rounded-xl p-2 md:p-3 shadow-inner">
                {/* Skin Selector Switcher */}
                <div className="flex items-center justify-between w-full max-w-[140px] md:max-w-[170px] mb-2">
                  <button
                    onClick={() => {
                      const ownedList = ownedSkins;
                      const idx = ownedList.indexOf(equippedSkin);
                      const prevIdx = (idx - 1 + ownedList.length) % ownedList.length;
                      useGameStore.getState().equipSkin(ownedList[prevIdx]);
                    }}
                    className="bg-[#8c6239] hover:bg-[#5c3a21] active:translate-y-[1px] text-white p-0.5 rounded transition-all cursor-pointer shadow"
                  >
                    <ChevronLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                  <div className="font-extrabold game-font text-[8px] md:text-[10px] text-[#5c3a21] uppercase tracking-tight w-20 md:w-24 text-center line-clamp-1">
                    {SKINS.find(s => s.id === equippedSkin)?.name || 'Default'}
                  </div>
                  <button
                    onClick={() => {
                      const ownedList = ownedSkins;
                      const idx = ownedList.indexOf(equippedSkin);
                      const nextIdx = (idx + 1) % ownedList.length;
                      useGameStore.getState().equipSkin(ownedList[nextIdx]);
                    }}
                    className="bg-[#8c6239] hover:bg-[#5c3a21] active:translate-y-[1px] text-white p-0.5 rounded transition-all cursor-pointer shadow"
                  >
                    <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </button>
                </div>

                {/* 3D Dino Rotating Preview Box */}
                <div className="w-full max-w-[100px] md:max-w-[130px] aspect-[4/3] bg-white rounded-lg border border-[#8c6239]/20 shadow-inner relative overflow-hidden flex items-center justify-center">
                  <Canvas dpr={1} camera={{ position: [0, 1.1, 3.2], fov: 40 }} className="w-full h-full">
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[2, 2, 2]} intensity={1.5} />
                    <RotatingDinoPreview skinId={equippedSkin} />
                  </Canvas>
                </div>

                <button 
                  onClick={() => setIsShopOpen(true)}
                  className="w-full mt-2 bg-[#e67e22] hover:bg-[#d35400] text-white game-font text-[9px] md:text-[10px] font-black py-1 rounded-lg shadow border-b-2 md:border-b-4 border-[#a04000] cursor-pointer transition-all active:border-b-0 active:translate-y-[2px]"
                >
                  LOJA DE SKINS
                </button>
              </div>
            </div>

            {/* Bottom-Center: Map Cards Grid + JOGAR Button */}
            <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3 z-20 pointer-events-auto w-full max-w-[95vw] md:max-w-2xl">
              
              {/* Medieval Cartoon JOGAR Button */}
              <button
                onClick={startGame}
                className="bg-[#27ae60] hover:bg-[#2ecc71] active:translate-y-[2px] text-[#fdf6e2] transition-all game-font py-1.5 md:py-2.5 px-6 md:px-8 rounded-xl md:rounded-2xl text-xs md:text-base font-black border-2 md:border-4 border-[#8c6239] border-b-4 md:border-b-6 border-b-[#1e8449] shadow-lg cursor-pointer flex items-center gap-2 uppercase tracking-wider bg-gradient-to-b from-[#2ecc71] to-[#27ae60] active:border-b-2"
              >
                JOGAR LV-{LEVELS.find(l => l.id === currentLevelId)?.levelNumber || 1}
              </button>

              {/* Levels Selection Panel */}
              <div className="w-full bg-[#fdf6e2] border-4 md:border-8 border-[#8c6239] border-double p-2.5 md:p-4 pointer-events-auto flex flex-col justify-between overflow-hidden shadow-2xl rounded-2xl md:rounded-[24px] relative pt-5 md:pt-6">
                {/* Overlapping badge */}
                <div className="absolute -top-3.5 left-4 md:-top-4 md:left-6 bg-[#5c3a21] text-[#fdf6e2] font-black text-[7px] md:text-[10px] px-3.5 py-1 md:px-5 md:py-1.5 rounded-lg md:rounded-xl shadow border border-[#8c6239] game-font uppercase tracking-widest text-center whitespace-nowrap z-25">
                  FASES DO JOGO
                </div>

                {/* Cards Container */}
                <div className="flex items-center overflow-x-auto gap-2.5 md:gap-4 pb-1 md:pb-2 scrollbar-thin scrollbar-thumb-[#8c6239] scrollbar-track-[#fdf6e2] py-1.5 mt-0.5">
                  {(() => {
                    const levelsPerPage = 7;
                    const levelsToShow = LEVELS.slice(levelPage * levelsPerPage, (levelPage + 1) * levelsPerPage);
                    return levelsToShow.map((level) => {
                      const prevLevel = LEVELS.find(l => l.map === level.map && l.levelNumber === level.levelNumber - 1);
                      const isUnlocked = level.levelNumber === 1 || (prevLevel && (levelStars[prevLevel.id] || 0) > 0);
                      const isSelected = level.id === currentLevelId;
                      const stars = levelStars[level.id] || 0;
                      
                      let cardBg = "from-[#f39c12] to-[#e67e22] text-[#fdf6e2]";
                      let badgeColor = "bg-[#d35400] text-white";
                      let illustration = null;
                      
                      if (level.map === 'desert') {
                        cardBg = "from-[#f39c12] to-[#e67e22] text-[#fdf6e2]";
                        badgeColor = "bg-[#d35400] text-white border-[#e67e22]";
                        illustration = (
                          <div className="w-full h-8 md:h-10 relative overflow-hidden bg-amber-300/40 rounded-md mb-1 pointer-events-none border border-[#8c6239]/10">
                            <div className="absolute bottom-0 left-[10%] border-l-[15px] border-r-[15px] border-b-[20px] md:border-l-[18px] md:border-r-[18px] md:border-b-[24px] border-l-transparent border-r-transparent border-b-amber-600/40" />
                            <div className="absolute bottom-0 left-[45%] border-l-[18px] border-r-[18px] border-b-[26px] md:border-l-[22px] md:border-r-[22px] md:border-b-[32px] border-l-transparent border-r-transparent border-b-amber-700/40" />
                            <div className="absolute bottom-0.5 right-[18%] w-1.5 h-4 md:h-5 bg-emerald-500 rounded-sm scale-75 md:scale-100">
                              <div className="absolute bottom-1.5 -left-1 w-2 h-1 bg-emerald-500 rounded-sm" />
                              <div className="absolute bottom-1.5 -right-1 w-2 h-1 bg-emerald-500 rounded-sm" />
                            </div>
                          </div>
                        );
                      } else if (level.map === 'forest') {
                        cardBg = "from-[#27ae60] to-[#1e8449] text-[#fdf6e2]";
                        badgeColor = "bg-[#196f3d] text-white border-[#27ae60]";
                        illustration = (
                          <div className="w-full h-8 md:h-10 relative overflow-hidden bg-emerald-300/20 rounded-md mb-1 pointer-events-none border border-[#8c6239]/10">
                            <div className="absolute bottom-0 left-[20%] flex flex-col items-center scale-75 md:scale-100 origin-bottom">
                              <div className="w-0.5 h-2 bg-amber-800" />
                              <div className="absolute bottom-1.5 border-l-[10px] border-r-[10px] border-b-[8px] border-l-transparent border-r-transparent border-b-emerald-700" />
                              <div className="absolute bottom-2.5 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-emerald-600" />
                            </div>
                            <div className="absolute bottom-0 right-[25%] flex flex-col items-center scale-75 md:scale-100 origin-bottom">
                              <div className="w-0.5 h-2 bg-amber-800" />
                              <div className="absolute bottom-1.5 border-l-[8px] border-r-[8px] border-b-[7px] border-l-transparent border-r-transparent border-b-emerald-800" />
                            </div>
                          </div>
                        );
                      } else if (level.map === 'swamp') {
                        cardBg = "from-[#16a085] to-[#117a65] text-[#fdf6e2]";
                        badgeColor = "bg-[#0e6251] text-white border-[#16a085]";
                        illustration = (
                          <div className="w-full h-8 md:h-10 relative overflow-hidden bg-zinc-400/25 rounded-md mb-1 pointer-events-none border border-[#8c6239]/10">
                            <div className="absolute bottom-0 left-[25%] w-1 h-4 md:h-5 bg-neutral-700" />
                            <div className="absolute bottom-2.5 left-[15%] w-4 h-4 md:w-5 md:h-5 rounded-full bg-teal-800/80" />
                            <div className="absolute bottom-0 right-[25%] w-0.5 h-3 md:h-4 bg-neutral-800" />
                            <div className="absolute bottom-2 right-[18%] w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-teal-950/80" />
                          </div>
                        );
                      } else if (level.map === 'snow') {
                        cardBg = "from-[#2980b9] to-[#2c3e50] text-[#fdf6e2]";
                        badgeColor = "bg-[#1f618d] text-white border-[#2980b9]";
                        illustration = (
                          <div className="w-full h-8 md:h-10 relative overflow-hidden bg-sky-200/40 rounded-md mb-1 pointer-events-none border border-[#8c6239]/10">
                            <div className="absolute bottom-0 left-[20%] border-l-[11px] border-r-[11px] border-b-[16px] md:border-l-[14px] md:border-r-[14px] md:border-b-[20px] border-l-transparent border-r-transparent border-b-slate-400">
                              <div className="absolute bottom-[-16px] md:bottom-[-20px] left-[-5px] md:left-[-6px] border-l-[5px] md:border-l-[6px] border-r-[5px] md:border-r-[6px] border-b-[7px] md:border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
                            </div>
                            <div className="absolute bottom-0 right-[20%] border-l-[14px] border-r-[14px] border-b-[20px] md:border-l-[18px] md:border-r-[18px] md:border-b-[25px] border-l-transparent border-r-transparent border-b-slate-500">
                              <div className="absolute bottom-[-20px] md:bottom-[-25px] left-[-6px] md:left-[-7px] border-l-[6px] md:border-l-[7px] border-r-[6px] md:border-r-[7px] border-b-[8px] md:border-b-[10px] border-l-transparent border-r-transparent border-b-white" />
                            </div>
                          </div>
                        );
                      }

                      const borderClass = isSelected 
                        ? "border-[#f1c40f] ring-2 md:ring-4 ring-[#f1c40f]/60 scale-105 shadow-xl" 
                        : "hover:scale-102 hover:border-[#8c6239]/60 border-[#8c6239]/30";
                      
                      return (
                        <div
                          key={level.id}
                          onClick={() => isUnlocked && selectLevel(level.id)}
                          className={`flex-shrink-0 w-16 h-16 md:w-24 md:h-24 aspect-square rounded-xl md:rounded-2xl border-2 md:border-4 p-1 md:p-2 bg-gradient-to-br ${cardBg} flex flex-col justify-between items-center transition-all relative ${borderClass} ${isUnlocked ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                        >
                          {/* Locked Mask */}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center z-10">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white md:w-4 md:h-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </div>
                          )}

                          {/* Level Badge Header */}
                          <div className={`text-[6px] md:text-[8px] game-font px-1 py-0.5 rounded-[6px] font-black uppercase tracking-wider ${badgeColor} text-center w-full line-clamp-1 border`}>
                            {level.map}-{level.levelNumber}
                          </div>

                          {/* Dynamic CSS Illustration */}
                          {illustration}

                          {/* SVG Stars */}
                          <div className="flex gap-0.5 justify-center mt-auto w-full">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <StarIcon key={i} filled={i < stars} />
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-center items-center gap-4 mt-2">
                  <button
                    disabled={levelPage === 0}
                    onClick={() => setLevelPage(0)}
                    className="text-[#8c6239] hover:text-[#5c3a21] disabled:opacity-30 disabled:hover:text-[#8c6239] game-font text-xs uppercase cursor-pointer font-extrabold"
                  >
                    &lt; Anterior
                  </button>
                  <span className="text-[#8c6239]/80 text-xs game-font font-bold">
                    Página {levelPage + 1} de 2
                  </span>
                  <button
                    disabled={levelPage === 1}
                    onClick={() => setLevelPage(1)}
                    className="text-[#8c6239] hover:text-[#5c3a21] disabled:opacity-30 disabled:hover:text-[#8c6239] game-font text-xs uppercase cursor-pointer font-extrabold"
                  >
                    Próximo &gt;
                  </button>
                </div>
              </div>
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
                  <span className="game-font text-white/70 text-sm tracking-widest uppercase">Qualidade</span>
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

        {status === 'levelcleared' && (
          <motion.div key="levelcleared"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/70 backdrop-blur-sm z-30 p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-[#fdf6e2] border-8 border-[#8c6239] border-double p-8 max-w-sm w-full rounded-[24px] shadow-2xl flex flex-col items-center text-[#5c3a21] relative select-none pt-10"
            >
              {/* Wooden Board Header */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#5c3a21] text-[#fdf6e2] font-black text-sm md:text-base px-8 py-2 rounded-2xl shadow-lg border-4 border-[#8c6239] game-font uppercase tracking-widest text-center whitespace-nowrap z-25">
                NÍVEL CONCLUÍDO
              </div>

              {/* Banner gap */}
              <div className="h-4 w-full" />
              
              {/* Flat Stars representation */}
              <div className="flex gap-4 my-6 justify-center">
                 {Array.from({ length: 3 }).map((_, i) => {
                   const stars = levelStars[currentLevelId] || 0;
                   const earned = i < stars;
                   return (
                     <motion.div
                       key={i}
                       initial={{ scale: 0, rotate: -20 }}
                       animate={earned ? { scale: [0, 1.25, 1], rotate: 0 } : { scale: 1, opacity: 0.3 }}
                       transition={{ delay: i * 0.25, type: 'spring', damping: 10 }}
                       className="w-12 h-12 flex items-center justify-center"
                     >
                       <svg 
                         xmlns="http://www.w3.org/2000/svg" 
                         viewBox="0 0 24 24" 
                         fill={earned ? "#f1c40f" : "#bdc3c7"} 
                         className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                       >
                         <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                       </svg>
                     </motion.div>
                   );
                 })}
              </div>

              <div className="text-center w-full mb-6">
                <p className="font-extrabold uppercase game-font text-xs tracking-widest text-[#8c6239] mb-1">Pontuação Final</p>
                <h3 className="text-2xl md:text-3xl font-black game-font tracking-tighter text-[#5c3a21]">
                  {Math.floor(score).toString().padStart(5, '0')}m
                </h3>
              </div>

              {/* Coins gained card */}
              <div className="w-full bg-[#fdfdf7] border-4 border-[#8c6239]/40 rounded-2xl p-3 mb-6 text-center text-xs md:text-sm font-bold text-[#8c6239] shadow-inner">
                 <span className="text-[#e67e22]">🪙 Moedas ganhas:</span> +{
                   currentRunEggs.common * 50 + currentRunEggs.rare * 150 + currentRunEggs.ultraRare * 250
                 }
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <button
                  onClick={() => useGameStore.getState().resetGame()}
                  className="flex-1 bg-[#7f8c8d] hover:bg-[#95a5a6] active:translate-y-[4px] text-white transition-all game-font py-3 rounded-xl font-black text-xs cursor-pointer shadow border-b-4 border-[#5d6d7e] active:border-b-0"
                >
                  MENU
                </button>
                <button
                  onClick={startGame}
                  className="flex-1 bg-[#e67e22] hover:bg-[#d35400] active:translate-y-[4px] text-white transition-all game-font py-3 rounded-xl font-black text-xs cursor-pointer shadow border-b-4 border-[#a04000] active:border-b-0"
                >
                  REPETIR
                </button>
                {currentLevelId < LEVELS.length && (
                  <button
                    onClick={() => {
                      const nextLvl = currentLevelId + 1;
                      const nextLvlConfig = LEVELS.find(l => l.id === nextLvl);
                      const prevLevelOfNext = nextLvlConfig ? LEVELS.find(l => l.map === nextLvlConfig.map && l.levelNumber === nextLvlConfig.levelNumber - 1) : null;
                      const nextLvlUnlocked = nextLvlConfig && (nextLvlConfig.levelNumber === 1 || (prevLevelOfNext && (levelStars[prevLevelOfNext.id] || 0) > 0));
                      if (nextLvlUnlocked) {
                         useGameStore.getState().selectLevel(nextLvl);
                         startGame();
                      } else {
                         alert("Complete este nível para liberar o próximo!");
                      }
                    }}
                    className="flex-1 bg-[#27ae60] hover:bg-[#2ecc71] active:translate-y-[4px] text-white transition-all game-font py-3 rounded-xl font-black text-xs cursor-pointer shadow border-b-4 border-[#1e8449] active:border-b-0"
                  >
                    AVANÇAR
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 pointer-events-auto"
          >
             <div className="bg-[#fdf6e2] border-8 border-double border-[#8c6239] w-full max-w-5xl h-[90vh] md:h-[80vh] rounded-[24px] shadow-2xl flex flex-col p-4 sm:p-6 text-[#5c3a21] overflow-hidden relative pt-10 sm:pt-12">
               
               {/* Wooden Board Header */}
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5c3a21] text-[#fdf6e2] font-black text-sm sm:text-base px-8 py-2 rounded-2xl shadow-lg border-4 border-[#8c6239] game-font uppercase tracking-widest text-center whitespace-nowrap z-25">
                 LOJA DE SKINS
               </div>

               {/* Shop Header Row */}
               <div className="flex justify-between items-center border-b-2 border-[#8c6239]/20 pb-3 mb-4 mt-2 sm:mt-0">
                 <div></div> {/* Spacer */}
                 <div className="flex items-center gap-4">
                   <div className="bg-[#fdfdf7] border-4 border-[#8c6239]/40 px-4 py-1.5 rounded-xl game-font font-black text-xs sm:text-sm text-[#e67e22] shadow-inner">
                     🪙 {coins} Moedas
                   </div>
                   <button 
                     onClick={() => setIsShopOpen(false)}
                     className="bg-[#ef4444] hover:bg-[#d32f2f] active:translate-y-[2px] text-white border-2 border-black/30 p-1.5 rounded-xl transition-all cursor-pointer shadow"
                   >
                     <X className="w-4 h-4 sm:w-5 sm:h-5" />
                   </button>
                 </div>
               </div>

               {/* Shop Body */}
               <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
                 {/* Left Column: Skins list */}
                 <div className="md:col-span-7 flex flex-col overflow-hidden">
                   <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-full pr-1.5 flex-1 scrollbar-thin scrollbar-thumb-[#8c6239] scrollbar-track-[#fdf6e2]">
                     {SKINS.map((skin) => {
                       const isOwned = ownedSkins.includes(skin.id);
                       const isEquipped = equippedSkin === skin.id;
                       const isSelected = selectedSkinId === skin.id;
                       
                       // Card style
                       const cardBorder = isSelected 
                         ? 'border-[#f1c40f] ring-4 ring-[#f1c40f]/60' 
                         : 'border-[#8c6239]/30 hover:border-[#8c6239]/60 hover:bg-[#fdfdf7]/50';
                       
                       return (
                         <div 
                           key={skin.id}
                           onClick={() => setSelectedSkinId(skin.id)}
                           className={`cursor-pointer bg-[#fdfdf7] rounded-xl border-4 p-2.5 sm:p-3 flex flex-col items-center justify-between transition-all select-none relative gap-1 border-double ${cardBorder}`}
                         >
                           {isEquipped && (
                             <span className="absolute top-1 right-1 bg-[#5c3a21] text-[#fdf6e2] text-[7px] sm:text-[9px] game-font px-1.5 py-0.5 rounded-lg border border-[#8c6239] uppercase font-bold z-20 shadow">
                               Equipado
                             </span>
                           )}
                           
                           {/* Skin Name */}
                           <div className="text-[9px] sm:text-[11px] game-font font-black uppercase tracking-tight text-center line-clamp-1 mb-1 text-[#5c3a21]">
                             {skin.name}
                           </div>
                           
                           {/* Mini 2D SVG Pixel Preview */}
                           <div className="w-full h-16 sm:h-20 bg-white rounded-lg overflow-hidden relative border border-[#8c6239]/15 shadow-inner flex items-center justify-center p-1">
                             <MiniDinoPixelArt skin={skin} />
                           </div>
                           
                           {/* Price or status */}
                           <div className="text-[8px] sm:text-[10px] game-font font-bold mt-2">
                             {isOwned ? (
                               <span className="text-[#27ae60]">ADQUIRIDO</span>
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
                 <div className="md:col-span-5 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#8c6239]/20 pt-4 md:pt-0 pl-0 md:pl-4 flex flex-col justify-between overflow-y-auto">
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
                           <div className="w-full h-40 sm:h-48 bg-white rounded-2xl overflow-hidden border-4 border-[#8c6239] relative shadow-inner">
                             <Canvas camera={{ position: [0, 1.1, 3.5], fov: 40 }}>
                               <ambientLight intensity={1.5} />
                               <directionalLight position={[2, 2, 2]} intensity={1.5} />
                               <Dino previewMode={true} skinId={selectedSkin.id} />
                             </Canvas>
                           </div>
                           
                           {/* Details */}
                           <div className="mt-3 text-center w-full">
                             <h3 className="text-lg sm:text-xl game-font font-black uppercase text-[#5c3a21]">{selectedSkin.name}</h3>
                             <span className={`inline-block border text-[9px] sm:text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mt-1.5 tracking-widest ${badgeColor}`}>
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
                               className={`w-full py-2.5 sm:py-3 game-font text-xs sm:text-sm font-black rounded-xl cursor-pointer transition-all border-b-4 ${
                                 isEquipped 
                                   ? 'bg-amber-500 text-white cursor-default shadow-none pointer-events-none border-b-0' 
                                   : 'bg-[#27ae60] hover:bg-[#2ecc71] text-white border-[#196f3d] active:border-b-0 active:translate-y-[4px]'
                               }`}
                             >
                               {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                             </button>
                           ) : selectedSkin.rarity === 'exclusive' ? (
                             <div className="text-center bg-[#fdfdf7] border-2 border-purple-300 p-2.5 rounded-xl text-[10px] text-purple-700 italic shadow-inner">
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
                               className="w-full py-2.5 sm:py-3 bg-[#e67e22] hover:bg-[#d35400] text-white game-font text-xs sm:text-sm font-black rounded-xl border-b-4 border-[#a04000] cursor-pointer transition-all active:border-b-0 active:translate-y-[4px]"
                             >
                               COMPRAR - 🪙 {selectedSkin.price}
                             </button>
                           )}

                           {/* Coupon Redeem Input */}
                           <div className="border-t border-[#8c6239]/20 pt-3 mt-1 flex flex-col gap-1.5">
                             <label className="text-[9px] sm:text-[10px] font-black text-[#8c6239] uppercase">Resgatar Código Especial:</label>
                             <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 value={couponCode}
                                 onChange={(e) => setCouponCode(e.target.value)}
                                 placeholder="Insira o Código"
                                 className="flex-1 border-2 border-[#8c6239]/40 focus:border-[#8c6239] px-2.5 py-1.5 game-font text-xs bg-white rounded-lg focus:outline-none placeholder-gray-400 font-bold text-[#5c3a21] transition-colors"
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
                                 className="bg-[#5c3a21] hover:bg-[#8c6239] active:translate-y-[1px] text-[#fdf6e2] px-4 py-1.5 rounded-lg game-font text-xs font-black border border-[#8c6239] cursor-pointer transition-all shadow"
                               >
                                 OK
                               </button>
                             </div>
                           </div>

                           {/* Egg Converter Conversion rate explanation box */}
                           <div className="bg-[#fdfdf7] border-2 border-[#8c6239]/30 p-2.5 rounded-xl text-[8px] sm:text-[10px] text-[#8c6239] leading-tight shadow-inner mt-2">
                             <div className="font-black text-[#5c3a21] mb-0.5">🪙 RECOMPENSAS DE OVOS:</div>
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
