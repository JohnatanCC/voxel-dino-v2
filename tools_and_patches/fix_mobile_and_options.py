import re

# 1. Update gameStore.ts
with open('src/store/gameStore.ts', 'r') as f:
    code = f.read()

if "export type GraphicsQuality =" not in code:
    code = code.replace("export type GameDifficulty = 'easy' | 'medium' | 'hard';", "export type GameDifficulty = 'easy' | 'medium' | 'hard';\nexport type GraphicsQuality = 'low' | 'medium' | 'high';")

if "graphicsQuality: GraphicsQuality;" not in code:
    code = code.replace("difficulty: GameDifficulty;", "difficulty: GameDifficulty;\n  graphicsQuality: GraphicsQuality;")
    code = code.replace("setDifficulty: (diff: GameDifficulty) => void;", "setDifficulty: (diff: GameDifficulty) => void;\n  setGraphicsQuality: (quality: GraphicsQuality) => void;")
    
if "graphicsQuality: 'medium'," not in code:
    code = code.replace("difficulty: 'medium',", "difficulty: 'medium',\n  graphicsQuality: 'medium',")
    code = code.replace("setDifficulty: (difficulty) => set({ difficulty }),", "setDifficulty: (difficulty) => set({ difficulty }),\n  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),")

with open('src/store/gameStore.ts', 'w') as f:
    f.write(code)

# 2. Update UI.tsx
with open('src/components/UI.tsx', 'r') as f:
    ui_code = f.read()

# Fix touch areas - left side crouch, right side jump
# "lado direito da pula e o lado esquerdo abaixa"
# Current:
# left flex-1 -> ArrowDown
# right flex-1 -> ArrowUp
# Add touch-none to prevent scrolling.
touch_areas_old = """
          <div 
            className="flex-1 h-full"
            onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); }}
            onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onPointerLeave={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div 
            className="flex-1 h-full"
            onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); }}
            onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onPointerLeave={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onContextMenu={(e) => e.preventDefault()}
          />
"""

touch_areas_new = """
          <div 
            className="flex-1 h-full touch-none"
            onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); }}
            onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onPointerLeave={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onPointerCancel={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' })); }}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div 
            className="flex-1 h-full touch-none"
            onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); }}
            onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onPointerLeave={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onPointerCancel={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}
            onContextMenu={(e) => e.preventDefault()}
          />
"""

if "className=\"flex-1 h-full\"" in ui_code:
    ui_code = ui_code.replace(touch_areas_old, touch_areas_new)

# Add graphics quality selector below difficulty
quality_selector = """
              {/* Quality Selector */}
              <div className="flex items-center gap-4">
                <button
                   onClick={() => {
                      const opts = ['low', 'medium', 'high'];
                      const current = useGameStore.getState().graphicsQuality;
                      const idx = opts.indexOf(current);
                      useGameStore.getState().setGraphicsQuality(opts[(idx - 1 + opts.length) % opts.length] as any);
                   }}
                   className="text-white hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                ><ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" /></button>
                <div className="game-font text-white text-lg sm:text-2xl uppercase tracking-widest w-24 sm:w-32 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex flex-col">
                   <span>{useGameStore.getState().graphicsQuality}</span>
                   <span className="text-[10px] opacity-70">Graphics</span>
                </div>
                <button
                   onClick={() => {
                      const opts = ['low', 'medium', 'high'];
                      const current = useGameStore.getState().graphicsQuality;
                      const idx = opts.indexOf(current);
                      useGameStore.getState().setGraphicsQuality(opts[(idx + 1) % opts.length] as any);
                   }}
                   className="text-white hover:text-amber-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                ><ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" /></button>
              </div>
"""

# Find the Difficulty Selector block to insert after
if "{/* Quality Selector */}" not in ui_code:
    # Let's just find the startGame button and insert before it
    ui_code = ui_code.replace("<button\n                  onClick={startGame}", quality_selector + "\n              <button\n                  onClick={startGame}")

with open('src/components/UI.tsx', 'w') as f:
    f.write(ui_code)


# 3. Update App.tsx for graphics quality DPR and conditional shadow/effects
with open('src/App.tsx', 'r') as f:
    app_code = f.read()

if "graphicsQuality" not in app_code:
    app_code = app_code.replace("const fogSettings = useGameStore((state) => state.fogSettings);", "const fogSettings = useGameStore((state) => state.fogSettings);\n  const graphicsQuality = useGameStore((state) => state.graphicsQuality);")
    app_code = app_code.replace("<Canvas shadows camera={{ position: [6, 4.5, 22], fov: 35 }}", "<Canvas shadows={graphicsQuality !== 'low'} dpr={graphicsQuality === 'low' ? 1 : graphicsQuality === 'medium' ? 1.5 : 2} camera={{ position: [6, 4.5, 22], fov: 35 }}")

with open('src/App.tsx', 'w') as f:
    f.write(app_code)

