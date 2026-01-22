/**
 * 回答者プロフィールAPI
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { updateResponderProfileSchema } from '@/lib/validations/user';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

/**
 * GET /api/users/me/responder-profile - 回答者プロフィール取得
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

    // 回答者プロフィール取得
    const profile = await prisma.responderProfile.findUnique({
      where: { userId: payload.sub },
    });

    if (!profile) {
      // プロフィールがない場合は空のレスポンス
      return successResponse({
        responderProfile: null,
      });
    }

    return successResponse({
      responderProfile: {
        id: profile.id,
        expertiseTags: profile.expertiseTags,
        levelPreference: profile.levelPreference,
        answerCount: profile.answerCount,
        thanksCount: profile.thanksCount,
        avgResponseTime: profile.avgResponseTime,
        createdAt: profile.createdAt,
      },
    });
  } catch (error) {
    console.error('Get responder profile error:', error);
    return serverErrorResponse();
  }
}

/**
 * PATCH /api/users/me/responder-profile - 回答者プロフィール更新
 */
export async function PATCH(request: NextRequest) {
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
    const validation = updateResponderProfileSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { expertiseTags, levelPreference } = validation.data;

    // 回答者プロフィールをupsert
    const profile = await prisma.responderProfile.upsert({
      where: { userId: payload.sub },
      update: {
        ...(expertiseTags !== undefined && { expertiseTags }),
        ...(levelPreference !== undefined && { levelPreference }),
      },
      create: {
        userId: payload.sub,
        expertiseTags: expertiseTags ?? [],
        levelPreference: levelPreference ?? null,
      },
    });

    return successResponse({
      responderProfile: {
        id: profile.id,
        expertiseTags: profile.expertiseTags,
        levelPreference: profile.levelPreference,
        answerCount: profile.answerCount,
        thanksCount: profile.thanksCount,
        avgResponseTime: profile.avgResponseTime,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update responder profile error:', error);
    return serverErrorResponse();
  }
}
