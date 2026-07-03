const fs = require('fs');
let code = fs.readFileSync('src/components/UI.tsx', 'utf8');

const oldLives = `<AnimatePresence>
                {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 1.5, opacity: 0, rotate: 15 }}
                    className="inline-block"
                  >
                    ♥
                  </motion.span>
                ))}
              </AnimatePresence>`;

const newLives = `
                {Array.from({ length: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center relative">
                    <AnimatePresence>
                      {i < lives && (
                        <motion.span
                          key="heart"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 1.5, opacity: 0, rotate: 15 }}
                          className="inline-block absolute"
                        >
                          ♥
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              `;

code = code.replace(oldLives, newLives);
fs.writeFileSync('src/components/UI.tsx', code, 'utf8');
