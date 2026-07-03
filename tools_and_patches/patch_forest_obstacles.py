import re

with open('src/components/ForestObstacles.tsx', 'r') as f:
    code = f.read()

tree_hole_code = """
const TreeHoleObstacle = forwardRef<THREE.Group, { x: number }>(({ x }, ref) => {
  const innerRef = useRef<THREE.Group>(null);
  useImperativeHandle(ref, () => innerRef.current!);
  
  return (
    <group ref={innerRef} position={[x, 0, 0]}>
      {/* Huge trunk */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.5, 8, 8]} />
        <meshStandardMaterial color="#3f2715" roughness={0.9} />
      </mesh>
      
      {/* Hole - we simulate this by making the hitbox only hit the top part (the canopy/arch). 
          Wait, the hitbox in Game.tsx uses the whole ref box. If the ref contains a mesh at y=2.5 to 8, 
          the bounding box will start at 0. Let's position the hitbox mesh correctly! */}
      
      {/* Actual physical parts that player can hit. 
          The Dino crouching box has height ~1.2. 
          So we put a block starting at y = 1.8 up to 8. */}
      
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
         <boxGeometry args={[3, 6, 2]} />
         <meshStandardMaterial color="#3f2715" roughness={0.9} />
      </mesh>
      
      {/* Visual only - sides of the trunk (roots) so it looks like a tunnel */}
      <mesh position={[2, 1, 0]} castShadow receiveShadow>
         <cylinderGeometry args={[0.5, 1, 2, 5]} />
         <meshStandardMaterial color="#3f2715" roughness={0.9} />
      </mesh>
      <mesh position={[-2, 1, 0]} castShadow receiveShadow>
         <cylinderGeometry args={[0.5, 1, 2, 5]} />
         <meshStandardMaterial color="#3f2715" roughness={0.9} />
      </mesh>
    </group>
  );
});
"""

code = code.replace("export const ForestObstacles", tree_hole_code + "\nexport const ForestObstacles")

gen_code = """
    } else if (rand > 0.5 && rand <= 0.65) {
      type = 'puddle';
    } else if (rand > 0.35 && rand <= 0.5) {
      type = 'stump-high';
    } else if (rand > 0.25 && rand <= 0.35) {
      type = 'tree-hole';
    }
"""
old_gen = """
    } else if (rand > 0.5 && rand <= 0.7) {
      type = 'puddle';
    } else if (rand > 0.3 && rand <= 0.5) {
      type = 'stump-high';
    }
"""
code = code.replace(old_gen, gen_code)

render_code = """
        if (obs.type === 'puddle') {
           return <Puddle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
        if (obs.type === 'tree-hole') {
           return <TreeHoleObstacle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
"""
old_render = """
        if (obs.type === 'puddle') {
           return <Puddle key={obs.id} ref={obs.ref as any} x={obs.x} />;
        }
"""
code = code.replace(old_render, render_code)

with open('src/components/ForestObstacles.tsx', 'w') as f:
    f.write(code)

