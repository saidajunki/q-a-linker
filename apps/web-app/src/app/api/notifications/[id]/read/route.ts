/**
 * 通知既読API
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
 * POST /api/notifications/:id/read - 通知を既読にする
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

    // 通知取得
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return notFoundResponse('通知が見つかりません');
    }

    // 権限チェック
    if (notification.userId !== payload.sub) {
      return forbiddenResponse();
    }

    // 既読に更新
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return successResponse({
      notification: {
        id: updated.id,
        isRead: updated.isRead,
      },
    });
  } catch (error) {
    console.error('Notification read error:', error);
    return serverErrorResponse();
  }
}
