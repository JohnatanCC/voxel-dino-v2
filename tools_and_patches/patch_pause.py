import re

with open('src/components/UI.tsx', 'r') as f:
    code = f.read()

replacement = """        {status === 'paused' && (
          <motion.div key="paused"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 p-4"
          >
            <div className="text-center pointer-events-auto bg-white/95 backdrop-blur border-2 border-[#535353] p-6 sm:p-10 rounded shadow-[8px_8px_0px_#bcbcbc] max-w-[95vw] sm:max-w-sm w-full flex flex-col items-center gap-4">
              <h2 className="text-3xl sm:text-5xl game-font text-[#535353] mb-2 tracking-tighter">PAUSED</h2>
              
              <div className="flex items-center gap-4 mt-2 mb-4 w-full justify-center">
                <button
                  onClick={() => {
                    const opts = ['low', 'medium', 'high'] as const;
                    const idx = opts.indexOf(fogSettings[scenario]);
                    const prev = opts[(idx - 1 + opts.length) % opts.length];
                    setFogDensity(scenario, prev);
                  }}
                  className="text-[#535353] hover:text-amber-500 transition-colors"
                ><ChevronLeft className="w-6 h-6" /></button>
                <div className="game-font text-[#535353] text-base uppercase tracking-widest w-24 text-center">
                  FOG: {fogSettings[scenario]}
                </div>
                <button
                  onClick={() => {
                    const opts = ['low', 'medium', 'high'] as const;
                    const idx = opts.indexOf(fogSettings[scenario]);
                    const next = opts[(idx + 1) % opts.length];
                    setFogDensity(scenario, next);
                  }}
                  className="text-[#535353] hover:text-amber-500 transition-colors"
                ><ChevronRight className="w-6 h-6" /></button>
              </div>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => useGameStore.getState().resetGame()}
                  className="flex-1 bg-red-500 text-white game-font py-2 sm:py-3 px-4 voxel-btn text-sm sm:text-lg"
                >
                  MENU
                </button>
                <button 
                  onClick={() => useGameStore.getState().togglePause()}
                  className="flex-1 bg-[#535353] text-white game-font py-2 sm:py-3 px-4 voxel-btn text-sm sm:text-lg"
                >
                  RESUME
                </button>
              </div>
            </div>
          </motion.div>
        )}"""

code = re.sub(r'        \{status === \'paused\' && \([\s\S]*?<\/motion\.div>\n        \)\}', replacement, code)

with open('src/components/UI.tsx', 'w') as f:
    f.write(code)

