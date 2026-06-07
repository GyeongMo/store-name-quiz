import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { Button } from '../common/Button';
import { shuffleArray } from '../../utils/shuffle';
import { createDefaultTeams } from '../../hooks/useGameReducer';
import { soundManager } from '../../utils/soundManager';
import { getEffectivePool } from '../../utils/quizPool';

export function SettingsScreen() {
  const pool = getEffectivePool();
  const { state, dispatch } = useGame();
  const { settings } = state;
  const [sound, setSound] = useState(soundManager.getSettings());

  const updateSound = (patch: Partial<typeof sound>) => {
    const next = { ...sound, ...patch };
    setSound(next);
    soundManager.update(patch);
  };

  const availableQuizzes = pool.categories
    .filter((c) => settings.selectedCategoryId === 'all' || c.id === settings.selectedCategoryId)
    .flatMap((c) => c.quizzes.filter((q) => q.isEnabled !== false));

  const maxQuestions = Math.max(1, availableQuizzes.length);

  const handleStart = () => {
    const count = Math.min(settings.questionCount, availableQuizzes.length);
    const quizzes = shuffleArray(availableQuizzes).slice(0, count);
    dispatch({
      type: 'START_GAME',
      quizzes,
      teams: state.teams.length === settings.teamCount ? state.teams : createDefaultTeams(settings.teamCount),
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-[35px] sm:text-[53px] font-bold text-text-primary mb-3">
          4학년 7반 생활부 <span className="text-accent">향동동 가게 이름</span> 초성게임
        </h1>
        <p className="text-lg text-text-secondary">게임 시작 전에 설정을 맞춰주세요</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-[var(--shadow-lg)] space-y-6"
      >
        <SettingRow label="모둠 개수">
          <NumberStepper
            value={settings.teamCount}
            min={2}
            max={6}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { teamCount: v } })}
            unit="개"
          />
        </SettingRow>

        <SettingRow label="타이머 사용">
          <ToggleSwitch
            active={settings.timerEnabled}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { timerEnabled: v } })}
          />
        </SettingRow>

        {settings.timerEnabled && (
          <SettingRow label="타이머 시간">
            <div className="flex gap-2">
              {[20, 30, 45].map((s) => (
                <button
                  key={s}
                  onClick={() => dispatch({ type: 'UPDATE_SETTINGS', patch: { timerSeconds: s } })}
                  className={`px-4 py-2 rounded-xl text-base font-bold transition-colors cursor-pointer ${
                    settings.timerSeconds === s
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {s}초
                </button>
              ))}
            </div>
          </SettingRow>
        )}

        <SettingRow label="문제 개수">
          <NumberStepper
            value={Math.min(settings.questionCount, maxQuestions)}
            min={1}
            max={maxQuestions}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { questionCount: v } })}
            unit="문제"
            showMax
          />
        </SettingRow>

        <SettingRow label="카테고리">
          <select
            value={settings.selectedCategoryId}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_SETTINGS',
                patch: { selectedCategoryId: e.target.value },
              })
            }
            className="px-4 py-2 rounded-xl bg-gray-100 text-text-primary font-bold cursor-pointer"
          >
            <option value="all">전체 ({availableQuizzes.length}개)</option>
            {pool.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name} ({c.quizzes.length}개)
              </option>
            ))}
          </select>
        </SettingRow>

        <div className="border-t pt-4 space-y-3">
          <h3 className="font-bold text-text-primary">🔊 효과음</h3>
          <SettingRow label="효과음 재생">
            <ToggleSwitch
              active={sound.masterEnabled}
              onChange={(v) => updateSound({ masterEnabled: v })}
            />
          </SettingRow>
          {sound.masterEnabled && (
            <SettingRow label="볼륨">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(sound.masterVolume * 100)}
                onChange={(e) => updateSound({ masterVolume: Number(e.target.value) / 100 })}
                onMouseUp={() => soundManager.play('score-up')}
                className="w-40 cursor-pointer"
              />
            </SettingRow>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleStart} size="lg" className="flex-1">
            🎮 게임 시작
          </Button>
          <Button
            onClick={() => dispatch({ type: 'OPEN_EDITOR' })}
            variant="secondary"
            size="lg"
          >
            ✏️ 퀴즈 편집
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <span className="text-lg font-bold text-text-primary">{label}</span>
      {children}
    </div>
  );
}

function NumberStepper({
  value,
  min,
  max,
  onChange,
  unit,
  showMax,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
  showMax?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 rounded-full bg-bubble-1 text-text-primary font-bold text-xl
                   disabled:opacity-40 cursor-pointer hover:bg-accent hover:text-white transition-colors"
      >
        −
      </button>
      <span className="min-w-[80px] text-center text-xl font-bold text-text-primary">
        {value}
        {unit && <span className="text-sm text-text-secondary ml-1">{unit}</span>}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 rounded-full bg-bubble-4 text-text-primary font-bold text-xl
                   disabled:opacity-40 cursor-pointer hover:bg-correct hover:text-white transition-colors"
      >
        +
      </button>
      {showMax && (
        <button
          onClick={() => onChange(max)}
          disabled={value >= max}
          className="px-3 h-10 rounded-full bg-accent text-white font-bold text-sm
                     disabled:opacity-40 cursor-pointer hover:bg-correct transition-colors"
        >
          최대
        </button>
      )}
    </div>
  );
}

function ToggleSwitch({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative ${
        active ? 'bg-correct' : 'bg-gray-300'
      }`}
    >
      <div
        className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${
          active ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
