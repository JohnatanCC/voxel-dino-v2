with open('src/components/ForestObstacles.tsx', 'r') as f:
    lines = f.readlines()

count = 0
for i, line in enumerate(lines):
    for char in line:
        if char == '{': count += 1
        elif char == '}': count -= 1
    if count < 0:
        print(f"Negative count at {i+1}: {line}")

print(f"Final count: {count}")
