/**
 * 質問辞退API
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
  params: Promise<{ assignmentId: string }>;
}

/**
 * POST /api/responder/inbox/:assignmentId/decline - 質問を辞退する
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { assignmentId } = await params;

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

    // アサインメント取得
    const assignment = await prisma.threadAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return notFoundResponse('アサインメントが見つかりません');
    }

    // 権限チェック
    if (assignment.responderId !== payload.sub) {
      return forbiddenResponse();
    }

    // 辞退に更新
    const updated = await prisma.threadAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'declined',
      },
    });

    return successResponse({
      assignment: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('Decline assignment error:', error);
    return serverErrorResponse();
  }
}
