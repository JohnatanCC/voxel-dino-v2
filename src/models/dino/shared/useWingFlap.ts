import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DinoAnimationState } from '../types';

// Shared flap state machine for the shared <Wings> component: braces on the way down,
// flaps fast on the way up, folds flat while grounded. Same shape every skin already used.
export function useWingFlap(
  animState: React.RefObject<DinoAnimationState>,
  wingLeftRef: React.RefObject<THREE.Group | null>,
  wingRightRef: React.RefObject<THREE.Group | null>
) {
  useFrame(({ clock }) => {
    const current = animState.current;
    if (!current || current.activePowerup !== 'wings') return;
    if (!wingLeftRef.current || !wingRightRef.current) return;

    const time = clock.getElapsedTime();
    if (!current.isGrounded && current.velocity < 0) {
      wingLeftRef.current.rotation.z = THREE.MathUtils.lerp(wingLeftRef.current.rotation.z, Math.PI / 4, 0.2);
      wingRightRef.current.rotation.z = THREE.MathUtils.lerp(wingRightRef.current.rotation.z, -Math.PI / 4, 0.2);
    } else if (!current.isGrounded && current.velocity > 0) {
      wingLeftRef.current.rotation.z = Math.sin(time * 30) * 0.8;
      wingRightRef.current.rotation.z = -Math.sin(time * 30) * 0.8;
    } else {
      wingLeftRef.current.rotation.z = 0;
      wingRightRef.current.rotation.z = 0;
    }
  });
}
