/**
 * ユーザープロフィールAPI
 * 仕様書: docs/specs/api.md
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { updateProfileSchema } from '@/lib/validations/user';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

/**
 * GET /api/users/me - 自分のプロフィール取得
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

    // ユーザー取得
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return notFoundResponse('ユーザーが見つかりません');
    }

    return successResponse({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return serverErrorResponse();
  }
}

/**
 * PATCH /api/users/me - 自分のプロフィール更新
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
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { name } = validation.data;

    // ユーザー更新
    const user = await prisma.user.update({
      where: { id: payload.sub },
      data: {
        ...(name && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return successResponse({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    return serverErrorResponse();
  }
}
