# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**상호명 초성 퀴즈** — 가게·브랜드 이름을 초성으로 맞히는 멀티팀 퀴즈 게임. React 19 + TypeScript + Vite + Electron 33으로 빌드되는 오프라인 데스크톱 앱.

> 이 프로젝트는 `initialism-quiz`(애니메이션 초성퀴즈)의 시스템 구조를 그대로 복제해 출발했다. 게임 메커니즘(초성 → 픽토그램 → 명대사 TTS 3단계 힌트, 멀티팀 채점, 결승전, 퀴즈풀 편집기)은 동일하며, 도메인만 **애니메이션 제목 → 상호명(가게/브랜드 이름)**으로 바뀌었다. 아래 아키텍처 설명의 "애니메이션" 예시는 대부분 상호명 예시로 치환해 읽으면 된다.

## Commands

```bash
# 웹 (브라우저) 모드 — 빠른 개발
npm run dev               # http://localhost:5173
npm run build             # tsc -b && vite build → dist/
npm run preview           # 빌드 결과 미리보기
npm run lint              # ESLint

# Electron 데스크톱 (Windows/macOS 네이티브 셸에서 실행 권장)
npm run electron:dev      # dev 서버 + Electron 동시 실행
npm run electron:build:win   # Windows NSIS 설치 파일 (release/)
npm run electron:build:mac   # macOS dmg

# 아이콘 재생성 (favicon.svg 수정 후)
node scripts/generate-icon.cjs   # build/icon.ico, build/icon.png 갱신
```

**테스트 프레임워크 없음** — 기능 검증은 브라우저/Electron UI에서 수동. 타입 체크는 `npm run build` 또는 `npx tsc -b --noEmit`.

## 환경 주의사항

- **WSL**: Electron 실행 시 `libnss3.so` 등 GUI 라이브러리 부족으로 `npm run electron:dev` 실패. `npm run dev`(웹)만 가능. Electron 빌드는 Windows PowerShell에서.
- **`node_modules` 플랫폼 충돌**: WSL과 Windows에서 번갈아 `npm install`하면 네이티브 바이너리(rolldown·esbuild·sharp)가 깨짐. 한쪽 플랫폼에서만 사용하거나 플랫폼 전환 시 `node_modules`, `package-lock.json` 삭제 후 재설치.
- **Electron 빌드**: Windows용 NSIS 생성에 `wine`이 필요하므로 Linux/WSL에서 Windows 빌드 불가 (또는 `win.signAndEditExecutable: false` 필요). 네이티브 OS에서 빌드.

## 아키텍처

### 화면 라우팅 (`src/App.tsx`)

4개 스크린을 `state.screen` 값으로 전환. `AnimatePresence` 없이 조건부 렌더링 + `motion.div` 엔터 애니메이션만 사용 (이전 `AnimatePresence mode="wait"` 사용 시 exit 중 MainScreen이 re-render되어 Scoreboard 플래시, AwardsScreen mount 정체 등 버그가 있었음).

```
settings ──▶ playing ──▶ awards ──▶ (결승전 시 다시 playing) ──▶ awards
                    └──▶ editor ──▶ settings
```

### 상태 관리 (`src/context/GameContext.tsx`, `src/hooks/useGameReducer.ts`)

단일 `GameState`를 `useReducer`로 관리. `GameProvider`가 `soundManager.preload()`와 Web Audio autoplay unlock을 담당. Context로 전역 접근.

주요 액션: `UPDATE_SETTINGS` / `START_GAME` / `TICK` / `REVEAL_ANSWER` / `NEXT_QUESTION` / `ADJUST_SCORE` / `UPDATE_TEAM` / `START_TIEBREAKER` / `RESOLVE_TIEBREAKER`.

상수: `TIEBREAKER_SECONDS = 10`, `TIEBREAKER_WIN_BONUS = 50` (결승전 고정 타이머 10초, 우승 팀 +50점).

**중복 디스패치 가드**: `RESOLVE_TIEBREAKER`는 `if (!state.tieBreaker.active) return state;`로 이중 실행 방지.

