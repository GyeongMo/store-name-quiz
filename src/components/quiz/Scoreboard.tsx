import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import type { Team } from '../../types/game';
import { soundManager } from '../../utils/soundManager';

const COLOR_MAP: Record<string, string> = {
  pink: 'bg-bubble-1',
  mint: 'bg-bubble-4',
  sky: 'bg-bubble-5',
  lemon: 'bg-bubble-3',
  lavender: 'bg-bubble-6',
  peach: 'bg-bubble-2',
};

const EMOJI_PRESETS = ['🐻', '🦁', '🚀', '🌸', '⚡', '🌈', '🦄', '🐶', '🐱', '🐵', '🐼', '🦊', '🐧', '🌟', '👑', '🤖'];
const COLOR_PRESETS: Array<{ key: string; label: string }> = [
  { key: 'pink', label: '분홍' },
  { key: 'mint', label: '민트' },
  { key: 'sky', label: '하늘' },
  { key: 'lemon', label: '레몬' },
  { key: 'lavender', label: '라벤더' },
  { key: 'peach', label: '복숭아' },
];

export function Scoreboard() {
  const { state, dispatch } = useGame();

  return (
    <div className="bg-white rounded-3xl p-4 shadow-[var(--shadow-card)] h-full">
      <h2 className="text-xl font-bold text-text-primary mb-3 text-center">
        🏆 점수 현황판
      </h2>
      <div className="space-y-3">
        {state.teams.map((team) => (
          <TeamCard key={team.id} team={team} dispatch={dispatch} />
        ))}
      </div>
    </div>
  );
}

function TeamCard({
  team,
  dispatch,
}: {
  team: Team;
  dispatch: React.Dispatch<import('../../types/game').GameAction>;
}) {
  const [editing, setEditing] = useState(false);
  const bg = COLOR_MAP[team.colorTheme] ?? 'bg-bubble-1';

  return (
    <motion.div layout className={`${bg} rounded-2xl p-3 shadow-[var(--shadow-card)] relative`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-2xl cursor-pointer hover:scale-110 transition-transform"
            title="이모지/색상 변경"
          >
            {team.emoji}
          </button>
          <input
            type="text"
            value={team.name}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_TEAM',
                teamId: team.id,
                patch: { name: e.target.value.slice(0, 10) },
              })
            }
            className="bg-transparent font-bold text-text-primary text-base w-24 outline-none
                       focus:bg-white/50 rounded px-1"
          />
        </div>
        <motion.span
          key={team.score}
          initial={{ scale: 1.4, color: '#FF6B9D' }}
          animate={{ scale: 1, color: '#4A3728' }}
          className="text-2xl font-bold"
        >
          {team.score}점
        </motion.span>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => {
            soundManager.play('score-up');
            dispatch({ type: 'ADJUST_SCORE', teamId: team.id, delta: 10 });
          }}
          className="flex-1 py-2 rounded-xl bg-correct text-white font-bold text-sm
                     hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          +10
        </button>
        <button
          onClick={() => {
            soundManager.play('score-down');
            dispatch({ type: 'ADJUST_SCORE', teamId: team.id, delta: -10 });
          }}
          className="flex-1 py-2 rounded-xl bg-wrong text-white font-bold text-sm
                     hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          −10
        </button>
        <button
          onClick={() => {
            soundManager.play('foul');
            dispatch({ type: 'ADJUST_SCORE', teamId: team.id, delta: -2 });
          }}
          className="flex-1 py-2 rounded-xl bg-gray-600 text-white font-bold text-sm
                     hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          title="반칙 (-2점)"
        >
          반칙
        </button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl p-3 shadow-[var(--shadow-lg)] z-20"
          >
            <p className="text-xs font-bold text-text-secondary mb-1">이모지</p>
            <div className="grid grid-cols-8 gap-1 mb-3">
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  onClick={() =>
                    dispatch({ type: 'UPDATE_TEAM', teamId: team.id, patch: { emoji: e } })
                  }
                  className={`text-xl p-1 rounded hover:bg-bg-primary cursor-pointer ${
                    team.emoji === e ? 'bg-bubble-2' : ''
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-text-secondary mb-1">색상</p>
            <div className="flex gap-1 mb-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.key}
                  onClick={() =>
                    dispatch({ type: 'UPDATE_TEAM', teamId: team.id, patch: { colorTheme: c.key } })
                  }
                  className={`flex-1 py-2 rounded-lg ${COLOR_MAP[c.key]} font-bold text-xs cursor-pointer ${
                    team.colorTheme === c.key ? 'ring-2 ring-accent' : ''
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditing(false)}
              className="w-full py-1 text-xs text-text-secondary hover:text-accent cursor-pointer"
            >
              닫기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
