import re

with open('src/components/UI.tsx', 'r') as f:
    code = f.read()

# Add Camera icon import if missing
if 'Camera' not in code:
    code = code.replace("import { Play, RotateCcw, Volume2, VolumeX, Pause, ChevronLeft, ChevronRight, Droplets } from 'lucide-react';", "import { Play, RotateCcw, Volume2, VolumeX, Pause, ChevronLeft, ChevronRight, Droplets, Camera } from 'lucide-react';")

# Extract destructuring to add devMode and setDevMode
code = code.replace("const { status, score, highScore, speed, startGame, cameraMode, setCameraMode, activePowerup, scenario, setScenario, difficulty, setDifficulty, lives, isTransitioning, transitionStartTime, gameTime, coldTimer, fogSettings, setFogDensity, dinoColor, setDinoColor } = useGameStore();", "const { status, score, highScore, speed, startGame, cameraMode, setCameraMode, activePowerup, scenario, setScenario, difficulty, setDifficulty, lives, isTransitioning, transitionStartTime, gameTime, coldTimer, fogSettings, setFogDensity, dinoColor, setDinoColor, devMode, setDevMode } = useGameStore();")

# Add the dev mode icon next to sound toggle
dev_icon_code = """        <button 
          onClick={() => setDevMode(!devMode)}
          className="opacity-60 hover:opacity-100 transition-opacity ml-2"
          title={devMode ? "Exit Free Camera (Alt)" : "Free Camera"}
        >
          <Camera className={`w-5 h-5 sm:w-6 sm:h-6 ${devMode ? 'text-amber-500' : 'text-[#535353]'}`} />
        </button>"""

code = code.replace("""        <button 
          onClick={toggleSound}
          className="opacity-60 hover:opacity-100 transition-opacity"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-[#535353]" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#535353]" />}
        </button>""", """        <button 
          onClick={toggleSound}
          className="opacity-60 hover:opacity-100 transition-opacity"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-[#535353]" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#535353]" />}
        </button>
""" + dev_icon_code)

# Make menu invisible if devMode is on. 
# Wrap menu and paused state with !devMode.
code = code.replace("{status === 'menu' && (", "{status === 'menu' && !devMode && (")
code = code.replace("{status === 'paused' && (", "{status === 'paused' && !devMode && (")

with open('src/components/UI.tsx', 'w') as f:
    f.write(code)

