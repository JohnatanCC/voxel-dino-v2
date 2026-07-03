import re

with open('src/components/ForestObstacles.tsx', 'r') as f:
    code = f.read()

tree_hole_code = """
const TreeHoleObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const hitboxRef = useRef<THREE.Mesh>(null);
  
  // Expose ONLY the hitbox mesh to the collision system!
  useImperativeHandle(ref, () => hitboxRef.current as any);
  
  // But we need to move the whole group! Wait, if Game.tsx does obs.ref.current.position.x = newX,
  // it will only move the hitbox.
  // We should move the group in useFrame based on Game.tsx's x property update? No, Game.tsx mutates x.
  // Actually, we can return a proxy object!
  useImperativeHandle(ref, () => {
     return new Proxy(groupRef.current!, {
       get(target, prop) {
          if (prop === 'isGroup' || prop === 'isObject3D') return true;
          // Game.tsx calls setFromObject(obs.ref.current)
          // We can't easily proxy that because setFromObject traverses children.
          // Better solution: The hitbox is the only child of the main group that has geometry,
          // and the visual parts are in a sub-group that is EXCLUDED from raycast/boundingBox?
          // No, THREE.Box3.setFromObject traverses everything.
          return (target as any)[prop];
       }
     });
  });
"""

# Let's write a better solution. 
# Game.tsx does:
# obstacleBox.current.setFromObject(obs.ref.current);
# obs.ref.current.position.x = newX;
# We can make a wrapper group for `obs.ref.current` that only contains the hitbox, 
# and inside it, another group that has an opposite offset for visuals.
# Even simpler: Game.tsx just checks bounding box of `obs.ref.current`.

