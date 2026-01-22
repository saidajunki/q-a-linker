/**
 * AIサービスファクトリ
 * 仕様書: docs/specs/ai-services.md
 */

import type { AIService } from './types';
import { MockAIService } from './mock';

export type AIProvider = 'mock' | 'openai' | 'claude';

/**
 * AIサービスのインスタンスを作成する
 * 環境変数 AI_PROVIDER で切り替え可能
 */
export function createAIService(provider?: AIProvider): AIService {
  const selectedProvider = provider ?? (process.env.AI_PROVIDER as AIProvider) ?? 'mock';

  switch (selectedProvider) {
    case 'mock':
      return new MockAIService();
    case 'openai':
      // TODO: OpenAI実装
      console.warn('OpenAI provider not implemented, falling back to mock');
      return new MockAIService();
    case 'claude':
      // TODO: Claude実装
      console.warn('Claude provider not implemented, falling back to mock');
      return new MockAIService();
    default:
      console.warn(`Unknown AI provider: ${selectedProvider}, falling back to mock`);
      return new MockAIService();
  }
}

// シングルトンインスタンス
let aiServiceInstance: AIService | null = null;

/**
 * AIサービスのシングルトンインスタンスを取得する
 */
export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = createAIService();
  }
  return aiServiceInstance;
}

// 型のre-export
export type {
  AIService,
  QuestionInput,
  QuestionStructured,
  AnswerInput,
  AnswerSimplified,
  MergeInput,
  MergedAnswer,
  ModerationInput,
  ModerationResult,
  Level,
} from './types';
