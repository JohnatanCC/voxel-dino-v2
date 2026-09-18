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

export function playPowerupCollectSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'triangle';
  const notes = [659.25, 830.61, 987.77, 1318.51, 1567.98]; // E5 G#5 B5 E6 G#6 — bright ascending sparkle run
  const step = 0.07;
  notes.forEach((freq, i) => {
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * step);
  });

  const totalDuration = notes.length * step + 0.15;
  gain.gain.setValueAtTime(0.09, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + totalDuration);

  osc.start();
  osc.stop(audioCtx.currentTime + totalDuration);
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

let isPlayingBgm = false;
let schedulerRunning = false;
let timerID: number | null = null;

const BPM = 130;
const BEAT = 60 / BPM;
const BGM_MASTER_VOLUME = 0.5;
const CROSSFADE_S = 1.2;

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

// Four genuinely different sections (intro, playful hook, running bridge, big reprise)
// instead of the old two near-identical 12-beat halves — the loop is ~2.5x longer and
// doesn't repeat itself until it's actually gone somewhere.
const melodyTrackMenu: Note[] = [
  // -- A: gentle, welcoming intro --
  { f: E5, d: 1.5 }, { f: G5, d: 0.5 }, { f: C6, d: 2 }, { f: G5, d: 2 },
  { f: A5, d: 1.5 }, { f: G5, d: 0.5 }, { f: F5, d: 2 }, { f: E5, d: 2 },
  { f: D5, d: 1.5 }, { f: E5, d: 0.5 }, { f: C5, d: 3 }, { f: 0, d: 1 },

  // -- B: playful, bouncy main hook --
  { f: C5, d: 0.5 }, { f: E5, d: 0.5 }, { f: G5, d: 0.5 }, { f: E5, d: 0.5 },
  { f: F5, d: 0.5 }, { f: A5, d: 0.5 }, { f: G5, d: 1 },
  { f: C5, d: 0.5 }, { f: E5, d: 0.5 }, { f: G5, d: 0.5 }, { f: E5, d: 0.5 },
  { f: D5, d: 0.5 }, { f: F5, d: 0.5 }, { f: E5, d: 1 },
  { f: G5, d: 0.5 }, { f: B5, d: 0.5 }, { f: C6, d: 0.5 }, { f: B5, d: 0.5 },
  { f: A5, d: 0.5 }, { f: G5, d: 0.5 }, { f: F5, d: 1 },
  { f: E5, d: 0.5 }, { f: G5, d: 0.5 }, { f: C6, d: 1 }, { f: G5, d: 1 },
  { f: E5, d: 2 }, { f: 0, d: 2 },

  // -- C: skipping bridge, lighter and higher --
  { f: A5, d: 0.5 }, { f: G5, d: 0.5 }, { f: F5, d: 0.5 }, { f: E5, d: 0.5 },
  { f: D5, d: 0.5 }, { f: E5, d: 0.5 }, { f: F5, d: 0.5 }, { f: G5, d: 0.5 },
  { f: A5, d: 0.5 }, { f: C6, d: 0.5 }, { f: B5, d: 0.5 }, { f: A5, d: 0.5 },
  { f: G5, d: 1.5 }, { f: E5, d: 0.5 },
  { f: F5, d: 0.5 }, { f: A5, d: 0.5 }, { f: G5, d: 0.5 }, { f: F5, d: 0.5 },
  { f: E5, d: 0.5 }, { f: D5, d: 0.5 }, { f: C5, d: 1 },

  // -- D: hook reprise lifted an octave, joyful close, then loops back to A --
  { f: C6, d: 0.5 }, { f: G5, d: 0.5 }, { f: E5, d: 0.5 }, { f: G5, d: 0.5 },
  { f: F5, d: 0.5 }, { f: A5, d: 0.5 }, { f: G6, d: 1 },
  { f: E6, d: 0.5 }, { f: C6, d: 0.5 }, { f: G5, d: 0.5 }, { f: C6, d: 0.5 },
  { f: D6, d: 1.5 }, { f: C6, d: 0.5 },
  { f: G5, d: 1 }, { f: E5, d: 1 }, { f: C5, d: 2 },
  { f: 0, d: 2 },
];

