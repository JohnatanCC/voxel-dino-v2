import re

with open('src/components/UI.tsx', 'r') as f:
    ui_code = f.read()

# Replace difficulty and color picker with Settings Button
start_str = "{/* Difficulty */}"
end_str = "              {/* Start Button */}"
if start_str in ui_code and end_str in ui_code:
    start_idx = ui_code.find(start_str)
    end_idx = ui_code.find(end_str)
    
    settings_btn = """              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-white hover:text-amber-300 transition-colors flex items-center justify-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-2"
              >
                <Settings className="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
              
"""
    ui_code = ui_code[:start_idx] + settings_btn + ui_code[end_idx:]

# Remove Quality Selector from Game Over
start_q = "{/* Quality Selector */}"
end_q = "<button\n                  onClick={startGame}"
if start_q in ui_code and end_q in ui_code:
    start_q_idx = ui_code.find(start_q)
    end_q_idx = ui_code.find(end_q)
    if start_q_idx < end_q_idx:
        ui_code = ui_code[:start_q_idx] + ui_code[end_q_idx:]

with open('src/components/UI.tsx', 'w') as f:
    f.write(ui_code)
