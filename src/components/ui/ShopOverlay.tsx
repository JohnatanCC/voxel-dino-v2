import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, X } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { useGameStore, SKINS, SkinConfig } from '../../store/gameStore';
import { EGG_COIN_VALUES } from '../../config/balance';
import { Dino } from '../Dino';
import { MiniDinoPixelArt } from './shared';

interface ShopOverlayProps {
  onClose: () => void;
}

const RARITY_ORDER: SkinConfig['rarity'][] = ['common', 'rare', 'ultra-rare', 'legendary', 'exclusive'];

const RARITY_META: Record<SkinConfig['rarity'], { label: string; accent: string }> = {
  common: { label: 'Comum', accent: '#94a3b8' },
  rare: { label: 'Raro', accent: '#3b82f6' },
  'ultra-rare': { label: 'Ultra Raro', accent: '#d946ef' },
  legendary: { label: 'Lendário', accent: '#f59e0b' },
  exclusive: { label: 'Exclusivo', accent: '#a855f7' },
};

const FILTERS: { key: 'all' | SkinConfig['rarity']; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'common', label: 'Comuns' },
  { key: 'rare', label: 'Raras' },
  { key: 'ultra-rare', label: 'Ultra Raras' },
  { key: 'legendary', label: 'Lendárias' },
  { key: 'exclusive', label: 'Exclusivas' },
];

const PROMO_SKIN_BY_CODE: Record<string, string> = {
  'EXCLUSIVEPRIDE#0507D': 'dino-kitsune',
  PATO: 'dino-duck',
  QUACK: 'dino-duck',
  DUCKDINO: 'dino-duck',
  JEFF: 'dino-shark',
  SHARK: 'dino-shark',
  SHARKDINO: 'dino-shark',
  CDINO: 'dino-rabbit',
};

