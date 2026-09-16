import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

function dispatchKey(type: 'keydown' | 'keyup', key: string) {
  window.dispatchEvent(new KeyboardEvent(type, { key }));
}

export function TouchControls() {
  const status = useGameStore(s => s.status);
  const devMode = useGameStore(s => s.devMode);
  const [isJumpPressed, setIsJumpPressed] = useState(false);
  const [isDuckPressed, setIsDuckPressed] = useState(false);

  // Tracks physical/synthetic key presses to animate the on-screen buttons.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') setIsJumpPressed(true);
      if (e.key === 'ArrowDown' || e.key === 's') setIsDuckPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') setIsJumpPressed(false);
      if (e.key === 'ArrowDown' || e.key === 's') setIsDuckPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <>
      {/* Invisible Touch Areas for Mobile Controls */}
      {status === 'playing' && !devMode && (
        <div className="absolute inset-0 z-0 flex pointer-events-auto">
          <div
            className="flex-1 h-full touch-none"
            onPointerDown={(e) => { e.preventDefault(); dispatchKey('keydown', 'ArrowDown'); }}
            onPointerUp={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowDown'); }}
            onPointerLeave={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowDown'); }}
            onPointerCancel={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowDown'); }}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            className="flex-1 h-full touch-none"
            onPointerDown={(e) => { e.preventDefault(); dispatchKey('keydown', 'ArrowUp'); }}
            onPointerUp={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowUp'); }}
            onPointerLeave={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowUp'); }}
            onPointerCancel={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowUp'); }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      )}

      {/* Controls Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-end pointer-events-none z-10">
        {/* Left Control - Duck */}
        <div className="pointer-events-auto">
          <div
            className={`flex items-center justify-center cursor-pointer opacity-50 hover:opacity-80 select-none transition-transform duration-100 ${isDuckPressed ? 'scale-90' : 'scale-100'}`}
            onPointerDown={(e) => { e.preventDefault(); dispatchKey('keydown', 'ArrowDown'); }}
            onPointerUp={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowDown'); }}
            onPointerLeave={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowDown'); }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-black/20 text-white backdrop-blur-sm border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            </div>
          </div>
        </div>

        {/* Right Control - Jump */}
        <div className="pointer-events-auto">
          <div
            className={`flex items-center justify-center cursor-pointer opacity-50 hover:opacity-80 select-none transition-transform duration-100 ${isJumpPressed ? 'scale-90' : 'scale-100'}`}
            onPointerDown={(e) => { e.preventDefault(); dispatchKey('keydown', 'ArrowUp'); }}
            onPointerUp={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowUp'); }}
            onPointerLeave={(e) => { e.preventDefault(); dispatchKey('keyup', 'ArrowUp'); }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-black/20 text-white backdrop-blur-sm border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
