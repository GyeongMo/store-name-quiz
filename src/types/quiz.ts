export interface Quiz {
  id: string;
  answer: string;
  initials: string;
  aliases?: string[];
  pictogram: string;
  catchphrase: string;
  photo?: string; // 가게 홍보사진 (dataURL 또는 외부 이미지 URL)
  isCustom?: boolean;
  isEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  quizzes: Quiz[];
  isCustom?: boolean;
}

export interface QuizPool {
  version: string;
  categories: Category[];
}
