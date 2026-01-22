/**
 * スレッドAPI（作成・一覧）
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { createThreadSchema, threadQuerySchema } from '@/lib/validations/thread';
import { getAIService } from '@/lib/ai';
import { matchResponders } from '@/lib/matching';
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

/**
 * POST /api/threads - 質問を投稿
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
    const validation = createThreadSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { body: questionBody } = validation.data;

    // AIによる質問の構造化
    const aiService = getAIService();
    const structured = await aiService.structureQuestion({ body: questionBody });

    // モデレーション
    const moderation = await aiService.moderate({ body: questionBody, type: 'question' });
    const finalBody = moderation.sanitizedBody ?? questionBody;

    // トランザクションでスレッドとメッセージを作成
    const result = await prisma.$transaction(async (tx) => {
      // スレッド作成
      const thread = await tx.thread.create({
        data: {
          askerId: payload.sub,
          title: structured.suggestedTitle,
          status: 'open',
          category: structured.categories[0] ?? null,
          estimatedLevel: structured.estimatedLevel,
        },
      });

      // 質問メッセージ作成
      const message = await tx.message.create({
        data: {
          threadId: thread.id,
          senderId: payload.sub,
          type: 'question',
          body: finalBody,
          isOriginal: true,
        },
      });

      // AI成果物を保存
      const aiArtifact = await tx.aIArtifact.create({
        data: {
          threadId: thread.id,
          kind: 'question_structured',
          inputMessageIds: [message.id],
          outputJson: structured as object,
          model: 'mock',
        },
      });

      return { thread, message, aiArtifact };
    });

    // 回答者マッチング（非同期で実行）
    matchResponders({
      threadId: result.thread.id,
      categories: structured.categories,
      estimatedLevel: structured.estimatedLevel,
    }).catch((err) => console.error('Matching error:', err));

    return successResponse(
      {
        thread: {
          id: result.thread.id,
          askerId: result.thread.askerId,
          title: result.thread.title,
          status: result.thread.status,
          category: result.thread.category,
          estimatedLevel: result.thread.estimatedLevel,
          createdAt: result.thread.createdAt,
        },
        message: {
          id: result.message.id,
          threadId: result.message.threadId,
          senderId: result.message.senderId,
          type: result.message.type,
          body: result.message.body,
          isOriginal: result.message.isOriginal,
          createdAt: result.message.createdAt,
        },
        aiArtifact: {
          id: result.aiArtifact.id,
          kind: result.aiArtifact.kind,
          outputJson: result.aiArtifact.outputJson,
        },
      },
      201
    );
  } catch (error) {
    console.error('Thread creation error:', error);
    return serverErrorResponse();
  }
}

/**
 * GET /api/threads - スレッド一覧取得
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
    const queryValidation = threadQuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? 20,
      offset: searchParams.get('offset') ?? 0,
    });

    if (!queryValidation.success) {
      return validationErrorResponse(queryValidation.error);
    }

    const { status, limit, offset } = queryValidation.data;

    // スレッド取得（自分が質問者のスレッドのみ）
    const where = {
      askerId: payload.sub,
      ...(status && { status }),
    };

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.thread.count({ where }),
    ]);

    return successResponse({
      threads: threads.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        category: t.category,
        estimatedLevel: t.estimatedLevel,
        messageCount: t._count.messages,
        createdAt: t.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Thread list error:', error);
    return serverErrorResponse();
  }
}
