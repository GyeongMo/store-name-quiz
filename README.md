# 상호명 초성 퀴즈

**멀티팀 초성 퀴즈 게임**. 모둠별 점수를 실시간 관리하고, **초성 → 픽토그램(이모지) → 명대사 TTS** 3단계 힌트로 가게·브랜드 이름(상호명)을 맞춘다. Electron 데스크톱 앱(Windows · macOS)으로 배포되며, 모든 에셋이 앱 내장이라 **오프라인 실행** 가능.

> `initialism-quiz`(애니메이션 초성퀴즈)의 시스템 구조를 복제해 도메인만 상호명으로 바꾼 프로젝트. 아래 문서의 "애니메이션" 예시는 상호명 예시로 치환해 읽으면 된다.

---

## ✨ 주요 기능

### 게임 진행
- 🧑‍🤝‍🧑 **2~6개 모둠** 멀티팀, 이름·이모지(16종)·색상(6종 파스텔) 실시간 커스터마이즈
- ⏱️ **타이머 프리셋** 15 / 20 / 30 / 45 / 60초 + On/Off 토글
- 📝 **문제 개수 1~30** 자유 선택
- 🗂️ **카테고리 선택** (또는 전체 퀴즈풀 사용)

### 3단계 힌트 시스템
1. **초성** — 타이머 시작과 동시에 큰 글자로 표시 (예: `ㅅㅂㅇㅍㅌ`)
2. **픽토그램** — 타이머 절반 지점 등장, 이모지 2~4개 조합 (예: `👻🔮🏠`)
3. **명대사 TTS** — 타이머 종료 5초 전, 화면 표시 + 한국어 음성 낭독

### 진행자 컨트롤
- 📊 **모둠별 점수 조정**: +10 / −10 / 반칙 −2
- 🔊 **효과음**: 문제 시작·힌트 등장·카운트다운·정답 공개·점수 변동·시상식 10종 SFX (에셋 파일 없어도 Web Audio API 합성음으로 자동 대체)

### 시상식 & 결승전
- 🏆 **공동 순위** 자동 계산 (올림픽 방식)
- ⚔️ **결승전 모드**: 공동 1위 발생 시 선택적 진입. 10초 타이머, 힌트 없이 초성만, 점수판 숨김. 우승팀 +50점
- 🎉 컨페티 + 팡파레

### 데이터 관리
- ✏️ **퀴즈풀 편집기**: 카테고리/퀴즈 CRUD, 전체 체크·해제, 검색, 활성화 토글, 🔊 TTS 미리듣기
- 💾 **결과 저장**: JSON / CSV 내보내기 (Electron에서는 네이티브 저장 다이얼로그)
- 🗃️ **자동 저장**: 최근 20회 게임 결과 `localStorage` 자동 보관
- 📤 **Import / Export**: 퀴즈풀 JSON으로 다른 PC 공유 가능

---

## 🛠 기술 스택

| 영역 | 도구 |
|------|------|
| Shell | **Electron 33** (Windows `.exe` NSIS / macOS `.dmg`) |
| Framework | **React 19 + TypeScript** |
| Build | **Vite** (상대경로 `base: './'`, 오프라인 실행 호환) |
| Styling | **Tailwind CSS v4** + 파스텔 테마 |
| Animation | **Framer Motion** |
| SFX | **Howler.js** + Web Audio API 합성음 폴백 |
| TTS | **Web Speech API** (`window.speechSynthesis`, OS 한국어 음성) |
| Effects | **canvas-confetti** |
| Persistence | **localStorage** (키: `yeneungbu-quiz-v1`) |

---

## 🚀 시작하기

### 사전 요구사항
- Node.js 20 LTS 이상
- npm (또는 pnpm)
- **Electron 빌드는 Windows/macOS 네이티브 환경 권장** (WSL은 GUI 라이브러리 부재로 실행 어려움)

### 설치
```bash
npm install
```

### 웹 브라우저 모드 (빠른 개발)
```bash
npm run dev        # http://localhost:5173
npm run build      # dist/ 정적 파일 생성
npm run preview    # 빌드 결과 미리보기
```

### Electron 데스크톱 모드
```bash
npm run electron:dev         # 개발 모드 (HMR)
npm run electron:build:win   # Windows .exe 빌드
npm run electron:build:mac   # macOS .dmg 빌드
```
빌드 산출물은 `release/` 폴더에 생성됩니다.

---

## 📁 프로젝트 구조

```
.
├── electron/
│   ├── main.cjs                 # Electron Main 프로세스 (창·IPC·저장 다이얼로그)
│   └── preload.cjs              # contextBridge 기반 안전한 API 노출
├── public/assets/
│   └── sfx/                     # 시스템 효과음 (선택, 없어도 합성음 재생)
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   └── DialogProvider.tsx   # 전역 React 모달 (alert/confirm/prompt/choice)
│   │   ├── quiz/
│   │   │   ├── QuizBoard.tsx        # 초성·픽토그램·명대사·타이머
│   │   │   └── Scoreboard.tsx       # 모둠 카드 + 점수 버튼
│   │   └── screens/
│   │       ├── SettingsScreen.tsx   # 설정 화면
│   │       ├── MainScreen.tsx       # 게임 진행 화면 레이아웃
│   │       ├── AwardsScreen.tsx     # 시상식 + 결승전 트리거
│   │       └── QuizEditorScreen.tsx # 퀴즈풀 편집기
│   ├── context/GameContext.tsx      # GameProvider + soundManager 프리로드
│   ├── data/quizzes.json            # 기본 퀴즈풀 43선
│   ├── hooks/
│   │   ├── useGameReducer.ts        # 게임 상태 머신 + TIEBREAKER 상수
│   │   └── useTimer.ts              # 타이머 tick interval
│   ├── types/
│   │   ├── game.ts                  # GameState · GameAction · Team
│   │   ├── quiz.ts                  # Quiz · Category · QuizPool
│   │   └── electron.d.ts            # window.electronAPI 타입
│   ├── utils/
│   │   ├── chosung.ts               # 한글 초성 추출
│   │   ├── shuffle.ts
│   │   ├── soundManager.ts          # SFX 이벤트 재생 + 합성음 폴백
│   │   ├── synthSfx.ts              # Web Audio API 신시사이저 패턴
│   │   ├── storage.ts               # localStorage 래퍼
│   │   ├── quizPool.ts              # 기본 + 커스텀 풀 머지, Import/Export
│   │   └── tts.ts                   # Web Speech API 래퍼
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── electron-builder.yml
├── vite.config.ts
└── package.json
```

