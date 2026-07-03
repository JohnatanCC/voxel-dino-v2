import re

with open('src/components/Obstacles.tsx', 'r') as f:
    code = f.read()

code = code.replace("export type ObstacleType = 'bird' | 'cactus-small' | 'cactus-large' | 'powerup' | 'stump-low' | 'stump-high' | 'puddle' | 'rock-large' | 'snowman' | 'rock-small' | 'firebox' | 'swamp-log' | 'swamp-fly' | 'skull';", "export type ObstacleType = 'bird' | 'cactus-small' | 'cactus-large' | 'powerup' | 'stump-low' | 'stump-high' | 'puddle' | 'rock-large' | 'snowman' | 'rock-small' | 'firebox' | 'swamp-log' | 'swamp-fly' | 'skull' | 'croc' | 'tree-hole';")

with open('src/components/Obstacles.tsx', 'w') as f:
    f.write(code)

