import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';
import { Button } from '../common/Button';
import { shuffleArray } from '../../utils/shuffle';
import type { Team } from '../../types/game';
import { soundManager } from '../../utils/soundManager';
import { appendResult, type GameResult } from '../../utils/storage';
import { getEffectivePool } from '../../utils/quizPool';
import { useDialogs } from '../common/DialogProvider';

interface RankedTeam extends Team {
  rank: number;
}

export function AwardsScreen() {
  const { state, dispatch } = useGame();
  const dialogs = useDialogs();
  const [tiePromptDismissed, setTiePromptDismissed] = useState(false);

  const ranked = useMemo(() => rankTeams(state.teams), [state.teams]);
  const topTied = useMemo(
    () => ranked.filter((t) => t.rank === 1).map((t) => t.id),
    [ranked],
  );
  const hasTopTie = topTied.length > 1 && !state.tieBreaker.winnerTeamId;

  useEffect(() => {
    window.scrollTo(0, 0);
    soundManager.play('fanfare');
    const victoryTimer = setTimeout(() => soundManager.play('victory'), 900);
    const confettiTimer = setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.4 },
        colors: ['#4FBEE2', '#45CBA8', '#7FB4F0', '#9F8FE0', '#3FD0C4', '#7AA7EC'],
      });
    }, 400);

    const result: GameResult = {
      schemaVersion: '1.0',
      playedAt: new Date().toISOString(),
      settings: state.settings,
      teams: ranked,
      quizzes: state.quizzes.map((q, i) => ({ order: i + 1, quizId: q.id, answer: q.answer })),
    };
    appendResult(result);

    return () => {
      clearTimeout(victoryTimer);
      clearTimeout(confettiTimer);
    };
  }, []);

  const startTieBreaker = async () => {
    const allQuizzes = getEffectivePool()
      .categories.flatMap((c) => c.quizzes)
      .filter((q) => q.isEnabled !== false);
    // 본게임에 나오지 않은 문제에서 랜덤 선택
    const unused = allQuizzes.filter(
      (q) => !state.quizzes.some((used) => used.id === q.id),
    );
    if (unused.length === 0) {
      await dialogs.alert('출제 가능한 미사용 퀴즈가 없습니다. 이미 사용된 문제 중 무작위 선택합니다.');
    }
    const pickPool = unused.length > 0 ? unused : allQuizzes;
    const picked = shuffleArray(pickPool)[0];
    dispatch({ type: 'START_TIEBREAKER', tiedTeamIds: topTied, quiz: picked });
  };

  const timestamp = () =>
    new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

  const saveFile = async (content: string, filename: string, type: 'json' | 'csv') => {
    if (window.electronAPI?.saveResult) {
      const res = await window.electronAPI.saveResult({ filename, content, type });
      if (res.saved && res.filePath) await dialogs.alert(`저장됨: ${res.filePath}`);
      return;
    }
    const mime = type === 'csv' ? 'text/csv;charset=utf-8' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const payload = {
      schemaVersion: '1.0',
      playedAt: new Date().toISOString(),
      settings: state.settings,
      teams: ranked,
      quizzes: state.quizzes.map((q, i) => ({
        order: i + 1,
        quizId: q.id,
        answer: q.answer,
      })),
    };
    saveFile(JSON.stringify(payload, null, 2), `result_${timestamp()}.json`, 'json');
  };

  const exportCSV = () => {
    const header = '순위,모둠명,이모지,점수';
    const rows = ranked.map((t) => `${t.rank},${t.name},${t.emoji},${t.score}`);
    const csv = '\ufeff' + [header, ...rows].join('\n');
    saveFile(csv, `result_${timestamp()}.csv`, 'csv');
  };

  const topTeams = ranked.filter((t) => t.rank === 1);
  const second = ranked.filter((t) => t.rank === topTeams.length + 1);
  const third = ranked.filter((t) => t.rank === topTeams.length + second.length + 1);

  return (
    <div className="min-h-screen flex flex-col items-center p-6 overflow-y-auto">
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-5xl sm:text-6xl font-bold text-text-primary mt-4 mb-2 text-center"
      >
        🏆 시상식 🏆
      </motion.h1>
      <p className="text-lg text-text-secondary mb-8">
        오늘의 우승팀을 공개합니다!
      </p>

      {/* 시상대 */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 w-full max-w-3xl mb-8 flex-wrap">
        {second.length > 0 && (
          <Podium teams={second} place={2} height="h-32" color="bg-bubble-5" />
        )}
        <Podium teams={topTeams} place={1} height="h-44" color="bg-bubble-3" isWinner />
        {third.length > 0 && (
          <Podium teams={third} place={3} height="h-24" color="bg-bubble-2" />
        )}
      </div>

      {/* 동점 안내 */}
      {hasTopTie && !tiePromptDismissed && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-accent text-white rounded-2xl p-4 mb-6 text-center max-w-lg w-full"
        >
          <p className="text-lg font-bold mb-3">
            🤝 공동 1위가 {topTied.length}팀 있습니다!
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={startTieBreaker} size="md">
              ⚔️ 결승전 진행
            </Button>
            <Button
              onClick={() => setTiePromptDismissed(true)}
              variant="secondary"
              size="md"
            >
              공동 1위로 확정
            </Button>
          </div>
        </motion.div>
      )}

      {/* 전체 순위 테이블 */}
      <div className="w-full max-w-lg bg-white rounded-2xl p-4 shadow-[var(--shadow-card)] mb-6">
        <h3 className="font-bold text-text-primary mb-3">전체 순위</h3>
        <div className="space-y-2">
          {ranked.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-bg-primary rounded-xl px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-accent w-8">{t.rank}위</span>
                <span className="text-2xl">{t.emoji}</span>
                <span className="font-bold text-text-primary">{t.name}</span>
              </div>
              <span className="font-bold text-lg">{t.score}점</span>
            </div>
          ))}
        </div>
      </div>

      {/* 액션 */}
      <div className="flex flex-wrap gap-3 w-full max-w-lg">
        <Button
          onClick={() => dispatch({ type: 'RESTART' })}
          variant="secondary"
          size="lg"
          className="flex-1"
        >
          🔁 처음부터
        </Button>
        <Button onClick={exportJSON} size="lg" className="flex-1">
          💾 JSON 저장
        </Button>
        <Button onClick={exportCSV} size="lg" variant="secondary" className="flex-1">
          📊 CSV 저장
        </Button>
      </div>
    </div>
  );
}

