# AI機能仕様

## 概要

QALinkerにおけるAIの役割は「仲介」に徹する。
AIは回答を生成せず、以下の機能のみを担う：

1. 質問の構造化
2. 回答の翻訳（初心者向け）
3. 複数回答の統合
4. モデレーション（安全フィルタ）

## 実装方針

### MVP段階

- **モック実装**：固定応答またはシンプルなルールベース
- **Gemini Flash**：コスト効率の良い本番実装（推奨）
- **切り替え可能**：環境変数 `AI_PROVIDER` で切り替え
  - `mock`: モック実装（開発・テスト用）
  - `gemini`: Google Gemini Flash（推奨・低コスト）
  - `openai`: OpenAI API
  - `claude`: Claude API

### 将来

- AWS Bedrock への移行
- 複数モデルの使い分け

---

## 1. 質問の構造化 (Question Structuring)

### 目的

質問者の曖昧な質問を、回答者がわかりやすい形に構造化する。

### 入力

```typescript
interface QuestionInput {
  body: string;  // 質問本文
}
```

### 出力

```typescript
interface QuestionStructured {
  categories: string[];        // カテゴリ候補（複数）
  estimatedLevel: Level;       // 想定レベル
  intent: string;              // 意図（知りたいこと）
  assumptions: string[];       // 前提/制約の推定
  missingInfo: string[];       // 不足情報（聞き返し候補）
  suggestedTitle: string;      // タイトル案
}

type Level = 'beginner' | 'intermediate' | 'advanced';
```

### モック実装

```typescript
function mockStructureQuestion(input: QuestionInput): QuestionStructured {
  return {
    categories: ['一般'],
    estimatedLevel: 'beginner',
    intent: input.body.slice(0, 50),
    assumptions: [],
    missingInfo: ['詳細な状況'],
    suggestedTitle: input.body.slice(0, 30) + '...',
  };
}
```

### OpenAI実装（将来）

```typescript
const prompt = `
以下の質問を構造化してください。

質問: ${input.body}

以下のJSON形式で出力してください：
{
  "categories": ["カテゴリ1", "カテゴリ2"],
  "estimatedLevel": "beginner" | "intermediate" | "advanced",
  "intent": "質問者が知りたいこと",
  "assumptions": ["推定される前提1", "推定される前提2"],
  "missingInfo": ["不足している情報1", "不足している情報2"],
  "suggestedTitle": "タイトル案"
}
`;
```

---

## 2. 回答の翻訳 (Answer Simplification)

### 目的

回答者の専門的な回答を、質問者のレベルに合わせて翻訳する。

### 入力

```typescript
interface AnswerInput {
  body: string;           // 回答本文
  targetLevel: Level;     // 質問者のレベル
  questionContext: string; // 質問の文脈
}
```

### 出力

```typescript
interface AnswerSimplified {
  simplifiedBody: string;  // 翻訳後の回答
  glossary: {              // 用語解説
    term: string;
    explanation: string;
  }[];
  warnings: string[];      // 注意事項（断定が危険な場合など）
}
```

### モック実装

```typescript
function mockSimplifyAnswer(input: AnswerInput): AnswerSimplified {
  return {
    simplifiedBody: `【初心者向け】${input.body}`,
    glossary: [],
    warnings: [],
  };
}
```

---

## 3. 複数回答の統合 (Answer Merging)

### 目的

複数の回答から共通点を抽出し、統合回答を生成する。

### 入力

```typescript
interface MergeInput {
  answers: {
    id: string;
    body: string;
    responderId: string;
  }[];
  questionContext: string;
  targetLevel: Level;
}
```

### 出力

```typescript
interface MergedAnswer {
  body: string;              // 統合回答本文
  structure: {
    conclusion: string;      // 結論
    reasons: string[];       // 理由（共通点）
    steps: string[];         // 手順/具体例
    warnings: string[];      // 注意点/例外
    nextActions: string[];   // 次に試すこと
  };
  contributions: {           // 各回答の貢献
    answerId: string;
    contributionType: 'main' | 'supplement' | 'minority';
  }[];
}
```

