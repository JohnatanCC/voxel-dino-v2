import re
import os

files = [
    'src/components/ForestGround.tsx',
    'src/components/SnowGround.tsx',
    'src/components/SwampGround.tsx',
    'src/components/Ground.tsx'
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Look for the mountain loop and replace `d.x -= moveDistance;` with `d.x -= moveDistance * 0.2;`
    # We must be careful because the loop variable `d` is used.
    # It's better to just extract mountains out entirely to `Mountains.tsx`.

