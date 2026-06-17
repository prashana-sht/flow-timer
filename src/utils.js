// Singleton AudioContext — iOS Safari requires it to be resumed after a user gesture
let _audioCtx = null;

function getAudioContext() {
  if (!_audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

/**
 * Call this inside a user-gesture handler (e.g. Start button click).
 * On iOS Safari the AudioContext starts suspended; resume() unlocks it.
 */
export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Generates a beep sound using the Web Audio API
export function createBeepSound(type = 'beep', volume = 0.7, frequency = 880, duration = 0.3) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Ensure context is running (defensive resume for iOS)
    const play = () => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      switch (type) {
        case 'beep':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          break;
        case 'double-beep':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          gainNode.gain.setValueAtTime(0, ctx.currentTime + duration * 0.6);
          gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + duration * 0.6 + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + duration * 0.6);
          break;
        case 'ding':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(frequency * 1.2, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.8, ctx.currentTime + duration);
          break;
        case 'buzz':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(frequency * 0.5, ctx.currentTime);
          break;
        case 'alert':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(frequency * 0.7, ctx.currentTime);
          oscillator.frequency.setValueAtTime(frequency * 1.3, ctx.currentTime + 0.15);
          break;
        case 'chime':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          oscillator.frequency.setValueAtTime(frequency * 1.33, ctx.currentTime + 0.12);
          oscillator.frequency.setValueAtTime(frequency * 1.5, ctx.currentTime + 0.24);
          break;
        case 'none':
          return;
        default:
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      }

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + (type === 'double-beep' ? duration * 1.7 : duration));
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

export const BEEP_TYPES = [
  { value: 'beep', label: 'Beep', icon: '🔊' },
  { value: 'double-beep', label: 'Double Beep', icon: '🔔' },
  { value: 'ding', label: 'Ding', icon: '🔕' },
  { value: 'buzz', label: 'Buzz', icon: '📳' },
  { value: 'alert', label: 'Alert', icon: '🚨' },
  { value: 'chime', label: 'Chime', icon: '🎵' },
  { value: 'none', label: 'Silent', icon: '🔇' },
];

export const SEGMENT_TYPES = [
  { value: 'work', label: 'Work', color: '#6c63ff', cssClass: 'tl-work', dotClass: 'segment-type-work', phaseClass: 'phase-work' },
  { value: 'break', label: 'Break', color: '#00e676', cssClass: 'tl-break', dotClass: 'segment-type-break', phaseClass: 'phase-break' },
  { value: 'rest', label: 'Rest', color: '#ffb347', cssClass: 'tl-rest', dotClass: 'segment-type-rest', phaseClass: 'phase-rest' },
];

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// Build the full sequence of timer steps from config
export function buildTimerSequence(config) {
  const { segments, cycles, breakAfterCycles, breakSegment } = config;
  const sequence = [];

  for (let cycle = 0; cycle < cycles; cycle++) {
    for (const seg of segments) {
      sequence.push({ ...seg, cycle: cycle + 1 });
    }
    // Insert break after each cycle except the last (if configured)
    if (breakAfterCycles > 0 && breakSegment && (cycle + 1) % breakAfterCycles === 0 && cycle + 1 < cycles) {
      sequence.push({ ...breakSegment, cycle: cycle + 1, isAutoBreak: true });
    }
  }

  return sequence;
}
