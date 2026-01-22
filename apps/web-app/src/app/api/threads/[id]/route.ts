/**
 * スレッド詳細API
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
 * GET /api/threads/:id - スレッド詳細取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        },
        aiArtifacts: {
          where: { kind: 'merged_answer' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!thread) {
      return notFoundResponse('スレッドが見つかりません');
    }

    // アクセス権チェック（質問者または回答者のみ）
    const isAsker = thread.askerId === payload.sub;
    const isResponder = thread.messages.some(
      (m) => m.senderId === payload.sub && m.type === 'answer'
    );
    const hasAssignment = await prisma.threadAssignment.findFirst({
      where: { threadId: id, responderId: payload.sub },
    });

    if (!isAsker && !isResponder && !hasAssignment) {
      return forbiddenResponse();
    }

    // 統合回答を取得
    const mergedAnswerMessage = thread.messages.find((m) => m.type === 'merged_answer');

    return successResponse({
      thread: {
        id: thread.id,
        askerId: thread.askerId,
        title: thread.title,
        status: thread.status,
        category: thread.category,
        estimatedLevel: thread.estimatedLevel,
        createdAt: thread.createdAt,
      },
      messages: thread.messages.map((m) => ({
        id: m.id,
        type: m.type,
        body: m.body,
        sender: m.sender,
        isOriginal: m.isOriginal,
        createdAt: m.createdAt,
      })),
      mergedAnswer: mergedAnswerMessage
        ? {
            id: mergedAnswerMessage.id,
            body: mergedAnswerMessage.body,
            createdAt: mergedAnswerMessage.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Thread detail error:', error);
    return serverErrorResponse();
  }
}

/**
 * PATCH /api/threads/:id - スレッド更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // 質問者のみ更新可能
    if (thread.askerId !== payload.sub) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { title, status } = body;

    const updated = await prisma.thread.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(status && { status }),
      },
    });

    return successResponse({
      thread: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Thread update error:', error);
    return serverErrorResponse();
  }
}
