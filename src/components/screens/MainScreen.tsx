import { useTimer } from '../../hooks/useTimer';
import { Scoreboard } from '../quiz/Scoreboard';
import { QuizBoard } from '../quiz/QuizBoard';
import { useGame } from '../../context/GameContext';

export function MainScreen() {
  useTimer();
  const { state } = useGame();
  const isTieBreaker = state.tieBreaker.active;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-4 p-4">
      {!isTieBreaker && (
        <aside className="lg:w-[380px] shrink-0">
          <Scoreboard />
        </aside>
      )}
      <main className="flex-1 min-w-0">
        <QuizBoard key={`${state.currentIndex}-${isTieBreaker ? 'tb' : 'normal'}`} />
      </main>
    </div>
  );
}