const bassTrackMenu: Note[] = [
  // -- A: soft arpeggiated support --
  { f: C3, d: 1 }, { f: G3, d: 0.5 }, { f: E3, d: 0.5 }, { f: C4, d: 1 }, { f: G3, d: 0.5 }, { f: E3, d: 0.5 },
  { f: F3, d: 1 }, { f: C4, d: 0.5 }, { f: A3, d: 0.5 }, { f: F3, d: 1 }, { f: C4, d: 0.5 }, { f: A3, d: 0.5 },
  { f: G3, d: 1 }, { f: D4, d: 0.5 }, { f: B3, d: 0.5 }, { f: C3, d: 3 },

  // -- B: bouncy walking bass under the hook --
  { f: C3, d: 0.5 }, { f: C4, d: 0.5 }, { f: E3, d: 0.5 }, { f: C4, d: 0.5 },
  { f: F3, d: 0.5 }, { f: F4, d: 0.5 }, { f: A3, d: 1 },
  { f: C3, d: 0.5 }, { f: C4, d: 0.5 }, { f: E3, d: 0.5 }, { f: C4, d: 0.5 },
  { f: G3, d: 0.5 }, { f: G4, d: 0.5 }, { f: B3, d: 1 },
  { f: C3, d: 0.5 }, { f: C4, d: 0.5 }, { f: E3, d: 0.5 }, { f: C4, d: 0.5 },
  { f: F3, d: 0.5 }, { f: F4, d: 0.5 }, { f: A3, d: 1 },
  { f: G3, d: 0.5 }, { f: G4, d: 0.5 }, { f: C4, d: 1 }, { f: G3, d: 1 },
  { f: C3, d: 2 }, { f: 0, d: 2 },

  // -- C: lighter, sparser, tracking the running bridge loosely --
  { f: F3, d: 1 }, { f: C4, d: 1 }, { f: G3, d: 1 }, { f: D4, d: 1 },
  { f: A3, d: 1.5 }, { f: E3, d: 0.5 },
  { f: F3, d: 1 }, { f: G3, d: 1 },

  // -- D: full, driving close, then a turnaround back into A --
  { f: C3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 }, { f: G3, d: 0.5 },
  { f: F3, d: 0.5 }, { f: A3, d: 0.5 }, { f: F4, d: 1 },
  { f: C4, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 }, { f: G3, d: 0.5 },
  { f: G3, d: 1.5 }, { f: D4, d: 0.5 },
  { f: C3, d: 1 }, { f: G3, d: 1 }, { f: C3, d: 2 },
  { f: 0, d: 2 },
];

// New: menu music previously had no harmony or rhythm layer at all (just melody + bass),
// which was a big part of why it felt thin/repetitive. These fill it out.
const harmTrackMenu: Note[] = [
  { f: C4, d: 4 }, { f: F4, d: 4 }, { f: G4, d: 4 }, // sustained chords under the intro
  { f: E4, d: 1 }, { f: G4, d: 1 }, { f: C5, d: 1 }, { f: G4, d: 1 },
  { f: F4, d: 1 }, { f: A4, d: 1 }, { f: C5, d: 1 }, { f: A4, d: 1 },
  { f: E4, d: 1 }, { f: G4, d: 1 }, { f: B4, d: 1 }, { f: G4, d: 1 },
  { f: C4, d: 4 }, // chordal pulses under the hook
  { f: 0, d: 2 }, { f: E4, d: 2 }, { f: 0, d: 2 }, { f: A4, d: 2 }, // sparse and airy during the bridge
  { f: C4, d: 1 }, { f: E4, d: 1 }, { f: G4, d: 1 }, { f: C5, d: 1 },
  { f: F4, d: 1 }, { f: A4, d: 1 }, { f: C5, d: 1 }, { f: F5, d: 1 },
  { f: G4, d: 2 }, { f: C4, d: 2 }, // warm full chords for the closing lift
];

const percTrackMenu: Note[] = [
  { f: 0, d: 18 }, // silent through the gentle intro
];
for (let i = 0; i < 38; i++) {
  percTrackMenu.push({ f: 1200, d: 0.1 }, { f: 0, d: 0.4 }); // light tick pulse under the bouncy hook
}
percTrackMenu.push({ f: 0, d: 10 }); // silent again through the airy bridge
for (let i = 0; i < 28; i++) {
  percTrackMenu.push({ f: 1200, d: 0.1 }, { f: 0, d: 0.4 }); // ticks return for the closing lift
}

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

