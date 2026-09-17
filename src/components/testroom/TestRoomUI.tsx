import { useGameStore } from '../../store/gameStore';
import { SCENARIOS } from '../../scenarios';

const BIOME_LABELS: Record<string, string> = {
  desert: 'Deserto',
  forest: 'Floresta',
  swamp: 'Pântano',
  snow: 'Neve',
};

const BIOME_ORDER = Object.keys(SCENARIOS);

export function TestRoomUI() {
  const scenario = useGameStore((s) => s.scenario);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
      <div className="flex justify-between items-start">
        <div className="bg-black/50 text-white text-xs md:text-sm rounded-xl px-4 py-2.5 backdrop-blur">
          <div className="font-black uppercase tracking-wide mb-1 game-font">Sala de Teste</div>
          <div>Bioma: {BIOME_LABELS[scenario] || scenario} ({BIOME_ORDER.indexOf(scenario) + 1}/4)</div>
          <div className="opacity-80 mt-1">A/D ou ←/→: trocar de pista · Espaço: pular · 1-4: trocar cenário</div>
        </div>
        <button
          onClick={() => useGameStore.getState().exitTestRoom()}
          className="pointer-events-auto bg-red-600 hover:bg-red-700 active:translate-y-[1px] text-white font-black game-font text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all uppercase tracking-wide"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
