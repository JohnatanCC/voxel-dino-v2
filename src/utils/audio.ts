import { useGameStore } from '../store/gameStore';

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export function playJumpSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

export function playHitSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

export function playScoreSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

export function playLifeSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
  osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
  osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6

  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

export function playGameOverSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sawtooth';
  osc2.type = 'square';
  
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 1);
  
  osc2.frequency.setValueAtTime(100, audioCtx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 1);

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

  osc.start();
  osc2.start();
  osc.stop(audioCtx.currentTime + 1.5);
  osc2.stop(audioCtx.currentTime + 1.5);
}

let bgmOscillators: OscillatorNode[] = [];
let bgmGain: GainNode | null = null;
let isPlayingBgm = false;
let timerID: number | null = null;

const BPM = 130;
const BEAT = 60 / BPM;

interface Note {
  f: number;
  d: number;
}

const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196.00, Ab3 = 207.65, Gs3 = 207.65, A3 = 220.00, Bb3 = 233.08, B3 = 246.94;
const C4 = 261.63, D4 = 293.66, Eb4 = 311.13, E4 = 329.63, F4 = 349.23, Fs4 = 369.99, G4 = 392.00, Gs4 = 415.30, A4 = 440.00, Bb4 = 466.16, B4 = 493.88;
const C5 = 523.25, Cs5 = 554.37, D5 = 587.33, Eb5 = 622.25, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, B5 = 987.77, C6 = 1046.50;
const D6 = 1174.66, E6 = 1318.51, F6 = 1396.91, G6 = 1567.98, A6 = 1760.00, B6 = 1975.53;

const melodyTrackDesert: Note[] = [
  { f: A4, d: 1.5 }, { f: B4, d: 0.5 }, { f: C5, d: 1 }, { f: D5, d: 1 },
  { f: E5, d: 2.5 }, { f: E5, d: 0.5 }, { f: E5, d: 0.5 }, { f: F5, d: 0.5 },
  { f: G5, d: 2 }, { f: F5, d: 1 }, { f: E5, d: 1 },
  { f: D5, d: 2.5 }, { f: E5, d: 0.5 }, { f: F5, d: 1 },

  { f: E5, d: 1.5 }, { f: C5, d: 0.5 }, { f: A4, d: 1 }, { f: B4, d: 1 },
  { f: C5, d: 1.5 }, { f: B4, d: 0.5 }, { f: A4, d: 1 }, { f: G4, d: 1 },
  { f: A4, d: 4 },
  { f: 0, d: 4 },
];

const bassTrackDesert: Note[] = [
  { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: E3, d: 0.5 }, { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: C4, d: 0.5 }, { f: 0, d: 0.5 },
  { f: C4, d: 0.5 }, { f: 0, d: 0.5 }, { f: C4, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 }, { f: 0, d: 0.5 }, { f: E4, d: 0.5 }, { f: 0, d: 0.5 },
  { f: F3, d: 0.5 }, { f: 0, d: 0.5 }, { f: F3, d: 0.5 }, { f: C4, d: 0.5 }, { f: F3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: 0, d: 0.5 },
  { f: G3, d: 0.5 }, { f: 0, d: 0.5 }, { f: G3, d: 0.5 }, { f: D4, d: 0.5 }, { f: G3, d: 0.5 }, { f: 0, d: 0.5 }, { f: B3, d: 0.5 }, { f: 0, d: 0.5 },

  { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: E3, d: 0.5 }, { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: C4, d: 0.5 }, { f: 0, d: 0.5 },
  { f: F3, d: 0.5 }, { f: 0, d: 0.5 }, { f: F3, d: 0.5 }, { f: C4, d: 0.5 }, { f: G3, d: 0.5 }, { f: 0, d: 0.5 }, { f: G3, d: 0.5 }, { f: D4, d: 0.5 },
  { f: A3, d: 0.5 }, { f: A3, d: 0.5 }, { f: E4, d: 0.5 }, { f: A3, d: 0.5 }, { f: A3, d: 0.5 }, { f: A3, d: 0.5 }, { f: E4, d: 0.5 }, { f: A3, d: 0.5 },
  { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: E4, d: 0.5 }, { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: 0, d: 1 },
];

