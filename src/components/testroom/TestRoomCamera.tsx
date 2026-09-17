import { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  TEST_ROOM_CAMERA_DISTANCE,
  TEST_ROOM_CAMERA_HEIGHT,
  TEST_ROOM_CAMERA_LOOK_AHEAD,
  TEST_ROOM_CAMERA_LERP_RATE,
  TEST_ROOM_CAMERA_BOB_AMPLITUDE,
  TEST_ROOM_CAMERA_BOB_SPEED,
} from '../../config/balance';

interface TestRoomCameraProps {
  targetRef: RefObject<THREE.Group | null>;
}

const idealPos = new THREE.Vector3();
const lookAt = new THREE.Vector3();

// Third-person chase camera: behind and above the dino, tracking its lane (Z)
// and jump (Y) while always looking forward down the run direction (+X).
export function TestRoomCamera({ targetRef }: TestRoomCameraProps) {
  useFrame((state, delta) => {
    const target = targetRef.current;
    if (!target) return;

    const bob = Math.sin(state.clock.elapsedTime * TEST_ROOM_CAMERA_BOB_SPEED) * TEST_ROOM_CAMERA_BOB_AMPLITUDE;
    idealPos.set(
      target.position.x - TEST_ROOM_CAMERA_DISTANCE,
      target.position.y + TEST_ROOM_CAMERA_HEIGHT + bob,
      target.position.z
    );
    const camT = 1 - Math.exp(-TEST_ROOM_CAMERA_LERP_RATE * delta);
    state.camera.position.lerp(idealPos, camT);

    lookAt.set(target.position.x + TEST_ROOM_CAMERA_LOOK_AHEAD, target.position.y + 1.0, target.position.z);
    state.camera.lookAt(lookAt);
  });

  return null;
}
