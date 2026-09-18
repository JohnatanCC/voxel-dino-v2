import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect, createRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Dino } from './Dino';
import * as THREE from 'three';
import { playScoreSound } from '../utils/audio';
import { VFXRenderer } from './VFXRenderer';
import { Text, OrbitControls } from '@react-three/drei';
import { SCENARIOS } from '../scenarios';
import { ObstacleData, DINO_HITBOX_OFFSET, OBSTACLE_HITBOX_OFFSETS } from '../scenarios/types';
import { resolveObstacleCollision, destroyObstacleWithScore } from '../scenarios/obstacleEffects';
import { TrailingEggs } from './TrailingEggs';
import { Fireball } from './Fireball';
import { Coins } from './Coins';
import { DRAGON_FIREBALL_INTERVAL_S, DRAGON_FIREBALL_SPEED, DRAGON_FIREBALL_LIFETIME_S } from '../config/balance';

interface TransitionProps {
  scenarioKey: string;
  children: React.ReactNode;
}

function ScenarioTransition({ scenarioKey, children }: TransitionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const animTime = useRef(0);
  const duration = 0.6;
  const status = useGameStore(s => s.status);

  useEffect(() => {
    animTime.current = 0;
  }, [scenarioKey]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    if (status === 'menu' && animTime.current < duration) {
      animTime.current += delta;
      const t = Math.min(1, animTime.current / duration);
      // Spring bounce formula: starts at 0, overshoots to ~1.2, undershoots, and settles at 1.0
      const s = 1.0 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2);
      groupRef.current.scale.set(s, s, s);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}

function FloatingTextRenderer() {
  const texts = useGameStore(state => state.floatingTexts);
  const removeFloatingText = useGameStore(state => state.removeFloatingText);
  const status = useGameStore(state => state.status);

  useFrame((_state, delta) => {
    const now = performance.now();
    texts.forEach(t => {
      if (status === 'playing') {
        // Move backwards with world
        t.x -= useGameStore.getState().getCurrentSpeed() * delta;
        // Move up slightly
        t.y += delta * 2;
      }

      // Expiry always runs, even outside a run (e.g. "COMPRADO!" from the shop),
      // otherwise texts triggered from menus never get cleaned up.
      if (now - t.createdAt > 1000) {
        removeFloatingText(t.id);
      }
    });
  });

  return (
    <>
      {/* Hidden text to preload font */}
      <Text
        visible={false}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
      >
        Preload
      </Text>
      {texts.map(t => (
        <Text
          key={t.id}
          position={[t.x, t.y, t.z]}
          color={t.color}
          fontSize={0.8}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {t.text}
        </Text>
      ))}
    </>
  );
}


function CameraController() {
   const activePowerup = useGameStore(s => s.activePowerup);
   useFrame((state) => {
      const targetFov = activePowerup === 'super' ? 50 : 35;
      (state.camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp((state.camera as THREE.PerspectiveCamera).fov, targetFov, 0.05);
      state.camera.updateProjectionMatrix();
   });
   return null;
}

function PowerupLight() {
    const activePowerup = useGameStore(s => s.activePowerup);
    const color = activePowerup === 'super' ? '#fde047' :
                  activePowerup === 'jaw' ? '#ef4444' :
                  activePowerup === 'ghost' ? '#a855f7' :
                  activePowerup === 'wings' ? '#93c5fd' :
                  activePowerup === 'earth' ? '#d97706' :
                  activePowerup === 'dragon' ? '#dc2626' : '#ffffff';
    const intensity = activePowerup !== 'none' ? 1.5 : 0;
    
    return <pointLight position={[2, 3, 0]} color={color} intensity={intensity} distance={15} />;
}

interface FireballSlot {
  id: number;
  x: number;
  y: number;
  active: boolean;
  life: number;
  ref: React.RefObject<THREE.Group | null>;
}

export function Game() {
  const { status, incrementScore, cameraMode, scenario, devMode, gameId } = useGameStore();
  const dinoRef = useRef<THREE.Group>(null);
  const dinoBox = useRef(new THREE.Box3());
  const obstaclesRef = useRef<ObstacleData[]>([]);
  const obstacleBox = useRef(new THREE.Box3());
  const fireballBox = useRef(new THREE.Box3());
  const lookAtTarget = useRef(new THREE.Vector3(5, 3.5, 0));

  const [fireballs] = useState<FireballSlot[]>(() =>
    Array.from({ length: 3 }, (_, i) => ({ id: i, x: -1000, y: 0, active: false, life: 0, ref: createRef<THREE.Group>() }))
  );
  const fireballSpawnTimer = useRef(DRAGON_FIREBALL_INTERVAL_S);
  const dragonWasActive = useRef(false);

  // Fresh run: clear out any fireball still mid-flight from the previous attempt.
  useEffect(() => {
    fireballs.forEach((fb) => {
      fb.active = false;
      fb.x = -1000;
      if (fb.ref.current) fb.ref.current.visible = false;
    });
    fireballSpawnTimer.current = DRAGON_FIREBALL_INTERVAL_S;
    dragonWasActive.current = false;
  }, [gameId]);

  // Camera settings
  useFrame((state, delta) => {
    if (devMode) return;
    const isMobile = window.innerWidth < 768;
    const mobileOffset = isMobile ? -5 : 0; // Move camera closer on mobile

    let idealPos = new THREE.Vector3(6, 4.5, 22 + mobileOffset);
    let targetLook = new THREE.Vector3(6, 3.5, 0);

    if (cameraMode === '2D') {
      idealPos.set(6, 4.5, 22 + mobileOffset);
      targetLook.set(6, 3.5, 0);
    } else if (cameraMode === '2.5D') {
      idealPos.set(0, 5, 16 + mobileOffset * 0.8);
      targetLook.set(8, 2, 0);
    }

    const shake = useGameStore.getState().cameraShake;
    if (shake > 0) {
      idealPos.x += (Math.random() - 0.5) * shake;
      idealPos.y += (Math.random() - 0.5) * shake;
      idealPos.z += (Math.random() - 0.5) * shake;
      useGameStore.getState().updateCameraShake();
    }

    state.camera.position.lerp(idealPos, 0.1);
    lookAtTarget.current.lerp(targetLook, 0.1);
    state.camera.lookAt(lookAtTarget.current);

    if (status !== 'playing' && status !== 'gameover') return;

    useGameStore.getState().addGameTime(delta);

    // Update score: 100 points per second at base speed (10)
    const points = 100 * (useGameStore.getState().getCurrentSpeed() / 10) * delta;
    const oldScore = useGameStore.getState().score;
    if (status === 'playing') {
      incrementScore(points);
    }
    const newScore = oldScore + points;

    // Play milestone sound every 1000 points
    if (status === 'playing' && Math.floor(newScore / 1000) > Math.floor(oldScore / 1000) && newScore > 100) {
      playScoreSound();
    }
    
    const { activePowerup } = useGameStore.getState();

    // Collision Detection (Grace period of 10 points to avoid instant death on restart)
    if (status === 'playing' && dinoRef.current && newScore > 10) {
      dinoBox.current.setFromObject(dinoRef.current);

      // Make dino hitbox slightly smaller to be forgiving
      dinoBox.current.expandByScalar(DINO_HITBOX_OFFSET);

      // If Super T-rex, expand hitbox and don't die on obstacle
      if (activePowerup === 'super') {
        dinoBox.current.expandByScalar(1.5);
      }

      for (let i = 0; i < obstaclesRef.current.length; i++) {
        const obs = obstaclesRef.current[i];
        if (!obs.ref.current) continue;

        obstacleBox.current.setFromObject(obs.ref.current);
        const hitboxOffset = OBSTACLE_HITBOX_OFFSETS[obs.type] ?? -0.2;
        obstacleBox.current.expandByScalar(hitboxOffset);

        if (dinoBox.current.intersectsBox(obstacleBox.current)) {
          const runEnded = resolveObstacleCollision(
            { obs, x: obs.x, y: obs.ref.current.position.y, dinoRef },
            useGameStore.getState().dinoColor
          );
          if (runEnded) break;
        }
      }
    }

    // Dragon powerup: fires a fireball forward every couple seconds, destroying
    // whatever obstacle it touches (but never eggs/powerups — those stay collectible).
    if (status === 'playing' && activePowerup === 'dragon' && dinoRef.current) {
      if (!dragonWasActive.current) {
        dragonWasActive.current = true;
        fireballSpawnTimer.current = 0; // fire one immediately on activation
      }
      fireballSpawnTimer.current -= delta;
      if (fireballSpawnTimer.current <= 0) {
        fireballSpawnTimer.current = DRAGON_FIREBALL_INTERVAL_S;
        const slot = fireballs.find(f => !f.active);
        if (slot) {
          slot.active = true;
          slot.life = 0;
          slot.x = dinoRef.current.position.x + 1.5;
          slot.y = dinoRef.current.position.y + 0.8;
        }
      }
    } else {
      dragonWasActive.current = false;
    }

    for (const fb of fireballs) {
      if (!fb.active || !fb.ref.current) continue;

      fb.x += DRAGON_FIREBALL_SPEED * delta;
      fb.life += delta;
      fb.ref.current.position.set(fb.x, fb.y, 0);
      fb.ref.current.visible = true;

      if (fb.life > DRAGON_FIREBALL_LIFETIME_S) {
        fb.active = false;
        fb.ref.current.visible = false;
        continue;
      }

      fireballBox.current.setFromObject(fb.ref.current);
      for (let i = 0; i < obstaclesRef.current.length; i++) {
        const obs = obstaclesRef.current[i];
        if (!obs.ref.current || obs.type === 'egg' || obs.type === 'powerup') continue;

        obstacleBox.current.setFromObject(obs.ref.current);
        if (fireballBox.current.intersectsBox(obstacleBox.current)) {
          destroyObstacleWithScore(obs, obs.x, obs.ref.current.position.y, '#f97316');
          fb.active = false;
          fb.ref.current.visible = false;
          break;
        }
      }
    }
  });

  return (
    <group>
      <VFXRenderer />
      <FloatingTextRenderer />
      <CameraController />
      <PowerupLight />
      <Dino ref={dinoRef} />
      <TrailingEggs dinoRef={dinoRef} />
      <Coins obstaclesRef={obstaclesRef} dinoRef={dinoRef} />
      {fireballs.map((fb) => (
        <Fireball key={fb.id} ref={fb.ref} x={fb.x} y={fb.y} />
      ))}
      {(() => {
        const activeScenario = SCENARIOS[scenario];
        const Ground = activeScenario.GroundComponent;
        const Obstacles = activeScenario.ObstaclesComponent;
        const Env = activeScenario.EnvironmentComponent;
        return (
          <ScenarioTransition key={scenario} scenarioKey={scenario}>
            <Obstacles ref={obstaclesRef} />
            <Ground />
            {Env && <Env />}
          </ScenarioTransition>
        );
      })()}
      {devMode && <OrbitControls makeDefault />}
    </group>

  );
}
