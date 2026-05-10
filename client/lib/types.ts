export type User = {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
};

export type Question = {
  id: string;
  category: 'technical' | 'hr' | 'scenario';
  question: string;
  idealAnswer?: string;
  tips?: string[];
};

export type InterviewAnswer = {
  questionId: string;
  question: string;
  answer: string;
  score: number;
  feedback: string;
  improvedAnswer: string;
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
  answeredAt?: string;
};

export type ScoreSummary = {
  totalScore: number;
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
};

export type InterviewSession = {
  /** MongoDB document id — always use _id, not id */
  _id: string;
  userId: string;
  pdfText?: string;
  questions: Question[];
  answers: InterviewAnswer[];
  scores: number[];
  scoreSummary: ScoreSummary;
  createdAt: string;
  updatedAt: string;
};

export type ReportResponse = {
  userId: string;
  totalInterviews: number;
  totalScore: number;
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
  interviews: InterviewSession[];
};

