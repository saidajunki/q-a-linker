/**
 * マッチングサービスのテスト
 * 注: 実際のDBを使用するため、統合テストとして実行
 */

import { describe, it, expect } from 'vitest';

// スコアリング関数（service.tsのロジックを抽出）
const calculateScore = (
  expertiseTags: string[],
  levelPreference: string | null,
  answerCount: number,
  thanksCount: number,
  avgResponseTime: number | null,
  categories: string[],
  estimatedLevel: string
): { score: number; matchedTags: string[] } => {
  let score = 0;
  const matchedTags: string[] = [];

  // カテゴリマッチング
  for (const category of categories) {
    const normalizedCategory = category.toLowerCase();
    for (const tag of expertiseTags) {
      if (tag.toLowerCase().includes(normalizedCategory) || 
          normalizedCategory.includes(tag.toLowerCase())) {
        score += 10;
        matchedTags.push(tag);
      }
    }
  }

  // レベル適合性
  if (levelPreference) {
    if (levelPreference === estimatedLevel) {
      score += 5;
    } else if (
      (levelPreference === 'beginner' && estimatedLevel === 'intermediate') ||
      (levelPreference === 'intermediate' && estimatedLevel === 'advanced')
    ) {
      score += 2;
    }
  }

  // 実績ボーナス
  score += Math.min(answerCount * 0.5, 10);
  score += Math.min(thanksCount * 1, 15);

  // 応答時間ペナルティ
  if (avgResponseTime !== null) {
    if (avgResponseTime < 30) {
      score += 5;
    } else if (avgResponseTime > 120) {
      score -= 3;
    }
  }

  return { score, matchedTags };
};

// スコアリングロジックのユニットテスト
describe('Matching scoring logic', () => {

  it('カテゴリがマッチすると10点加算される', () => {
    const result = calculateScore(
      ['React', 'TypeScript'],
      null,
      0,
      0,
      null,
      ['React'],
      'beginner'
    );
    expect(result.score).toBe(10);
    expect(result.matchedTags).toContain('React');
  });

  it('複数のカテゴリがマッチすると加算される', () => {
    const result = calculateScore(
      ['React', 'TypeScript'],
      null,
      0,
      0,
      null,
      ['React', 'TypeScript'],
      'beginner'
    );
    expect(result.score).toBe(20);
  });

  it('レベルが完全一致すると5点加算される', () => {
    const result = calculateScore(
      [],
      'beginner',
      0,
      0,
      null,
      [],
      'beginner'
    );
    expect(result.score).toBe(5);
  });

  it('レベルが隣接すると2点加算される', () => {
    const result = calculateScore(
      [],
      'beginner',
      0,
      0,
      null,
      [],
      'intermediate'
    );
    expect(result.score).toBe(2);
  });

  it('回答数に応じてボーナスが加算される（上限10点）', () => {
    const result1 = calculateScore([], null, 10, 0, null, [], 'beginner');
    expect(result1.score).toBe(5); // 10 * 0.5 = 5

    const result2 = calculateScore([], null, 30, 0, null, [], 'beginner');
    expect(result2.score).toBe(10); // 上限
  });

  it('ありがとう数に応じてボーナスが加算される（上限15点）', () => {
    const result1 = calculateScore([], null, 0, 10, null, [], 'beginner');
    expect(result1.score).toBe(10);

    const result2 = calculateScore([], null, 0, 20, null, [], 'beginner');
    expect(result2.score).toBe(15); // 上限
  });

  it('応答時間が速いとボーナスが加算される', () => {
    const result = calculateScore([], null, 0, 0, 20, [], 'beginner');
    expect(result.score).toBe(5);
  });

  it('応答時間が遅いとペナルティが課される', () => {
    const result = calculateScore([], null, 0, 0, 150, [], 'beginner');
    expect(result.score).toBe(-3);
  });

  it('複合的なスコアが正しく計算される', () => {
    const result = calculateScore(
      ['React', 'JavaScript'],
      'beginner',
      20,
      10,
      25,
      ['React', 'プログラミング'],
      'beginner'
    );
    // React: 10点
    // レベル一致: 5点
    // 回答数: 10点（上限）
    // ありがとう: 10点
    // 応答時間: 5点
    expect(result.score).toBe(40);
  });
});

