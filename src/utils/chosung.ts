const CHOSUNG_LIST = [
  'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ',
  'ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'
] as const;

export function extractChosung(text: string): string {
  return [...text].map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      return CHOSUNG_LIST[Math.floor((code - 0xAC00) / 588)];
    }
    return ch;
  }).join('');
}

export function normalizeAnswer(input: string): string {
  return input.trim().replace(/\s+/g, '').toLowerCase();
}

export function checkAnswer(
  userInput: string,
  correctAnswer: string,
  acceptableAliases: string[]
): boolean {
  const normalized = normalizeAnswer(userInput);
  const allAcceptable = [correctAnswer, ...acceptableAliases].map(normalizeAnswer);
  return allAcceptable.some(ans => ans === normalized);
}