interface BgmLayer {
  channels: Channel[];
  gain: GainNode;
  oscillators: OscillatorNode[];
  beatSeconds: number;
}

let activeLayers: BgmLayer[] = [];

// --- Master bus: everything the BGM plays through, built once and reused across scenario
// changes. A lowpass takes the edge off raw square/sawtooth waves, and a synthesized
// impulse response (no external audio asset — matches how the rest of this file works)
// feeds a light reverb send in parallel with the dry signal for some sense of space. ---

let masterBusInput: GainNode | null = null;

function createReverbImpulse(duration: number, decay: number): AudioBuffer {
  const rate = audioCtx.sampleRate;
  const length = Math.floor(rate * duration);
  const impulse = audioCtx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function ensureMasterBus(): GainNode {
  if (masterBusInput) return masterBusInput;

  masterBusInput = audioCtx.createGain();

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 5200;
  filter.Q.value = 0.7;

  const dry = audioCtx.createGain();
  dry.gain.value = 0.82;
  const wet = audioCtx.createGain();
  wet.gain.value = 0.18;

  const convolver = audioCtx.createConvolver();
  convolver.buffer = createReverbImpulse(1.8, 2.2);

  masterBusInput.connect(filter);
  filter.connect(dry);
  filter.connect(convolver);
  convolver.connect(wet);
  dry.connect(audioCtx.destination);
  wet.connect(audioCtx.destination);

  return masterBusInput;
}

function scheduleBGM() {
  const lookahead = 0.1;
  const currentTime = audioCtx.currentTime;
  const state = useGameStore.getState();
  const score = state.score;

  activeLayers.forEach((layer) => {
    layer.channels.forEach((ch) => {
      while (ch.nextTime < currentTime + lookahead) {
        const note = ch.notes[ch.idx % ch.notes.length];
        const durationSeconds = note.d * layer.beatSeconds;

        if (note.f > 0 && score >= ch.minScore) {
          const osc = audioCtx.createOscillator();
          osc.type = ch.type;
          osc.frequency.value = note.f;

          const noteGain = audioCtx.createGain();
          osc.connect(noteGain);
          noteGain.connect(layer.gain);

          // Small ADSR shape instead of a flat on/off ramp — softens the mechanical
          // "beep" raw oscillators otherwise have, without touching the melodies themselves.
          const t0 = ch.nextTime;
          const tEnd = t0 + durationSeconds;
          const attack = Math.min(0.025, durationSeconds * 0.25);
          const decay = Math.min(0.05, durationSeconds * 0.25);
          const release = Math.min(0.06, durationSeconds * 0.3);
          const sustainLevel = ch.volume * 0.72;
          const sustainStart = t0 + attack + decay;
          const releaseStart = Math.max(sustainStart, tEnd - release);

          noteGain.gain.setValueAtTime(0, t0);
          noteGain.gain.linearRampToValueAtTime(ch.volume, t0 + attack);
          noteGain.gain.linearRampToValueAtTime(sustainLevel, sustainStart);
          noteGain.gain.setValueAtTime(sustainLevel, releaseStart);
          noteGain.gain.linearRampToValueAtTime(0, tEnd);

          osc.start(t0);
          osc.stop(tEnd);
          layer.oscillators.push(osc);

          setTimeout(() => {
            const idx = layer.oscillators.indexOf(osc);
            if (idx > -1) layer.oscillators.splice(idx, 1);
          }, durationSeconds * 1000 + 100);
        }

        ch.nextTime += durationSeconds;
        ch.idx++;
      }
    });
  });

  if (isPlayingBgm && activeLayers.length > 0) {
    timerID = requestAnimationFrame(scheduleBGM);
  } else {
    schedulerRunning = false;
  }
}

let currentScenarioBgm: string | null = null;

export function pauseBackgroundMusic() {
  if (audioCtx.state === 'running') {
    audioCtx.suspend();
  }
}

// --- Powerup themes: short, punchy loops with their own tempo/character, swapped in for
// the ~12s the effect is active (see playPowerupMusic). Each loops a handful of times
// during that window rather than being one long piece — same spirit as a Mario-style
// "star" jingle, just one per powerup instead of one for all of them. ---

const melodyTrackSuper: Note[] = [
  { f: C5, d: 0.5 }, { f: E5, d: 0.5 }, { f: G5, d: 0.5 }, { f: C6, d: 1 },
  { f: G5, d: 0.5 }, { f: E5, d: 0.5 }, { f: G5, d: 0.5 }, { f: C6, d: 1.5 },
  { f: E6, d: 1 }, { f: D6, d: 0.5 }, { f: C6, d: 0.5 }, { f: G5, d: 1.5 },
];
const bassTrackSuper: Note[] = [
  { f: C3, d: 0.5 }, { f: C3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 1 },
  { f: C3, d: 0.5 }, { f: C3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 1.5 },
  { f: C4, d: 0.5 }, { f: C4, d: 0.5 }, { f: G3, d: 0.5 }, { f: C3, d: 1.5 },
];
const percTrackSuper: Note[] = [];
for (let i = 0; i < 18; i++) percTrackSuper.push({ f: 1600, d: 0.1 }, { f: 0, d: 0.4 });

const melodyTrackGhost: Note[] = [
  { f: C6, d: 2 }, { f: Eb5, d: 1.5 }, { f: E5, d: 0.5 }, { f: 0, d: 1 },
  { f: B5, d: 2 }, { f: Eb5, d: 1 }, { f: D5, d: 1 }, { f: 0, d: 2 },
];
const bassTrackGhost: Note[] = [
  { f: C3, d: 4 }, { f: Gs3, d: 4 }, { f: D3, d: 3 },
];

const melodyTrackWings: Note[] = [
  { f: C5, d: 0.5 }, { f: E5, d: 0.5 }, { f: G5, d: 0.5 }, { f: C6, d: 0.5 },
  { f: E6, d: 1.5 }, { f: D6, d: 0.5 }, { f: B5, d: 0.5 }, { f: G5, d: 0.5 },
  { f: D6, d: 1.5 }, { f: C6, d: 3 },
];
const bassTrackWings: Note[] = [
  { f: C3, d: 0.5 }, { f: G3, d: 0.5 }, { f: C4, d: 0.5 }, { f: E4, d: 0.5 },
  { f: G3, d: 0.5 }, { f: B3, d: 0.5 }, { f: D4, d: 0.5 }, { f: G4, d: 0.5 },
  { f: C3, d: 1.5 }, { f: C4, d: 3 },
];

const melodyTrackJaw: Note[] = [
  { f: E4, d: 0.25 }, { f: 0, d: 0.25 }, { f: E4, d: 0.25 }, { f: 0, d: 0.25 }, { f: G4, d: 0.5 },
  { f: E4, d: 0.25 }, { f: 0, d: 0.25 }, { f: E4, d: 0.25 }, { f: 0, d: 0.25 }, { f: A4, d: 0.5 },
  { f: F4, d: 0.5 }, { f: E4, d: 0.5 }, { f: D4, d: 1 },
];
const bassTrackJaw: Note[] = [
  { f: E3, d: 0.5 }, { f: E3, d: 0.5 }, { f: G3, d: 0.5 }, { f: E3, d: 0.5 },
  { f: E3, d: 0.5 }, { f: E3, d: 0.5 }, { f: A3, d: 0.5 }, { f: E3, d: 0.5 },
  { f: F3, d: 0.5 }, { f: E3, d: 0.5 }, { f: D3, d: 1 },
];
const percTrackJaw: Note[] = [];
for (let i = 0; i < 20; i++) percTrackJaw.push({ f: 2000, d: 0.05 }, { f: 0, d: 0.2 });

const bassTrackEarth: Note[] = [
  { f: C3, d: 1 }, { f: 0, d: 0.5 }, { f: C3, d: 0.5 }, { f: F3, d: 1 }, { f: 0, d: 0.5 }, { f: F3, d: 0.5 },
  { f: G3, d: 1 }, { f: 0, d: 0.5 }, { f: G3, d: 0.5 }, { f: C3, d: 1.5 }, { f: 0, d: 0.5 },
];
const melodyTrackEarth: Note[] = [
  { f: 0, d: 2 }, { f: E4, d: 1 }, { f: D4, d: 1 }, { f: 0, d: 2 }, { f: F4, d: 1 }, { f: E4, d: 1 },
];
const percTrackEarth: Note[] = [];
for (let i = 0; i < 4; i++) percTrackEarth.push({ f: 90, d: 0.3 }, { f: 0, d: 1.7 });

const melodyTrackDragon: Note[] = [
  { f: A4, d: 0.5 }, { f: C5, d: 0.5 }, { f: E5, d: 0.5 }, { f: A5, d: 1 },
  { f: G5, d: 0.5 }, { f: E5, d: 0.5 }, { f: C5, d: 0.5 }, { f: A4, d: 1 },
  { f: Bb4, d: 0.5 }, { f: A4, d: 0.5 }, { f: E5, d: 0.5 }, { f: A5, d: 1.5 },
];
const bassTrackDragon: Note[] = [
  { f: A3, d: 0.5 }, { f: A3, d: 0.5 }, { f: E3, d: 0.5 }, { f: A3, d: 1 },
  { f: A3, d: 0.5 }, { f: A3, d: 0.5 }, { f: E3, d: 0.5 }, { f: A3, d: 1 },
  { f: F3, d: 0.5 }, { f: A3, d: 0.5 }, { f: E3, d: 0.5 }, { f: A3, d: 1.5 },
];
const percTrackDragon: Note[] = [];
for (let i = 0; i < 16; i++) percTrackDragon.push({ f: 1800, d: 0.08 }, { f: 0, d: 0.42 });

function buildPowerupTrack(type: string): { channels: Channel[]; beatSeconds: number } | null {
  switch (type) {
    case 'super':
      return {
        beatSeconds: 60 / 176,
        channels: [
          new Channel(bassTrackSuper, 'triangle', 0.09, 0),
          new Channel(melodyTrackSuper, 'square', 0.07, 0),
          new Channel(percTrackSuper, 'square', 0.025, 0),
        ],
      };
    case 'ghost':
      return {
        beatSeconds: 60 / 84,
        channels: [
          new Channel(bassTrackGhost, 'sine', 0.06, 0),
          new Channel(melodyTrackGhost, 'sine', 0.06, 0),
        ],
      };
    case 'wings':
      return {
        beatSeconds: 60 / 118,
        channels: [
          new Channel(bassTrackWings, 'sine', 0.05, 0),
          new Channel(melodyTrackWings, 'triangle', 0.07, 0),
        ],
      };
    case 'jaw':
      return {
        beatSeconds: 60 / 152,
        channels: [
          new Channel(bassTrackJaw, 'sawtooth', 0.07, 0),
          new Channel(melodyTrackJaw, 'sawtooth', 0.06, 0),
          new Channel(percTrackJaw, 'square', 0.02, 0),
        ],
      };
    case 'earth':
      return {
        beatSeconds: 60 / 76,
        channels: [
          new Channel(bassTrackEarth, 'triangle', 0.1, 0),
          new Channel(melodyTrackEarth, 'triangle', 0.04, 0),
          new Channel(percTrackEarth, 'sine', 0.08, 0),
        ],
      };
    case 'dragon':
      return {
        beatSeconds: 60 / 168,
        channels: [
          new Channel(bassTrackDragon, 'sawtooth', 0.08, 0),
          new Channel(melodyTrackDragon, 'sawtooth', 0.07, 0),
          new Channel(percTrackDragon, 'square', 0.025, 0),
        ],
      };
    default:
      return null;
  }
}

function buildChannelsForScenario(scenario: string): Channel[] {
  if (scenario === 'menu') {
    return [
      new Channel(bassTrackMenu, 'triangle', 0.05, 0),
      new Channel(melodyTrackMenu, 'sine', 0.1, 0),
      new Channel(harmTrackMenu, 'triangle', 0.035, 0),
      new Channel(percTrackMenu, 'square', 0.02, 0)
    ];
  } else if (scenario === 'forest') {
    return [
      new Channel(bassTrackForest, 'triangle', 0.08, 0),
      new Channel(melodyTrackForest, 'square', 0.04, 3000),
      new Channel(harmTrackForest, 'sawtooth', 0.04, 6000),
      new Channel(percTrackForest, 'square', 0.02, 9000)
    ];
  } else if (scenario === 'swamp') {
    return [
      new Channel(bassTrackSwamp, 'triangle', 0.08, 0),
      new Channel(melodyTrackSwamp, 'square', 0.04, 3000),
      new Channel(harmTrackSwamp, 'sawtooth', 0.03, 6000),
      new Channel(percTrackSwamp, 'square', 0.03, 9000)
    ];
  } else if (scenario === 'snow') {
    return [
      new Channel(melodyTrackSnow, 'sine', 0.04, 0),      // Music box intro
      new Channel(percTrackSnow, 'sine', 0.015, 3000),   // Sleigh bells enter
      new Channel(bassTrackSnow, 'sine', 0.08, 3000),  // Bass enters
      new Channel(harmTrackSnow, 'triangle', 0.04, 6000),  // Rich harmonies enter
    ];
  }
  return [
    new Channel(bassTrackDesert, 'triangle', 0.08, 0),
    new Channel(melodyTrackDesert, 'square', 0.04, 3000),
    new Channel(harmTrackDesert, 'sawtooth', 0.03, 6000),
    new Channel(percTrackDesert, 'square', 0.02, 9000)
  ];
}

// Crossfades out whatever layers are currently playing instead of cutting them dead —
// shared by both the biome/menu track switcher and the powerup track override below.
function crossfadeOutCurrentLayers() {
  const outgoing = activeLayers;
  activeLayers = [];
  outgoing.forEach((layer) => {
    const now = audioCtx.currentTime;
    layer.gain.gain.cancelScheduledValues(now);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
    layer.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_S);
    setTimeout(() => {
      layer.oscillators.forEach((osc) => {
        try { osc.stop(); } catch (e) { /* already stopped */ }
        osc.disconnect();
      });
      layer.gain.disconnect();
    }, CROSSFADE_S * 1000 + 150);
  });
}