const harmTrackDesert: Note[] = [
  { f: C4, d: 1.5 }, { f: D4, d: 0.5 }, { f: E4, d: 1 }, { f: F4, d: 1 },
  { f: G4, d: 2.5 }, { f: G4, d: 0.5 }, { f: G4, d: 0.5 }, { f: A4, d: 0.5 },
  { f: B4, d: 2 }, { f: A4, d: 1 }, { f: G4, d: 1 },
  { f: F4, d: 2.5 }, { f: G4, d: 0.5 }, { f: A4, d: 1 },

  { f: G4, d: 1.5 }, { f: E4, d: 0.5 }, { f: C4, d: 1 }, { f: D4, d: 1 },
  { f: E4, d: 1.5 }, { f: D4, d: 0.5 }, { f: C4, d: 1 }, { f: B3, d: 1 },
  { f: C4, d: 4 },
  { f: 0, d: 4 },
];

const percTrackDesert: Note[] = [];
for (let i = 0; i < 8; i++) { // 32 beats total
  percTrackDesert.push(
    { f: 800, d: 0.125 }, { f: 0, d: 0.375 }, { f: 800, d: 0.125 }, { f: 0, d: 0.375 },
    { f: 800, d: 0.125 }, { f: 0, d: 0.375 }, { f: 800, d: 0.125 }, { f: 0, d: 0.375 },
    { f: 800, d: 0.125 }, { f: 0, d: 0.375 }, { f: 800, d: 0.125 }, { f: 0, d: 0.375 },
    { f: 800, d: 0.125 }, { f: 0, d: 0.125 }, { f: 800, d: 0.125 }, { f: 0, d: 0.125 }, { f: 800, d: 0.125 }, { f: 0, d: 0.375 }
  );
}

const melodyTrackForest: Note[] = [
  // Phase 1: Gentle start (8 beats)
  { f: C4, d: 2 }, { f: E4, d: 2 },
  { f: G4, d: 2 }, { f: C5, d: 2 },
  
  // Phase 2: Building up (8 beats)
  { f: C4, d: 1 }, { f: E4, d: 1 }, { f: G4, d: 1 }, { f: C5, d: 1 },
  { f: E5, d: 1 }, { f: G5, d: 1 }, { f: C6, d: 2 },
  
  // Phase 3: Faster pattern (8 beats)
  { f: C5, d: 0.5 }, { f: E5, d: 0.5 }, { f: G5, d: 0.5 }, { f: C6, d: 0.5 },
  { f: E6, d: 0.5 }, { f: C6, d: 0.5 }, { f: G5, d: 0.5 }, { f: E5, d: 0.5 },
  { f: D5, d: 0.5 }, { f: F5, d: 0.5 }, { f: A5, d: 0.5 }, { f: D6, d: 0.5 },
  { f: F6, d: 0.5 }, { f: D6, d: 0.5 }, { f: A5, d: 0.5 }, { f: F5, d: 0.5 },
  
  // Phase 4: Climax and resolve (8 beats)
  { f: G5, d: 0.25 }, { f: B5, d: 0.25 }, { f: D6, d: 0.25 }, { f: G6, d: 0.25 },
  { f: B6, d: 0.5 }, { f: G6, d: 0.5 }, { f: D6, d: 0.5 }, { f: B5, d: 0.5 },
  { f: C6, d: 5 }
];

