/**
 * 通知API
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response';

/**
 * GET /api/notifications - 通知一覧取得
 */
export async function GET(request: NextRequest) {
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

    // クエリパラメータ
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // 通知取得
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: payload.sub },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: { userId: payload.sub } }),
      prisma.notification.count({ where: { userId: payload.sub, isRead: false } }),
    ]);

    return successResponse({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        threadId: n.threadId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      total,
      unreadCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Notification list error:', error);
    return serverErrorResponse();
  }
}
