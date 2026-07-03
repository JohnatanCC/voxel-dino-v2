import re

with open('src/components/UI.tsx', 'r') as f:
    code = f.read()

dev_icon_code = """
            <button 
              onClick={() => setDevMode(!devMode)}
              className="opacity-60 hover:opacity-100 transition-opacity ml-2"
              title={devMode ? "Exit Free Camera (Alt)" : "Free Camera"}
            >
              <Camera className={`w-4 h-4 sm:w-5 sm:h-5 ${devMode ? 'text-amber-500' : 'text-[var(--game-ui-color)]'}`} />
            </button>"""

code = code.replace("""                  )}
                </svg>
              </button>
            )}""", """                  )}
                </svg>
              </button>
            )}""" + dev_icon_code)

with open('src/components/UI.tsx', 'w') as f:
    f.write(code)