const bassTrackForest: Note[] = [
  // Phase 1: Gentle start (8 beats)
  { f: C3, d: 4 }, { f: G3, d: 4 },
  
  // Phase 2: Building up (8 beats)
  { f: C3, d: 2 }, { f: G3, d: 2 }, { f: C4, d: 2 }, { f: G3, d: 2 },
  
  // Phase 3: Faster pattern (8 beats)
  { f: C3, d: 1 }, { f: G3, d: 1 }, { f: C4, d: 1 }, { f: G3, d: 1 },
  { f: D3, d: 1 }, { f: A3, d: 1 }, { f: D4, d: 1 }, { f: A3, d: 1 },
  
  // Phase 4: Climax and resolve (8 beats)
  { f: G3, d: 0.5 }, { f: D4, d: 0.5 }, { f: G4, d: 0.5 }, { f: D4, d: 0.5 },
  { f: G3, d: 0.5 }, { f: D4, d: 0.5 }, { f: G4, d: 0.5 }, { f: D4, d: 0.5 },
  { f: C3, d: 4 }
];

const harmTrackForest: Note[] = [];
for (let i = 0; i < 2; i++) {
  // C Major
  harmTrackForest.push({ f: 0, d: 0.5 }, { f: E4, d: 0.5 }, { f: 0, d: 0.5 }, { f: E4, d: 0.5 }, { f: 0, d: 0.5 }, { f: E4, d: 0.5 }, { f: 0, d: 0.5 }, { f: E4, d: 0.5 });
  // F Major
  harmTrackForest.push({ f: 0, d: 0.5 }, { f: F4, d: 0.5 }, { f: 0, d: 0.5 }, { f: F4, d: 0.5 }, { f: 0, d: 0.5 }, { f: F4, d: 0.5 }, { f: 0, d: 0.5 }, { f: F4, d: 0.5 });
  // G Major
  harmTrackForest.push({ f: 0, d: 0.5 }, { f: G4, d: 0.5 }, { f: 0, d: 0.5 }, { f: G4, d: 0.5 }, { f: 0, d: 0.5 }, { f: G4, d: 0.5 }, { f: 0, d: 0.5 }, { f: G4, d: 0.5 });
  // A Minor
  harmTrackForest.push({ f: 0, d: 0.5 }, { f: A4, d: 0.5 }, { f: 0, d: 0.5 }, { f: A4, d: 0.5 }, { f: 0, d: 0.5 }, { f: A4, d: 0.5 }, { f: 0, d: 0.5 }, { f: A4, d: 0.5 });
}

const percTrackForest: Note[] = [];
for (let i = 0; i < 8; i++) {
  percTrackForest.push(
    { f: 800, d: 0.25 }, { f: 0, d: 0.75 }, { f: 800, d: 0.25 }, { f: 0, d: 0.75 },
    { f: 800, d: 0.25 }, { f: 0, d: 0.25 }, { f: 800, d: 0.25 }, { f: 0, d: 0.25 }, { f: 800, d: 0.25 }, { f: 0, d: 0.75 }
  );
}

const melodyTrackSwamp: Note[] = [
  // A section: Staccato jumps and spooky chromatic slides
  { f: A4, d: 0.25 }, { f: 0, d: 0.75 }, { f: C5, d: 0.25 }, { f: 0, d: 0.75 }, { f: A4, d: 0.5 }, { f: Eb5, d: 0.5 }, { f: D5, d: 0.5 }, { f: C5, d: 0.5 },
  { f: A4, d: 0.5 }, { f: 0, d: 0.5 }, { f: C5, d: 0.25 }, { f: 0, d: 0.75 }, { f: A4, d: 0.5 }, { f: Eb5, d: 0.5 }, { f: D5, d: 0.5 }, { f: F5, d: 0.5 },
  { f: E5, d: 0.5 }, { f: 0, d: 0.5 }, { f: C5, d: 0.25 }, { f: 0, d: 0.75 }, { f: A4, d: 0.5 }, { f: Eb5, d: 0.5 }, { f: D5, d: 0.5 }, { f: C5, d: 0.5 },
  { f: A4, d: 0.5 }, { f: 0, d: 0.5 }, { f: G4, d: 0.25 }, { f: 0, d: 0.75 }, { f: Bb4, d: 0.5 }, { f: A4, d: 0.5 }, { f: Gs4, d: 0.5 }, { f: A4, d: 0.5 },

  // B section: chromatic run
  { f: 0, d: 1 }, { f: A4, d: 0.25 }, { f: Bb4, d: 0.25 }, { f: B4, d: 0.25 }, { f: C5, d: 0.25 }, { f: Cs5, d: 0.25 }, { f: D5, d: 0.25 }, { f: Eb5, d: 0.25 }, { f: E5, d: 0.25 },
  { f: F5, d: 0.5 }, { f: E5, d: 0.5 }, { f: D5, d: 1 }, { f: C5, d: 2 },
  { f: E5, d: 0.5 }, { f: D5, d: 0.5 }, { f: C5, d: 1 }, { f: B4, d: 1 }, { f: 0, d: 1 },
  { f: A4, d: 0.5 }, { f: Gs4, d: 0.5 }, { f: A4, d: 1 }, { f: 0, d: 2 },
];

