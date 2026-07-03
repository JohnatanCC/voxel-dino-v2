const fs = require('fs');
let code = fs.readFileSync('src/components/UI.tsx', 'utf8');

code = code.replace(
  /{status === 'menu' && \(\s*<motion\.div/g,
  `{status === 'menu' && (\n          <motion.div key="menu"`
);

code = code.replace(
  /{status === 'menu' && \(\s*<button/g,
  `{status === 'menu' && (\n           <button key="secret-btn"`
);

code = code.replace(
  /{status === 'gameover' && \(\s*<motion\.div/g,
  `{status === 'gameover' && (\n          <motion.div key="gameover"`
);

code = code.replace(
  /{status === 'paused' && \(\s*<motion\.div/g,
  `{status === 'paused' && (\n          <motion.div key="paused"`
);

fs.writeFileSync('src/components/UI.tsx', code, 'utf8');
