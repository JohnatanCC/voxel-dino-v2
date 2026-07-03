import re

with open('src/components/UI.tsx', 'r') as f:
    code = f.read()

dev_button = """        {/* Floating Dev Mode Button */}
        {(status === 'menu' || devMode) && (
          <button key="dev-btn"
            onClick={() => setDevMode(!devMode)}
            className={`absolute bottom-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur transition-colors pointer-events-auto border ${devMode ? 'bg-amber-500/80 text-white border-amber-300' : 'bg-black/20 hover:bg-black/40 text-white border-white/30'}`}
            title={devMode ? "Exit Free Camera (Alt)" : "Free Camera"}
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
"""

# Insert it right after the secret powerup button
code = code.replace("""             ?
           </button>
        )}""", """             ?
           </button>
        )}
""" + dev_button)


with open('src/components/UI.tsx', 'w') as f:
    f.write(code)

