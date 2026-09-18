import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Cactus, Bird, SandWormModel } from '../../scenarios/desert/DesertObstacles';
import { Stump, GiantBee, GiantMushroom, TreeHoleObstacle } from '../../scenarios/forest/ForestObstacles';
import { DeadTree, Crow, CrocodileObstacle, LeechObstacle } from '../../scenarios/swamp/SwampObstacles';
import { IceSpikesObstacle, LiveSnowmanObstacle } from '../../scenarios/snow/SnowObstacles';
import { LavaPool, LavaBug } from '../../scenarios/lava/LavaModels';
import { BackgroundTreeModel, MangroveTreeModel, LilyPadModel, SnowyTreeModel } from '../environment/EnvironmentModels';
import { PowerupBox } from '../../scenarios/shared/PowerupBox';

interface AssetLibraryOverlayProps {
  onClose: () => void;
}

type Biome = 'desert' | 'forest' | 'swamp' | 'snow' | 'lava' | 'shared';

interface AssetEntry {
  id: string;
  name: string;
  biome: Biome;
  icon: string;
  note: string;
  Model: () => React.ReactElement;
}

const BIOME_META: Record<Biome, { label: string; accent: string }> = {
  desert: { label: 'Deserto', accent: '#e67e22' },
  forest: { label: 'Floresta', accent: '#22c55e' },
  swamp: { label: 'Pântano', accent: '#0f766e' },
  snow: { label: 'Neve', accent: '#38bdf8' },
  lava: { label: 'Lava', accent: '#f97316' },
  shared: { label: 'Compartilhado', accent: '#a855f7' },
};

const FILTERS: { key: 'all' | Biome; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'desert', label: 'Deserto' },
  { key: 'forest', label: 'Floresta' },
  { key: 'swamp', label: 'Pântano' },
  { key: 'snow', label: 'Neve' },
  { key: 'lava', label: 'Lava' },
  { key: 'shared', label: 'Compartilhado' },
];

