import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { Button } from '../common/Button';
import type { Quiz } from '../../types/quiz';
import { extractChosung } from '../../utils/chosung';
import {
  getEffectivePool,
  upsertQuiz,
  deleteQuiz,
  toggleQuizEnabled,
  upsertCategory,
  resetToDefault,
  exportPool,
  importPool,
  imageFileToDataUrl,
} from '../../utils/quizPool';
import { speak, cancelSpeak, isTTSAvailable } from '../../utils/tts';
import { useDialogs } from '../common/DialogProvider';

export function QuizEditorScreen() {
  const { dispatch } = useGame();
  const dialogs = useDialogs();
  const [poolVersion, setPoolVersion] = useState(0);
  const pool = useMemo(() => getEffectivePool(), [poolVersion]);
  const refresh = () => setPoolVersion((v) => v + 1);

  const [selectedCatId, setSelectedCatId] = useState<string>(pool.categories[0]?.id ?? '');
  const [editing, setEditing] = useState<{
    openId: number;
    categoryId: string;
    quiz: Quiz | null;
  } | null>(null);
  const [search, setSearch] = useState('');

  const openEditor = (categoryId: string, quiz: Quiz | null) =>
    setEditing({ openId: Date.now(), categoryId, quiz });

  const selectedCategory = pool.categories.find((c) => c.id === selectedCatId);
  const filteredQuizzes = (selectedCategory?.quizzes ?? []).filter(
    (q) =>
      !search ||
      q.answer.toLowerCase().includes(search.toLowerCase()) ||
      (q.aliases ?? []).some((a) => a.toLowerCase().includes(search.toLowerCase())),
  );

  const handleAddCategory = async () => {
    const name = await dialogs.prompt('새 카테고리 이름', { placeholder: '예: 카페 브랜드' });
    if (!name?.trim()) return;
    const icon = (await dialogs.prompt('이모지 아이콘 (예: 🏪)', { defaultValue: '✨' })) ?? '✨';
    const id = `cat-${Date.now()}`;
    upsertCategory({ id, name: name.trim(), icon, quizzes: [], isCustom: true });
    setSelectedCatId(id);
    refresh();
  };

  const handleExport = () => {
    const json = exportPool();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quizpool_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const pick = await dialogs.choice(
        '가져오기 방식을 선택해주세요',
        ['덮어쓰기', '병합'],
      );
      if (pick < 0) return;
      const mode = pick === 0 ? 'replace' : 'merge';
      try {
        importPool(text, mode);
        refresh();
        await dialogs.alert('가져오기 완료');
      } catch (err) {
        await dialogs.alert('가져오기 실패: ' + (err as Error).message);
      }
    };
    input.click();
  };

  const handleReset = async () => {
    const ok = await dialogs.confirm(
      '모든 커스텀 퀴즈를 제거하고 기본 퀴즈풀로 초기화합니다. 계속할까요?',
      { okText: '초기화', cancelText: '취소' },
    );
    if (!ok) return;
    resetToDefault();
    refresh();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4 max-w-6xl mx-auto flex-wrap gap-2">
        <h1 className="text-3xl font-bold text-text-primary">✏️ 퀴즈 편집기</h1>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExport} variant="secondary" size="md">📤 내보내기</Button>
          <Button onClick={handleImport} variant="secondary" size="md">📥 가져오기</Button>
          <Button onClick={handleReset} variant="secondary" size="md">♻️ 기본 복원</Button>
          <Button onClick={() => dispatch({ type: 'CLOSE_EDITOR' })} size="md">← 돌아가기</Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        {/* 카테고리 목록 */}
        <aside className="bg-white rounded-2xl p-3 shadow-[var(--shadow-card)] h-fit">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-text-primary">카테고리</h2>
            <button
              onClick={handleAddCategory}
              className="w-7 h-7 rounded-full bg-accent text-white font-bold cursor-pointer hover:brightness-110"
              title="카테고리 추가"
            >
              +
            </button>
          </div>
          <div className="space-y-1">
            {pool.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`w-full text-left rounded-xl px-3 py-2 cursor-pointer transition-colors ${
                  selectedCatId === cat.id ? 'bg-bubble-2' : 'hover:bg-bg-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-bold text-sm text-text-primary">{cat.name}</span>
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {cat.quizzes.length}개 {cat.isCustom && '· 커스텀'}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* 퀴즈 목록 */}
        <section className="bg-white rounded-2xl p-4 shadow-[var(--shadow-card)]">
          {selectedCategory && (
            <>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-bold text-text-primary">
                  {selectedCategory.icon} {selectedCategory.name}
                  <span className="ml-2 text-xs font-normal text-text-secondary">
                    ({filteredQuizzes.filter((q) => q.isEnabled !== false).length}/
                    {filteredQuizzes.length} 활성)
                  </span>
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-1 rounded-lg bg-bg-primary text-sm outline-none"
                  />
                  <button
                    onClick={() => {
                      filteredQuizzes.forEach((q) => {
                        if (q.isEnabled === false) {
                          toggleQuizEnabled(selectedCategory.id, q.id, true);
                        }
                      });
                      refresh();
                    }}
                    disabled={filteredQuizzes.every((q) => q.isEnabled !== false)}
                    className="px-3 py-1 rounded-lg bg-correct text-white text-sm font-bold
                               disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:brightness-110"
                    title={search ? '검색 결과만 전체 활성화' : '전체 활성화'}
                  >
                    ✅ 전체 체크
                  </button>
                  <button
                    onClick={() => {
                      filteredQuizzes.forEach((q) => {
                        if (q.isEnabled !== false) {
                          toggleQuizEnabled(selectedCategory.id, q.id, false);
                        }
                      });
                      refresh();
                    }}
                    disabled={filteredQuizzes.every((q) => q.isEnabled === false)}
                    className="px-3 py-1 rounded-lg bg-gray-500 text-white text-sm font-bold
                               disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:brightness-110"
                    title={search ? '검색 결과만 전체 해제' : '전체 해제'}
                  >
                    ☐ 전체 해제
                  </button>
                  <Button
                    onClick={() => openEditor(selectedCategory.id, null)}
                    size="sm"
                  >
                    + 퀴즈 추가
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[65vh] overflow-y-auto">
                {filteredQuizzes.map((q) => (
                  <QuizCard
                    key={q.id}
                    quiz={q}
                    onToggle={() => {
                      toggleQuizEnabled(selectedCategory.id, q.id, q.isEnabled === false);
                      refresh();
                    }}
                    onEdit={() => openEditor(selectedCategory.id, q)}
                    onDelete={async () => {
                      const ok = await dialogs.confirm(
                        `'${q.answer}' 퀴즈를 삭제할까요?`,
                        { okText: '삭제', cancelText: '취소' },
                      );
                      if (!ok) return;
                      deleteQuiz(selectedCategory.id, q.id);
                      refresh();
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {editing && (
        <QuizEditorModal
          key={editing.openId}
          categoryId={editing.categoryId}
          quiz={editing.quiz}
          onClose={() => setEditing(null)}
          onSave={(q) => {
            upsertQuiz(editing.categoryId, q);
            refresh();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function QuizCard({
  quiz,
  onToggle,
  onEdit,
  onDelete,
}: {
  quiz: Quiz;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const disabled = quiz.isEnabled === false;
  return (
    <div
      className={`rounded-xl px-3 py-2 border-2 ${
        disabled ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-bg-primary border-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="font-bold text-text-primary text-base truncate">{quiz.answer}</p>
        <label className="flex items-center cursor-pointer" title="출제 활성화">
          <input
            type="checkbox"
            checked={!disabled}
            onChange={onToggle}
            className="w-4 h-4 cursor-pointer"
          />
        </label>
      </div>
      <p className="text-xs text-text-secondary">{quiz.initials || extractChosung(quiz.answer)}</p>
      {quiz.catchphrase && (
        <p className="text-[10px] text-text-secondary mt-0.5 truncate">“{quiz.catchphrase}”</p>
      )}
      <div className="flex gap-1 mt-2">
        <button
          onClick={onEdit}
          className="flex-1 py-1 rounded bg-bubble-5 text-xs font-bold cursor-pointer hover:brightness-110"
        >
          수정
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-1 rounded bg-bubble-1 text-xs font-bold cursor-pointer hover:brightness-110"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function QuizEditorModal({
  categoryId: _categoryId,
  quiz,
  onClose,
  onSave,
}: {
  categoryId: string;
  quiz: Quiz | null;
  onClose: () => void;
  onSave: (q: Quiz) => void;
}) {
  const dialogs = useDialogs();
  const [answer, setAnswer] = useState(quiz?.answer ?? '');
  const [initials, setInitials] = useState(quiz?.initials ?? '');
  const [aliases, setAliases] = useState((quiz?.aliases ?? []).join(', '));
  const [pictogram, setPictogram] = useState(quiz?.pictogram ?? '');
  const [catchphrase, setCatchphrase] = useState(quiz?.catchphrase ?? '');
  const [photo, setPhoto] = useState(quiz?.photo ?? '');
  const [photoBusy, setPhotoBusy] = useState(false);

  const autoInitials = () => setInitials(extractChosung(answer));

  const previewTTS = () => {
    if (!catchphrase.trim()) return;
    speak(catchphrase.trim());
  };

  const handlePhotoFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      await dialogs.alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setPhotoBusy(true);
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setPhoto(dataUrl);
    } catch (e) {
      await dialogs.alert('이미지 처리 실패: ' + (e as Error).message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSave = async () => {
    if (!answer.trim()) {
      await dialogs.alert('정답은 필수입니다.');
      return;
    }
    if (!pictogram.trim()) {
      const proceed = await dialogs.confirm(
        '픽토그램이 비어있습니다. 첫 번째 힌트에서 ❓로 표시됩니다. 그래도 저장할까요?',
        { okText: '저장', cancelText: '취소' },
      );
      if (!proceed) return;
    }
    if (!catchphrase.trim()) {
      const proceed = await dialogs.confirm(
        '명대사가 비어있습니다. 두 번째 힌트 TTS가 재생되지 않습니다. 그래도 저장할까요?',
        { okText: '저장', cancelText: '취소' },
      );
      if (!proceed) return;
    }
    cancelSpeak();
    const now = new Date().toISOString();
    onSave({
      id: quiz?.id ?? `custom-${Date.now()}`,
      answer: answer.trim(),
      initials: (initials || extractChosung(answer)).trim(),
      aliases: aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      pictogram: pictogram.trim(),
      catchphrase: catchphrase.trim(),
      photo: photo.trim() || undefined,
      isCustom: true,
      isEnabled: quiz?.isEnabled ?? true,
      createdAt: quiz?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          {quiz ? '퀴즈 수정' : '새 퀴즈 추가'}
        </h2>

        <div className="space-y-3">
          <Field label="정답 *">
            <input
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onBlur={() => {
                if (!initials) setInitials(extractChosung(answer));
              }}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary outline-none"
            />
          </Field>

          <Field label="초성">
            <div className="flex gap-2">
              <input
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-bg-primary outline-none"
              />
              <button
                onClick={autoInitials}
                className="px-3 py-2 rounded-lg bg-bubble-4 text-sm font-bold cursor-pointer hover:brightness-110"
              >
                자동 생성
              </button>
            </div>
          </Field>

          <Field label="별명 (쉼표로 구분)">
            <input
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="예: 카봇, 헬로카봇 시즌2"
              className="w-full px-3 py-2 rounded-lg bg-bg-primary outline-none"
            />
          </Field>

          <Field label="픽토그램 힌트 (이모지 2~4개)">
            <div className="flex items-center gap-2">
              <input
                value={pictogram}
                onChange={(e) => setPictogram(e.target.value)}
                placeholder="예: 👻🔮🏠"
                className="flex-1 px-3 py-2 rounded-lg bg-bg-primary outline-none text-xl"
              />
              {pictogram && (
                <div className="text-3xl">{pictogram}</div>
              )}
            </div>
          </Field>

          <Field label="명대사 (TTS로 읽어줌)">
            <div className="flex items-center gap-2">
              <input
                value={catchphrase}
                onChange={(e) => setCatchphrase(e.target.value)}
                placeholder="예: 변신! / 카메하메하!"
                className="flex-1 px-3 py-2 rounded-lg bg-bg-primary outline-none"
              />
              <button
                type="button"
                onClick={previewTTS}
                disabled={!catchphrase.trim() || !isTTSAvailable()}
                className="px-3 py-2 rounded-lg bg-bubble-5 text-sm font-bold cursor-pointer hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                title={isTTSAvailable() ? '미리 듣기' : '이 브라우저는 TTS를 지원하지 않습니다'}
              >
                🔊 미리듣기
              </button>
            </div>
            {!isTTSAvailable() && (
              <p className="text-xs text-wrong mt-1">
                이 환경에서는 음성 합성(TTS)이 지원되지 않습니다. Electron·Chrome·Edge에서 정상 동작합니다.
              </p>
            )}
          </Field>

          <Field label="가게 홍보사진 (선택)">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="px-3 py-2 rounded-lg bg-bubble-4 text-sm font-bold cursor-pointer hover:brightness-110">
                {photoBusy ? '처리 중…' : '📁 파일 업로드'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                />
              </label>
              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto('')}
                  className="px-3 py-2 rounded-lg bg-bubble-1 text-sm font-bold cursor-pointer hover:brightness-110"
                >
                  🗑 삭제
                </button>
              )}
            </div>
            <input
              value={photo.startsWith('data:') ? '' : photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="또는 이미지 URL 붙여넣기 (https://...)"
              className="w-full mt-2 px-3 py-2 rounded-lg bg-bg-primary outline-none text-sm"
            />
            {photo && (
              <img
                src={photo}
                alt="홍보사진 미리보기"
                className="mt-2 max-h-40 rounded-xl border border-gray-200 object-contain"
              />
            )}
            <p className="text-xs text-text-secondary mt-1">
              업로드한 사진은 앱에 저장됩니다. 저작권에 유의해 직접 촬영했거나 사용 허락된 사진을 권장합니다.
            </p>
          </Field>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} variant="secondary" size="md" className="flex-1">
            취소
          </Button>
          <Button onClick={handleSave} size="md" className="flex-1">
            {quiz ? '저장' : '추가'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-bold text-text-primary block mb-1">{label}</label>
      {children}
    </div>
  );
}

