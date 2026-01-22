/**
 * メッセージAPI（投稿・一覧）
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { createMessageSchema } from '@/lib/validations/thread';
import { getAIService } from '@/lib/ai';
import { updateResponderStats } from '@/lib/matching';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/threads/:id/messages - 回答を投稿
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: threadId } = await params;

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
    const validation = createMessageSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { body: answerBody } = validation.data;

    // スレッド取得
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return notFoundResponse('スレッドが見つかりません');
    }

    // 回答者としてのアクセス権チェック
    const assignment = await prisma.threadAssignment.findFirst({
      where: { threadId, responderId: payload.sub },
    });

    // 質問者は追加質問可能、回答者は回答可能
    const isAsker = thread.askerId === payload.sub;
    const isAssignedResponder = !!assignment;

    if (!isAsker && !isAssignedResponder) {
      return forbiddenResponse();
    }

    const aiService = getAIService();

    // モデレーション
    const moderation = await aiService.moderate({ body: answerBody, type: 'answer' });
    const finalBody = moderation.sanitizedBody ?? answerBody;

    // メッセージタイプを決定
    const messageType = isAsker ? 'question' : 'answer';

    // トランザクションでメッセージを作成
    const result = await prisma.$transaction(async (tx) => {
      // メッセージ作成
      const message = await tx.message.create({
        data: {
          threadId,
          senderId: payload.sub,
          type: messageType,
          body: finalBody,
          isOriginal: true,
        },
      });

      // 回答の場合、初心者向け翻訳を作成
      let simplifiedMessage = null;
      if (messageType === 'answer' && thread.estimatedLevel) {
        const simplified = await aiService.simplifyAnswer({
          body: finalBody,
          targetLevel: thread.estimatedLevel,
          questionContext: thread.title ?? '',
        });

        simplifiedMessage = await tx.message.create({
          data: {
            threadId,
            senderId: payload.sub,
            type: 'answer',
            body: simplified.simplifiedBody,
            isOriginal: false,
            originalMessageId: message.id,
          },
        });

        // AI成果物を保存
        await tx.aIArtifact.create({
          data: {
            threadId,
            kind: 'answer_simplified',
            inputMessageIds: [message.id],
            outputJson: simplified as object,
            model: 'mock',
          },
        });
      }

      // 回答者のアサインメントを更新
      if (assignment) {
        await tx.threadAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'answered',
            answeredAt: new Date(),
          },
        });
      }

      // スレッドのステータスを更新
      if (messageType === 'answer' && thread.status === 'open') {
        await tx.thread.update({
          where: { id: threadId },
          data: { status: 'answering' },
        });
      }

      return { message, simplifiedMessage };
    });

    // 統合回答の生成をチェック（回答が2件以上の場合）
    const answerCount = await prisma.message.count({
      where: { threadId, type: 'answer', isOriginal: true },
    });

    if (answerCount >= 2) {
      // 非同期で統合回答を生成（バックグラウンド処理）
      generateMergedAnswer(threadId).catch(console.error);
    }

    // 回答者の統計を更新（非同期）
    if (messageType === 'answer') {
      updateResponderStats(payload.sub).catch(console.error);
    }

    return successResponse(
      {
        message: {
          id: result.message.id,
          threadId: result.message.threadId,
          senderId: result.message.senderId,
          type: result.message.type,
          body: result.message.body,
          isOriginal: result.message.isOriginal,
          createdAt: result.message.createdAt,
        },
        simplifiedMessage: result.simplifiedMessage
          ? {
              id: result.simplifiedMessage.id,
              threadId: result.simplifiedMessage.threadId,
              type: result.simplifiedMessage.type,
              body: result.simplifiedMessage.body,
              isOriginal: result.simplifiedMessage.isOriginal,
              originalMessageId: result.simplifiedMessage.originalMessageId,
              createdAt: result.simplifiedMessage.createdAt,
            }
          : null,
      },
      201
    );
  } catch (error) {
    console.error('Message creation error:', error);
    return serverErrorResponse();
  }
}

/**
 * GET /api/threads/:id/messages - メッセージ一覧取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: threadId } = await params;

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
      where: { id: threadId },
    });

    if (!thread) {
      return notFoundResponse('スレッドが見つかりません');
    }

    // アクセス権チェック
    const isAsker = thread.askerId === payload.sub;
    const hasAssignment = await prisma.threadAssignment.findFirst({
      where: { threadId, responderId: payload.sub },
    });

    if (!isAsker && !hasAssignment) {
      return forbiddenResponse();
    }

    // メッセージ取得
    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse({
      messages: messages.map((m) => ({
        id: m.id,
        type: m.type,
        body: m.body,
        sender: m.sender,
        isOriginal: m.isOriginal,
        originalMessageId: m.originalMessageId,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Message list error:', error);
    return serverErrorResponse();
  }
}

/**
 * 統合回答を生成する（バックグラウンド処理）
 */
async function generateMergedAnswer(threadId: string) {
  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          where: { type: 'answer', isOriginal: true },
          include: { sender: true },
        },
      },
    });

    if (!thread || thread.messages.length < 2) return;

    const aiService = getAIService();
    const merged = await aiService.mergeAnswers({
      answers: thread.messages.map((m) => ({
        id: m.id,
        body: m.body,
        responderId: m.senderId,
      })),
      questionContext: thread.title ?? '',
      targetLevel: thread.estimatedLevel ?? 'beginner',
    });

    // システムユーザーとして統合回答を作成
    // 注: 実際の実装ではシステムユーザーIDを環境変数等で管理
    const systemUser = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!systemUser) {
      console.warn('System user not found, skipping merged answer creation');
      return;
    }

    await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          threadId,
          senderId: systemUser.id,
          type: 'merged_answer',
          body: merged.body,
          isOriginal: false,
        },
      });

      await tx.aIArtifact.create({
        data: {
          threadId,
          kind: 'merged_answer',
          inputMessageIds: thread.messages.map((m) => m.id),
          outputJson: merged as object,
          model: 'mock',
        },
      });

      await tx.thread.update({
        where: { id: threadId },
        data: { status: 'answered' },
      });

      return message;
    });
  } catch (error) {
    console.error('Merged answer generation error:', error);
  }
}
