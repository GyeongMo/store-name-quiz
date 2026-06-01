import { Howl } from 'howler';
import { loadState, saveState, type SoundSettings } from './storage';
import { playSynth } from './synthSfx';

export type SfxEvent =
  | 'quiz-start'
  | 'hint-appear'
  | 'countdown-tick'
  | 'answer-reveal'
  | 'score-up'
  | 'score-down'
  | 'foul'
  | 'next-click'
  | 'fanfare'
  | 'victory';

const SFX_FILES: Record<SfxEvent, string> = {
  'quiz-start': '/assets/audio/sfx/quiz-start.mp3',
  'hint-appear': '/assets/audio/sfx/hint-appear.mp3',
  'countdown-tick': '/assets/audio/sfx/countdown-tick.mp3',
  'answer-reveal': '/assets/audio/sfx/answer-reveal.mp3',
  'score-up': '/assets/audio/sfx/score-up.mp3',
  'score-down': '/assets/audio/sfx/score-down.mp3',
  foul: '/assets/audio/sfx/foul.mp3',
  'next-click': '/assets/audio/sfx/next-click.mp3',
  fanfare: '/assets/audio/sfx/fanfare.mp3',
  victory: '/assets/audio/sfx/victory.mp3',
};

type LoadState = 'pending' | 'loaded' | 'missing';

class SoundManager {
  private cache: Partial<Record<SfxEvent, Howl>> = {};
  private status: Partial<Record<SfxEvent, LoadState>> = {};
  private settings: SoundSettings;

  constructor() {
    const persisted = loadState().soundSettings;
    this.settings = persisted ?? { masterEnabled: true, masterVolume: 0.7 };
  }

  preload(): void {
    (Object.keys(SFX_FILES) as SfxEvent[]).forEach((evt) => {
      if (this.cache[evt]) return;
      this.status[evt] = 'pending';
      this.cache[evt] = new Howl({
        src: [SFX_FILES[evt]],
        volume: this.settings.masterVolume,
        html5: false,
        pool: 3,
        onload: () => {
          this.status[evt] = 'loaded';
        },
        onloaderror: () => {
          this.status[evt] = 'missing';
        },
      });
    });
  }

  play(event: SfxEvent): void {
    if (!this.settings.masterEnabled) return;

    const status = this.status[event];
    const howl = this.cache[event];

    if (howl && status === 'loaded') {
      howl.volume(this.settings.masterVolume);
      try {
        howl.play();
        return;
      } catch {
        /* fall through to synth */
      }
    }

    // 파일이 없거나(missing) 아직 로딩 중(pending)이면 합성음으로 대체
    playSynth(event, this.settings.masterVolume);
  }

  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  update(patch: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...patch };
    saveState({ soundSettings: this.settings });
    Object.values(this.cache).forEach((howl) => {
      if (howl) howl.volume(this.settings.masterVolume);
    });
  }
}

export const soundManager = new SoundManager();