function startLayer(channels: Channel[], beatSeconds: number) {
  const busInput = ensureMasterBus();

  const layerGain = audioCtx.createGain();
  layerGain.gain.value = 0;
  layerGain.connect(busInput);
  layerGain.gain.linearRampToValueAtTime(BGM_MASTER_VOLUME, audioCtx.currentTime + CROSSFADE_S);

  const startTime = audioCtx.currentTime + 0.1;
  channels.forEach(ch => {
    ch.nextTime = startTime;
    ch.idx = 0;
  });

  activeLayers.push({ channels, gain: layerGain, oscillators: [], beatSeconds });

  isPlayingBgm = true;
  if (!schedulerRunning) {
    schedulerRunning = true;
    scheduleBGM();
  }
}

export function playBackgroundMusic(scenario: string = 'desert') {
  if (isPlayingBgm && currentScenarioBgm === scenario) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return;
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  crossfadeOutCurrentLayers();
  currentScenarioBgm = scenario;
  startLayer(buildChannelsForScenario(scenario), BEAT);
}

// Overrides whatever's playing with a short, powerup-specific theme (see POWERUP_TRACKS)
// for the duration of the effect. Call playBackgroundMusic(scenario) again once the
// powerup ends to crossfade back into the normal track — this module doesn't track
// game state itself, so the caller (the activePowerup watcher) owns that timing.
export function playPowerupMusic(type: string) {
  const track = buildPowerupTrack(type);
  if (!track) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  crossfadeOutCurrentLayers();
  currentScenarioBgm = `powerup:${type}`;
  startLayer(track.channels, track.beatSeconds);
}

