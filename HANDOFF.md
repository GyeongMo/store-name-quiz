# HANDOFF

> 다음 에이전트(또는 새 세션)가 이어서 작업할 수 있도록 작성한 인수인계 문서. 새 대화에서 이 파일 경로(`C:\development\store-name-quiz\HANDOFF.md`)만 주면 맥락을 복원할 수 있다.

## Goal
이번 세션은 **퀴즈 콘텐츠를 "향동(동)" 동네 가게 이름으로 채우고, 문제/설정 화면 UI·UX를 다듬는** 작업이었다. 사용자가 짧은 한국어 지시를 연속으로 주는 방식으로 진행됐고, 모든 요청을 순차 반영했다.

(이전 세션 목표였던 `CLAUDE.md` 점검·push, `dx` 플러그인 설치는 이미 완료됨 — 아래 "이전 세션" 참조.)

## Current Progress (이번 세션에서 한 작업)

### 1. 문서의 도메인 표현 정리 (애니메이션 → 향동 가게 이름)
- `CLAUDE.md`, `README.md`에서 **퀴즈 도메인**을 가리키던 "애니메이션" 표현만 "향동 가게 이름"으로 치환.
- UI/CSS 애니메이션(framer-motion, 키프레임)·원본 프로젝트명(`initialism-quiz`)은 사실 표현이라 **그대로 둠**.
- `README.md` 데이터 저장 위치 표가 원본(`yeneungbu`/`예능부`) 값으로 stale → 실제 코드값으로 교정 (key `store-name-quiz-v1`, productName `상호명 초성 퀴즈`, `Documents/상호명초성퀴즈/`).
- `docs/CONTENT_GUIDE.md`(폐기된 v1.2 문서)는 손대지 않음.

### 2. 첫 화면 제목 변경
- `SettingsScreen.tsx` `<h1>`: "상호명 초성 퀴즈" → **"향동동 가게 이름 초성퀴즈"** (사용자가 "향동동" 두 글자로 확정). 제목 글자 크기 `text-[35px] sm:text-[53px]`.
- 참고: `index.html`의 `<title>`은 그대로 둠(미요청).

### 3. 퀴즈 데이터 대량 추가 (`src/data/quizzes.json`)
- 단일 카테고리 `popular-stores`에 항목을 계속 append. **현재 총 57개**.
- 각 항목 필드: `id`(영문 slug, 중복 금지) / `answer` / `initials`(직접 계산한 초성, 공백은 단어 구분 유지) / `aliases` / `pictogram`(이모지) / `catchphrase`.
- 중복 브랜드는 스킵함: 다이소·배스킨라빈스(베스킨 라빈스)·파리바게뜨(파리바게트)·노브랜드버거(중복 요청).
- 업종 보정 받은 항목: 팔각도(닭 숯불구이), 푸른달 열엿새(베이커리), 안드로메다·엔젤헌터스·지구오락실(가챠샵), 가빈(중국집), 나이스가이(남성 헤어컷), 60계(초성 `ㅇㅅㄱ ㅊㅋ` 육십계).
- **검증 방법**: `node -e "const d=require('.../quizzes.json'); ... 중복 id/answer 체크"` 로 매번 파싱+중복 확인 (마지막 결과: 57개, 중복 없음).

### 4. 문제 화면(`src/components/quiz/QuizBoard.tsx`) UI/UX 개편 — 이번 세션 핵심
- **라벨 제거**: "초성 힌트", "픽토그램 힌트", "🔊 명대사 힌트", 정답의 "정답"·"다른 이름" 문구 모두 삭제 → 글자/이모지만 노출.
- **초성·정답 글자**: 글자별 무지개 색 span. 기본 크기를 **반응형 클래스** `text-8xl sm:text-9xl md:text-[180px] xl:text-[260px]` 로. 정답도 초성과 동일 클래스(공개 시 같은 위치에 표시).
- **`FitText` 컴포넌트(파일 하단 정의)**: 컨테이너 폭 측정 → **넘칠 때만** `transform: scale`로 축소(확대 안 함, scale ≤ 1), 스케일된 높이를 컨테이너 높이로 잡아 아래 요소와 겹침 방지. `ResizeObserver`로 반응형. → 초성/정답에 적용.
  - (히스토리: "폭 꽉 채움+세로 절반 상한"까지 갔다가, 사용자가 `AskUserQuestion`에서 **"폭 채움 제거, 단계별 크기"** 선택 → 현재의 축소 전용 + 반응형 클래스로 확정.)
- **정답 공개 동작**: 상단 초성이 사라지고 **그 자리에** 정답이 스케일 애니메이션으로 표시.
- **픽토그램**: 크기 1.5배(`text-[108px] sm:text-[144px]`).
- **명대사**:
  - 진행 중: **아래에서 위로 올라와 가운데 자리에서 멈추는** 슬라이드업(`initial y:140 → y:0`, 0.8s easeOut). (이전엔 우→좌 무한 마퀴였으나 제거함 → `Marquee` 컴포넌트 삭제됨.)
  - 정답 공개 시: 마퀴/슬라이드 없이 **화면 가운데 고정** 텍스트.
  - 글자 크기 2배 `text-5xl sm:text-6xl`.
- **요소 간 간격**: 초성/픽토그램/명대사 사이 `mb`를 원래의 **4배**로 (`mb-24` / `mb-16` / `mb-8`).

