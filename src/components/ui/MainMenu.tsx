import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { useGameStore, SKINS } from '../../store/gameStore';
import { RotatingDinoPreview } from './shared';

interface MainMenuProps {
  onOpenSettings: () => void;
  onOpenShop: () => void;
}

export function MainMenu({ onOpenSettings, onOpenShop }: MainMenuProps) {
  const { startGame, ownedSkins, equippedSkin } = useGameStore();

  return (
    <motion.div key="menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none z-20"
    >
      {/* Top-Right: Settings Button */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-3">
        <button
          onClick={onOpenSettings}
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
                const idx = ownedSkins.indexOf(equippedSkin);
                const prevIdx = (idx - 1 + ownedSkins.length) % ownedSkins.length;
                useGameStore.getState().equipSkin(ownedSkins[prevIdx]);
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
          <div className="w-full max-w-[100px] md:max-w-[130px] aspect-[4/3] bg-white rounded-lg border border-[#8c6239]/20 shadow-inner relative overflow-hidden flex items-center justify-center">
            <Canvas dpr={1} camera={{ position: [0, 1.1, 3.2], fov: 40 }} className="w-full h-full">
              <ambientLight intensity={1.5} />
              <directionalLight position={[2, 2, 2]} intensity={1.5} />
              <RotatingDinoPreview skinId={equippedSkin} />
            </Canvas>
          </div>

          <button
            onClick={onOpenShop}
            className="w-full mt-2 bg-[#e67e22] hover:bg-[#d35400] text-white game-font text-[9px] md:text-[10px] font-black py-1 rounded-lg shadow border-b-2 md:border-b-4 border-[#a04000] cursor-pointer transition-all active:border-b-0 active:translate-y-[2px]"
          >
            LOJA DE SKINS
          </button>
        </div>
      </div>

      {/* Bottom-Center: JOGAR Button */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3 z-20 pointer-events-auto">
        <button
          onClick={startGame}
          className="bg-[#27ae60] hover:bg-[#2ecc71] active:translate-y-[2px] text-[#fdf6e2] transition-all game-font py-3 md:py-4 px-10 md:px-14 rounded-xl md:rounded-2xl text-sm md:text-lg font-black border-2 md:border-4 border-[#8c6239] border-b-4 md:border-b-6 border-b-[#1e8449] shadow-lg cursor-pointer flex items-center gap-2 uppercase tracking-wider bg-gradient-to-b from-[#2ecc71] to-[#27ae60] active:border-b-2"
        >
          JOGAR
        </button>
      </div>
    </motion.div>
  );
}
