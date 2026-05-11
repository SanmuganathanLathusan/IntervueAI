/**
 * Shared TypeScript types for IntervueAI application
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Question {
  id: string;
  category: 'technical' | 'hr' | 'scenario';
  question: string;
  idealAnswer: string;
  tips: string[];
}

export interface Answer {
  questionId: string;
  question: string;
  answer: string;
  score: number;
  feedback: string;
  improvedAnswer: string;
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
  answeredAt: string;
}

export interface ScoreSummary {
  totalScore: number;
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
}

export interface Interview {
  _id: string;
  userId: string;
  pdfText: string;
  questions: Question[];
  answers: Answer[];
  scores: number[];
  scoreSummary: ScoreSummary;
  createdAt: string;
  updatedAt: string;
}

// Alias for consistency with code that uses InterviewSession
export type InterviewSession = Interview;

export interface ReportResponse {
  userId: string;
  totalInterviews: number;
  totalScore: number;
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
  interviews: Omit<Interview, 'pdfText'>[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  improvedAnswer: string;
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
}