export function ShopOverlay({ onClose }: ShopOverlayProps) {
  const { coins, ownedSkins, equippedSkin } = useGameStore();
  const [selectedSkinId, setSelectedSkinId] = useState('dino-classic');
  const [couponCode, setCouponCode] = useState('');
  const [filter, setFilter] = useState<'all' | SkinConfig['rarity']>('all');

  const sortedSkins = useMemo(
    () => [...SKINS].sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)),
    []
  );
  const visibleSkins = filter === 'all' ? sortedSkins : sortedSkins.filter(s => s.rarity === filter);

  const selectedSkin = SKINS.find(s => s.id === selectedSkinId) || SKINS[0];
  const isOwned = ownedSkins.includes(selectedSkin.id);
  const isEquipped = equippedSkin === selectedSkin.id;
  const meta = RARITY_META[selectedSkin.rarity];

  const handleRedeem = () => {
    if (!couponCode) return;
    const cleanCoupon = couponCode.trim();
    const ok = useGameStore.getState().redeemCode(cleanCoupon);
    if (ok) {
      useGameStore.getState().addFloatingText('CÓDIGO ACEITO!', 0, 5, 0, '#a855f7');
      setCouponCode('');
      const rewardedSkin = PROMO_SKIN_BY_CODE[cleanCoupon.toUpperCase()];
      if (rewardedSkin) {
        setSelectedSkinId(rewardedSkin);
        useGameStore.getState().equipSkin(rewardedSkin);
      }
    } else {
      alert('Código inválido ou já resgatado!');
    }
  };

  return (
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
        <div className="flex justify-between items-center border-b-2 border-[#8c6239]/20 pb-3 mb-3 mt-2 sm:mt-0">
          <div></div>
          <div className="flex items-center gap-4">
            <div className="bg-[#fdfdf7] border-4 border-[#8c6239]/40 px-4 py-1.5 rounded-xl game-font font-black text-xs sm:text-sm text-[#e67e22] shadow-inner">
              🪙 {coins} Moedas
            </div>
            <button
              onClick={onClose}
              className="bg-[#ef4444] hover:bg-[#d32f2f] active:translate-y-[2px] text-white border-2 border-black/30 p-1.5 rounded-xl transition-all cursor-pointer shadow"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Rarity Filter Chips */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase game-font border transition-colors cursor-pointer ${
                filter === f.key
                  ? 'bg-[#5c3a21] text-[#fdf6e2] border-[#5c3a21]'
                  : 'bg-[#fdfdf7] text-[#8c6239] border-[#8c6239]/30 hover:border-[#8c6239]/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Shop Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
          {/* Left Column: Skins list */}
          <div className="md:col-span-7 flex flex-col overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-max gap-3 overflow-y-auto min-h-0 flex-1 pr-1.5 scrollbar-thin scrollbar-thumb-[#8c6239] scrollbar-track-[#fdf6e2] content-start">
              {visibleSkins.map((skin) => {
                const skinOwned = ownedSkins.includes(skin.id);
                const skinEquipped = equippedSkin === skin.id;
                const isSelected = selectedSkinId === skin.id;
                const skinMeta = RARITY_META[skin.rarity];

                const cardBorder = isSelected
                  ? 'border-[#f1c40f] ring-4 ring-[#f1c40f]/60'
                  : 'border-[#8c6239]/30 hover:border-[#8c6239]/60 hover:bg-[#fdfdf7]/50';

                return (
                  <div
                    key={skin.id}
                    onClick={() => setSelectedSkinId(skin.id)}
                    className={`relative cursor-pointer bg-[#fdfdf7] rounded-xl border-4 border-double overflow-hidden flex flex-col items-center justify-between transition-all select-none gap-1 ${cardBorder}`}
                  >
                    {/* Rarity accent strip */}
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: skinMeta.accent }} />
                    {skin.rarity === 'legendary' && (
                      <div className="absolute inset-0 pointer-events-none animate-pulse" style={{ boxShadow: `inset 0 0 16px ${skinMeta.accent}55` }} />
                    )}

                    {skinEquipped && (
                      <span className="absolute top-2.5 right-1 bg-[#5c3a21] text-[#fdf6e2] text-[7px] sm:text-[9px] game-font px-1.5 py-0.5 rounded-lg border border-[#8c6239] uppercase font-bold z-20 shadow">
                        Equipado
                      </span>
                    )}

                    <div className="p-2.5 sm:p-3 pt-3.5 flex flex-col items-center gap-1 w-full">
                      <div className="text-[9px] sm:text-[11px] game-font font-black uppercase tracking-tight text-center line-clamp-1 text-[#5c3a21]">
                        {skin.name}
                      </div>
                      <div className="flex items-center gap-1 text-[7px] sm:text-[8px] uppercase tracking-wide text-[#8c6239]/70 font-bold mb-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: skinMeta.accent }} />
                        {skinMeta.label}
                      </div>

                      <div className="w-full h-16 sm:h-20 bg-white rounded-lg overflow-hidden relative border border-[#8c6239]/15 shadow-inner flex items-center justify-center p-1">
                        <MiniDinoPixelArt skin={skin} />
                      </div>

                      <div className="text-[8px] sm:text-[10px] game-font font-bold mt-2">
                        {skinOwned ? (
                          <span className="text-[#27ae60]">ADQUIRIDO</span>
                        ) : skin.rarity === 'exclusive' ? (
                          <span className="flex items-center gap-1 text-purple-600"><Lock className="w-2.5 h-2.5" /> CÓDIGO</span>
                        ) : skin.price === 0 ? (
                          <span className="text-emerald-600">GRÁTIS</span>
                        ) : (
                          <span className="text-amber-600">🪙 {skin.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="md:col-span-5 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#8c6239]/20 pt-4 md:pt-0 pl-0 md:pl-4 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col flex-1 justify-between gap-4">
              {/* Large Visual Preview */}
              <div className="flex flex-col items-center">
                <div className="w-full h-40 sm:h-48 bg-white rounded-2xl overflow-hidden border-4 relative shadow-inner" style={{ borderColor: meta.accent }}>
                  <Canvas camera={{ position: [0, 1.1, 3.5], fov: 40 }}>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[2, 2, 2]} intensity={1.5} />
                    <Dino previewMode={true} skinId={selectedSkin.id} />
                  </Canvas>
                </div>

                <div className="mt-3 text-center w-full">
                  <h3 className="text-lg sm:text-xl game-font font-black uppercase text-[#5c3a21]">{selectedSkin.name}</h3>
                  <span
                    className="inline-block border text-[9px] sm:text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mt-1.5 tracking-widest"
                    style={{ backgroundColor: `${meta.accent}22`, borderColor: `${meta.accent}66`, color: meta.accent }}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-auto">
                {isOwned ? (
                  <button
                    disabled={isEquipped}
                    onClick={() => useGameStore.getState().equipSkin(selectedSkin.id)}
                    className={`w-full py-2.5 sm:py-3 game-font text-xs sm:text-sm font-black rounded-xl cursor-pointer transition-all border-b-4 ${
                      isEquipped
                        ? 'bg-amber-500 text-white cursor-default shadow-none pointer-events-none border-b-0'
                        : 'bg-[#27ae60] hover:bg-[#2ecc71] text-white border-[#196f3d] active:border-b-0 active:translate-y-[4px]'
                    }`}
                  >
                    {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                  </button>
                ) : selectedSkin.rarity === 'exclusive' ? (
                  <div className="flex items-center gap-2 justify-center text-center bg-[#fdfdf7] border-2 border-purple-300 p-2.5 rounded-xl text-[10px] text-purple-700 italic shadow-inner">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Skin exclusiva: só pode ser desbloqueada com um código promocional.</span>
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
                    {selectedSkin.price === 0 ? 'EQUIPAR - GRÁTIS' : `COMPRAR - 🪙 ${selectedSkin.price}`}
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
                      onClick={handleRedeem}
                      className="bg-[#5c3a21] hover:bg-[#8c6239] active:translate-y-[1px] text-[#fdf6e2] px-4 py-1.5 rounded-lg game-font text-xs font-black border border-[#8c6239] cursor-pointer transition-all shadow"
                    >
                      OK
                    </button>
                  </div>
                </div>

                {/* Egg Converter Conversion rate explanation box */}
                <div className="bg-[#fdfdf7] border-2 border-[#8c6239]/30 p-2.5 rounded-xl text-[8px] sm:text-[10px] text-[#8c6239] leading-tight shadow-inner mt-2">
                  <div className="font-black text-[#5c3a21] mb-0.5">🪙 RECOMPENSAS DE OVOS:</div>
                  <div>🟢 Comum = {EGG_COIN_VALUES.common} moedas | 🔵 Raro = {EGG_COIN_VALUES.rare} moedas | 🟣 Ultra Raro = {EGG_COIN_VALUES.ultraRare} moedas</div>
                  <div className="mt-1 italic">Os ovos coletados em jogo são automaticamente convertidos no final da corrida!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
