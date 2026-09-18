import { RefObject, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore, SKINS } from '../../store/gameStore';
import { useTestRoomLanePhysics } from '../../models/dino/useTestRoomLanePhysics';
import { ClassicDinoModel } from '../../models/dino/skins/ClassicDinoModel';
import { KitsuneDinoModel } from '../../models/dino/skins/KitsuneDinoModel';
import { RainbowDinoModel } from '../../models/dino/skins/RainbowDinoModel';
import { DuckDinoModel } from '../../models/dino/skins/DuckDinoModel';
import { SharkDinoModel } from '../../models/dino/skins/SharkDinoModel';
import { GospelDinoModel } from '../../models/dino/skins/GospelDinoModel';
import { RabbitDinoModel } from '../../models/dino/skins/RabbitDinoModel';
import { CarinhosoDinoModel } from '../../models/dino/skins/CarinhosoDinoModel';

interface TestRoomPlayerProps {
  groupRef: RefObject<THREE.Group | null>;
}

export function TestRoomPlayer({ groupRef }: TestRoomPlayerProps) {
  const equippedSkin = useGameStore((s) => s.equippedSkin);
  const { animState } = useTestRoomLanePhysics(groupRef);

  const skin = useMemo(() => SKINS.find((s) => s.id === equippedSkin) || SKINS[0], [equippedSkin]);

  const renderModel = () => {
    if (equippedSkin === 'dino-kitsune') {
      return <KitsuneDinoModel animState={animState} skinConfig={skin} />;
    }
    if (equippedSkin === 'dino-rainbow' || skin.isRainbow) {
      return <RainbowDinoModel animState={animState} skinConfig={skin} />;
    }
    if (equippedSkin === 'dino-duck') {
      return <DuckDinoModel animState={animState} skinConfig={skin} />;
    }
    if (equippedSkin === 'dino-shark') {
      return <SharkDinoModel animState={animState} skinConfig={skin} />;
    }
    if (equippedSkin === 'dino-gospel') {
      return <GospelDinoModel animState={animState} skinConfig={skin} />;
    }
    if (equippedSkin === 'dino-rabbit') {
      return <RabbitDinoModel animState={animState} skinConfig={skin} />;
    }
    if (equippedSkin === 'dino-carinhoso') {
      return <CarinhosoDinoModel animState={animState} skinConfig={skin} />;
    }
    return <ClassicDinoModel animState={animState} skinConfig={skin} />;
  };

  return (
    <group ref={groupRef} scale={[0.85, 0.85, 0.85]}>
      <group key={equippedSkin}>{renderModel()}</group>
    </group>
  );
}
