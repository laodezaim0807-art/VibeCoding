export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export type QuestionType = "pilihan_ganda" | "esai";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options: string[]; // Empty if type is 'esai'
  correctAnswer: string; // The correct option for 'pilihan_ganda', or the model target answer for 'esai'
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  sourceType: "text" | "file" | "youtube";
  sourceName: string;
  difficulty: "Mudah" | "Sedang" | "Sulit";
  format: "pilihan_ganda" | "esai" | "campuran";
  timeLimit: number; // in minutes. 0 means unlimited
  questions: Question[];
  createdAt: string;
}

export interface UserAttempt {
  id: string;
  userId: string; // Associated user
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  answers: { [questionId: string]: string }; // Map of question ID to user response text
  grades?: { [questionId: string]: number }; // For essays: user self-assessed percentage (0-100) or score
  completedAt: string;
  timeSpentSeconds: number;
}

export interface QuizHistory {
  quizzes: Quiz[];
  attempts: UserAttempt[];
}
