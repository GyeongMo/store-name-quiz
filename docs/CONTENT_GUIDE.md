# 초성 퀴즈 - 콘텐츠 추가 가이드

## 퀴즈 추가 방법

### 1단계: 이미지 준비
- 캐릭터 이미지를 `public/assets/images/animations/` 폴더에 넣어주세요
- 권장 크기: 400x400 픽셀 (정사각형)
- 권장 형식: WebP 또는 PNG
- 파일명은 영어 소문자로 (예: `pororo.webp`)

### 2단계: 음악 준비 (선택)
- 애니메이션 주제가를 `public/assets/audio/themes/` 폴더에 넣어주세요
- 권장 길이: 15~30초 (가장 인식하기 쉬운 부분)
- 형식: MP3
- 파일명 예시: `pororo-theme.mp3`

### 3단계: quizzes.json 편집
`src/data/quizzes.json` 파일을 열고, 원하는 카테고리의 `quizzes` 배열에 새 항목을 추가하세요.

```json
{
  "id": "pororo",
  "answer": "뽀로로",
  "aliases": ["뽀뽀로로"],
  "image": "/assets/images/animations/pororo.webp",
  "themeAudio": "/assets/audio/themes/pororo-theme.mp3",
  "difficulty": 1,
  "hints": [
    "첫 번째 힌트",
    "두 번째 힌트",
    "세 번째 힌트"
  ]
}
```

### 항목 설명

| 항목 | 설명 | 필수 |
|------|------|------|
| `id` | 고유 식별자 (영어 소문자, 하이픈 사용) | O |
| `answer` | 정답 (한글 전체 이름) | O |
| `aliases` | 다른 이름으로도 정답 인정 (배열) | O |
| `image` | 캐릭터 이미지 경로 | O |
| `themeAudio` | 주제가 음악 경로 | X |
| `difficulty` | 난이도 (1=쉬움, 2=보통, 3=어려움) | O |
| `hints` | 텍스트 힌트 (최대 3개 권장) | O |

### 새 카테고리 추가

```json
{
  "id": "my-category",
  "name": "카테고리 이름",
  "icon": "🎬",
  "description": "카테고리 설명",
  "quizzes": [
    // 퀴즈 항목들...
  ]
}
```

## 주의사항
- JSON 형식이 올바른지 확인하세요 (쉼표, 따옴표 등)
- 이미지 파일명과 JSON의 경로가 일치하는지 확인하세요
- `aliases`에 자주 불리는 별명을 추가하면 정답 인정이 넓어집니다