function Podium({
  teams,
  place,
  height,
  color,
  isWinner,
}: {
  teams: RankedTeam[];
  place: number;
  height: string;
  color: string;
  isWinner?: boolean;
}) {
  const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: place * 0.15 }}
      className="flex flex-col items-center"
    >
      <div className="flex flex-col items-center mb-2 gap-1">
        {teams.map((t) => (
          <div key={t.id} className="flex flex-col items-center">
            <span className={isWinner ? 'text-5xl' : 'text-4xl'}>{t.emoji}</span>
            <span className="font-bold text-text-primary">{t.name}</span>
            <span className="text-sm text-text-secondary">{t.score}점</span>
          </div>
        ))}
      </div>
      <div
        className={`${color} ${height} w-24 sm:w-32 rounded-t-2xl flex items-start justify-center pt-2`}
      >
        <div className="text-center">
          <div className="text-4xl">{medal}</div>
          <div className="font-bold text-text-primary">
            {teams.length > 1 ? `공동 ${place}위` : `${place}위`}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function rankTeams(teams: Team[]): RankedTeam[] {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const result: RankedTeam[] = [];
  let rank = 1;
  sorted.forEach((team, i) => {
    if (i > 0 && sorted[i - 1].score !== team.score) {
      rank = i + 1;
    }
    result.push({ ...team, rank });
  });
  return result;
}
