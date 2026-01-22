/**
 * 全通知既読API
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
 * POST /api/notifications/read-all - 全通知を既読にする
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

    // 全て既読に更新
    const result = await prisma.notification.updateMany({
      where: { userId: payload.sub, isRead: false },
      data: { isRead: true },
    });

    return successResponse({
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Notification read-all error:', error);
    return serverErrorResponse();
  }
}
