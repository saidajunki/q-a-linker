/**
 * Google Gemini AIサービス
 * 仕様書: docs/specs/ai-services.md
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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
  Level,
} from './types';
import { MockAIService } from './mock';

export class GeminiAIService implements AIService {
  private client: GoogleGenerativeAI;
  private model: string;
  private mockFallback: MockAIService;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = process.env.GOOGLE_AI_MODEL ?? 'gemini-2.0-flash';
    this.mockFallback = new MockAIService();
  }

  /**
   * 質問を構造化する
   */
  async structureQuestion(input: QuestionInput): Promise<QuestionStructured> {
    try {
      const prompt = `以下の質問を分析して、JSON形式で構造化してください。

質問:
${input.body}

以下のJSON形式で出力してください（JSONのみ、説明不要）:
{
  "categories": ["カテゴリ1", "カテゴリ2"],
  "estimatedLevel": "beginner" | "intermediate" | "advanced",
  "intent": "質問者が知りたいこと（1文で）",
  "assumptions": ["推定される前提1", "推定される前提2"],
  "missingInfo": ["不足している情報1", "不足している情報2"],
  "suggestedTitle": "50文字以内のタイトル案"
}

カテゴリ候補: プログラミング, 健康, 法律, キャリア, 生活, 教育, 金融, 一般
レベル判定基準:
- beginner: 基礎的な質問、専門用語なし
- intermediate: ある程度の知識を前提とした質問
- advanced: 専門的・高度な質問`;

      const result = await this.generateJSON<QuestionStructured>(prompt);
      
      // バリデーションとデフォルト値
      return {
        categories: result.categories ?? ['一般'],
        estimatedLevel: this.validateLevel(result.estimatedLevel),
        intent: result.intent ?? input.body.slice(0, 100),
        assumptions: result.assumptions ?? [],
        missingInfo: result.missingInfo ?? [],
        suggestedTitle: (result.suggestedTitle ?? input.body).slice(0, 50),
      };
    } catch (error) {
      console.warn('Gemini structureQuestion failed, using mock fallback:', error);
      return this.mockFallback.structureQuestion(input);
    }
  }

  /**
   * 回答を初心者向けに翻訳する
   */
  async simplifyAnswer(input: AnswerInput): Promise<AnswerSimplified> {
    try {
      const levelLabel = {
        beginner: '初心者（専門用語を避け、例え話を使って説明）',
        intermediate: '中級者（基本用語は使用可、詳細な説明）',
        advanced: '上級者（専門用語OK、簡潔に）',
      }[input.targetLevel];

      const prompt = `以下の回答を、${levelLabel}向けに翻訳してください。

元の質問:
${input.questionContext}

回答:
${input.body}

以下のJSON形式で出力してください（JSONのみ、説明不要）:
{
  "simplifiedBody": "翻訳後の回答",
  "glossary": [
    {"term": "専門用語", "explanation": "わかりやすい説明"}
  ],
  "warnings": ["注意点があれば記載"]
}`;

      const result = await this.generateJSON<AnswerSimplified>(prompt);
      
      return {
        simplifiedBody: result.simplifiedBody ?? input.body,
        glossary: result.glossary ?? [],
        warnings: result.warnings ?? [],
      };
    } catch (error) {
      console.warn('Gemini simplifyAnswer failed, using mock fallback:', error);
      return this.mockFallback.simplifyAnswer(input);
    }
  }

  /**
   * 複数の回答を統合する
   */
  async mergeAnswers(input: MergeInput): Promise<MergedAnswer> {
    try {
      const answersText = input.answers
        .map((a, i) => `【回答${i + 1}】\n${a.body}`)
        .join('\n\n');

      const prompt = `以下の複数の回答を統合して、質問者にとってわかりやすい1つの回答を作成してください。

質問:
${input.questionContext}

${answersText}

以下のJSON形式で出力してください（JSONのみ、説明不要）:
{
  "body": "統合された回答本文",
  "structure": {
    "conclusion": "結論（1-2文）",
    "reasons": ["理由1", "理由2"],
    "steps": ["手順1", "手順2"],
    "warnings": ["注意点1"],
    "nextActions": ["次にやること1"]
  },
  "contributions": [
    {"answerId": "回答ID", "contributionType": "main" | "supplement" | "minority"}
  ]
}

contributionType:
- main: 統合回答の主要部分を構成
- supplement: 補足情報として採用
- minority: 少数意見として言及`;

      const result = await this.generateJSON<MergedAnswer>(prompt);
      
      return {
        body: result.body ?? input.answers.map(a => a.body).join('\n\n'),
        structure: {
          conclusion: result.structure?.conclusion ?? '',
          reasons: result.structure?.reasons ?? [],
          steps: result.structure?.steps ?? [],
          warnings: result.structure?.warnings ?? [],
          nextActions: result.structure?.nextActions ?? [],
        },
        contributions: input.answers.map((a, i) => ({
          answerId: a.id,
          contributionType: result.contributions?.[i]?.contributionType ?? 'main',
        })),
      };
    } catch (error) {
      console.warn('Gemini mergeAnswers failed, using mock fallback:', error);
      return this.mockFallback.mergeAnswers(input);
    }
  }

  /**
   * コンテンツをモデレートする
   */
  async moderate(input: ModerationInput): Promise<ModerationResult> {
    // まずルールベースでPIIを検出（高速・確実）
    const piiResult = this.detectPII(input.body);
    
    // AIによる追加チェック
    const prompt = `以下の${input.type === 'question' ? '質問' : '回答'}をモデレートしてください。

テキスト:
${input.body}

以下のJSON形式で出力してください（JSONのみ、説明不要）:
{
  "isApproved": true | false,
  "flags": [
    {
      "type": "pii" | "harassment" | "dangerous" | "spam",
      "severity": "low" | "medium" | "high",
      "description": "問題の説明"
    }
  ],
  "requiresReview": true | false
}

判定基準:
- pii: 個人情報（メール、電話、住所、氏名など）
- harassment: 誹謗中傷、差別的表現
- dangerous: 危険な行為の推奨、違法行為
- spam: 宣伝、無関係な内容`;

    try {
      const aiResult = await this.generateJSON<ModerationResult>(prompt);
      
      // PIIとAI結果をマージ
      const allFlags = [...piiResult.flags, ...(aiResult.flags ?? [])];
      const isApproved = allFlags.length === 0;
      
      return {
        isApproved,
        flags: allFlags,
        sanitizedBody: piiResult.sanitizedBody,
        requiresReview: allFlags.some(f => f.severity === 'high') || aiResult.requiresReview,
      };
    } catch {
      // AIエラー時はPII検出結果のみ返す
      return piiResult;
    }
  }

  /**
   * PIIを検出してマスキングする（ルールベース）
   */
  private detectPII(text: string): ModerationResult {
    const flags: ModerationResult['flags'] = [];
    let sanitizedBody = text;

    // メールアドレス
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    if (emailRegex.test(text)) {
      flags.push({
        type: 'pii',
        severity: 'medium',
        description: 'メールアドレスが含まれています',
      });
      sanitizedBody = sanitizedBody.replace(emailRegex, '[メールアドレス]');
    }

    // 電話番号（日本形式）
    const phoneRegex = /(?:\d{2,4}-\d{2,4}-\d{4}|\d{10,11})/g;
    if (phoneRegex.test(text)) {
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
      requiresReview: false,
    };
  }

  /**
   * JSONを生成する共通メソッド
   */
  private async generateJSON<T>(prompt: string): Promise<T> {
    const model = this.client.getGenerativeModel({ 
      model: this.model,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // JSONをパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from response');
    }
    
    return JSON.parse(jsonMatch[0]) as T;
  }

  /**
   * レベルをバリデートする
   */
  private validateLevel(level: string | undefined): Level {
    if (level === 'beginner' || level === 'intermediate' || level === 'advanced') {
      return level;
    }
    return 'beginner';
  }
}
