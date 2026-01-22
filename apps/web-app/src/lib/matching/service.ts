/**
 * 回答者マッチングサービス
 * 仕様書: docs/specs/api.md (マッチング要件)
 */

import { prisma } from '@/lib/prisma';
import type { MatchingInput, MatchingResult, ResponderCandidate } from './types';

// 同時に通知する回答者の最大数
const MAX_RESPONDERS = 5;

/**
 * 質問に対して適切な回答者をマッチングし、アサインメントを作成する
 */
export async function matchResponders(input: MatchingInput): Promise<MatchingResult> {
  const { threadId, categories, estimatedLevel } = input;

  // 回答者プロフィールを持つユーザーを取得
  const responderProfiles = await prisma.responderProfile.findMany({
    include: {
      user: {
        select: { id: true, role: true },
      },
    },
  });

  // スコアリング
  const candidates: ResponderCandidate[] = responderProfiles
    .filter((profile) => profile.user.role === 'responder' || profile.user.role === 'admin')
    .map((profile) => {
      let score = 0;
      const matchedTags: string[] = [];

      // カテゴリマッチング（タグとの一致）
      for (const category of categories) {
        const normalizedCategory = category.toLowerCase();
        for (const tag of profile.expertiseTags) {
          if (tag.toLowerCase().includes(normalizedCategory) || 
              normalizedCategory.includes(tag.toLowerCase())) {
            score += 10;
            matchedTags.push(tag);
          }
        }
      }

      // レベル適合性
      if (profile.levelPreference) {
        if (profile.levelPreference === estimatedLevel) {
          score += 5;
        } else if (
          (profile.levelPreference === 'beginner' && estimatedLevel === 'intermediate') ||
          (profile.levelPreference === 'intermediate' && estimatedLevel === 'advanced')
        ) {
          score += 2;
        }
      }

      // 実績ボーナス
      score += Math.min(profile.answerCount * 0.5, 10);
      score += Math.min(profile.thanksCount * 1, 15);

      // 応答時間ペナルティ（遅い人は優先度下げる）
      if (profile.avgResponseTime) {
        if (profile.avgResponseTime < 30) {
          score += 5;
        } else if (profile.avgResponseTime > 120) {
          score -= 3;
        }
      }

      return {
        userId: profile.userId,
        score,
        matchedTags,
      };
    })
    .filter((c) => c.score > 0 || c.matchedTags.length === 0) // スコア0でもタグなしなら候補に
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESPONDERS);

  // タグマッチがない場合は全回答者から上位を選択
  if (candidates.length === 0) {
    const fallbackCandidates = responderProfiles
      .filter((profile) => profile.user.role === 'responder' || profile.user.role === 'admin')
      .map((profile) => ({
        userId: profile.userId,
        score: profile.answerCount * 0.5 + profile.thanksCount * 1,
        matchedTags: [] as string[],
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESPONDERS);
    
    candidates.push(...fallbackCandidates);
  }

  // アサインメント作成
  const assignments = await Promise.all(
    candidates.map((candidate) =>
      prisma.threadAssignment.create({
        data: {
          threadId,
          responderId: candidate.userId,
          status: 'notified',
        },
      }).catch(() => null) // 重複エラーは無視
    )
  );

  const assignedCount = assignments.filter(Boolean).length;

  // 通知作成
  await Promise.all(
    candidates.map((candidate) =>
      prisma.notification.create({
        data: {
          userId: candidate.userId,
          threadId,
          type: 'new_question',
          title: '新しい質問が届きました',
          body: `あなたの得意分野に関する質問が投稿されました${candidate.matchedTags.length > 0 ? `（${candidate.matchedTags.join(', ')}）` : ''}`,
        },
      }).catch(() => null)
    )
  );

  return {
    candidates,
    assignedCount,
  };
}

/**
 * 回答者プロフィールの統計を更新する
 */
export async function updateResponderStats(userId: string): Promise<void> {
  // 回答数を集計
  const answerCount = await prisma.message.count({
    where: {
      senderId: userId,
      type: 'answer',
      isOriginal: true,
    },
  });

  // ありがとう数を集計
  const thanksCount = await prisma.feedback.count({
    where: {
      toUserId: userId,
      kind: 'thanks',
    },
  });

  // 平均応答時間を計算
  const assignments = await prisma.threadAssignment.findMany({
    where: {
      responderId: userId,
      status: 'answered',
      answeredAt: { not: null },
    },
    select: {
      notifiedAt: true,
      answeredAt: true,
    },
  });

  let avgResponseTime: number | null = null;
  if (assignments.length > 0) {
    const totalMinutes = assignments.reduce((sum, a) => {
      if (a.answeredAt) {
        return sum + (a.answeredAt.getTime() - a.notifiedAt.getTime()) / 60000;
      }
      return sum;
    }, 0);
    avgResponseTime = Math.round(totalMinutes / assignments.length);
  }

  // プロフィール更新
  await prisma.responderProfile.updateMany({
    where: { userId },
    data: {
      answerCount,
      thanksCount,
      avgResponseTime,
    },
  });
}
