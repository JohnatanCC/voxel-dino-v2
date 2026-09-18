import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Settings, Boxes } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { useGameStore, SKINS } from '../../store/gameStore';
import { RotatingDinoPreview, DinoCoinIcon, DinoFaceIcon } from './shared';
import { GAME_VERSION } from '../../config/version';

interface MainMenuProps {
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenExtra: () => void;
}

export function MainMenu({ onOpenSettings, onOpenShop, onOpenExtra }: MainMenuProps) {
  const { startGame, ownedSkins, equippedSkin, enterTestRoom, coins } = useGameStore();

  return (
    <motion.div key="menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none z-20"
    >
      {/* Logo (Top Left) */}
      <div className="absolute top-3 left-3 md:top-5 md:left-5 z-20 pointer-events-none select-none flex items-center gap-1.5">
        <DinoFaceIcon className="w-7 h-7 sm:w-8 sm:h-8 md:w-11 md:h-11 shrink-0 drop-shadow-[2px_3px_0_#5c3a21]" />
        <div>
          <div className="leading-[0.85]">
            <div
              className="menu-logo-text game-font font-black text-white text-lg sm:text-xl md:text-3xl uppercase tracking-tight"
              style={{ WebkitTextStroke: '2px #5c3a21', textShadow: '2px 3px 0 #5c3a21' }}
            >
              Voxel
            </div>
            <div
              className="menu-logo-text game-font font-black text-[#fbbf24] text-lg sm:text-xl md:text-3xl uppercase tracking-tight"
              style={{ WebkitTextStroke: '2px #5c3a21', textShadow: '2px 3px 0 #5c3a21' }}
            >
              Dino
            </div>
          </div>
          <div
            className="game-font font-black text-[10px] md:text-xs text-[#fdf6e2] tracking-widest mt-1.5 leading-none"
            style={{ textShadow: '1px 1px 0 #5c3a21' }}
          >
            v{GAME_VERSION}
          </div>
        </div>
      </div>

      {/* Dino Coin balance (Top Right) */}
      <div className="absolute top-3 right-3 md:top-5 md:right-5 z-20 pointer-events-auto">
        <div className="menu-coin-badge flex items-center gap-1.5 bg-[#fdf6e2] border-2 md:border-4 border-[#8c6239] px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-xl shadow-lg">
          <DinoCoinIcon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
          <span className="game-font font-black text-[11px] md:text-sm text-[#e67e22]">{coins}</span>
        </div>
      </div>

      {/* Character Card (Top Left, below logo on mobile / Bottom Left on desktop) */}
      <div className="menu-char-card absolute top-16 left-3 md:top-auto md:bottom-5 md:left-5 w-36 sm:w-44 md:w-56 z-20 pointer-events-auto bg-[#fdf6e2] rounded-[20px] border-4 md:border-8 border-[#8c6239] border-double p-2 md:p-3.5 flex flex-col items-center shadow-2xl pt-4 md:pt-6">
        {/* Wooden Board Header */}
        <div className="menu-char-card-label absolute -top-3 md:-top-3.5 left-1/2 -translate-x-1/2 bg-[#5c3a21] text-[#fdf6e2] font-black text-[7px] md:text-[10px] px-3 md:px-4 py-0.5 md:py-1 rounded-lg md:rounded-xl shadow border border-[#8c6239] game-font uppercase tracking-wider text-center whitespace-nowrap z-25">
          Personagem
        </div>

        <div className="my-1 w-full flex flex-col items-center bg-[#fdfdf7] border-2 md:border-4 border-[#8c6239]/40 rounded-xl p-1.5 md:p-3 shadow-inner">
          {/* Skin Selector Switcher */}
          <div className="flex items-center justify-between w-full max-w-[110px] md:max-w-[170px] mb-1 md:mb-2">
            <button
              onClick={() => {
                const idx = ownedSkins.indexOf(equippedSkin);
                const prevIdx = (idx - 1 + ownedSkins.length) % ownedSkins.length;
                useGameStore.getState().equipSkin(ownedSkins[prevIdx]);
              }}
              className="bg-[#8c6239] hover:bg-[#5c3a21] active:translate-y-[1px] text-white p-0.5 rounded transition-all cursor-pointer shadow"
            >
              <ChevronLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <div className="font-extrabold game-font text-[7px] md:text-[10px] text-[#5c3a21] uppercase tracking-tight w-16 md:w-24 text-center line-clamp-1">
              {SKINS.find(s => s.id === equippedSkin)?.name || 'Default'}
            </div>
            <button
              onClick={() => {
                const idx = ownedSkins.indexOf(equippedSkin);
                const nextIdx = (idx + 1) % ownedSkins.length;
                useGameStore.getState().equipSkin(ownedSkins[nextIdx]);
              }}
              className="bg-[#8c6239] hover:bg-[#5c3a21] active:translate-y-[1px] text-white p-0.5 rounded transition-all cursor-pointer shadow"
            >
              <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          </div>

          {/* 3D Dino Rotating Preview Box */}
          <div className="menu-char-preview w-full max-w-[84px] md:max-w-[130px] aspect-[4/3] bg-white rounded-lg border border-[#8c6239]/20 shadow-inner relative overflow-hidden flex items-center justify-center">
            <Canvas dpr={1} camera={{ position: [0, 1.1, 3.2], fov: 40 }} className="w-full h-full">
              <ambientLight intensity={1.5} />
              <directionalLight position={[2, 2, 2]} intensity={1.5} />
              <RotatingDinoPreview skinId={equippedSkin} />
            </Canvas>
          </div>

          <div className="menu-char-count game-font font-black text-[8px] md:text-[10px] text-[#8c6239] mt-1">
            {ownedSkins.length}/{SKINS.length}
          </div>

          <button
            onClick={onOpenShop}
            className="w-full mt-1.5 md:mt-2 bg-[#e67e22] hover:bg-[#d35400] text-white game-font text-[8px] md:text-[10px] font-black py-1 rounded-lg shadow border-b-2 md:border-b-4 border-[#a04000] cursor-pointer transition-all active:border-b-0 active:translate-y-[2px]"
          >
            LOJA DE SKINS
          </button>
        </div>
      </div>

      {/* Bottom-Center: Settings + JOGAR/Sala de Teste + Extra */}
      <div className="absolute bottom-3 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 z-20 pointer-events-auto">
        <button
          onClick={onOpenSettings}
          className="menu-icon-btn bg-[#5c3a21] hover:bg-[#8c6239] active:translate-y-[2px] text-[#fdf6e2] p-2.5 md:p-3.5 rounded-xl md:rounded-2xl border-2 md:border-4 border-[#8c6239] shadow-lg cursor-pointer transition-all"
          title="Opções"
        >
          <Settings className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* JOGAR + Sala de Teste combined as one card, like a "mode" tab under the play button */}
        <div className="flex flex-col rounded-xl md:rounded-2xl overflow-hidden border-2 md:border-4 border-[#8c6239] shadow-lg">
          <button
            onClick={startGame}
            className="menu-cta bg-gradient-to-b from-[#2ecc71] to-[#27ae60] hover:brightness-105 active:brightness-95 text-[#fdf6e2] transition-all game-font py-2.5 md:py-4 px-9 md:px-14 text-xs md:text-lg font-black cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            JOGAR
          </button>
          <button
            onClick={enterTestRoom}
            className="menu-testroom-tab bg-[#1e8449] hover:bg-[#196f3d] active:brightness-90 text-[#d1f2dd] game-font py-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest border-t border-black/15 cursor-pointer transition-colors"
          >
            Sala de Teste
          </button>
        </div>

        <button
          onClick={onOpenExtra}
          className="menu-icon-btn bg-[#5c3a21] hover:bg-[#8c6239] active:translate-y-[2px] text-[#fdf6e2] p-2.5 md:p-3.5 rounded-xl md:rounded-2xl border-2 md:border-4 border-[#8c6239] shadow-lg cursor-pointer transition-all"
          title="Extra: Biblioteca de Assets"
        >
          <Boxes className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </motion.div>
  );
}