### 5. 타이머/힌트 타이밍 (`src/hooks/useGameReducer.ts` TICK)
- **픽토그램**: 전체 시간의 **1/3 경과** 시 노출 (`next <= floor(total*2/3)`).
- **명대사(TTS+텍스트)**: 전체 시간의 **2/3 경과** 시 노출 (`next <= floor(total/3)`). 카운트다운 phase와 **분리**(카운트다운은 기존대로 마지막 5초).
- **카운트다운 중 명대사 음성 차단**: `QuizBoard`의 TTS effect `inHintPhase`에서 `'countdown'` 제외 → countdown 진입 시 `cancelSpeak()`로 중단.
- ⚠️ `CLAUDE.md`의 타임라인 설명(픽토그램 1/2, 명대사 -5초)은 **이제 코드와 불일치** → 갱신 필요(아래 Next Steps).

### 6. 설정 화면(`src/components/screens/SettingsScreen.tsx`)
- 문제 개수 스테퍼 옆에 **"최대"(한글) 버튼** 추가 → 누르면 카테고리 전체 활성 퀴즈 수로 즉시 설정. `NumberStepper`에 `showMax` prop 추가, 문제 개수에만 적용.
- 문제 개수의 **"(최대 N)" 라벨 문구 제거**, 30개 상한 제거(`Math.min(30,…)` → `Math.max(1, availableQuizzes.length)`) → 진짜 전체 개수 선택 가능.

## What Worked
- **편집마다 `npx tsc -b --noEmit`로 타입 검증** → 모든 변경 후 exit 0 확인. (테스트 프레임워크 없음, 타입체크가 1차 안전망.)
- **JSON 추가 후 `node -e`로 파싱+중복 id/answer 검사** → 데이터 깨짐/중복 방지.
- **`transform: scale` + 컨테이너 높이 보정** 패턴으로 폰트 자동 맞춤 구현(레이아웃 reflow 문제 회피).
- 애매한 요구("반응형")는 **`AskUserQuestion`으로 의도 확인 후 구현** → 헛작업 방지.

## What Didn't Work / 주의점
- **`Edit` old_string에 nbsp(` `) 포함 줄이 안 잡힘**: 초성/정답 span의 `{ch === ' ' ? '  ' : ch}` 줄. → 그 줄을 피해 앞뒤로 나눠 편집하거나, nbsp 없는 고유 줄을 타깃해야 함.
- **명대사 마퀴(우→좌 무한 스크롤)는 결국 폐기**됨. 사용자가 "아래→가운데 멈춤"을 원해서 `Marquee` 컴포넌트 자체를 삭제. (다시 필요하면 git 히스토리/이 문서 참고해 재작성.)
- **`FitText` "폭 꽉 채움+세로 절반 상한" 방향도 폐기**됨. 최종은 "축소 전용 + 반응형 클래스".
- 사용자 입력에 오타 잦음(예: "나이스카이"=나이스가이, "0.5배로 크게"=1.5배로 해석). 맥락으로 보정하되 결과를 명시할 것.

## Next Steps
- [ ] **`CLAUDE.md` 타이머 타임라인 설명 갱신** (픽토그램 1/3, 명대사 2/3, 카운트다운 마지막 5초로). 현재 문서가 코드와 불일치.
- [ ] **변경사항 커밋/푸시 여부 확인**: 현재 working tree에 미커밋 변경 6개 파일(`CLAUDE.md README.md QuizBoard.tsx SettingsScreen.tsx quizzes.json useGameReducer.ts`). 사용자가 push 지시한 적 없음 → 지시 대기.
- [ ] (선택) 가챠샵·중국집 등 **추정으로 채운 픽토그램/명대사** 실제와 맞는지 사용자 확인.
- [ ] (대기) `public/assets/images/animations/*.svg` 24개 레거시 잔재, `docs/CONTENT_GUIDE.md` 폐기 문서 정리.
- [ ] 실제 브라우저(`npm run dev`)에서 초성 자동 축소·명대사 슬라이드업·간격(4배)·"최대" 버튼 등 **육안 확인** (타입체크만 했고 런타임 확인은 안 함).

## 참고 파일
- `src/components/quiz/QuizBoard.tsx` — 문제 화면 전체. 하단에 `FitText`·`QuestionProgress` 로컬 컴포넌트.
- `src/hooks/useGameReducer.ts` — TICK 힌트 타이밍, 상수(`TIEBREAKER_SECONDS=10`, `+50`).
- `src/components/screens/SettingsScreen.tsx` — 설정, `NumberStepper`(showMax).
- `src/data/quizzes.json` — 퀴즈풀(현재 57개, `popular-stores` 단일 카테고리).
- `CLAUDE.md` — 아키텍처 가이드(타임라인 부분 stale).
- remote: `https://github.com/GyeongMo/store-name-quiz.git` (branch `main`)

## 이전 세션 (완료, 참고용)
1. **CLAUDE.md 보강** (reducer 액션 목록, `timerEnabled:false` 동작) → 커밋 `bca32b6`, `main` push 완료.
2. **`dx` 플러그인 설치**: 마켓플레이스 `ykdojo/claude-code-tips` 추가 → `dx@ykdojo` v0.14.12. 명령 `/dx:handoff` 등. (새 플러그인 명령은 세션 재시작 후 로드됨.)
- 환경 주의: WSL은 Electron 실행 불가(웹 `npm run dev`만). WSL↔Windows `npm install` 혼용 시 네이티브 바이너리 깨짐.