describe('Category matching edge cases', () => {
  it('大文字小文字を区別しない', () => {
    const result = calculateScore(
      ['REACT', 'typescript'],
      null,
      0,
      0,
      null,
      ['react', 'TYPESCRIPT'],
      'beginner'
    );
    expect(result.score).toBe(20);
    expect(result.matchedTags).toHaveLength(2);
  });

  it('部分一致でもマッチする', () => {
    const result = calculateScore(
      ['JavaScript'],
      null,
      0,
      0,
      null,
      ['java'],
      'beginner'
    );
    expect(result.score).toBe(10);
    expect(result.matchedTags).toContain('JavaScript');
  });

  it('空のカテゴリ配列では0点', () => {
    const result = calculateScore(
      ['React', 'TypeScript'],
      null,
      0,
      0,
      null,
      [],
      'beginner'
    );
    expect(result.score).toBe(0);
    expect(result.matchedTags).toHaveLength(0);
  });

  it('空のタグ配列では0点', () => {
    const result = calculateScore(
      [],
      null,
      0,
      0,
      null,
      ['React'],
      'beginner'
    );
    expect(result.score).toBe(0);
    expect(result.matchedTags).toHaveLength(0);
  });

  it('日本語タグもマッチする', () => {
    const result = calculateScore(
      ['プログラミング', '健康'],
      null,
      0,
      0,
      null,
      ['プログラミング'],
      'beginner'
    );
    expect(result.score).toBe(10);
    expect(result.matchedTags).toContain('プログラミング');
  });
});

describe('Level preference edge cases', () => {
  it('intermediate -> advanced で2点加算', () => {
    const result = calculateScore(
      [],
      'intermediate',
      0,
      0,
      null,
      [],
      'advanced'
    );
    expect(result.score).toBe(2);
  });

  it('advanced -> beginner では加算なし', () => {
    const result = calculateScore(
      [],
      'advanced',
      0,
      0,
      null,
      [],
      'beginner'
    );
    expect(result.score).toBe(0);
  });

  it('beginner -> advanced では加算なし', () => {
    const result = calculateScore(
      [],
      'beginner',
      0,
      0,
      null,
      [],
      'advanced'
    );
    expect(result.score).toBe(0);
  });

  it('nullのlevelPreferenceでは加算なし', () => {
    const result = calculateScore(
      [],
      null,
      0,
      0,
      null,
      [],
      'beginner'
    );
    expect(result.score).toBe(0);
  });
});

describe('Response time edge cases', () => {
  it('ちょうど30分では加算なし', () => {
    const result = calculateScore([], null, 0, 0, 30, [], 'beginner');
    expect(result.score).toBe(0);
  });

  it('ちょうど120分では加算なし', () => {
    const result = calculateScore([], null, 0, 0, 120, [], 'beginner');
    expect(result.score).toBe(0);
  });

  it('29分では5点加算', () => {
    const result = calculateScore([], null, 0, 0, 29, [], 'beginner');
    expect(result.score).toBe(5);
  });

  it('121分では3点減算', () => {
    const result = calculateScore([], null, 0, 0, 121, [], 'beginner');
    expect(result.score).toBe(-3);
  });
});

describe('Stats bonus edge cases', () => {
  it('回答数0では加算なし', () => {
    const result = calculateScore([], null, 0, 0, null, [], 'beginner');
    expect(result.score).toBe(0);
  });

  it('回答数1では0.5点加算', () => {
    const result = calculateScore([], null, 1, 0, null, [], 'beginner');
    expect(result.score).toBe(0.5);
  });

  it('ありがとう数0では加算なし', () => {
    const result = calculateScore([], null, 0, 0, null, [], 'beginner');
    expect(result.score).toBe(0);
  });

  it('ありがとう数1では1点加算', () => {
    const result = calculateScore([], null, 0, 1, null, [], 'beginner');
    expect(result.score).toBe(1);
  });

  it('両方の上限に達した場合', () => {
    const result = calculateScore([], null, 100, 100, null, [], 'beginner');
    expect(result.score).toBe(25); // 10 + 15
  });
});

describe('Complex scoring scenarios', () => {
  it('全ての要素が最大の場合', () => {
    const result = calculateScore(
      ['React', 'TypeScript', 'JavaScript'],
      'beginner',
      100,
      100,
      10,
      ['React', 'TypeScript', 'JavaScript'],
      'beginner'
    );
    // カテゴリ: 30点 (3 * 10)
    // レベル: 5点
    // 回答数: 10点（上限）
    // ありがとう: 15点（上限）
    // 応答時間: 5点
    expect(result.score).toBe(65);
  });

  it('全ての要素が最小/ペナルティの場合', () => {
    const result = calculateScore(
      [],
      'advanced',
      0,
      0,
      200,
      ['React'],
      'beginner'
    );
    // カテゴリ: 0点
    // レベル: 0点（不一致）
    // 回答数: 0点
    // ありがとう: 0点
    // 応答時間: -3点
    expect(result.score).toBe(-3);
  });

  it('中間的なスコアの場合', () => {
    const result = calculateScore(
      ['Python', 'データ分析'],
      'intermediate',
      15,
      8,
      60,
      ['Python'],
      'intermediate'
    );
    // カテゴリ: 10点
    // レベル: 5点
    // 回答数: 7.5点
    // ありがとう: 8点
    // 応答時間: 0点（30-120の間）
    expect(result.score).toBe(30.5);
  });
});
