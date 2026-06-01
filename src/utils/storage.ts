import type { GameSettings, Team } from '../types/game';
import type { Category } from '../types/quiz';

export interface SoundSettings {
  masterEnabled: boolean;
  masterVolume: number;
}

export interface GameResult {
  schemaVersion: string;
  playedAt: string;
  settings: GameSettings;
  teams: Array<Team & { rank: number }>;
  quizzes: Array<{ order: number; quizId: string; answer: string }>;
}

export interface PersistedState {
  lastSettings?: GameSettings;
  teamPresets?: Team[];
  soundSettings?: SoundSettings;
  recentResults?: GameResult[];
  customQuizPool?: {
    categories: Category[];
    hiddenQuizIds?: string[];
    customAssets?: Record<string, string>;
  };
}

const STORAGE_KEY = 'store-name-quiz-v1';
const MAX_RESULTS = 20;

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedState;
  } catch {
    return {};
  }
}

export function saveState(patch: Partial<PersistedState>): void {
  try {
    const prev = loadState();
    const next = { ...prev, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('localStorage save failed', e);
  }
}

export function appendResult(result: GameResult): void {
  const prev = loadState();
  const results = [result, ...(prev.recentResults ?? [])].slice(0, MAX_RESULTS);
  saveState({ recentResults: results });
}

export function clearAll(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
