import type { SfxEvent } from './soundManager';

type ToneSpec = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  delay?: number;
};

const PATTERNS: Record<SfxEvent, ToneSpec[]> = {
  'quiz-start': [
    { freq: 523, duration: 0.08, type: 'sine' },
    { freq: 784, duration: 0.12, type: 'sine', delay: 0.08 },
  ],
  'hint-appear': [
    { freq: 880, duration: 0.08, type: 'triangle' },
    { freq: 1320, duration: 0.1, type: 'triangle', delay: 0.08 },
  ],
  'countdown-tick': [{ freq: 440, duration: 0.05, type: 'square' }],
  'answer-reveal': [
    { freq: 523, duration: 0.1, type: 'sine' },
    { freq: 659, duration: 0.1, type: 'sine', delay: 0.1 },
    { freq: 784, duration: 0.18, type: 'sine', delay: 0.2 },
  ],
  'score-up': [
    { freq: 523, duration: 0.08, type: 'sine' },
    { freq: 659, duration: 0.08, type: 'sine', delay: 0.08 },
    { freq: 784, duration: 0.12, type: 'sine', delay: 0.16 },
  ],
  'score-down': [
    { freq: 392, duration: 0.08, type: 'sine' },
    { freq: 330, duration: 0.08, type: 'sine', delay: 0.08 },
    { freq: 262, duration: 0.12, type: 'sine', delay: 0.16 },
  ],
  foul: [
    { freq: 175, duration: 0.15, type: 'square' },
    { freq: 147, duration: 0.2, type: 'square', delay: 0.15 },
  ],
  'next-click': [{ freq: 660, duration: 0.04, type: 'triangle' }],
  fanfare: [
    { freq: 523, duration: 0.12, type: 'square' },
    { freq: 659, duration: 0.12, type: 'square', delay: 0.12 },
    { freq: 784, duration: 0.12, type: 'square', delay: 0.24 },
    { freq: 1047, duration: 0.25, type: 'square', delay: 0.36 },
  ],
  victory: [
    { freq: 523, duration: 0.1, type: 'triangle' },
    { freq: 659, duration: 0.1, type: 'triangle', delay: 0.1 },
    { freq: 784, duration: 0.1, type: 'triangle', delay: 0.2 },
    { freq: 1047, duration: 0.15, type: 'triangle', delay: 0.3 },
    { freq: 1319, duration: 0.25, type: 'triangle', delay: 0.45 },
  ],
};

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const W = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = W.AudioContext ?? W.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

export function playSynth(event: SfxEvent, volume: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  const pattern = PATTERNS[event];
  if (!pattern) return;

  const now = ctx.currentTime;
  pattern.forEach((tone) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type ?? 'sine';
    osc.frequency.value = tone.freq;

    const startAt = now + (tone.delay ?? 0);
    const stopAt = startAt + tone.duration;
    const peak = 0.18 * volume;

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(stopAt + 0.02);
  });
}
