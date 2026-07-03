import os
import glob
import re

files = glob.glob('src/components/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r') as f:
        code = f.read()

    # Special handling for Dino.tsx where speed is used for tilting and running animation
    if 'Dino.tsx' in file:
        code = code.replace("const runSpeed = speed *", "const runSpeed = useGameStore.getState().getCurrentSpeed() *")
        code = code.replace("targetTilt = -speed *", "targetTilt = -useGameStore.getState().getCurrentSpeed() *")
        code = code.replace("targetTilt = isGrounded.current && !isCrouching.current ? -speed * 0.012 : 0;", "targetTilt = isGrounded.current && !isCrouching.current ? -useGameStore.getState().getCurrentSpeed() * 0.012 : 0;")
        
    else:
        # replace `speed * delta`
        code = code.replace("speed * delta", "useGameStore.getState().getCurrentSpeed() * delta")
        
        # replace `speed * 1.2` in gap calculation
        code = code.replace("speed * 1.2", "useGameStore.getState().getCurrentSpeed() * 1.2")
        
        # replace `speed * 1.0` in gap calculation
        code = code.replace("speed * 1.0", "useGameStore.getState().getCurrentSpeed() * 1.0")
        
        # replace `speed / 10` in Game.tsx
        code = code.replace("speed / 10", "useGameStore.getState().getCurrentSpeed() / 10")

    with open(file, 'w') as f:
        f.write(code)

