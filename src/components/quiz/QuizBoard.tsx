import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { Button } from '../common/Button';
import { soundManager } from '../../utils/soundManager';
import { speak, cancelSpeak } from '../../utils/tts';
import { TIEBREAKER_SECONDS } from '../../hooks/useGameReducer';

export function QuizBoard() {
  const { state, dispatch } = useGame();
  const { quizzes, currentIndex, phase, timeRemaining, hint1Shown, hint2Shown, settings, tieBreaker } = state;
  const currentQuiz = quizzes[currentIndex];
  const hint1AnnouncedRef = useRef(false);
  const countdownLastRef = useRef<number | null>(null);
  const revealedAnnouncedRef = useRef(false);

  useEffect(() => {
    hint1AnnouncedRef.current = false;
    countdownLastRef.current = null;
    revealedAnnouncedRef.current = false;
    soundManager.play('quiz-start');
  }, [currentIndex]);

  useEffect(() => {
    if (hint1Shown && !hint1AnnouncedRef.current && !tieBreaker.active && phase !== 'revealed') {
      hint1AnnouncedRef.current = true;
      soundManager.play('hint-appear');
    }
  }, [hint1Shown, phase, tieBreaker.active]);

  useEffect(() => {
    if (phase === 'countdown' && timeRemaining > 0 && timeRemaining !== countdownLastRef.current) {
      countdownLastRef.current = timeRemaining;
      soundManager.play('countdown-tick');
    }
  }, [phase, timeRemaining]);

  useEffect(() => {
    if (phase === 'revealed' && !revealedAnnouncedRef.current) {
      revealedAnnouncedRef.current = true;
      soundManager.play('answer-reveal');
    }
  }, [phase]);

  useEffect(() => {
    const inHintPhase = phase === 'running' || phase === 'countdown' || phase === 'hint2';
    // 결승전에서는 TTS 힌트를 재생하지 않음
    if (hint2Shown && currentQuiz?.catchphrase && inHintPhase && !tieBreaker.active) {
      speak(currentQuiz.catchphrase);
    }
    return () => {
      cancelSpeak();
    };
  }, [hint2Shown, currentQuiz?.catchphrase, phase, tieBreaker.active]);

  if (!currentQuiz) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center">
        <p className="text-xl">퀴즈가 없습니다.</p>
      </div>
    );
  }

  const isRevealed = phase === 'revealed';
  const totalTime = tieBreaker.active ? TIEBREAKER_SECONDS : settings.timerSeconds;
  const timerPercent = settings.timerEnabled ? (timeRemaining / totalTime) * 100 : 100;

  const handleNext = () => {
    if (tieBreaker.active) return;
    cancelSpeak();
    soundManager.play('next-click');
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const handleSkip = () => {
    if (settings.timerEnabled && !isRevealed) {
      cancelSpeak();
      dispatch({ type: 'REVEAL_ANSWER' });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[var(--shadow-lg)] h-full flex flex-col">
      {tieBreaker.active && (
        <div className="mb-3 text-center bg-accent text-white rounded-xl py-2 font-bold">
          ⚔️ 결승전 진행 중
        </div>
      )}

      {/* 타이머 */}
      {settings.timerEnabled && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1 text-sm font-bold text-text-secondary">
            <span>
              {tieBreaker.active
                ? '결승전'
                : `문제 ${currentIndex + 1} / ${quizzes.length}`}
            </span>
            <span className={timeRemaining <= 5 ? 'text-wrong' : ''}>
              {isRevealed ? '정답!' : `${timeRemaining}초`}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${
                timeRemaining <= 5
                  ? 'bg-timer-danger'
                  : timeRemaining <= 10
                  ? 'bg-timer-warning'
                  : 'bg-timer-safe'
              }`}
              animate={{ width: `${timerPercent}%` }}
              transition={{ duration: 0.4, ease: 'linear' }}
            />
          </div>
        </div>
      )}

      {/* 본문 */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <AnimatePresence>
          {phase === 'countdown' && !isRevealed && timeRemaining > 0 && (
            <motion.div
              key={timeRemaining}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              className="absolute top-0 right-0 pointer-events-none z-10"
            >
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent text-white
                           flex items-center justify-center font-bold text-5xl sm:text-6xl
                           shadow-[var(--shadow-lg)] ring-4 ring-white"
              >
                {timeRemaining}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 초성 */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <p className="text-sm text-text-secondary mb-2">초성 힌트</p>
          <h2 className="text-6xl sm:text-8xl font-bold tracking-wide">
            {[...currentQuiz.initials].map((ch, i) => (
              <span
                key={i}
                className="inline-block mx-1"
                style={{
                  color: ['#FFB3BA', '#FFDFBA', '#BAFFC9', '#BAE1FF', '#D4BAFF', '#FF6B9D'][i % 6],
                }}
              >
                {ch === ' ' ? '\u00A0\u00A0' : ch}
              </span>
            ))}
          </h2>
        </motion.div>

        {/* 픽토그램 힌트 */}
        {hint1Shown && !tieBreaker.active && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 text-center"
          >
            <p className="text-sm text-text-secondary mb-1">픽토그램 힌트</p>
            <div className="text-7xl sm:text-8xl leading-none tracking-wide select-none">
              {currentQuiz.pictogram || '❓'}
            </div>
          </motion.div>
        )}

        {/* 힌트2: 명대사 (TTS 재생 + 텍스트 표시) — 결승전에서는 숨김 */}
        {hint2Shown && !isRevealed && currentQuiz.catchphrase && !tieBreaker.active && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-2 text-center"
          >
            <p className="text-sm text-text-secondary mb-1">🔊 명대사 힌트</p>
            <p className="text-2xl sm:text-3xl font-bold text-accent">
              "{currentQuiz.catchphrase}"
            </p>
          </motion.div>
        )}

        {/* 정답 */}
        {isRevealed && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-sm text-text-secondary mb-1">정답</p>
            <h1 className="text-5xl sm:text-7xl font-bold text-accent">
              {currentQuiz.answer}
            </h1>
            {currentQuiz.aliases && currentQuiz.aliases.length > 0 && (
              <p className="text-base text-text-secondary mt-2">
                다른 이름: {currentQuiz.aliases.join(', ')}
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="flex items-center justify-between gap-3 mt-4">
        {!tieBreaker.active && (
          <QuestionProgress
            total={quizzes.length}
            current={currentIndex}
          />
        )}
        <div className="flex gap-2 ml-auto">
          {!isRevealed && settings.timerEnabled && (
            <Button onClick={handleSkip} variant="secondary" size="md">
              정답 공개
            </Button>
          )}
          {tieBreaker.active && (
            <div className="flex gap-2 flex-wrap">
              {state.teams
                .filter((t) => tieBreaker.tiedTeamIds.includes(t.id))
                .map((t) => (
                  <Button
                    key={t.id}
                    size="md"
                    onClick={() => {
                      cancelSpeak();
                      dispatch({ type: 'RESOLVE_TIEBREAKER', winnerTeamId: t.id });
                    }}
                  >
                    {t.emoji} {t.name} 우승
                  </Button>
                ))}
            </div>
          )}
          {isRevealed && !tieBreaker.active && (
            <Button onClick={handleNext} size="lg">
              {currentIndex + 1 >= quizzes.length ? '🎉 결과 보기' : '➡️ 다음 문제'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionProgress({ total, current }: { total: number; current: number }) {
  const rows: number[][] = [];
  for (let i = 0; i < total; i += 10) {
    rows.push(Array.from({ length: Math.min(10, total - i) }, (_, k) => i + k));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1.5 items-center">
          {row.map((i) => (
            <div
              key={i}
              className={`transition-all rounded-full shrink-0 ${
                i === current
                  ? 'w-8 h-8 bg-accent text-white flex items-center justify-center font-bold text-base'
                  : i < current
                  ? 'w-5 h-5 bg-correct'
                  : 'w-5 h-5 bg-gray-200'
              }`}
            >
              {i === current ? i + 1 : ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
