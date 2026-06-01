import type { Quiz } from './quiz';

export type GameScreen = 'settings' | 'playing' | 'awards' | 'editor';
export type QuizPhase = 'idle' | 'running' | 'hint2' | 'countdown' | 'revealed';

export interface GameSettings {
  teamCount: number;
  timerSeconds: number;
  timerEnabled: boolean;
  questionCount: number;
  selectedCategoryId: string | 'all';
}

export interface Team {
  id: string;
  name: string;
  emoji: string;
  colorTheme: string;
  score: number;
}

export interface TieBreakerState {
  active: boolean;
  tiedTeamIds: string[];
  winnerTeamId?: string;
}

export interface GameState {
  screen: GameScreen;
  settings: GameSettings;
  teams: Team[];
  quizzes: Quiz[];
  currentIndex: number;
  phase: QuizPhase;
  timeRemaining: number;
  hint1Shown: boolean;
  hint2Shown: boolean;
  tieBreaker: TieBreakerState;
}

export type GameAction =
  | { type: 'UPDATE_SETTINGS'; patch: Partial<GameSettings> }
  | { type: 'START_GAME'; quizzes: Quiz[]; teams: Team[] }
  | { type: 'TICK' }
  | { type: 'SHOW_HINT1' }
  | { type: 'SHOW_HINT2' }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'ADJUST_SCORE'; teamId: string; delta: number }
  | { type: 'UPDATE_TEAM'; teamId: string; patch: Partial<Team> }
  | { type: 'GO_AWARDS' }
  | { type: 'START_TIEBREAKER'; tiedTeamIds: string[]; quiz: Quiz }
  | { type: 'RESOLVE_TIEBREAKER'; winnerTeamId: string }
  | { type: 'RESTART' }
  | { type: 'OPEN_EDITOR' }
  | { type: 'CLOSE_EDITOR' };
