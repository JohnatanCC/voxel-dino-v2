import re

with open('src/components/Game.tsx', 'r') as f:
    code = f.read()

puddle_collision = """
            if (obs.type === 'puddle') {
               spawnParticles('dust', [obs.x, obs.ref.current.position.y, 0], 30, '#0ea5e9');
               useGameStore.getState().addFloatingText('LENTO!', obs.x, obs.ref.current.position.y + 1, 0, '#0ea5e9');
               useGameStore.getState().setSlowUntil(performance.now() + 1500); // 1.5 seconds slow
               obs.x = -100;
               obs.ref.current.position.y = -100;
               continue;
            }
"""

code = code.replace("if (obs.type === 'firebox') {", puddle_collision + "            if (obs.type === 'firebox') {")

with open('src/components/Game.tsx', 'w') as f:
    f.write(code)