const ASSET_LIBRARY: AssetEntry[] = [
  { id: 'cactus-small', name: 'Cacto Pequeno', biome: 'desert', icon: '🌵', note: 'obstáculo de chão — porte pequeno/médio', Model: () => <Cactus x={0} scale={0.85} numStems={1} /> },
  { id: 'cactus-large', name: 'Cacto Grande', biome: 'desert', icon: '🌵', note: 'obstáculo de chão — porte grande, com galhos', Model: () => <Cactus x={0} scale={1.3} numStems={3} /> },
  { id: 'bird-desert', name: 'Ave do Deserto', biome: 'desert', icon: '🐦', note: 'inimigo voador — sozinho ou em bando', Model: () => <Bird x={0} y={0} /> },
  { id: 'sand-worm', name: 'Verme de Areia', biome: 'desert', icon: '🐛', note: 'inimigo-evento — persegue por trás e ataca', Model: () => <SandWormModel /> },

  { id: 'stump-low', name: 'Tronco Baixo', biome: 'forest', icon: '🪵', note: 'obstáculo de chão — pular', Model: () => <Stump x={0} scale={0.8} isHigh={false} /> },
  { id: 'stump-high', name: 'Tronco Alto', biome: 'forest', icon: '🪵', note: 'obstáculo de chão — porte alto', Model: () => <Stump x={0} scale={1.2} isHigh={true} /> },
  { id: 'giant-bee', name: 'Abelha Gigante', biome: 'forest', icon: '🐝', note: 'inimigo voador raivoso', Model: () => <GiantBee x={0} y={0} /> },
  { id: 'giant-mushroom', name: 'Cogumelo Gigante', biome: 'forest', icon: '🍄', note: 'dano + neblina temporária', Model: () => <GiantMushroom x={0} spotSeed={0.5} /> },
  { id: 'tree-hole', name: 'Árvore Oca', biome: 'forest', icon: '🌳', note: 'arco grande — o player passa por baixo', Model: () => <TreeHoleObstacle x={0} /> },
  { id: 'background-tree', name: 'Árvore de Fundo', biome: 'forest', icon: '🌲', note: 'cenário — decoração de fundo (sem colisão)', Model: () => <BackgroundTreeModel /> },

  { id: 'dead-tree-low', name: 'Tronco Morto', biome: 'swamp', icon: '🪵', note: 'obstáculo de chão do pântano', Model: () => <DeadTree x={0} scale={1} isHigh={false} /> },
  { id: 'dead-tree-high', name: 'Tronco Morto Alto', biome: 'swamp', icon: '🪵', note: 'obstáculo de chão — porte alto', Model: () => <DeadTree x={0} scale={1} isHigh={true} /> },
  { id: 'crow', name: 'Corvo', biome: 'swamp', icon: '🐦‍⬛', note: 'inimigo voador do pântano', Model: () => <Crow x={0} y={0} /> },
  { id: 'crocodile', name: 'Jacaré', biome: 'swamp', icon: '🐊', note: 'inimigo terrestre — investida', Model: () => <CrocodileObstacle x={0} /> },
  { id: 'leech', name: 'Sanguessuga', biome: 'swamp', icon: '🩸', note: 'acumula 3 hits antes de causar dano', Model: () => <LeechObstacle x={0} /> },
  { id: 'mangrove-tree', name: 'Mangue', biome: 'swamp', icon: '🌴', note: 'cenário — decoração de fundo (sem colisão)', Model: () => <MangroveTreeModel /> },
  { id: 'lily-pad', name: 'Vitória-Régia', biome: 'swamp', icon: '🪷', note: 'cenário — decoração de fundo (sem colisão)', Model: () => <LilyPadModel /> },

  { id: 'ice-spike', name: 'Espinhos de Gelo', biome: 'snow', icon: '🧊', note: 'obstáculo de chão — causa dano', Model: () => <IceSpikesObstacle x={0} y={0} /> },
  { id: 'snowman', name: 'Boneco de Neve', biome: 'snow', icon: '⛄', note: 'causa dano + visão reduzida', Model: () => <LiveSnowmanObstacle x={0} y={0} /> },
  { id: 'snowy-tree', name: 'Árvore Nevada', biome: 'snow', icon: '🎄', note: 'cenário — decoração de fundo (sem colisão)', Model: () => <SnowyTreeModel /> },

  { id: 'lava-pool', name: 'Poça de Lava', biome: 'lava', icon: '🌋', note: 'obstáculo de chão — pular por cima', Model: () => <LavaPool x={0} scale={1} /> },
  { id: 'lava-bug', name: 'Besouro de Magma', biome: 'lava', icon: '🪲', note: 'inseto espinhoso — anda em direção ao player', Model: () => <LavaBug x={0} /> },
  { id: 'ember-bird', name: 'Ave de Brasa', biome: 'lava', icon: '🔥', note: 'inimigo voador do vulcão', Model: () => <Bird x={0} y={0} ember /> },

  { id: 'powerup-super', name: 'Powerup: Super', biome: 'shared', icon: '⭐', note: 'SUPERDINO — destrói tudo no caminho', Model: () => <PowerupBox x={0} y={0} type="super" /> },
  { id: 'powerup-wings', name: 'Powerup: Asas', biome: 'shared', icon: '🪽', note: 'Anjo — bate asa uma vez', Model: () => <PowerupBox x={0} y={0} type="wings" /> },
  { id: 'powerup-ghost', name: 'Powerup: Fantasma', biome: 'shared', icon: '👻', note: 'Fantasma — voa e atravessa obstáculos', Model: () => <PowerupBox x={0} y={0} type="ghost" /> },
  { id: 'powerup-jaw', name: 'Powerup: Feroz', biome: 'shared', icon: '🦷', note: 'Feroz — come qualquer inimigo', Model: () => <PowerupBox x={0} y={0} type="jaw" /> },
  { id: 'powerup-earth', name: 'Powerup: Escavador', biome: 'shared', icon: '⛏️', note: 'Escavador — entra no chão por um tempo', Model: () => <PowerupBox x={0} y={0} type="earth" /> },
  { id: 'powerup-dragon', name: 'Powerup: Dragão', biome: 'shared', icon: '🐉', note: 'Dragão — cospe bolas de fogo a cada 2s', Model: () => <PowerupBox x={0} y={0} type="dragon" /> },
  { id: 'powerup-life', name: 'Powerup: Vida', biome: 'shared', icon: '❤️', note: '+1 vida', Model: () => <PowerupBox x={0} y={0} type="life" /> },
];

