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
  round?: number;          // 결승전 라운드 (재대결 시 증가, QuizBoard 리마운트 키)
  usedQuizIds?: string[];  // 본게임 + 지난 결승전 라운드에서 출제된 퀴즈 id (중복 출제 방지)
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
  | { type: 'RETRY_TIEBREAKER'; quiz: Quiz }
  | { type: 'RESOLVE_TIEBREAKER'; winnerTeamId: string }
  | { type: 'RESTART' }
  | { type: 'OPEN_EDITOR' }
  | { type: 'CLOSE_EDITOR' };