const bassTrackSwamp: Note[] = [
  // Bouncy tuba-like bass line (diminished / bluesy feel)
  { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: Eb4, d: 0.5 }, { f: D4, d: 0.5 }, { f: 0, d: 0.5 }, { f: C4, d: 0.5 }, { f: A3, d: 0.5 },
  { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: Eb4, d: 0.5 }, { f: D4, d: 0.5 }, { f: 0, d: 0.5 }, { f: F4, d: 0.5 }, { f: E4, d: 0.5 },
  { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: Eb4, d: 0.5 }, { f: D4, d: 0.5 }, { f: 0, d: 0.5 }, { f: C4, d: 0.5 }, { f: A3, d: 0.5 },
  { f: G3, d: 0.5 }, { f: 0, d: 0.5 }, { f: Bb3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 1 }, { f: 0, d: 1 },

  { f: F3, d: 0.5 }, { f: 0, d: 0.5 }, { f: F3, d: 0.5 }, { f: C4, d: 0.5 }, { f: F3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: C4, d: 0.5 },
  { f: D3, d: 0.5 }, { f: 0, d: 0.5 }, { f: D3, d: 0.5 }, { f: A3, d: 0.5 }, { f: D3, d: 0.5 }, { f: 0, d: 0.5 }, { f: F3, d: 0.5 }, { f: A3, d: 0.5 },
  { f: E3, d: 0.5 }, { f: 0, d: 0.5 }, { f: E3, d: 0.5 }, { f: B3, d: 0.5 }, { f: E3, d: 0.5 }, { f: 0, d: 0.5 }, { f: Gs3, d: 0.5 }, { f: B3, d: 0.5 },
  { f: A3, d: 0.5 }, { f: 0, d: 0.5 }, { f: A3, d: 0.5 }, { f: Eb4, d: 0.5 }, { f: A3, d: 1 }, { f: 0, d: 1 },
];

const harmTrackSwamp: Note[] = [
  // "Doo-wop" choppy chords (A section)
  { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: F4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 },
  { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: F4, d: 0.25 }, { f: 0, d: 0.75 }, { f: G4, d: 0.25 }, { f: 0, d: 0.75 },
  { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: F4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 },
  { f: D4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.5 }, { f: 0, d: 1.5 },

  // B section 
  { f: C4, d: 0.25 }, { f: 0, d: 0.75 }, { f: C4, d: 0.25 }, { f: 0, d: 0.75 }, { f: C4, d: 0.25 }, { f: 0, d: 0.75 }, { f: C4, d: 0.25 }, { f: 0, d: 0.75 },
  { f: F4, d: 0.25 }, { f: 0, d: 0.75 }, { f: F4, d: 0.25 }, { f: 0, d: 0.75 }, { f: F4, d: 0.25 }, { f: 0, d: 0.75 }, { f: F4, d: 0.25 }, { f: 0, d: 0.75 },
  { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 },
  { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.25 }, { f: 0, d: 0.75 }, { f: E4, d: 0.5 }, { f: 0, d: 1.5 },
];

