/**
 * スレッドクローズAPI
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/threads/:id/close - スレッドをクローズ
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // スレッド取得
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread) {
      return notFoundResponse('スレッドが見つかりません');
    }

    // 質問者のみクローズ可能
    if (thread.askerId !== payload.sub) {
      return forbiddenResponse();
    }

    // クローズに更新
    const updated = await prisma.thread.update({
      where: { id },
      data: { status: 'closed' },
    });

    return successResponse({
      thread: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Thread close error:', error);
    return serverErrorResponse();
  }
}