### 타이머 & 힌트 페이즈 (`src/hooks/useTimer.ts`, reducer의 `TICK`)

`QuizPhase`: `'idle' | 'running' | 'hint2' | 'countdown' | 'revealed'`.

타임라인 (30초 예시):
- `t=0`: `phase='running'`, hint1Shown/hint2Shown=false
- `t=15` (1/2): `hint1Shown=true` → 픽토그램 표시
- `t=25` (-5초): `hint2Shown=true`, `phase='countdown'` → 명대사 TTS + 우상단 카운트다운
- `t=30`: `phase='revealed'`

**결승전에서는 TICK이 힌트 자동 노출을 건너뜀** (초성만으로 승부). Scoreboard도 `MainScreen`에서 `tieBreaker.active` 체크로 숨김.

### 3단계 힌트

1. **초성** (`src/utils/chosung.ts`의 `extractChosung`): 한글 정답에서 초성 추출 (예: "스타벅스" → "ㅅㅌㅂㅅ"). 자체 `checkAnswer`도 있으나 현재 UI에서는 사용자 입력을 받지 않음(진행자가 수동 판정).
2. **픽토그램**: `quiz.pictogram` 필드의 이모지 조합 문자열을 크게 표시 (예: `👻🔮🏠`). 이미지 에셋 불필요.
3. **명대사 TTS** (`src/utils/tts.ts`): `quiz.catchphrase`를 `window.speechSynthesis`로 한국어 낭독. OS 내장 음성 사용 (Windows: Heami/SunHi, macOS: Yuna). 오디오 파일 불필요.

### 효과음 시스템 (`src/utils/soundManager.ts`, `src/utils/synthSfx.ts`)

10종 시스템 SFX(`quiz-start`, `hint-appear`, `countdown-tick`, `answer-reveal`, `score-up`, `score-down`, `foul`, `next-click`, `fanfare`, `victory`). `public/assets/audio/sfx/{이벤트}.mp3`에 파일이 있으면 Howler.js로 재생, **없으면 Web Audio API 신시사이저 폴백**(`playSynth`). 파일이 없어도 앱은 정상 동작.

마스터 볼륨·Mute는 `localStorage` 영속화(`SoundSettings`). TTS도 같은 마스터 볼륨 존중.

### 퀴즈풀 (`src/utils/quizPool.ts`, `src/data/quizzes.json`)

**기본 퀴즈풀(앱 번들)** + **사용자 커스텀 오버레이(localStorage)** 이중 레이어.

- `getEffectivePool()`: 기본 + 커스텀 merge 반환. 같은 `id`는 커스텀이 덮어쓰되, 커스텀에 없는 필드는 base에서 보존 (`{ ...base, ...custom }`).
- `hiddenQuizIds`: 사용자가 기본 퀴즈를 "삭제"하면 숨김 목록에 추가 (base 파일은 수정 안 됨).
- `isEnabled: false`: 출제 대상 제외. 편집기의 전체 체크/해제는 이 필드 토글.
- `resetToDefault()`: 커스텀 풀 전체 삭제 → 기본 퀴즈풀로 복원.
- `exportPool() / importPool(json, 'replace'|'merge')`: JSON 내보내기·가져오기.
- **v1.2→1.3 legacy 마이그레이션**: 모듈 로드 시 `image` 필드를 가진 레거시 데이터 자동 정리.

### 영속 저장소 (`src/utils/storage.ts`)

localStorage key: **`store-name-quiz-v1`**.

`PersistedState` 스키마: `lastSettings`, `teamPresets`, `soundSettings`, `recentResults` (최근 20개 게임 결과 자동), `customQuizPool`.

### 전역 다이얼로그 (`src/components/common/DialogProvider.tsx`)

**`window.confirm/alert/prompt`는 사용하지 않음.** Electron에서 네이티브 다이얼로그가 렌더러 포커스를 stuck 상태로 만드는 알려진 버그 때문. 모든 모달 확인은 React로 구현된 `useDialogs()` API(`alert / confirm / prompt / choice`, Promise 반환)를 통해 처리. `main.tsx`에서 `<DialogProvider>`로 App을 감쌈.