const percTrackSwamp: Note[] = [];
for (let i = 0; i < 8; i++) {
  percTrackSwamp.push(
    // beatbox pattern: "boots and cats and boots and cats"
    { f: 65, d: 0.25 }, { f: 0, d: 0.75 },
    { f: 800, d: 0.25 }, { f: 0, d: 0.75 },
    { f: 65, d: 0.25 }, { f: 0, d: 0.25 }, { f: 65, d: 0.25 }, { f: 0, d: 0.25 },
    { f: 800, d: 0.25 }, { f: 0, d: 0.75 }
  );
}

const melodyTrackMenu: Note[] = [
  // Lullaby melody (slow, gentle)
  { f: C5, d: 1 }, { f: G4, d: 1 }, { f: E4, d: 2 },
  { f: A4, d: 1 }, { f: G4, d: 1 }, { f: C5, d: 2 },
  { f: D5, d: 1 }, { f: C5, d: 1 }, { f: B4, d: 1 }, { f: A4, d: 1 },
  { f: G4, d: 2 }, { f: 0, d: 2 },
  { f: C5, d: 1 }, { f: G4, d: 1 }, { f: E4, d: 2 },
  { f: A4, d: 1 }, { f: G4, d: 1 }, { f: E5, d: 2 },
  { f: D5, d: 1 }, { f: C5, d: 1 }, { f: B4, d: 1 }, { f: D5, d: 1 },
  { f: C5, d: 2 }, { f: 0, d: 2 },
];

const bassTrackMenu: Note[] = [
  // Arpeggiated accompaniment
  { f: C3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 }, { f: C3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 },
  { f: F3, d: 0.5 }, { f: A3, d: 0.5 }, { f: C4, d: 0.5 }, { f: F4, d: 0.5 }, { f: C3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 },
  { f: G3, d: 0.5 }, { f: B3, d: 0.5 }, { f: D4, d: 0.5 }, { f: G4, d: 0.5 }, { f: F3, d: 0.5 }, { f: A3, d: 0.5 }, { f: C4, d: 0.5 }, { f: F4, d: 0.5 },
  { f: C3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 }, { f: 0, d: 2 },
  { f: C3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 }, { f: C3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 },
  { f: F3, d: 0.5 }, { f: A3, d: 0.5 }, { f: C4, d: 0.5 }, { f: F4, d: 0.5 }, { f: C3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 },
  { f: G3, d: 0.5 }, { f: B3, d: 0.5 }, { f: D4, d: 0.5 }, { f: G4, d: 0.5 }, { f: G3, d: 0.5 }, { f: B3, d: 0.5 }, { f: D4, d: 0.5 }, { f: G4, d: 0.5 },
  { f: C3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 }, { f: 0, d: 2 },
];

const windTrackSnow: Note[] = [
  { f: 400, d: 0.1 }, { f: 450, d: 0.1 }, { f: 380, d: 0.1 }, { f: 420, d: 0.1 },
  { f: 500, d: 0.1 }, { f: 480, d: 0.1 }, { f: 410, d: 0.1 }, { f: 460, d: 0.1 },
  { f: 390, d: 0.1 }, { f: 430, d: 0.1 }, { f: 470, d: 0.1 }, { f: 440, d: 0.1 },
  { f: 350, d: 0.1 }, { f: 390, d: 0.1 }, { f: 420, d: 0.1 }, { f: 380, d: 0.1 },
  { f: 460, d: 0.1 }, { f: 490, d: 0.1 }, { f: 450, d: 0.1 }, { f: 510, d: 0.1 },
  { f: 400, d: 0.1 }, { f: 430, d: 0.1 }, { f: 480, d: 0.1 }, { f: 440, d: 0.1 },
  { f: 380, d: 0.1 }, { f: 410, d: 0.1 }, { f: 470, d: 0.1 }, { f: 450, d: 0.1 },
  { f: 360, d: 0.1 }, { f: 390, d: 0.1 }, { f: 430, d: 0.1 }, { f: 400, d: 0.1 }
];
const melodyTrackSnow: Note[] = [
  // Gentle, angelic lullaby / bell melody
  { f: C6, d: 2 }, { f: G5, d: 2 }, { f: A5, d: 2 }, { f: E5, d: 2 },
  { f: F5, d: 2 }, { f: C5, d: 2 }, { f: F5, d: 2 }, { f: G5, d: 2 },
  { f: C6, d: 2 }, { f: G5, d: 2 }, { f: A5, d: 2 }, { f: E5, d: 2 },
  { f: F5, d: 2 }, { f: C5, d: 2 }, { f: D5, d: 2 }, { f: G5, d: 2 },
  { f: C6, d: 4 }, { f: 0, d: 4 }, { f: 0, d: 8 }
];

