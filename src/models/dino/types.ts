import { GameStatus } from '../../store/gameStore';

export interface DinoAnimationState {
  runPhase: number;
  velocity: number;
  isGrounded: boolean;
  isCrouching: boolean;
  isUnderground: boolean;
  isEating: boolean;
  activePowerup: 'none' | 'wings' | 'super' | 'ghost' | 'jaw' | 'earth';
  status: GameStatus;
  speed: number;
  isGhost: boolean;
  baseScale: number;
}

export interface DinoModelProps {
  animState: React.RefObject<DinoAnimationState>;
  previewMode?: boolean;
}
