import { loadState } from './storage';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const list = window.speechSynthesis.getVoices();
  if (list.length > 0) cachedVoices = list;
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    refreshVoices();
  };
}

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function listKoreanVoices(): SpeechSynthesisVoice[] {
  return refreshVoices().filter((v) => v.lang.toLowerCase().startsWith('ko'));
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isTTSAvailable() || !text.trim()) return;

  const sound = loadState().soundSettings;
  if (sound && sound.masterEnabled === false) return;
  const volume = sound?.masterVolume ?? 0.9;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = options.lang ?? 'ko-KR';
  utter.rate = options.rate ?? 0.95;
  utter.pitch = options.pitch ?? 1.0;
  utter.volume = volume;

  const koVoices = listKoreanVoices();
  if (koVoices.length > 0) utter.voice = koVoices[0];

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function cancelSpeak(): void {
  if (!isTTSAvailable()) return;
  window.speechSynthesis.cancel();
}
