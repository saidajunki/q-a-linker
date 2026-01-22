/**
 * 回答者受信箱API
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { inboxQuerySchema } from '@/lib/validations/responder';
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

/**
 * GET /api/responder/inbox - 割り当てられた質問一覧
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

    // クエリパラメータの検証
    const { searchParams } = new URL(request.url);
    const queryValidation = inboxQuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? 20,
      offset: searchParams.get('offset') ?? 0,
    });

    if (!queryValidation.success) {
      return validationErrorResponse(queryValidation.error);
    }

    const { status, limit, offset } = queryValidation.data;

    // アサインメント取得
    const where = {
      responderId: payload.sub,
      ...(status && { status }),
    };

    const [assignments, total] = await Promise.all([
      prisma.threadAssignment.findMany({
        where,
        orderBy: { notifiedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          thread: {
            select: {
              id: true,
              title: true,
              category: true,
              estimatedLevel: true,
            },
          },
        },
      }),
      prisma.threadAssignment.count({ where }),
    ]);

    return successResponse({
      assignments: assignments.map((a) => ({
        id: a.id,
        thread: {
          id: a.thread.id,
          title: a.thread.title,
          category: a.thread.category,
          estimatedLevel: a.thread.estimatedLevel,
        },
        status: a.status,
        notifiedAt: a.notifiedAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Inbox list error:', error);
    return serverErrorResponse();
  }
}
