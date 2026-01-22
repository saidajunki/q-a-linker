/**
 * 評価API
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { createFeedbackSchema } from '@/lib/validations/feedback';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse,
  serverErrorResponse,
} from '@/lib/api/response';

/**
 * POST /api/feedback - 評価を送信
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorizedResponse();
    }

    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return unauthorizedResponse('無効なトークンです');
    }

    // リクエストボディの検証
    const body = await request.json();
    const validation = createFeedbackSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { threadId, messageId, kind } = validation.data;

    // スレッド存在確認
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return notFoundResponse('スレッドが見つかりません');
    }

    // 質問者のみ評価可能
    if (thread.askerId !== payload.sub) {
      return forbiddenResponse('質問者のみ評価できます');
    }

    // メッセージ存在確認
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.threadId !== threadId) {
      return notFoundResponse('メッセージが見つかりません');
    }

    // 自分のメッセージには評価できない
    if (message.senderId === payload.sub) {
      return forbiddenResponse('自分のメッセージには評価できません');
    }

    // 重複チェック
    const existing = await prisma.feedback.findUnique({
      where: {
        threadId_messageId_fromUserId: {
          threadId,
          messageId,
          fromUserId: payload.sub,
        },
      },
    });

    if (existing) {
      return conflictResponse('既に評価済みです');
    }

    // 評価を作成
    const feedback = await prisma.feedback.create({
      data: {
        threadId,
        messageId,
        fromUserId: payload.sub,
        toUserId: message.senderId,
        kind,
      },
    });

    // 回答者のthanksCountを更新（thanksの場合）
    if (kind === 'thanks') {
      await prisma.responderProfile.updateMany({
        where: { userId: message.senderId },
        data: { thanksCount: { increment: 1 } },
      });
    }

    return successResponse(
      {
        feedback: {
          id: feedback.id,
          threadId: feedback.threadId,
          messageId: feedback.messageId,
          kind: feedback.kind,
          createdAt: feedback.createdAt,
        },
      },
      201
    );
  } catch (error) {
    console.error('Feedback creation error:', error);
    return serverErrorResponse();
  }
}
