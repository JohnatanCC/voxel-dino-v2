// Registry of moving platforms the dino can land on (currently only the lava T-Rex's
// back). Empty registry = the plain flat ground at y = 0, so nothing else changes.

export interface StandableSurface {
  id: string;
  x0: number;
  x1: number;
  top: number;
  onLand?: () => void;
}

const surfaces = new Map<string, StandableSurface>();

export function setSurface(surface: StandableSurface): void {
  surfaces.set(surface.id, surface);
}

export function clearSurface(id: string): void {
  surfaces.delete(id);
}

export function clearAllSurfaces(): void {
  surfaces.clear();
}

// Highest surface under `x` that the dino was above (or resting on) at `fromY`.
// A dino rising from below passes through — it only lands when coming down onto it.
export function findSupport(x: number, fromY: number): StandableSurface | null {
  let best: StandableSurface | null = null;
  surfaces.forEach((s) => {
    if (x >= s.x0 && x <= s.x1 && s.top <= fromY + 0.1 && (!best || s.top > best.top)) best = s;
  });
  return best;
}
