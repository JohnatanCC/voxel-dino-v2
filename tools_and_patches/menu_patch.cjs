const fs = require('fs');
let code = fs.readFileSync('src/components/UI.tsx', 'utf8');

const menuStartIdx = code.indexOf("{status === 'menu' && (");
const menuEndIdx = code.indexOf("{status === 'gameover' && (");

const newMenuStr = `{status === 'menu' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 p-4"
          >
            {/* Title */}
            <h1 className="text-6xl sm:text-8xl game-font text-[#535353] mb-12 tracking-tighter drop-shadow-md text-white mix-blend-difference">
              RUNNER
            </h1>

            <div className="pointer-events-auto flex flex-col gap-6 items-center">
              {/* Scenario Selector */}
              <div className="flex items-center gap-4">
                <button 
                   onClick={() => {
                      const opts = ['mixed', 'desert', 'forest', 'swamp', 'snow'];
                      const current = useGameStore.getState().isMixedMode ? 'mixed' : scenario;
                      const idx = opts.indexOf(current);
                      const prev = opts[(idx - 1 + opts.length) % opts.length];
                      if (prev === 'mixed') {
                         useGameStore.getState().setMixedMode(true);
                      } else {
                         setScenario(prev as any);
                         useGameStore.getState().setMixedMode(false);
                      }
                   }}
                   className="text-white text-3xl hover:text-amber-300 transition-colors drop-shadow-md"
                >◀</button>
                <div className="game-font text-white text-2xl uppercase tracking-widest w-32 text-center drop-shadow-md">
                   {useGameStore.getState().isMixedMode ? 'Mixed' : scenario}
                </div>
                <button 
                   onClick={() => {
                      const opts = ['mixed', 'desert', 'forest', 'swamp', 'snow'];
                      const current = useGameStore.getState().isMixedMode ? 'mixed' : scenario;
                      const idx = opts.indexOf(current);
                      const next = opts[(idx + 1) % opts.length];
                      if (next === 'mixed') {
                         useGameStore.getState().setMixedMode(true);
                      } else {
                         setScenario(next as any);
                         useGameStore.getState().setMixedMode(false);
                      }
                   }}
                   className="text-white text-3xl hover:text-amber-300 transition-colors drop-shadow-md"
                >▶</button>
              </div>

              {/* Camera Mode */}
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setCameraMode(cameraMode === '2D' ? '2.5D' : '2D')}
                   className="text-white text-3xl hover:text-amber-300 transition-colors drop-shadow-md"
                >◀</button>
                <div className="game-font text-white text-xl uppercase tracking-widest w-24 text-center drop-shadow-md">
                   {cameraMode}
                </div>
                <button 
                   onClick={() => setCameraMode(cameraMode === '2D' ? '2.5D' : '2D')}
                   className="text-white text-3xl hover:text-amber-300 transition-colors drop-shadow-md"
                >▶</button>
              </div>

              {/* Color Picker */}
              <div className="flex gap-3 justify-center">
                {['#535353', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map((color) => (
                  <button
                    key={color}
                    onClick={() => useGameStore.getState().setDinoColor(color)}
                    className="w-8 h-8 border-2 border-white rounded-full transition-transform hover:scale-110 shadow-lg"
                    style={{ 
                       backgroundColor: color,
                      transform: useGameStore.getState().dinoColor === color ? 'scale(1.2)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>

              {/* Start Button */}
              <button
                onClick={startGame}
                className="mt-6 bg-white text-[#535353] hover:bg-amber-300 hover:text-black transition-colors game-font py-4 px-12 rounded-full text-2xl shadow-[0_0_15px_rgba(0,0,0,0.2)]"
              >
                START
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Secret Powerup Button */}
        {status === 'menu' && (
           <button
             onClick={() => {
                const powerups = ['wings', 'super', 'ghost', 'jaw', 'earth'];
                const rand = powerups[Math.floor(Math.random() * powerups.length)];
                useGameStore.getState().grantPowerup(rand);
             }}
             className="absolute bottom-4 left-4 z-30 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center font-bold text-xl backdrop-blur transition-colors pointer-events-auto border border-white/30"
           >
             ?
           </button>
        )}
        
        `;

code = code.substring(0, menuStartIdx) + newMenuStr + code.substring(menuEndIdx);

fs.writeFileSync('src/components/UI.tsx', code, 'utf8');
