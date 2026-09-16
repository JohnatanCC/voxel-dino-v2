import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useGameStore, GraphicsQuality } from '../../store/gameStore';

interface SettingsModalProps {
  onClose: () => void;
}

const QUALITY_OPTIONS: GraphicsQuality[] = ['low', 'medium', 'high'];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const graphicsQuality = useGameStore(s => s.graphicsQuality);

  const cycleQuality = (direction: 1 | -1) => {
    const idx = QUALITY_OPTIONS.indexOf(graphicsQuality);
    const nextIdx = (idx + direction + QUALITY_OPTIONS.length) % QUALITY_OPTIONS.length;
    useGameStore.getState().setGraphicsQuality(QUALITY_OPTIONS[nextIdx]);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto bg-black/60 backdrop-blur-sm">
      <div className="bg-[#2a2a2a] border-4 border-[#535353] p-8 max-w-md w-full relative shadow-[8px_8px_0px_rgba(0,0,0,0.5)] flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/50 hover:text-white"
        >
          <X className="w-8 h-8" />
        </button>

        <h2 className="text-3xl game-font text-white mb-8 tracking-tighter">CONFIGURAÇÕES</h2>

        <div className="flex flex-col gap-8 w-full">
          <div className="flex flex-col items-center gap-2">
            <span className="game-font text-white/70 text-sm tracking-widest uppercase">Qualidade</span>
            <div className="flex items-center gap-4">
              <button onClick={() => cycleQuality(-1)} className="text-white hover:text-amber-300 transition-colors">
                <ChevronLeft className="w-8 h-8" />
              </button>
              <div className="game-font text-white text-xl uppercase tracking-widest w-24 text-center">
                {graphicsQuality}
              </div>
              <button onClick={() => cycleQuality(1)} className="text-white hover:text-amber-300 transition-colors">
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