// Frames the camera/orbit target around whatever the selected asset renders, regardless of its
// authored size or internal position offsets — avoids hand-tuning a camera per obstacle type.
function AutoFramedModel({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const framed = useRef(false);
  const { camera, controls } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    if (box.isEmpty()) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // OrbitControls may not have registered itself on the R3F store yet on the first
    // frame — keep syncing its target every frame (cheap) until it exists, otherwise
    // it snaps the camera back to looking at its own stale (0,0,0) target on its next update.
    const anyControls = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    if (anyControls) {
      anyControls.target.copy(center);
      anyControls.update();
    }

    if (!framed.current && anyControls) {
      const maxDim = Math.max(size.x, size.y, size.z, 0.5);
      const dist = maxDim * 1.5 + 1.2;
      camera.position.set(center.x + dist * 0.55, center.y + dist * 0.45, center.z + dist * 0.85);
      camera.lookAt(center);
      anyControls.update();
      framed.current = true;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export function AssetLibraryOverlay({ onClose }: AssetLibraryOverlayProps) {
  const [filter, setFilter] = useState<'all' | Biome>('all');
  const [selectedId, setSelectedId] = useState(ASSET_LIBRARY[0].id);

  const visibleAssets = useMemo(
    () => (filter === 'all' ? ASSET_LIBRARY : ASSET_LIBRARY.filter(a => a.biome === filter)),
    [filter]
  );

  const selected = ASSET_LIBRARY.find(a => a.id === selectedId) || ASSET_LIBRARY[0];
  const meta = BIOME_META[selected.biome];

  return (
    <motion.div
      key="asset-library"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6 pointer-events-auto"
    >
      <div className="bg-[#fdf6e2] border-8 border-double border-[#8c6239] w-full max-w-5xl h-[90vh] md:h-[80vh] rounded-[24px] shadow-2xl flex flex-col p-4 sm:p-6 text-[#5c3a21] overflow-hidden relative pt-10 sm:pt-12">

        {/* Wooden Board Header */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5c3a21] text-[#fdf6e2] font-black text-sm sm:text-base px-8 py-2 rounded-2xl shadow-lg border-4 border-[#8c6239] game-font uppercase tracking-widest text-center whitespace-nowrap z-25">
          BIBLIOTECA DE ASSETS
        </div>

        {/* Header Row */}
        <div className="flex justify-between items-center border-b-2 border-[#8c6239]/20 pb-3 mb-3 mt-2 sm:mt-0">
          <div className="text-[9px] sm:text-[10px] text-[#8c6239]/70 font-bold italic">
            Clique em um item para girar/dar zoom e inspecionar o modelo.
          </div>
          <button
            onClick={onClose}
            className="bg-[#ef4444] hover:bg-[#d32f2f] active:translate-y-[2px] text-white border-2 border-black/30 p-1.5 rounded-xl transition-all cursor-pointer shadow shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Biome Filter Chips */}
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

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
          {/* Left Column: Asset list */}
          <div className="md:col-span-5 flex flex-col overflow-hidden">
            <div className="grid grid-cols-3 sm:grid-cols-4 auto-rows-max gap-3 overflow-y-auto min-h-0 flex-1 pr-1.5 scrollbar-thin scrollbar-thumb-[#8c6239] scrollbar-track-[#fdf6e2] content-start">
              {visibleAssets.map((asset) => {
                const isSelected = selectedId === asset.id;
                const assetMeta = BIOME_META[asset.biome];
                const cardBorder = isSelected
                  ? 'border-[#f1c40f] ring-4 ring-[#f1c40f]/60'
                  : 'border-[#8c6239]/30 hover:border-[#8c6239]/60 hover:bg-[#fdfdf7]/50';

                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedId(asset.id)}
                    className={`relative cursor-pointer bg-[#fdfdf7] rounded-xl border-4 border-double overflow-hidden flex flex-col items-center justify-center gap-1 py-3 select-none transition-all ${cardBorder}`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: assetMeta.accent }} />
                    <div className="text-2xl sm:text-3xl leading-none mt-1">{asset.icon}</div>
                    <div className="text-[8px] sm:text-[9px] game-font font-black uppercase tracking-tight text-center leading-tight px-1 text-[#5c3a21]">
                      {asset.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live 3D Preview */}
          <div className="md:col-span-7 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#8c6239]/20 pt-4 md:pt-0 pl-0 md:pl-4 flex flex-col overflow-y-auto">
            <div className="w-full h-56 sm:h-72 md:flex-1 bg-[#2b2118] rounded-2xl overflow-hidden border-4 relative shadow-inner" style={{ borderColor: meta.accent }}>
              <Canvas key={selected.id} camera={{ position: [4, 3, 5], fov: 45 }}>
                <ambientLight intensity={1.2} />
                <directionalLight position={[4, 6, 4]} intensity={1.5} />
                <directionalLight position={[-4, 2, -3]} intensity={0.4} />
                <gridHelper args={[16, 16, '#8c6239', '#4a3b2a']} />
                <AutoFramedModel>
                  <selected.Model />
                </AutoFramedModel>
                <OrbitControls makeDefault enablePan={false} minDistance={0.5} maxDistance={40} />
              </Canvas>
            </div>

            <div className="mt-3">
              <h3 className="text-lg sm:text-xl game-font font-black uppercase text-[#5c3a21]">{selected.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="inline-block border text-[9px] sm:text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-widest"
                  style={{ backgroundColor: `${meta.accent}22`, borderColor: `${meta.accent}66`, color: meta.accent }}
                >
                  {meta.label}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#8c6239] italic">{selected.note}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
