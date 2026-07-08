import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SkinConfig } from '../../../store/gameStore';
import { createVoxelTexture } from '../../../utils/texture';
import { DinoModelProps } from '../types';

interface RainbowDinoProps extends DinoModelProps {
  skinConfig: SkinConfig;
}

export function RainbowDinoModel({ animState, previewMode = false, skinConfig }: RainbowDinoProps) {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const wingLeftRef = useRef<THREE.Mesh>(null);
  const wingRightRef = useRef<THREE.Mesh>(null);
  const lowerJawRef = useRef<THREE.Mesh>(null);
  const parentGroupRef = useRef<THREE.Group>(null);

  // Generate procedural textures
  const bodyTexture = useMemo(() => createVoxelTexture(skinConfig.baseColor, skinConfig.spotsColor, 'rainbow'), [skinConfig.baseColor, skinConfig.spotsColor]);

  // Create materials
  const dinoMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: bodyTexture,
    roughness: 0.4,
    metalness: 0.8, // Metallic cyber texture
  }), [bodyTexture]);

  const neonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.2,
    metalness: 0.5,
    emissive: new THREE.Color('#ff00ff'),
    emissiveIntensity: 2.0,
  }), []);

  const spikesMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.2,
    metalness: 0.5,
    emissive: new THREE.Color('#00ffff'),
    emissiveIntensity: 2.0,
  }), []);

  const collarMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.5,
    metalness: 0.1,
  }), []);

  useFrame((state) => {
    const current = animState.current;
    const p = current.activePowerup;
    const phase = current.runPhase;
    const isGrounded = current.isGrounded;
    const isCrouching = current.isCrouching;
    const isUnderground = current.isUnderground;
    const isEating = current.isEating;
    const status = current.status;
    const time = state.clock.getElapsedTime();

    // 1. Cycle Neon/Rainbow Colors (Tron style)
    const neonColor = new THREE.Color().setHSL((time * 0.4) % 1, 0.95, 0.5);
    const spikeColor = new THREE.Color().setHSL((time * 0.4 + 0.35) % 1, 0.95, 0.5);
    const bodyEmissive = new THREE.Color().setHSL((time * 0.4 + 0.7) % 1, 0.9, 0.5);

    neonMaterial.color.copy(neonColor);
    neonMaterial.emissive.copy(neonColor);

    spikesMaterial.color.copy(spikeColor);
    spikesMaterial.emissive.copy(spikeColor);

    collarMaterial.color.set('#ffffff');

    if (p === 'super') {
      dinoMaterial.emissive.copy(bodyEmissive);
      dinoMaterial.emissiveIntensity = 3.0;
    } else {
      // Shimmering cyber grids
      dinoMaterial.emissive.copy(bodyEmissive);
      dinoMaterial.emissiveIntensity = 0.6 + Math.sin(time * 5) * 0.4;
    }

    // 2. Invincibility Blink visual
    const storeState = useGameStore.getState();
    if (performance.now() < storeState.invincibleUntil) {
      const isWhite = Math.floor(performance.now() / 150) % 2 === 0;
      if (isWhite) {
        dinoMaterial.color.set('#ffffff');
        dinoMaterial.emissive.set('#ffffff');
        dinoMaterial.emissiveIntensity = 1.0;
      }
    } else {
      dinoMaterial.color.set('#ffffff'); // keep map base
    }

    // 3. Set Preview Mode pose and bypass animations
    if (previewMode) {
      if (leftLegRef.current) {
        leftLegRef.current.rotation.z = 0;
        leftLegRef.current.position.y = 0.7;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.z = 0;
        rightLegRef.current.position.y = 0.7;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.z = 0;
      if (headRef.current) {
        headRef.current.rotation.z = 0;
        headRef.current.position.set(0.5, 0, 0);
      }
      if (lowerJawRef.current) lowerJawRef.current.rotation.z = 0;
      return;
    }

    // 4. Procedural running & death cycles
    if (status === 'gameover') {
      // Death splayed limbs and head
      if (leftLegRef.current) {
        leftLegRef.current.rotation.z = 1.2;
        leftLegRef.current.position.y = 0.7;
        leftLegRef.current.scale.set(1.0, 1.0, 1.0);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.z = -1.2;
        rightLegRef.current.position.y = 0.7;
        rightLegRef.current.scale.set(1.0, 1.0, 1.0);
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = 1.5;
        leftArmRef.current.scale.set(1.0, 1.0, 1.0);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = -1.5;
        rightArmRef.current.scale.set(1.0, 1.0, 1.0);
      }
      if (headRef.current) {
        headRef.current.rotation.z = -0.4;
        headRef.current.position.set(0.5, -0.2, 0);
      }

      // Fall sideways smoothly (rotate on X-axis and translate up to stay on ground)
      if (parentGroupRef.current) {
        parentGroupRef.current.rotation.x = THREE.MathUtils.lerp(parentGroupRef.current.rotation.x, Math.PI / 2, 0.1);
        parentGroupRef.current.position.y = THREE.MathUtils.lerp(parentGroupRef.current.position.y, 0.55, 0.1);
        parentGroupRef.current.position.x = THREE.MathUtils.lerp(parentGroupRef.current.position.x, -0.2, 0.1);
      }
    } else {
      // Reset parent group
      if (parentGroupRef.current) {
        parentGroupRef.current.rotation.set(0, 0, 0);
        parentGroupRef.current.position.set(0, 0, 0);
      }

      if (isGrounded) {
        if (leftLegRef.current && rightLegRef.current) {
          if (p === 'ghost') {
            leftLegRef.current.rotation.z = -0.2;
            rightLegRef.current.rotation.z = 0.2;
            leftLegRef.current.position.y = 0.7;
            rightLegRef.current.position.y = 0.7;
          } else {
            const leftCycle = Math.sin(phase);
            const rightCycle = Math.sin(phase + Math.PI);

            leftLegRef.current.rotation.z = leftCycle * 0.9 + Math.cos(phase) * 0.2;
            rightLegRef.current.rotation.z = rightCycle * 0.9 + Math.cos(phase + Math.PI) * 0.2;

            leftLegRef.current.position.y = 0.7 + Math.max(0, -leftCycle) * 0.4;
            rightLegRef.current.position.y = 0.7 + Math.max(0, -rightCycle) * 0.4;
          }
        }

        if (leftArmRef.current && rightArmRef.current) {
          if (p === 'ghost') {
            leftArmRef.current.rotation.z = 0;
            rightArmRef.current.rotation.z = 0;
          } else {
            leftArmRef.current.rotation.z = Math.sin(phase + Math.PI) * 0.6;
            leftArmRef.current.rotation.y = Math.sin(phase + Math.PI) * 0.2;

            rightArmRef.current.rotation.z = Math.sin(phase) * 0.6;
            rightArmRef.current.rotation.y = Math.sin(phase) * 0.2;
          }
        }
      } else {
        // Jumping pose
        if (leftLegRef.current && rightLegRef.current) {
          if (p === 'ghost') {
            leftLegRef.current.rotation.z = -0.2;
            rightLegRef.current.rotation.z = 0.2;
          } else {
            const isFalling = current.velocity < 0;
            leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, isFalling ? 0.3 : -0.7, 0.2);
            rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, isFalling ? 0.7 : 0.4, 0.2);

            leftLegRef.current.position.y = THREE.MathUtils.lerp(leftLegRef.current.position.y, 0.7, 0.2);
            rightLegRef.current.position.y = THREE.MathUtils.lerp(rightLegRef.current.position.y, 0.7, 0.2);
          }
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.8, 0.2);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.8, 0.2);
        }
      }

      // 5. Crouch & escavation head pose adjustments
      if (isUnderground) {
        if (headRef.current) {
          headRef.current.position.y = 0;
          headRef.current.position.x = 0.5;
          headRef.current.rotation.z = 0;
        }
      } else if (isCrouching) {
        if (headRef.current) {
          headRef.current.position.y = -0.5;
          headRef.current.position.x = 1.0;
          headRef.current.rotation.z = 0.2;
        }
      } else {
        if (headRef.current) {
          headRef.current.position.y = 0;
          headRef.current.position.x = 0.5;
          if (isGrounded && p !== 'ghost') {
            headRef.current.rotation.z = Math.sin(phase) * 0.1 - 0.05;
            headRef.current.position.x = 0.5 + Math.sin(phase) * 0.05;
          } else if (current.velocity < 0) {
            headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.2, 0.1);
          }
        }
      }

      // 6. Eating jaw movement
      if (lowerJawRef.current) {
        if (isEating) {
          lowerJawRef.current.rotation.z = -Math.abs(Math.sin(time * 15)) * 0.45;
        } else {
          lowerJawRef.current.rotation.z = p === 'super' ? -0.4 : 0;
        }
      }

      // 7. Wings flapping powerup
      if (wingLeftRef.current && wingRightRef.current) {
        if (p === 'wings') {
          if (!isGrounded && current.velocity < 0) {
            wingLeftRef.current.rotation.z = THREE.MathUtils.lerp(wingLeftRef.current.rotation.z, Math.PI / 4, 0.2);
            wingRightRef.current.rotation.z = THREE.MathUtils.lerp(wingRightRef.current.rotation.z, -Math.PI / 4, 0.2);
          } else if (!isGrounded && current.velocity > 0) {
            wingLeftRef.current.rotation.z = Math.sin(time * 30) * 0.8;
            wingRightRef.current.rotation.z = -Math.sin(time * 30) * 0.8;
          } else {
            wingLeftRef.current.rotation.z = 0;
            wingRightRef.current.rotation.z = 0;
          }
        }
      }
    }
  });

  const isGhost = animState.current.activePowerup === 'ghost';
  const activePowerup = animState.current.activePowerup;

  // Render Cyber Rainbow structure
  return (
    <group ref={parentGroupRef}>
      {/* Main Body */}
      <mesh position={[-0.1, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.0, 0.8]} />
        <primitive object={dinoMaterial} attach="material" />
      </mesh>

      {/* Glowing Cyber Spots */}
      <mesh position={[0.2, 1.6, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <primitive object={neonMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.3, 1.4, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <primitive object={neonMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.9, 0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <primitive object={neonMaterial} attach="material" />
      </mesh>
      <mesh position={[0.2, 1.6, -0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <primitive object={neonMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.3, 1.4, -0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <primitive object={neonMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.9, -0.41]} castShadow={!isGhost}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <primitive object={neonMaterial} attach="material" />
      </mesh>

      {/* Cyber Spikes */}
      <mesh position={[-0.1, 1.9, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.3, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.6, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.3, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>
      <mesh position={[-1.0, 1.5, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.3, 0.2]} />
        <primitive object={spikesMaterial} attach="material" />
      </mesh>

      {/* Tail */}
      <mesh position={[-1.0, 1.0, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <primitive object={dinoMaterial} attach="material" />
      </mesh>
      <mesh position={[-1.5, 0.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.6, 0.4, 0.4]} />
        <primitive object={dinoMaterial} attach="material" />
      </mesh>

      {/* Collar */}
      <mesh position={[0.4, 1.8, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.6, 0.2, 0.9]} />
        <primitive object={collarMaterial} attach="material" />
      </mesh>
      {/* Tag */}
      <mesh position={[0.7, 1.6, 0]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.3, 0.3]} />
        <primitive object={neonMaterial} attach="material" />
      </mesh>

      {/* Head Group */}
      <group ref={headRef} position={[0.5, 0, 0]}>
        {/* Main Head */}
        <mesh position={[0.4, 2.2, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[1.2, 1.1, 1.1]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Snout */}
        <mesh position={[1.1, 2.1, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.6, 0.7, 0.9]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Teeth */}
        <mesh position={[1.2, 1.7, 0.4]} castShadow={!isGhost}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[1.3, 1.7, 0.2]} castShadow={!isGhost}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[1.3, 1.7, -0.2]} castShadow={!isGhost}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[1.2, 1.7, -0.4]} castShadow={!isGhost}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {/* Lower Jaw */}
        <mesh ref={lowerJawRef} position={[1.0, 1.75, 0]} castShadow={!isGhost} receiveShadow={!isGhost}>
          <boxGeometry args={[0.5, 0.3, 0.8]} />
          <primitive object={dinoMaterial} attach="material" />
        </mesh>

        {/* Horns */}
        <mesh position={[0.1, 2.8, 0.35]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <primitive object={spikesMaterial} attach="material" />
        </mesh>
        <mesh position={[0.1, 2.8, -0.35]} castShadow={!isGhost} receiveShadow={!isGhost} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <primitive object={spikesMaterial} attach="material" />
        </mesh>

        {/* Strong Jaw Powerup Visual */}
        {activePowerup === "jaw" && (
          <group position={[1.4, 2.0, 0]}>
            <mesh position={[0, 0, 0.3]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.4, 0.4, 0.15]} />
              <primitive object={neonMaterial} attach="material" />
            </mesh>
            <mesh position={[0, 0, -0.3]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.4, 0.4, 0.15]} />
              <primitive object={neonMaterial} attach="material" />
            </mesh>
          </group>
        )}

        {/* Neon glowing Eyes */}
        <>
          <mesh position={[0.6, 2.4, 0.56]}>
            <boxGeometry args={[0.2, 0.25, 0.05]} />
            <primitive object={neonMaterial} attach="material" />
          </mesh>
          <mesh position={[0.65, 2.4, 0.57]}>
            <boxGeometry args={[0.1, 0.15, 0.05]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
        </>
        <>
          <mesh position={[0.6, 2.4, -0.56]}>
            <boxGeometry args={[0.2, 0.25, 0.05]} />
            <primitive object={neonMaterial} attach="material" />
          </mesh>
          <mesh position={[0.65, 2.4, -0.57]}>
            <boxGeometry args={[0.1, 0.15, 0.05]} />
            <meshBasicMaterial color="black" transparent={isGhost} opacity={isGhost ? 0.4 : 1.0} />
          </mesh>
        </>
      </group>

      {/* Cyber Wings Powerup Visual */}
      {activePowerup === "wings" && (
        <group position={[-0.2, 1.5, 0]}>
          <mesh ref={wingLeftRef} position={[0, 0, 0.6]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.6, 0.1, 0.4]} />
            <primitive object={spikesMaterial} attach="material" />
          </mesh>
          <mesh ref={wingRightRef} position={[0, 0, -0.6]} rotation={[0, -Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.6, 0.1, 0.4]} />
            <primitive object={spikesMaterial} attach="material" />
          </mesh>
        </group>
      )}

      {/* Arms */}
      <mesh ref={leftArmRef} position={[0.6, 1.2, 0.56]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <primitive object={dinoMaterial} attach="material" />
        <mesh position={[0.2, 0, 0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.2, 0, -0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </mesh>
      <mesh ref={rightArmRef} position={[0.6, 1.2, -0.56]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <primitive object={dinoMaterial} attach="material" />
        <mesh position={[0.2, 0, 0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.2, 0, -0.05]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </mesh>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.2, 0.7, 0.35]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.5, 0.7, 0.4]} />
        <primitive object={dinoMaterial} attach="material" />
        <mesh position={[0.15, -0.3, 0]}>
          <boxGeometry args={[0.6, 0.3, 0.45]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.35, -0.1, 0.15]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.35, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.35, -0.1, -0.15]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </mesh>
      </mesh>
      <mesh ref={rightLegRef} position={[0.2, 0.7, -0.35]} castShadow={!isGhost} receiveShadow={!isGhost}>
        <boxGeometry args={[0.5, 0.7, 0.4]} />
        <primitive object={dinoMaterial} attach="material" />
        <mesh position={[0.15, -0.3, 0]}>
          <boxGeometry args={[0.6, 0.3, 0.45]} />
          <primitive object={dinoMaterial} attach="material" />
          <mesh position={[0.35, -0.1, 0.15]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.35, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.35, -0.1, -0.15]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </mesh>
      </mesh>
    </group>
  );
}
