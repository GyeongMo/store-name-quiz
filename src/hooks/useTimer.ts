import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export function useTimer() {
  const { state, dispatch } = useGame();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const timerActive = state.settings.timerEnabled || state.tieBreaker.active;
    const shouldRun =
      state.screen === 'playing' &&
      timerActive &&
      (state.phase === 'running' || state.phase === 'countdown' || state.phase === 'hint2') &&
      state.timeRemaining > 0;

    if (shouldRun) {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    state.screen,
    state.settings.timerEnabled,
    state.tieBreaker.active,
    state.phase,
    state.timeRemaining,
    dispatch,
  ]);
}
