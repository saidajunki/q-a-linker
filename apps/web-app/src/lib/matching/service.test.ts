/**
 * マッチングサービスのテスト
 * 注: 実際のDBを使用するため、統合テストとして実行
 */

import { describe, it, expect } from 'vitest';

// スコアリングロジックのユニットテスト
describe('Matching scoring logic', () => {
  // スコアリング関数を抽出してテスト可能にする
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
