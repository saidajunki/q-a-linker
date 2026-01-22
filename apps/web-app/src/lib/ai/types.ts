/**
 * AI機能の型定義
 * 仕様書: docs/specs/ai-services.md
 */

export type Level = 'beginner' | 'intermediate' | 'advanced';

// 質問構造化
export interface QuestionInput {
  body: string;
}

export interface QuestionStructured {
  categories: string[];
  estimatedLevel: Level;
  intent: string;
  assumptions: string[];
  missingInfo: string[];
  suggestedTitle: string;
}

// 回答翻訳
export interface AnswerInput {
  body: string;
  targetLevel: Level;
  questionContext: string;
}

export interface AnswerSimplified {
  simplifiedBody: string;
  glossary: {
    term: string;
    explanation: string;
  }[];
  warnings: string[];
}

// 統合回答
export interface MergeInput {
  answers: {
    id: string;
    body: string;
    responderId: string;
  }[];
  questionContext: string;
  targetLevel: Level;
}

export interface MergedAnswer {
  body: string;
  structure: {
    conclusion: string;
    reasons: string[];
    steps: string[];
    warnings: string[];
    nextActions: string[];
  };
  contributions: {
    answerId: string;
    contributionType: 'main' | 'supplement' | 'minority';
  }[];
}

// モデレーション
export interface ModerationInput {
  body: string;
  type: 'question' | 'answer';
}

export interface ModerationResult {
  isApproved: boolean;
  flags: {
    type: 'pii' | 'harassment' | 'dangerous' | 'spam';
    severity: 'low' | 'medium' | 'high';
    description: string;
    position?: { start: number; end: number };
  }[];
  sanitizedBody?: string;
  requiresReview: boolean;
}

// AIサービスインターフェース
export interface AIService {
  structureQuestion(input: QuestionInput): Promise<QuestionStructured>;
  simplifyAnswer(input: AnswerInput): Promise<AnswerSimplified>;
  mergeAnswers(input: MergeInput): Promise<MergedAnswer>;
  moderate(input: ModerationInput): Promise<ModerationResult>;
}
