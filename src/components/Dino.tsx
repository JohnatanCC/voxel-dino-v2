import { forwardRef, useEffect, useMemo } from "react";
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
        </group>
      </group>
    );
  }
);

Dino.displayName = "Dino";
