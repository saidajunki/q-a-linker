/**
 * モックAIサービス
 * 仕様書: docs/specs/ai-services.md
 */

import type {
  AIService,
  QuestionInput,
  QuestionStructured,
  AnswerInput,
  AnswerSimplified,
  MergeInput,
  MergedAnswer,
  ModerationInput,
  ModerationResult,
} from './types';

export class MockAIService implements AIService {
  /**
   * 質問を構造化する（モック実装）
   */
  async structureQuestion(input: QuestionInput): Promise<QuestionStructured> {
    // シンプルなキーワードベースのカテゴリ推定
    const categories = this.detectCategories(input.body);
    
    return {
      categories: categories.length > 0 ? categories : ['一般'],
      estimatedLevel: 'beginner',
      intent: input.body.slice(0, 100),
      assumptions: [],
      missingInfo: ['詳細な状況', '試したこと'],
      suggestedTitle: this.generateTitle(input.body),
    };
  }

  /**
   * 回答を初心者向けに翻訳する（モック実装）
   */
  async simplifyAnswer(input: AnswerInput): Promise<AnswerSimplified> {
    return {
      simplifiedBody: `【${input.targetLevel === 'beginner' ? '初心者向け' : ''}】${input.body}`,
      glossary: [],
      warnings: [],
    };
  }

  /**
   * 複数の回答を統合する（モック実装）
   */
  async mergeAnswers(input: MergeInput): Promise<MergedAnswer> {
    const bodies = input.answers.map((a) => a.body);
    
    return {
      body: `【統合回答】\n\n${bodies.join('\n\n---\n\n')}`,
      structure: {
        conclusion: '複数の回答をまとめました',
        reasons: [],
        steps: [],
        warnings: [],
        nextActions: ['詳細は各回答を参照してください'],
      },
      contributions: input.answers.map((a) => ({
        answerId: a.id,
        contributionType: 'main' as const,
      })),
    };
  }

  /**
   * コンテンツをモデレートする（モック実装）
   */
  async moderate(input: ModerationInput): Promise<ModerationResult> {
    const flags: ModerationResult['flags'] = [];
    let sanitizedBody = input.body;

    // メールアドレスの検出
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    if (emailRegex.test(input.body)) {
      flags.push({
        type: 'pii',
        severity: 'medium',
        description: 'メールアドレスが含まれています',
      });
      sanitizedBody = sanitizedBody.replace(emailRegex, '[メールアドレス]');
    }

    // 電話番号の検出
    const phoneRegex = /\d{2,4}-\d{2,4}-\d{4}/g;
    if (phoneRegex.test(input.body)) {
      flags.push({
        type: 'pii',
        severity: 'medium',
        description: '電話番号が含まれています',
      });
      sanitizedBody = sanitizedBody.replace(phoneRegex, '[電話番号]');
    }

    return {
      isApproved: flags.length === 0,
      flags,
      sanitizedBody: flags.length > 0 ? sanitizedBody : undefined,
      requiresReview: flags.some((f) => f.severity === 'high'),
    };
  }

  /**
   * カテゴリを検出する
   */
  private detectCategories(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'プログラミング': ['react', 'javascript', 'python', 'java', 'コード', 'プログラム', 'エラー', 'バグ'],
      '健康': ['健康', '病気', '症状', '薬', '医療'],
      '法律': ['法律', '契約', '権利', '訴訟'],
      'キャリア': ['転職', '就職', '仕事', 'キャリア', '面接'],
      '生活': ['生活', '料理', '掃除', '家事'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        categories.push(category);
      }
    }

    return categories;
  }

  /**
   * タイトルを生成する
   */
  private generateTitle(body: string): string {
    // 最初の句点または50文字までを取得
    const firstSentence = body.split(/[。？！\n]/)[0];
    if (firstSentence.length <= 50) {
      return firstSentence;
    }
    return firstSentence.slice(0, 47) + '...';
  }
}
