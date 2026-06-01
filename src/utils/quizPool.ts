import quizData from '../data/quizzes.json';
import type { Category, Quiz, QuizPool } from '../types/quiz';
import { loadState, saveState } from './storage';

const basePool = quizData as QuizPool;

export function getBasePool(): QuizPool {
  return basePool;
}

// v1.2 이전(`image` 필드) → v1.3(`pictogram` 필드) 일회성 마이그레이션
// 커스텀 퀴즈풀에서 legacy `image` 필드 제거, `pictogram` 없는 커스텀 항목은 버림
(function migrateLegacyQuizPool() {
  const state = loadState();
  const custom = state.customQuizPool;
  if (!custom?.categories) return;

  let changed = false;
  const nextCategories = custom.categories.map((cat) => {
    const nextQuizzes = cat.quizzes
      .map((q) => {
        const asAny = q as Quiz & { image?: string };
        if (asAny.image !== undefined) {
          changed = true;
          const { image, ...rest } = asAny;
          void image;
          return rest as Quiz;
        }
        return q;
      })
      .filter((q) => {
        // 베이스 풀에 같은 id가 있으면 유지 (머지 시 base pictogram이 보강됨)
        const inBase = basePool.categories.some((bc) =>
          bc.quizzes.some((bq) => bq.id === q.id),
        );
        if (inBase) return true;
        // 커스텀 전용 항목인데 pictogram이 없으면 제거
        if (!q.pictogram) {
          changed = true;
          return false;
        }
        return true;
      });
    return { ...cat, quizzes: nextQuizzes };
  });

  if (changed) {
    saveState({ customQuizPool: { ...custom, categories: nextCategories } });
  }
})();

export function getEffectivePool(): QuizPool {
  const custom = loadState().customQuizPool;
  if (!custom) return basePool;

  const hidden = new Set(custom.hiddenQuizIds ?? []);
  const baseCategories: Category[] = basePool.categories.map((cat) => ({
    ...cat,
    quizzes: cat.quizzes.filter((q) => !hidden.has(q.id)),
  }));

  const customCats: Category[] = custom.categories ?? [];
  const merged: Category[] = [...baseCategories];

  customCats.forEach((cc) => {
    const existingIdx = merged.findIndex((m) => m.id === cc.id);
    if (existingIdx >= 0) {
      const combined = [...merged[existingIdx].quizzes];
      cc.quizzes.forEach((q) => {
        const idx = combined.findIndex((c) => c.id === q.id);
        // 머지할 때 베이스 필드를 보존하고 커스텀 값으로 덮어쓰기 (부분 필드만 덮어씀)
        if (idx >= 0) combined[idx] = { ...combined[idx], ...q } as Quiz;
        else combined.push(q);
      });
      merged[existingIdx] = { ...merged[existingIdx], quizzes: combined };
    } else {
      merged.push(cc);
    }
  });

  return { version: basePool.version, categories: merged };
}

export function upsertQuiz(categoryId: string, quiz: Quiz): void {
  const state = loadState();
  const custom = state.customQuizPool ?? { categories: [] };
  const categories = [...custom.categories];
  let cat = categories.find((c) => c.id === categoryId);
  if (!cat) {
    const baseCat = basePool.categories.find((c) => c.id === categoryId);
    cat = {
      id: categoryId,
      name: baseCat?.name ?? '커스텀',
      icon: baseCat?.icon ?? '✨',
      description: baseCat?.description,
      quizzes: [],
      isCustom: !baseCat,
    };
    categories.push(cat);
  }
  const idx = cat.quizzes.findIndex((q) => q.id === quiz.id);
  if (idx >= 0) cat.quizzes[idx] = quiz;
  else cat.quizzes.push(quiz);
  saveState({ customQuizPool: { ...custom, categories } });
}

export function deleteQuiz(categoryId: string, quizId: string): void {
  const state = loadState();
  const custom = state.customQuizPool ?? { categories: [] };

  const isBase = basePool.categories.some((c) =>
    c.id === categoryId && c.quizzes.some((q) => q.id === quizId),
  );

  if (isBase) {
    const hidden = new Set(custom.hiddenQuizIds ?? []);
    hidden.add(quizId);
    saveState({ customQuizPool: { ...custom, hiddenQuizIds: [...hidden] } });
    return;
  }

  const categories = custom.categories.map((c) =>
    c.id === categoryId ? { ...c, quizzes: c.quizzes.filter((q) => q.id !== quizId) } : c,
  );
  saveState({ customQuizPool: { ...custom, categories } });
}

export function toggleQuizEnabled(categoryId: string, quizId: string, enabled: boolean): void {
  const pool = getEffectivePool();
  const cat = pool.categories.find((c) => c.id === categoryId);
  const quiz = cat?.quizzes.find((q) => q.id === quizId);
  if (!quiz) return;
  upsertQuiz(categoryId, { ...quiz, isEnabled: enabled });
}

export function upsertCategory(category: Category): void {
  const state = loadState();
  const custom = state.customQuizPool ?? { categories: [] };
  const categories = [...custom.categories];
  const idx = categories.findIndex((c) => c.id === category.id);
  if (idx >= 0) categories[idx] = category;
  else categories.push(category);
  saveState({ customQuizPool: { ...custom, categories } });
}

export function resetToDefault(): void {
  saveState({ customQuizPool: undefined });
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function exportPool(): string {
  const custom = loadState().customQuizPool ?? { categories: [] };
  return JSON.stringify({ version: '1.0', ...custom }, null, 2);
}

export function importPool(json: string, mode: 'replace' | 'merge'): void {
  const data = JSON.parse(json) as { categories?: Category[]; hiddenQuizIds?: string[] };
  if (mode === 'replace') {
    saveState({ customQuizPool: { categories: data.categories ?? [], hiddenQuizIds: data.hiddenQuizIds } });
    return;
  }
  const current = loadState().customQuizPool ?? { categories: [] };
  const mergedCategories = [...current.categories];
  (data.categories ?? []).forEach((cat) => {
    const idx = mergedCategories.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      const combined = [...mergedCategories[idx].quizzes];
      cat.quizzes.forEach((q) => {
        const qIdx = combined.findIndex((c) => c.id === q.id);
        if (qIdx >= 0) combined[qIdx] = q;
        else combined.push(q);
      });
      mergedCategories[idx] = { ...mergedCategories[idx], quizzes: combined };
    } else {
      mergedCategories.push(cat);
    }
  });
  const hidden = new Set([...(current.hiddenQuizIds ?? []), ...(data.hiddenQuizIds ?? [])]);
  saveState({
    customQuizPool: { categories: mergedCategories, hiddenQuizIds: [...hidden] },
  });
}
