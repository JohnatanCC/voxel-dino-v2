import re

with open('src/components/UI.tsx', 'r') as f:
    ui_code = f.read()

# 1. Add Settings modal
settings_modal = """
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto bg-black/60 backdrop-blur-sm">
            <div className="bg-[#2a2a2a] border-4 border-[#535353] p-8 max-w-md w-full relative shadow-[8px_8px_0px_rgba(0,0,0,0.5)] flex flex-col items-center">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-2 right-2 text-white/50 hover:text-white"
              >
                <X className="w-8 h-8" />
              </button>
              
              <h2 className="text-3xl game-font text-white mb-8 tracking-tighter">CONFIGURAÇÕES</h2>
              
              <div className="flex flex-col gap-8 w-full">
                {/* Difficulty */}
                <div className="flex flex-col items-center gap-2">
                  <span className="game-font text-white/70 text-sm tracking-widest uppercase">Dificuldade</span>
                  <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                          const opts = ['easy', 'medium', 'hard'];
                          const idx = opts.indexOf(useGameStore.getState().difficulty);
                          const prev = opts[(idx - 1 + opts.length) % opts.length];
                          useGameStore.getState().setDifficulty(prev as 'easy' | 'medium' | 'hard');
                        }}
                      className="text-white hover:text-amber-300 transition-colors"
                    ><ChevronLeft className="w-8 h-8" /></button>
                    <div className="game-font text-white text-xl uppercase tracking-widest w-24 text-center">
                      {useGameStore.getState().difficulty}
                    </div>
                    <button
                        onClick={() => {
                          const opts = ['easy', 'medium', 'hard'];
                          const idx = opts.indexOf(useGameStore.getState().difficulty);
                          const next = opts[(idx + 1) % opts.length];
                          useGameStore.getState().setDifficulty(next as 'easy' | 'medium' | 'hard');
                        }}
                      className="text-white hover:text-amber-300 transition-colors"
                    ><ChevronRight className="w-8 h-8" /></button>
                  </div>
                </div>

                {/* Graphics */}
                <div className="flex flex-col items-center gap-2">
                  <span className="game-font text-white/70 text-sm tracking-widest uppercase">Gráficos</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                          const opts = ['low', 'medium', 'high'];
                          const current = useGameStore.getState().graphicsQuality;
                          const idx = opts.indexOf(current);
                          useGameStore.getState().setGraphicsQuality(opts[(idx - 1 + opts.length) % opts.length] as any);
                      }}
                      className="text-white hover:text-amber-300 transition-colors"
                    ><ChevronLeft className="w-8 h-8" /></button>
                    <div className="game-font text-white text-xl uppercase tracking-widest w-24 text-center">
                      {useGameStore.getState().graphicsQuality}
                    </div>
                    <button
                      onClick={() => {
                          const opts = ['low', 'medium', 'high'];
                          const current = useGameStore.getState().graphicsQuality;
                          const idx = opts.indexOf(current);
                          useGameStore.getState().setGraphicsQuality(opts[(idx + 1) % opts.length] as any);
                      }}
                      className="text-white hover:text-amber-300 transition-colors"
                    ><ChevronRight className="w-8 h-8" /></button>
                  </div>
                </div>
                
                {/* Color Picker */}
                <div className="flex flex-col items-center gap-2">
                  <span className="game-font text-white/70 text-sm tracking-widest uppercase">Cor do Dino</span>
                  <input
                    type="color"
                    value={useGameStore.getState().dinoColor}
                    onChange={(e) => useGameStore.getState().setDinoColor(e.target.value)}
                    className="w-12 h-12 rounded-full cursor-pointer border-2 border-white shadow-lg bg-transparent p-0 overflow-hidden"
                    style={{ borderRadius: '50%', WebkitAppearance: 'none', border: '2px solid white' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
"""

if "{isSettingsOpen && (" not in ui_code:
    ui_code = ui_code.replace("{status === 'gameover' && (", settings_modal + "\n        {status === 'gameover' && (")

# 2. Replace Difficulty in menu with Settings button
difficulty_start = ui_code.find("{/* Difficulty */}")
color_start = ui_code.find("{/* Color Picker */}")
if difficulty_start != -1 and color_start != -1:
    end_of_color = ui_code.find("</div>", ui_code.find("</input>", color_start) if "</input>" in ui_code[color_start:color_start+1000] else ui_code.find("/>", color_start) + 2)
    end_of_color = ui_code.find("</div>", end_of_color) + 6
    
    # We will replace the block from difficulty_start to end_of_color with a Settings button
    settings_button = """
              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-white hover:text-amber-300 transition-colors flex items-center justify-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-4"
              >
                <Settings className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
"""
    # But wait, let's just do a simpler string replacement
    pass

with open('src/components/UI.tsx', 'w') as f:
    f.write(ui_code)

