const fs = require('fs');
let code = fs.readFileSync('src/components/UI.tsx', 'utf8');
code = code.replace(/key="heart"/g, 'key={`heart-${i}`}');
fs.writeFileSync('src/components/UI.tsx', code, 'utf8');