const bassTrackSnow: Note[] = [
  // Very slow, deep, warm bass
  { f: C3, d: 2 }, { f: G3, d: 2 }, { f: A3, d: 2 }, { f: E3, d: 2 },
  { f: F3, d: 2 }, { f: C3, d: 2 }, { f: F3, d: 2 }, { f: G3, d: 2 },
];

const harmTrackSnow: Note[] = [
  // Soft rolling arpeggios
  { f: C5, d: 0.5 }, { f: E5, d: 0.5 }, { f: G5, d: 0.5 }, { f: C6, d: 0.5 },
  { f: G4, d: 0.5 }, { f: B4, d: 0.5 }, { f: D5, d: 0.5 }, { f: G5, d: 0.5 },
  { f: A4, d: 0.5 }, { f: C5, d: 0.5 }, { f: E5, d: 0.5 }, { f: A5, d: 0.5 },
  { f: E4, d: 0.5 }, { f: G4, d: 0.5 }, { f: B4, d: 0.5 }, { f: E5, d: 0.5 },
  { f: F4, d: 0.5 }, { f: A4, d: 0.5 }, { f: C5, d: 0.5 }, { f: F5, d: 0.5 },
  { f: C4, d: 0.5 }, { f: E4, d: 0.5 }, { f: G4, d: 0.5 }, { f: C5, d: 0.5 },
  { f: F4, d: 0.5 }, { f: A4, d: 0.5 }, { f: C5, d: 0.5 }, { f: F5, d: 0.5 },
  { f: G4, d: 0.5 }, { f: B4, d: 0.5 }, { f: D5, d: 0.5 }, { f: G5, d: 0.5 },
];

const percTrackSnow: Note[] = [
  // Light, infrequent chime
  { f: 2000, d: 0.1 }, { f: 0, d: 3.9 }, 
  { f: 2000, d: 0.1 }, { f: 0, d: 3.9 }, 
  { f: 2000, d: 0.1 }, { f: 0, d: 3.9 }, 
  { f: 2000, d: 0.1 }, { f: 0, d: 3.9 }, 
];
class Channel {
  notes: Note[];
  idx: number = 0;
  nextTime: number = 0;
  type: OscillatorType;
  volume: number;
  minScore: number;

  constructor(notes: Note[], type: OscillatorType, volume: number, minScore: number = 0) {
    this.notes = notes;
    this.type = type;
    this.volume = volume;
    this.minScore = minScore;
  }
}

let activeChannels: Channel[] = [];

