import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { refreshSchema } from '@/lib/validations/auth';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = refreshSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { refreshToken: token } = result.data;

    // トークンを検証
    const payload = await verifyRefreshToken(token);
    if (!payload) {
      return unauthorizedResponse('無効なリフレッシュトークンです');
    }

    // DBでトークンを確認
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return unauthorizedResponse('無効なリフレッシュトークンです');
    }

    // 古いトークンを無効化
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // 新しいトークンを生成
    const accessToken = await generateAccessToken({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    const { token: newRefreshToken, expiresAt } = await generateRefreshToken(storedToken.user.id);

    // 新しいリフレッシュトークンをDBに保存
    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: newRefreshToken,
        expiresAt,
      },
    });

    return successResponse({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return serverErrorResponse();
  }
}
