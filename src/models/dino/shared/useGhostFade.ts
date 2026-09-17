import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DinoAnimationState } from '../types';

// Applies consistent transparency to a skin's primary body materials while the ghost
// powerup is active. Centralizes a pattern 3 of the 7 skins already had right (Classic,
// Gospel, Rainbow) so the other 4 (which missed it partially or entirely) get it too.
export function useGhostFade(animState: React.RefObject<DinoAnimationState>, materials: THREE.Material[]) {
  useFrame(() => {
    const isGhostActive = animState.current?.activePowerup === 'ghost';
    for (const mat of materials) {
      if (mat.transparent !== isGhostActive) {
        mat.transparent = isGhostActive;
        (mat as THREE.Material & { opacity: number }).opacity = isGhostActive ? 0.4 : 1.0;
      }
    }
  });
}