function scheduleBGM() {
  const lookahead = 0.1;
  const currentTime = audioCtx.currentTime;
  const state = useGameStore.getState();
  const score = state.score;
  const isPowerupActive = state.activePowerup !== 'none';
  const currentBeat = isPowerupActive ? (60 / (BPM * 1.5)) : BEAT;

  activeChannels.forEach((ch) => {
    while (ch.nextTime < currentTime + lookahead) {
      const note = ch.notes[ch.idx % ch.notes.length];
      const durationSeconds = note.d * currentBeat;

      if (note.f > 0 && bgmGain && score >= ch.minScore) {
        const osc = audioCtx.createOscillator();
        osc.type = ch.type;
        osc.frequency.value = note.f;

        const noteGain = audioCtx.createGain();
        osc.connect(noteGain);
        noteGain.connect(bgmGain);

        noteGain.gain.setValueAtTime(0, ch.nextTime);
        noteGain.gain.linearRampToValueAtTime(ch.volume, ch.nextTime + 0.02);
        noteGain.gain.linearRampToValueAtTime(0, ch.nextTime + durationSeconds - 0.02);

        osc.start(ch.nextTime);
        osc.stop(ch.nextTime + durationSeconds);
        bgmOscillators.push(osc);

        setTimeout(() => {
          const idx = bgmOscillators.indexOf(osc);
          if (idx > -1) bgmOscillators.splice(idx, 1);
        }, durationSeconds * 1000 + 100);
      }

      ch.nextTime += durationSeconds;
      ch.idx++;
    }
  });

  if (isPlayingBgm) {
    timerID = requestAnimationFrame(scheduleBGM);
  }
}

let currentScenarioBgm: string | null = null;

export function pauseBackgroundMusic() {
  if (audioCtx.state === 'running') {
    audioCtx.suspend();
  }
}

export function playBackgroundMusic(scenario: string = 'desert') {
  if (isPlayingBgm && currentScenarioBgm === scenario) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return;
  }

  if (isPlayingBgm) {
    stopBackgroundMusic();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  currentScenarioBgm = scenario;
  isPlayingBgm = true;
  bgmGain = audioCtx.createGain();
  bgmGain.connect(audioCtx.destination);
  bgmGain.gain.value = 0.5;
  
  const startTime = audioCtx.currentTime + 0.1;
  
  if (scenario === 'menu') {
    activeChannels = [
      new Channel(bassTrackMenu, 'triangle', 0.05, 0),
      new Channel(melodyTrackMenu, 'sine', 0.1, 0)
    ];
  } else if (scenario === 'forest') {
    activeChannels = [
      new Channel(bassTrackForest, 'triangle', 0.08, 0),
      new Channel(melodyTrackForest, 'square', 0.04, 3000),
      new Channel(harmTrackForest, 'sawtooth', 0.04, 6000),
      new Channel(percTrackForest, 'square', 0.02, 9000)
    ];
  } else if (scenario === 'swamp') {
    activeChannels = [
      new Channel(bassTrackSwamp, 'triangle', 0.08, 0),
      new Channel(melodyTrackSwamp, 'square', 0.04, 3000),
      new Channel(harmTrackSwamp, 'sawtooth', 0.03, 6000),
      new Channel(percTrackSwamp, 'square', 0.03, 9000)
    ];
  } else if (scenario === 'snow') {
    activeChannels = [
      new Channel(melodyTrackSnow, 'sine', 0.04, 0),      // Music box intro
      new Channel(percTrackSnow, 'sine', 0.015, 3000),   // Sleigh bells enter
      new Channel(bassTrackSnow, 'sine', 0.08, 3000),  // Bass enters
      new Channel(harmTrackSnow, 'triangle', 0.04, 6000),  // Rich harmonies enter
    ];
  } else {
    activeChannels = [
      new Channel(bassTrackDesert, 'triangle', 0.08, 0),
      new Channel(melodyTrackDesert, 'square', 0.04, 3000),
      new Channel(harmTrackDesert, 'sawtooth', 0.03, 6000),
      new Channel(percTrackDesert, 'square', 0.02, 9000)
    ];
  }
  
  activeChannels.forEach(ch => {
    ch.nextTime = startTime;
    ch.idx = 0;
  });
  
  scheduleBGM();
}

export function stopBackgroundMusic() {
  isPlayingBgm = false;
  currentScenarioBgm = null;
  if (timerID !== null) cancelAnimationFrame(timerID);
  if (bgmGain) {
    bgmGain.disconnect();
    bgmGain = null;
  }
  bgmOscillators.forEach(osc => {
    try { osc.stop(); } catch (e) {}
    osc.disconnect();
  });
  bgmOscillators = [];
}
