import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Dino } from './Dino';
import * as THREE from 'three';
import { playHitSound, playScoreSound, playLifeSound, playGameOverSound } from '../utils/audio';
import { VFXRenderer, spawnParticles } from './VFXRenderer';
import { Text, OrbitControls } from '@react-three/drei';
import { SCENARIOS } from '../scenarios';
import { ObstacleData, DINO_HITBOX_OFFSET, OBSTACLE_HITBOX_OFFSETS } from '../scenarios/types';
import { TrailingEggs } from './TrailingEggs';

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
  const { speed, status } = useGameStore();

  useFrame((state, delta) => {
    if (status !== 'playing') return;
    const now = performance.now();
    texts.forEach(t => {
      // Move backwards with world
      t.x -= useGameStore.getState().getCurrentSpeed() * delta;
      // Move up slightly
      t.y += delta * 2;
      
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
                  activePowerup === 'earth' ? '#d97706' : '#ffffff';
    const intensity = activePowerup !== 'none' ? 1.5 : 0;
    
    return <pointLight position={[2, 3, 0]} color={color} intensity={intensity} distance={15} />;
}

export function Game() {
  const { status, speed, incrementScore, increaseSpeed, endGame, cameraMode, scenario, devMode } = useGameStore();
  const dinoRef = useRef<THREE.Group>(null);
  const dinoBox = useRef(new THREE.Box3());
  const obstaclesRef = useRef<ObstacleData[]>([]);
  const obstacleBox = useRef(new THREE.Box3());
  const lookAtTarget = useRef(new THREE.Vector3(5, 3.5, 0));

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
    
    const { activePowerup, activatePowerup } = useGameStore.getState();

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
        if (obs.ref.current) {
          obstacleBox.current.setFromObject(obs.ref.current);
          const hitboxOffset = OBSTACLE_HITBOX_OFFSETS[obs.type] ?? -0.2;
          obstacleBox.current.expandByScalar(hitboxOffset);
          
          if (dinoBox.current.intersectsBox(obstacleBox.current)) {
            if (obs.type === 'egg' && obs.eggRarity) {
              const rarityColor = obs.eggRarity === 'ultraRare' ? '#c084fc' : obs.eggRarity === 'rare' ? '#60a5fa' : '#4ade80';
              spawnParticles('sparkle', [obs.x, obs.ref.current.position.y, 0], 20, rarityColor);
              playScoreSound();
              
              const textLabel = obs.eggRarity === 'ultraRare' ? 'OVO ULTRA RARO!' : obs.eggRarity === 'rare' ? 'OVO RARO!' : 'OVO COMUM!';
              const textColor = obs.eggRarity === 'ultraRare' ? '#a855f7' : obs.eggRarity === 'rare' ? '#3b82f6' : '#22c55e';
              useGameStore.getState().addFloatingText(textLabel, obs.x, obs.ref.current.position.y + 1, 0, textColor);
              
              useGameStore.getState().collectEgg(obs.eggRarity);
              
              obs.x = -100;
              obs.ref.current.position.y = -100;
              continue;
            }

            if (obs.type === 'powerup' && obs.powerupType) {
              if (obs.powerupType === 'life') {
                spawnParticles('sparkle', [obs.x, obs.ref.current.position.y, 0], 20);
                playLifeSound();
                useGameStore.getState().gainLife();
                useGameStore.getState().addFloatingText('+1 VIDA', obs.x, obs.ref.current.position.y + 1, 0, '#ef4444');
              } else {
                const powerupColors: Record<string, string> = {
                  wings: '#ffd700',
                  super: '#facc15',
                  ghost: '#c084fc',
                  jaw: '#f97316',
                  earth: '#a16207',
                };
                const particleColor = powerupColors[obs.powerupType] || '#fbbf24';
                spawnParticles('absorb', [obs.x, obs.ref.current.position.y, 0], 35, particleColor);
                playScoreSound();
                activatePowerup(obs.powerupType, 12); // 12 seconds duration
              }
              // Move powerup out of view immediately to simulate despawn
              obs.x = -100;
              obs.ref.current.position.y = -100;
              continue;
            }

            if (activePowerup === 'super' || activePowerup === 'ghost') {
              // Destroy obstacle (or phase through)
              if (activePowerup === 'ghost') {
                useGameStore.getState().addFloatingText('-1s', obs.x, obs.ref.current.position.y + 1, 0, '#a855f7');
                useGameStore.setState((state) => ({ powerupEndTime: state.powerupEndTime - 1 }));
                spawnParticles('sparkle', [obs.x, obs.ref.current.position.y, 0], 12, '#a855f7');
              } else {
                // If super, explode the obstacle
                playScoreSound();
                spawnParticles('explosion', [obs.x, obs.ref.current.position.y, 0], 30);
                useGameStore.getState().triggerCameraShake(0.5);
                useGameStore.getState().addFloatingText('+100 Pts', obs.x, obs.ref.current.position.y + 1, 0, '#ffffff');
                incrementScore(100); useGameStore.getState().triggerCameraShake(0.3);
              }
              // Move obstacle out of view
              obs.x = -100;
              obs.ref.current.position.y = -100;
              continue;
            }

            if (activePowerup === 'jaw' && obs.type === 'bird') {
              // Eat bird
              playScoreSound();
              spawnParticles('explosion', [obs.x, obs.ref.current.position.y, 0], 20, '#ef4444');
              useGameStore.getState().addFloatingText('+100 Pts', obs.x, obs.ref.current.position.y + 1, 0, '#ffffff');
              incrementScore(100); useGameStore.getState().triggerCameraShake(0.3);
              
              obs.x = -100;
              obs.ref.current.position.y = -100;
              continue;
            }

            if (obs.type === 'bird') {
              const state = useGameStore.getState();
              const isCurrentlyEating = performance.now() < state.eatingUntil;
              
              if (!isCurrentlyEating) {
                // Dino eats the bird!
                playScoreSound();
                spawnParticles('explosion', [obs.x, obs.ref.current.position.y, 0], 25, '#ef4444');
                state.setEatingUntil(performance.now() + 8000); // Eating for 8 seconds
                state.addFloatingText('NHAC!', obs.x, obs.ref.current.position.y + 1, 0, '#ec4899');
                
                incrementScore(50);
                
                obs.x = -100;
                obs.ref.current.position.y = -100;
                continue;
              }
            }

            // Check if currently invincible
            if (performance.now() < useGameStore.getState().invincibleUntil) {
              continue;
            }

            if (obs.type === 'mummy') {
               playHitSound();
               spawnParticles('dust', [obs.x, obs.ref.current.position.y, 0], 30, '#fef08a');
               
               const state = useGameStore.getState();
               const currentScenario = state.scenario;
               const currentFog = state.fogSettings[currentScenario];
               
               if (performance.now() >= state.mummySlowUntil) {
                  state.setOriginalFogDensity(currentFog);
               }
               
               state.setFogDensity(currentScenario, 'high');
               state.setMummySlowUntil(performance.now() + 4000); // 4 seconds mummy slow
               state.addFloatingText('MÚMIA! NEBLINA E LENTO', obs.x, obs.ref.current.position.y + 1, 0, '#eab308');
               
               obs.x = -100;
               obs.ref.current.position.y = -100;
               continue;
            }

            if (obs.type === 'skull') {
               playHitSound();
               spawnParticles('dust', [obs.x, obs.ref.current.position.y, 0], 30, '#f8fafc');
               useGameStore.getState().addFloatingText('PESADO!', obs.x, obs.ref.current.position.y + 1, 0, '#94a3b8');
               useGameStore.getState().setHeavyJumpUntil(performance.now() + 1000); // 1 second heavy jump
               obs.x = -100;
               obs.ref.current.position.y = -100;
               continue;
            }

            if (obs.type === 'snowman') {
               playHitSound();
               spawnParticles('dust', [obs.x, obs.ref.current.position.y, 0], 30, '#f8fafc');
               useGameStore.getState().addFloatingText('FRACO!', obs.x, obs.ref.current.position.y + 1, 0, '#60a5fa');
               useGameStore.getState().setWeakJumpUntil(performance.now() + 2500); // 2.5 seconds weak jump
               obs.x = -100;
               obs.ref.current.position.y = -100;
               continue;
            }

            
            if (obs.type === 'puddle') {
               spawnParticles('dust', [obs.x, obs.ref.current.position.y, 0], 30, '#0ea5e9');
               useGameStore.getState().addFloatingText('LENTO!', obs.x, obs.ref.current.position.y + 1, 0, '#0ea5e9');
               useGameStore.getState().setSlowUntil(performance.now() + 1500); // 1.5 seconds slow
               obs.x = -100;
               obs.ref.current.position.y = -100;
               continue;
            }
            if (obs.type === 'firebox') {
               playScoreSound();
               spawnParticles('sparkle', [obs.x, obs.ref.current.position.y, 0], 20, '#ef4444');
               useGameStore.getState().addFloatingText('QUENTE!', obs.x, obs.ref.current.position.y + 1, 0, '#ef4444');
               useGameStore.getState().resetColdTimer();
               obs.x = -100;
               obs.ref.current.position.y = -100;
               continue;
            }

            // Collision!
            useGameStore.getState().triggerCameraShake(1.0);
            spawnParticles('explosion', [obs.x, obs.ref.current.position.y, 0], 40, useGameStore.getState().dinoColor);
            obs.x = -100;
            obs.ref.current.position.y = -100;
            useGameStore.getState().setInvincibleUntil(performance.now() + 1500); // 1.5 seconds of invincibility

            // Penalidade de perda de ovo se tiver algum no rastro
            const tail = useGameStore.getState().eggsInTail;
             if (tail.length > 0) {
                const lastEgg = tail[tail.length - 1];
                const eggColor = lastEgg.rarity === 'ultraRare' ? '#a855f7' : lastEgg.rarity === 'rare' ? '#3b82f6' : '#22c55e';
                
                let parentX = 2;
                let parentY = 0;
                if (dinoRef.current && dinoRef.current.parent) {
                  const parent = dinoRef.current.parent;
                  const visualGroup = parent.children.find(child => child !== dinoRef.current && child instanceof THREE.Group);
                  if (visualGroup) {
                    parentX = visualGroup.position.x;
                    parentY = visualGroup.position.y;
                  } else {
                    parentX = dinoRef.current.position.x;
                    parentY = dinoRef.current.position.y;
                  }
                }

               spawnParticles('explosion', [parentX, parentY + 0.5, 0], 25, eggColor);
               useGameStore.getState().loseEgg();
               useGameStore.getState().addFloatingText('-1 OVO', parentX, parentY + 1, 0, '#ef4444');
            }

            useGameStore.getState().loseLife();
            
            if (useGameStore.getState().lives <= 0) {
              playGameOverSound();
              endGame();
              break;
            } else {
              playHitSound();
            }
          }
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
