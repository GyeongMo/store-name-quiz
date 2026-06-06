import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
    // 마지막 5초 카운트다운(phase === 'countdown') 중에는 명대사 음성을 재생하지 않음
    const inHintPhase = phase === 'running' || phase === 'hint2';
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
          className="text-center mb-24 w-full"
        >
          {isRevealed ? (
            <motion.div
              key="answer"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <FitText className="text-8xl sm:text-9xl md:text-[180px] xl:text-[260px] font-bold tracking-wide">
                {[...currentQuiz.answer].map((ch, i) => (
                  <span
                    key={i}
                    className="inline-block mx-1"
                    style={{
                      color: ['#4FBEE2', '#45CBA8', '#7FB4F0', '#9F8FE0', '#3FD0C4', '#7AA7EC'][i % 6],
                    }}
                  >
                    {ch === ' ' ? '  ' : ch}
                  </span>
                ))}
              </FitText>
            </motion.div>
          ) : (
            <FitText className="text-8xl sm:text-9xl md:text-[180px] xl:text-[260px] font-bold tracking-wide">
            {[...currentQuiz.initials].map((ch, i) => (
              <span
                key={i}
                className="inline-block mx-1"
                style={{
                  color: ['#4FBEE2', '#45CBA8', '#7FB4F0', '#9F8FE0', '#3FD0C4', '#7AA7EC'][i % 6],
                }}
              >
                {ch === ' ' ? '\u00A0\u00A0' : ch}
              </span>
            ))}
            </FitText>
          )}
        </motion.div>

        {/* 픽토그램 힌트 */}
        {hint1Shown && !tieBreaker.active && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-16 text-center"
          >
            <div className="text-[108px] sm:text-[144px] leading-none tracking-wide select-none">
              {currentQuiz.pictogram || '❓'}
            </div>
          </motion.div>
        )}

        {/* 가게 홍보사진 힌트 */}
        {hint1Shown && currentQuiz.photo && !tieBreaker.active && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-16 text-center"
          >
            <img
              src={currentQuiz.photo}
              alt="가게 홍보사진"
              className="max-h-[38vh] max-w-full mx-auto rounded-3xl shadow-[var(--shadow-lg)] object-contain"
            />
          </motion.div>
        )}

        {/* 힌트2: 명대사 — 진행 중엔 우→좌 마퀴, 정답 공개 시엔 화면 가운데 고정. 결승전에서는 숨김 */}
        {hint2Shown && currentQuiz.catchphrase && !tieBreaker.active && (
          isRevealed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 w-full text-center"
            >
              <p className="text-[4.5rem] sm:text-[5.625rem] font-bold text-accent">
                "{currentQuiz.catchphrase}"
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: 140, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mb-8 w-full text-center"
            >
              <p className="text-[4.5rem] sm:text-[5.625rem] font-bold text-accent">
                "{currentQuiz.catchphrase}"
              </p>
            </motion.div>
          )
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
              <span className="text-[2.5rem]">
                {currentIndex + 1 >= quizzes.length ? '🎉 결과 보기' : '➡️ 다음 문제'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 기본 크기는 반응형 클래스(text-... 구간별)로 정하고, 그 크기로도 한 줄에
// 안 들어갈 만큼 길 때만 transform: scale로 줄여 한 줄을 유지한다 (확대는 안 함).
function FitText({ children, className }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;
      const available = container.clientWidth;
      const natural = content.scrollWidth;
      // offsetHeight는 flex 컨테이너 height를 되먹임할 때 stretch로 붕괴될 수 있으므로
      // 콘텐츠의 실제 높이를 반영하는 scrollHeight를 사용한다.
      const naturalHeight = content.scrollHeight;
      if (!available || !natural || !naturalHeight) return;
      const scale = Math.min(1, available / natural); // 넘칠 때만 축소, 확대는 안 함
      const height = naturalHeight * scale;
      setDims((prev) =>
        Math.abs(prev.scale - scale) > 0.001 || Math.abs(prev.height - height) > 0.5
          ? { scale, height }
          : prev,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  });

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden flex items-start justify-center"
      style={{ height: dims.height || undefined }}
    >
      <div
        ref={contentRef}
        className={className}
        style={{ whiteSpace: 'nowrap', transform: `scale(${dims.scale})`, transformOrigin: 'center top' }}
      >
        {children}
      </div>
    </div>
  );
}

function QuestionProgress({ total, current }: { total: number; current: number }) {
  const rows: number[][] = [];
  for (let i = 0; i < total; i += 15) {
    rows.push(Array.from({ length: Math.min(15, total - i) }, (_, k) => i + k));
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