export function stopBackgroundMusic() {
  isPlayingBgm = false;
  currentScenarioBgm = null;
  schedulerRunning = false;
  if (timerID !== null) {
    cancelAnimationFrame(timerID);
    timerID = null;
  }

  activeLayers.forEach((layer) => {
    layer.oscillators.forEach((osc) => {
      try { osc.stop(); } catch (e) { /* already stopped */ }
      osc.disconnect();
    });
    layer.gain.disconnect();
  });
  activeLayers = [];
}

// Browsers block AudioContext playback until a real user gesture — the very first
// playBackgroundMusic('menu') call on page load happens before any interaction, so
// audioCtx.resume() there silently no-ops and nothing is ever actually heard. Listen
// once for the first genuine click/key/touch anywhere and re-kick whatever track was
// already selected, since anything scheduled while suspended never actually sounded.
let audioUnlocked = false;
function unlockAudioOnFirstGesture() {
  const unlock = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);

    audioCtx.resume().then(() => {
      const scenario = currentScenarioBgm;
      if (!scenario) return;
      currentScenarioBgm = null; // force a real restart instead of the "already playing" early-out
      if (scenario.startsWith('powerup:')) {
        playPowerupMusic(scenario.slice('powerup:'.length));
      } else {
        playBackgroundMusic(scenario);
      }
    });
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchstart', unlock);
}
unlockAudioOnFirstGesture();