### Electron 통합 (`electron/main.cjs`, `electron/preload.cjs`, `src/types/electron.d.ts`)

- `contextIsolation: true`, `nodeIntegration: false` — Preload의 `contextBridge`로만 Node API 노출.
- IPC 핸들러 `dialog:saveResult`: 결과 파일 저장 시 네이티브 `dialog.showSaveDialog` 사용. 기본 경로는 `Documents/상호명초성퀴즈/`.
- `AwardsScreen`의 `saveFile`은 `window.electronAPI?.saveResult`가 있으면 IPC 사용, 없으면(브라우저 모드) `a[download]` 방식으로 다운로드.
- Vite의 `base: './'`로 빌드 경로 상대화 (파일 경로 로딩 호환).

### 퀴즈 편집기 (`src/components/screens/QuizEditorScreen.tsx`)

- `editing` 상태에 `openId: Date.now()` 포함 → 매 오픈마다 unique key → React가 새 인스턴스로 확실히 mount. `AnimatePresence` 없이 조건부 렌더링.
- `autoFocus` + 매 오픈 고유 key → Electron 다이얼로그 잔재 포커스 이슈 방지.
- 이미지·오디오 업로드는 **없음** (v1.4에서 제거). 픽토그램은 이모지 텍스트, 명대사는 텍스트 + 🔊 TTS 미리듣기 버튼.

## 주요 설계 결정 (저작권 회피)

1. **캐릭터 이미지 미사용**: 픽토그램(유니코드 이모지)으로 대체
2. **OST·음원 미사용**: 명대사 텍스트 + OS TTS 낭독
3. **시스템 SFX 미사용도 가능**: Web Audio API 합성음 폴백
4. **짧은 명대사만**: 1~2문장 이내의 상징 구호. 긴 대사·가사 금지

자세한 배경은 외부 PRD 문서 (`C:\vault\gmgu_obsidian\1. Project\개인\하린이 요청\하린이 초성게임 PRD.md`) 13장(저작권), 16장(에셋 가이드) 참조.

## 퀴즈 데이터 추가 가이드

`src/data/quizzes.json` 직접 편집 또는 앱 내 편집기(설정 → ✏️ 퀴즈 편집) 사용. **퀴즈는 평면 배열이 아니라 카테고리 안에 중첩**되어 있다 (`{ version, categories: Category[] }`, 타입은 `src/types/quiz.ts`):

```ts
QuizPool { version: string; categories: Category[] }
Category { id; name; icon; description?; quizzes: Quiz[]; isCustom? }
Quiz {
  id: string;          // 고유 slug (예: "starbucks")
  answer: string;      // 정답 (예: "스타벅스")
  initials: string;    // 초성 (예: "ㅅㅌㅂㅅ")
  aliases?: string[];  // 정답으로 인정되는 별명 (예: "스벅")
  pictogram: string;   // 이모지 2~4개 (예: "☕🟢🧜")
  catchphrase: string; // TTS 낭독 명대사 (1~2문장 이내, 예: "사이렌 오더로 주문하세요!")
  isCustom?: boolean;  // 사용자 추가 여부
  isEnabled?: boolean; // 출제 활성화 (기본 true)
  createdAt?, updatedAt?: string; // 편집기에서 자동 기록
}
```

**오래된 자산/문서 주의**:
- `docs/CONTENT_GUIDE.md`는 v1.2 이전 문서로, 캐릭터 이미지(`public/assets/images/animations/`)·OST 음원(`public/assets/audio/themes/`) 추가법을 설명하지만 이는 위 "저작권 회피" 설계 결정으로 **폐기됨**. 새 퀴즈 작성 시 따르지 말 것.
- `public/assets/images/animations/*.svg` 24개는 코드 어디에서도 참조되지 않는 **레거시 잔재**(grep으로 확인됨). 픽토그램 전환 전 자산이며 정리 대상.
