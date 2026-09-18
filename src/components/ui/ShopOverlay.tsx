import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, X } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { useGameStore, SKINS, SkinConfig } from '../../store/gameStore';
import { EGG_COIN_VALUES } from '../../config/balance';
import { Dino } from '../Dino';
import { MiniDinoPixelArt, DinoCoinIcon } from './shared';

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
  TCARINHOSO: 'dino-carinhoso',
};

interface SkinRowProps {
  skin: SkinConfig;
  isSelected: boolean;
  isOwned: boolean;
  isEquipped: boolean;
  onSelect: () => void;
  onBuy: () => void;
  onEquip: () => void;
}

function SkinRow({ skin, isSelected, isOwned, isEquipped, onSelect, onBuy, onEquip }: SkinRowProps) {
  const meta = RARITY_META[skin.rarity];

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-[#8c6239]/12 cursor-pointer transition-colors select-none ${
        isSelected ? 'bg-[#fdecc8]' : 'hover:bg-[#fdfdf7]'
      }`}
    >
      <div
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 shrink-0 flex items-center justify-center overflow-hidden shadow-inner"
        style={{ borderColor: meta.accent }}
      >
        <MiniDinoPixelArt skin={skin} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="game-font font-black text-[11px] sm:text-sm text-[#5c3a21] truncate">{skin.name}</span>
          {isEquipped && (
            <span className="shrink-0 bg-amber-500 text-white text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">
              Equipado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[8px] sm:text-[9px] uppercase font-bold text-[#8c6239]/70 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.accent }} />
          {meta.label}
        </div>
      </div>

      {isEquipped ? (
        <span className="shrink-0 game-font text-[9px] sm:text-[10px] font-black text-amber-600 px-2">ATUAL</span>
      ) : isOwned ? (
        <button
          onClick={(e) => { e.stopPropagation(); onEquip(); }}
          className="shrink-0 bg-[#27ae60] hover:bg-[#2ecc71] text-white text-[9px] sm:text-[10px] font-black game-font px-3 py-1.5 rounded-lg border-b-2 border-[#196f3d] cursor-pointer active:border-b-0 active:translate-y-[2px] transition-all"
        >
          EQUIPAR
        </button>
      ) : skin.rarity === 'exclusive' ? (
        <span className="shrink-0 flex items-center gap-1 text-[8px] sm:text-[10px] font-black text-purple-600 px-1">
          <Lock className="w-3 h-3 shrink-0" /> CÓDIGO
        </span>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onBuy(); }}
          className="shrink-0 flex items-center gap-1 bg-[#e67e22] hover:bg-[#d35400] text-white text-[9px] sm:text-[10px] font-black game-font px-3 py-1.5 rounded-lg border-b-2 border-[#a04000] cursor-pointer active:border-b-0 active:translate-y-[2px] transition-all"
        >
          {skin.price === 0 ? 'GRÁTIS' : <><DinoCoinIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {skin.price}</>}
        </button>
      )}
    </div>
  );
}

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

  const handleBuy = (skin: SkinConfig) => {
    const success = useGameStore.getState().buySkin(skin.id);
    if (success) {
      useGameStore.getState().addFloatingText('COMPRADO!', 0, 5, 0, '#22c55e');
      setSelectedSkinId(skin.id);
    } else {
      alert('Moedas insuficientes!');
    }
  };

  const handleEquip = (skin: SkinConfig) => {
    useGameStore.getState().equipSkin(skin.id);
    setSelectedSkinId(skin.id);
  };

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
      className="fixed inset-0 bg-[#fdf6e2] z-50 flex flex-col text-[#5c3a21] pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-[#5c3a21] border-b-4 border-[#8c6239] shadow-md shrink-0">
        <h2 className="game-font font-black text-xs sm:text-lg text-[#fdf6e2] uppercase tracking-widest">
          Loja de Skins
        </h2>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-[#fdf6e2] border-2 border-[#8c6239] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-inner">
            <DinoCoinIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="game-font font-black text-[10px] sm:text-xs text-[#e67e22]">{coins}</span>
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
      <div className="flex gap-1.5 px-4 sm:px-6 py-2 overflow-x-auto shrink-0 border-b border-[#8c6239]/20">
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

      {/* Body: skin list + preview/code panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Skin List */}
        <div className="flex-1 md:w-[58%] lg:w-[55%] overflow-y-auto min-h-0">
          {visibleSkins.map((skin) => (
            <SkinRow
              key={skin.id}
              skin={skin}
              isSelected={selectedSkinId === skin.id}
              isOwned={ownedSkins.includes(skin.id)}
              isEquipped={equippedSkin === skin.id}
              onSelect={() => setSelectedSkinId(skin.id)}
              onBuy={() => handleBuy(skin)}
              onEquip={() => handleEquip(skin)}
            />
          ))}
        </div>

        {/* Preview + Code Panel */}
        <div className="md:w-[42%] lg:w-[45%] border-t-2 md:border-t-0 md:border-l-4 border-[#8c6239]/25 bg-[#fdfdf7]/50 p-4 sm:p-6 flex flex-col overflow-y-auto min-h-0">
          <div className="flex flex-col items-center">
            <div
              className="w-full aspect-[4/3] max-h-56 sm:max-h-72 bg-white rounded-2xl overflow-hidden border-4 relative shadow-inner"
              style={{ borderColor: meta.accent }}
            >
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

          {/* Coupon Redeem */}
          <div className="border-t border-[#8c6239]/20 pt-4 mt-4 flex flex-col gap-1.5">
            <label className="text-[9px] sm:text-[10px] font-black text-[#8c6239] uppercase">
              {selectedSkin.rarity === 'exclusive' && !isOwned
                ? 'Esta skin precisa de um código:'
                : 'Resgatar Código Especial:'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Insira o Código"
                className="flex-1 min-w-0 border-2 border-[#8c6239]/40 focus:border-[#8c6239] px-2.5 py-1.5 game-font text-xs bg-white rounded-lg focus:outline-none placeholder-gray-400 font-bold text-[#5c3a21] transition-colors"
              />
              <button
                onClick={handleRedeem}
                className="shrink-0 bg-[#5c3a21] hover:bg-[#8c6239] active:translate-y-[1px] text-[#fdf6e2] px-4 py-1.5 rounded-lg game-font text-xs font-black border border-[#8c6239] cursor-pointer transition-all shadow"
              >
                OK
              </button>
            </div>
            {isEquipped && (
              <p className="text-[9px] sm:text-[10px] text-amber-600 font-bold mt-1">Esta skin já está equipada.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer: egg-to-coin conversion note */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-1.5 text-[8px] sm:text-[9px] text-[#8c6239] text-center border-t border-[#8c6239]/15 bg-[#fdf6e2]">
        <DinoCoinIcon className="w-3 h-3 shrink-0" />
        <span>
          Ovos viram Dino Coins ao fim da corrida: 🟢 Comum = {EGG_COIN_VALUES.common} · 🔵 Raro = {EGG_COIN_VALUES.rare} · 🟣 Ultra Raro = {EGG_COIN_VALUES.ultraRare}
        </span>
      </div>
    </motion.div>
  );
}
