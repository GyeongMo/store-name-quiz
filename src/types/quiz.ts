export interface Quiz {
  id: string;
  answer: string;
  initials: string;
  aliases?: string[];
  pictogram: string;
  catchphrase: string;
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