### モック実装

```typescript
function mockMergeAnswers(input: MergeInput): MergedAnswer {
  const bodies = input.answers.map(a => a.body).join('\n\n---\n\n');
  return {
    body: `【統合回答】\n\n${bodies}`,
    structure: {
      conclusion: '複数の回答をまとめました',
      reasons: [],
      steps: [],
      warnings: [],
      nextActions: [],
    },
    contributions: input.answers.map(a => ({
      answerId: a.id,
      contributionType: 'main' as const,
    })),
  };
}
```

---

## 4. モデレーション (Moderation)

### 目的

個人情報、誹謗中傷、危険表現を検出し、適切に処理する。

### 入力

```typescript
interface ModerationInput {
  body: string;
  type: 'question' | 'answer';
}
```

### 出力

```typescript
interface ModerationResult {
  isApproved: boolean;       // 承認可否
  flags: {
    type: 'pii' | 'harassment' | 'dangerous' | 'spam';
    severity: 'low' | 'medium' | 'high';
    description: string;
    position?: { start: number; end: number };
  }[];
  sanitizedBody?: string;    // サニタイズ後の本文（PIIマスキング等）
  requiresReview: boolean;   // 人間によるレビューが必要か
}
```

### モック実装

```typescript
function mockModerate(input: ModerationInput): ModerationResult {
  // 簡易的なPII検出
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\d{2,4}-\d{2,4}-\d{4}/g;
  
  const flags = [];
  let sanitizedBody = input.body;
  
  if (emailRegex.test(input.body)) {
    flags.push({
      type: 'pii' as const,
      severity: 'medium' as const,
      description: 'メールアドレスが含まれています',
    });
    sanitizedBody = sanitizedBody.replace(emailRegex, '[メールアドレス]');
  }
  
  if (phoneRegex.test(input.body)) {
    flags.push({
      type: 'pii' as const,
      severity: 'medium' as const,
      description: '電話番号が含まれています',
    });
    sanitizedBody = sanitizedBody.replace(phoneRegex, '[電話番号]');
  }
  
  return {
    isApproved: flags.length === 0,
    flags,
    sanitizedBody: flags.length > 0 ? sanitizedBody : undefined,
    requiresReview: flags.some(f => f.severity === 'high'),
  };
}
```

---

## 環境変数

```
AI_PROVIDER=gemini  # mock / gemini / openai / claude

# Google Gemini（推奨）
GOOGLE_AI_API_KEY=AIza...
GOOGLE_AI_MODEL=gemini-2.0-flash

# OpenAI（オプション）
OPENAI_API_KEY=sk-...

# Anthropic Claude（オプション）
ANTHROPIC_API_KEY=sk-ant-...
```

---

## インターフェース

```typescript
// AI サービスのインターフェース
interface AIService {
  structureQuestion(input: QuestionInput): Promise<QuestionStructured>;
  simplifyAnswer(input: AnswerInput): Promise<AnswerSimplified>;
  mergeAnswers(input: MergeInput): Promise<MergedAnswer>;
  moderate(input: ModerationInput): Promise<ModerationResult>;
}

// ファクトリ関数
function createAIService(provider: 'mock' | 'openai' | 'claude'): AIService {
  switch (provider) {
    case 'mock':
      return new MockAIService();
    case 'openai':
      return new OpenAIService();
    case 'claude':
      return new ClaudeAIService();
  }
}
```

---

## 設計判断の指針

1. **AIは「仲介」に徹する**: AIが回答を生成する機能は実装しない
2. **モック優先**: まずモックで動作確認し、後からAI実装を追加
3. **切り替え可能**: 環境変数でプロバイダーを切り替えられる設計
4. **エラーハンドリング**: AI APIのエラー時はモックにフォールバック
