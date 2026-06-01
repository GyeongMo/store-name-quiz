import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { GameState, GameAction } from '../types/game';
import { useGameReducer } from '../hooks/useGameReducer';
import { soundManager } from '../utils/soundManager';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useGameReducer();

  useEffect(() => {
    soundManager.preload();

    // 첫 사용자 인터랙션에서 AudioContext resume (브라우저 autoplay 정책 대응)
    const unlock = () => {
      const W = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = W.AudioContext ?? W.webkitAudioContext;
      if (Ctor) {
        const ctx = new Ctor();
        if (ctx.state === 'suspended') void ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
