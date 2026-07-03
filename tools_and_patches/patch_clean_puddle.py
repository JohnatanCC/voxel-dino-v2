with open('src/components/ForestObstacles.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "return (" in line and "group ref={innerRef} position={[x, 0, 0]}" in lines[lines.index(line)+1]:
        skip = True
    
    if skip and "});" in line and "const PowerupBox" in lines[lines.index(line)+1]:
        skip = False
        continue # skip this line too
    
    if not skip:
        new_lines.append(line)

with open('src/components/ForestObstacles.tsx', 'w') as f:
    f.writelines(new_lines)

