/**
 * 通報API
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { createReportSchema } from '@/lib/validations/report';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

/**
 * POST /api/reports - 通報を送信
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
    const validation = createReportSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { threadId, messageId, reason, description } = validation.data;

    // スレッド存在確認
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return notFoundResponse('スレッドが見つかりません');
    }

    // メッセージ存在確認（指定された場合）
    if (messageId) {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message || message.threadId !== threadId) {
        return notFoundResponse('メッセージが見つかりません');
      }
    }

    // 通報を作成
    const report = await prisma.report.create({
      data: {
        threadId,
        messageId: messageId ?? null,
        reporterId: payload.sub,
        reason,
        description: description ?? null,
        status: 'pending',
      },
    });

    return successResponse(
      {
        report: {
          id: report.id,
          status: report.status,
          createdAt: report.createdAt,
        },
      },
      201
    );
  } catch (error) {
    console.error('Report creation error:', error);
    return serverErrorResponse();
  }
}
