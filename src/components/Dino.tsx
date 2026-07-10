import { forwardRef, useEffect, useMemo, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, SKINS } from "../store/gameStore";
import { spawnParticles } from "./VFXRenderer";
import { useDinoPhysics } from "../models/dino/useDinoPhysics";
import { ClassicDinoModel } from "../models/dino/skins/ClassicDinoModel";
import { KitsuneDinoModel } from "../models/dino/skins/KitsuneDinoModel";
import { RainbowDinoModel } from "../models/dino/skins/RainbowDinoModel";

import { DinoAnimationState } from "../models/dino/types";
import { DuckDinoModel } from "../models/dino/skins/DuckDinoModel";
import { SharkDinoModel } from "../models/dino/skins/SharkDinoModel";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";

function DustParticles({ animState }: { animState: React.RefObject<DinoAnimationState> }) {
  useFrame(() => {
    const current = animState.current;
    if (current.status === "playing" && current.isGrounded && Math.random() > 0.6) {
      const baseScale = current.baseScale;
      spawnParticles(
        "dust",
        [
          2 - 0.5 * baseScale + (Math.random() - 0.5) * 0.5,
          0.1,
          (Math.random() - 0.5) * 0.5,
        ],
        1,
        "#d2b48c",
      );
    }
  });

  return null;
}

function FloatingLives() {
  const lives = useGameStore((state) => state.lives);
  const difficulty = useGameStore((state) => state.difficulty);
  const status = useGameStore((state) => state.status);
  const [show, setShow] = useState(false);
  const prevLives = useRef(lives);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status !== 'playing') {
      prevLives.current = lives;
      setShow(false);
      return;
    }

    if (lives < prevLives.current) {
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShow(false);
      }, 3000);
    }
    prevLives.current = lives;
  }, [lives, status]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (status !== 'playing') return null;

  return (
    <Html position={[0, 2.6, 0]} center distanceFactor={15}>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex gap-1 bg-[#fdf6e2] border-4 border-[#8c6239] border-double px-2.5 py-1 rounded-xl shadow-2xl pointer-events-none select-none w-max items-center"
          >
            {Array.from({ length: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1 }).map((_, i) => (
              <svg 
                key={i}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill={i < lives ? "#ff4757" : "rgba(0,0,0,0.15)"}
                className="w-4 h-4 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}

function FloatingPowerupBar() {
  const activePowerup = useGameStore((state) => state.activePowerup);
  const powerupEndTime = useGameStore((state) => state.powerupEndTime);
  const gameTime = useGameStore((state) => state.gameTime);
  const status = useGameStore((state) => state.status);
  
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
  }, [activePowerup, powerupEndTime]);

  if (status !== 'playing' || !activePowerup || activePowerup === 'none' || progress <= 0) return null;

  const powerupNames: Record<string, string> = {
    wings: 'Anjo',
    super: 'SUPERDINO',
    ghost: 'Fantasma',
    jaw: 'Feroz',
    earth: 'Escavador',
  };

  const name = powerupNames[activePowerup] || activePowerup.toUpperCase();

  return (
    <Html position={[0, -0.3, 0]} center distanceFactor={15}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="flex flex-col items-center gap-1 bg-[#fdf6e2] border-4 border-[#8c6239] border-double px-2.5 py-1 rounded-xl shadow-2xl pointer-events-none select-none w-28 text-center"
        >
          <span className="text-[7px] sm:text-[9px] font-black uppercase text-[#5c3a21] game-font tracking-wider">
            {name}
          </span>
          <div className="w-full h-2 bg-black/15 rounded-md overflow-hidden border border-[#8c6239]/30 relative p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-sm"
              style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </Html>
  );
}

function FloatingCinematicPowerup() {
  const cinematicPowerup = useGameStore((state) => state.cinematicPowerup);
  const [show, setShow] = useState(false);
  const [currentPowerup, setCurrentPowerup] = useState<any>(null);

  useEffect(() => {
    if (cinematicPowerup) {
      setCurrentPowerup(cinematicPowerup);
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 1600); // Show for 1.6s
      return () => clearTimeout(timer);
    }
  }, [cinematicPowerup]);

  if (!currentPowerup) return null;

  return (
    <Html position={[0, 2.8, 0]} center distanceFactor={12}>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.4, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -20 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="flex flex-col items-center bg-[#5c3a21] border-4 border-double border-[#8c6239] p-3 sm:p-4 rounded-2xl shadow-2xl pointer-events-none select-none w-56 sm:w-64 text-center text-[#fdf6e2] relative z-40"
          >
            <span className="text-[6px] sm:text-[8px] font-black uppercase text-[#e67e22] game-font tracking-widest mb-0.5">
              Poder Adquirido!
            </span>
            <h2 className="text-sm sm:text-base font-black uppercase game-font tracking-wide drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
              {currentPowerup.name}
            </h2>
            <p className="text-[10px] sm:text-xs font-bold text-[#fdf6e2]/80 mt-1.5 border-t border-[#8c6239]/40 pt-1.5 leading-tight font-sans">
              {currentPowerup.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}

export const Dino = forwardRef<THREE.Group, { previewMode?: boolean; skinId?: string }>(
  ({ previewMode = false, skinId }, ref) => {
    const { equippedSkin } = useGameStore();
    const activeSkinId = skinId || equippedSkin;

    const { innerRef, hitboxRef, animState } = useDinoPhysics(previewMode);

    // Forward the hitbox ref to the parent (Game.tsx) for collision calculations
    useEffect(() => {
      if (typeof ref === "function") {
        ref(hitboxRef.current);
      } else if (ref) {
        ref.current = hitboxRef.current;
      }
    }, [ref, hitboxRef]);

    const skin = useMemo(() => SKINS.find((s) => s.id === activeSkinId) || SKINS[0], [activeSkinId]);

    // Choose the appropriate skin model component
    const renderModel = () => {
      if (activeSkinId === "dino-kitsune") {
        return <KitsuneDinoModel animState={animState} previewMode={previewMode} skinConfig={skin} />;
      }
      if (activeSkinId === "dino-rainbow" || skin.isRainbow) {
        return <RainbowDinoModel animState={animState} previewMode={previewMode} skinConfig={skin} />;
      }
      if (activeSkinId === "dino-duck") {
        return <DuckDinoModel animState={animState} previewMode={previewMode} skinConfig={skin} />;
      }
      if (activeSkinId === "dino-shark") {
        return <SharkDinoModel animState={animState} previewMode={previewMode} skinConfig={skin} />;
      }
      return <ClassicDinoModel animState={animState} previewMode={previewMode} skinConfig={skin} />;
    };

    return (
      <group  >
        {!previewMode && <DustParticles animState={animState} />}

        {/* Hitbox (invisible box used for collision detection, sibling to innerRef to avoid squash scale) */}
        <group ref={hitboxRef}>
          <mesh visible={false}>
            <boxGeometry args={[1.2, 2, 1]} />
            <meshBasicMaterial color="green" wireframe />
          </mesh>
        </group>

        {/* The physics ref innerRef moves/scales/rotates this container */}
        <group ref={innerRef}>
          {/* Skin Model Render with key to force remount on skin change */}
          <group key={activeSkinId}>
            {renderModel()}
          </group>
          {!previewMode && <FloatingLives />}
          {!previewMode && <FloatingPowerupBar />}
          {!previewMode && <FloatingCinematicPowerup />}
        </group>
      </group>
    );
  }
);

Dino.displayName = "Dino";