---

## 🎨 에셋 관리

### 픽토그램 · 명대사 (기본 내장)
모든 퀴즈의 `pictogram`·`catchphrase`는 `src/data/quizzes.json`에 텍스트로 내장되어 있어 별도 이미지·오디오 파일 불필요.

- **직접 편집**: JSON 파일 수정
- **앱 내 편집기**: 설정 → `✏️ 퀴즈 편집` → 픽토그램 입력 + 명대사 입력 + 🔊 미리듣기

### 시스템 효과음 (선택)
10종 SFX 파일을 넣지 않아도 Web Audio API 합성음이 자동 재생됩니다. 실제 음원을 사용하려면:

```
public/assets/sfx/
├── quiz-start.mp3     # 문제 시작
├── hint-appear.mp3    # 힌트1 등장
├── countdown-tick.mp3 # 카운트다운 틱
├── answer-reveal.mp3  # 정답 공개
├── score-up.mp3       # +10
├── score-down.mp3     # −10
├── foul.mp3           # 반칙
├── next-click.mp3     # 다음 문제
├── fanfare.mp3        # 시상식 진입
└── victory.mp3        # 1위 축하
```
출처: Pixabay / Freesound CC0 / YouTube Audio Library 권장. 라이선스는 `src/assets/audio/LICENSES.md`에 기록.

---

## 🗄 데이터 저장 위치

| 종류 | 위치 |
|------|------|
| 기본 퀴즈풀 (읽기 전용) | `src/data/quizzes.json` |
| 사용자 커스텀 퀴즈 · 설정 · 사운드 · 최근 결과 | `localStorage` 키 `yeneungbu-quiz-v1` |
| Electron 사용자 데이터 | `%APPDATA%\4학년 7반 예능부 애니메이션 초성퀴즈\Local Storage\leveldb\` (Windows) |
| 게임 결과 수동 저장 | 사용자 선택 경로 (기본: `Documents/4학년7반예능부퀴즈/`) |

사용자 편집은 항상 **오버레이** 형태로 저장되어 기본 풀을 덮어쓰며, 편집기의 `♻️ 기본 복원`으로 언제든 초기화 가능.

---

## 🎮 게임 흐름

```
[설정 화면]
   ↓ 모둠·타이머·문제 수 설정
[메인 화면] ── 점수 현황판 + 초성 게임판
   ↓ (문제 N개 반복)
   ↓  ─ 초성 표시
   ↓  ─ 타이머 절반: 픽토그램 등장
   ↓  ─ 종료 5초 전: 명대사 TTS + 카운트다운
   ↓  ─ 정답 공개 → +10/-10/반칙 조작 → 다음 문제
[시상식 화면] ── 공동 순위 + 시상대 + 컨페티
   ↓ (공동 1위 발생 시 선택)
[결승전 모드] ── 10초 초성 단독 + 점수판 숨김
   ↓ 우승 지목 → +50점
[시상식 화면] ── 재시작 / JSON·CSV 저장
```

---

## 🔑 주요 설계 결정

- **캐릭터 이미지 미사용**: 픽토그램(유니코드 이모지)으로 대체 → 저작권 리스크 제거
- **오디오 파일 미사용**: 힌트2는 짧은 명대사 텍스트 + OS TTS 낭독 → 음원 저작권·제작 비용 0
- **네이티브 다이얼로그 미사용**: Electron의 포커스 stuck 버그 회피를 위해 모든 alert/confirm/prompt를 React 모달로 구현 (`DialogProvider`)
- **효과음 합성 폴백**: mp3 파일 없어도 Web Audio API로 즉시 재생 → 배포 부담 제로

자세한 배경과 설계는 기획 문서(PRD)의 13장(저작권), 16장(에셋 가이드) 참조.

---

## 🐛 문제 해결

### WSL에서 Electron 실행이 안 됨
`libnss3.so` 등 GUI 라이브러리 부재로 인한 것입니다. **Windows/macOS 네이티브 셸**에서 실행하세요. 같은 `node_modules`를 WSL과 Windows 간 공유하지 마세요.

### TTS 음성이 안 나옴
- Chrome / Edge / Electron에서만 Web Speech API 지원
- Firefox는 한국어 음성 제한적
- Linux는 별도 음성 엔진 설치 필요
- `DevTools Console`에서 `speechSynthesis.getVoices().filter(v => v.lang.startsWith('ko'))` 로 한국어 음성 확인

### 커스텀 퀴즈가 안 보임
- 편집기의 퀴즈 카드 체크박스가 꺼져 있을 수 있음 → "✅ 전체 체크" 버튼으로 일괄 활성화
- localStorage의 레거시 데이터가 간섭할 수 있음 → `♻️ 기본 복원`으로 초기화

---

## 📜 라이선스

교실 내부 교육용으로 개발된 프로젝트입니다. 외부 배포 시에는 사용된 애니메이션 캐릭터명·명대사의 저작권 정책을 별도 확인하세요.
