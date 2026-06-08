import { useReducer } from 'react';
import type { GameState, GameAction, Team, QuizPhase } from '../types/game';

const TEAM_EMOJIS = ['🐻', '🦁', '🚀', '🌸', '⚡', '🌈'];
const TEAM_COLORS = ['pink', 'mint', 'sky', 'lemon', 'lavender', 'peach'];

export const TIEBREAKER_SECONDS = 10;
export const TIEBREAKER_WIN_BONUS = 50;

export function createDefaultTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `모둠 ${i + 1}`,
    emoji: TEAM_EMOJIS[i % TEAM_EMOJIS.length],
    colorTheme: TEAM_COLORS[i % TEAM_COLORS.length],
    score: 0,
  }));
}

const initialState: GameState = {
  screen: 'settings',
  settings: {
    teamCount: 6,
    timerSeconds: 30,
    timerEnabled: true,
    questionCount: 25,
    selectedCategoryId: 'all',
  },
  teams: createDefaultTeams(6),
  quizzes: [],
  currentIndex: 0,
  phase: 'idle',
  timeRemaining: 0,
  hint1Shown: false,
  hint2Shown: false,
  tieBreaker: { active: false, tiedTeamIds: [] },
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE_SETTINGS': {
      const next = { ...state.settings, ...action.patch };
      const teams =
        action.patch.teamCount !== undefined && action.patch.teamCount !== state.settings.teamCount
          ? createDefaultTeams(action.patch.teamCount)
          : state.teams;
      return { ...state, settings: next, teams };
    }

    case 'START_GAME':
      return {
        ...state,
        screen: 'playing',
        teams: action.teams.map((t) => ({ ...t, score: 0 })),
        quizzes: action.quizzes,
        currentIndex: 0,
        phase: state.settings.timerEnabled ? 'running' : 'revealed',
        timeRemaining: state.settings.timerEnabled ? state.settings.timerSeconds : 0,
        hint1Shown: !state.settings.timerEnabled,
        hint2Shown: !state.settings.timerEnabled,
        tieBreaker: { active: false, tiedTeamIds: [] },
      };

    case 'TICK': {
      if (state.phase === 'idle' || state.phase === 'revealed') return state;
      const next = Math.max(0, state.timeRemaining - 1);
      const total = state.tieBreaker.active
        ? TIEBREAKER_SECONDS
        : state.settings.timerSeconds;
      let phase: QuizPhase = state.phase;
      let hint1Shown = state.hint1Shown;
      let hint2Shown = state.hint2Shown;

      // 결승전에서는 힌트 자동 노출 차단 (초성만으로 승부)
      if (!state.tieBreaker.active) {
        // 전체 시간의 1/3이 지난 시점(= 남은 시간이 2/3 이하)에 픽토그램 노출
        if (!hint1Shown && next <= Math.floor((total * 2) / 3)) {
          hint1Shown = true;
        }
        // 명대사(TTS) 힌트: 전체 시간의 2/3가 지난 시점(= 남은 시간이 1/3 이하)에 노출
        if (!hint2Shown && next <= Math.floor(total / 3) && next > 0) {
          hint2Shown = true;
        }
        // 마지막 5초에는 카운트다운 phase로 전환
        if (next <= 5 && next > 0) {
          phase = 'countdown';
        }
      } else {
        // 결승전도 마지막 5초에는 카운트다운 phase로 전환 (UI 표시용)
        if (next <= 5 && next > 0 && phase !== 'countdown') {
          phase = 'countdown';
        }
      }
      if (next === 0) {
        phase = 'revealed';
      }
      return { ...state, timeRemaining: next, phase, hint1Shown, hint2Shown };
    }

    case 'SHOW_HINT1':
      return { ...state, hint1Shown: true };

    case 'SHOW_HINT2':
      return { ...state, hint2Shown: true };

    case 'REVEAL_ANSWER':
      return { ...state, phase: 'revealed', timeRemaining: 0, hint1Shown: true, hint2Shown: true };

    case 'NEXT_QUESTION': {
      if (state.tieBreaker.active) return state;
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.quizzes.length) {
        return { ...state, screen: 'awards', phase: 'idle' };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        phase: state.settings.timerEnabled ? 'running' : 'revealed',
        timeRemaining: state.settings.timerEnabled ? state.settings.timerSeconds : 0,
        hint1Shown: !state.settings.timerEnabled,
        hint2Shown: !state.settings.timerEnabled,
      };
    }

    case 'ADJUST_SCORE':
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.teamId ? { ...t, score: t.score + action.delta } : t,
        ),
      };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.teamId ? { ...t, ...action.patch } : t,
        ),
      };

    case 'GO_AWARDS':
      return { ...state, screen: 'awards', phase: 'idle' };

    case 'START_TIEBREAKER': {
      return {
        ...state,
        screen: 'playing',
        tieBreaker: {
          active: true,
          tiedTeamIds: action.tiedTeamIds,
          round: 1,
          usedQuizIds: [...state.quizzes.map((q) => q.id), action.quiz.id],
        },
        quizzes: [action.quiz],
        currentIndex: 0,
        phase: 'running',
        timeRemaining: TIEBREAKER_SECONDS,
        hint1Shown: false,
        hint2Shown: false,
      };
    }

    case 'RETRY_TIEBREAKER': {
      // 승부가 안 났을 때 새 문제로 재대결 — 같은 동점 팀 유지, 라운드 증가
      if (!state.tieBreaker.active) return state;
      return {
        ...state,
        tieBreaker: {
          ...state.tieBreaker,
          round: (state.tieBreaker.round ?? 1) + 1,
          usedQuizIds: [...(state.tieBreaker.usedQuizIds ?? []), action.quiz.id],
        },
        quizzes: [action.quiz],
        currentIndex: 0,
        phase: 'running',
        timeRemaining: TIEBREAKER_SECONDS,
        hint1Shown: false,
        hint2Shown: false,
      };
    }

    case 'RESOLVE_TIEBREAKER':
      // 중복 디스패치 방어 — 이미 비활성 상태면 무시
      if (!state.tieBreaker.active) return state;
      return {
        ...state,
        screen: 'awards',
        phase: 'idle',
        tieBreaker: { active: false, tiedTeamIds: [], winnerTeamId: action.winnerTeamId },
        teams: state.teams.map((t) =>
          t.id === action.winnerTeamId ? { ...t, score: t.score + TIEBREAKER_WIN_BONUS } : t,
        ),
      };

    case 'RESTART':
      return {
        ...initialState,
        settings: state.settings,
        teams: createDefaultTeams(state.settings.teamCount),
      };

    case 'OPEN_EDITOR':
      return { ...state, screen: 'editor' };

    case 'CLOSE_EDITOR':
      return { ...state, screen: 'settings' };

    default:
      return state;
  }
}

export function useGameReducer() {
  return useReducer(reducer, initialState);
}
