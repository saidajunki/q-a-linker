import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validations/auth';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { email, password } = result.data;

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse(
        'Bad Request',
        'メールアドレスまたはパスワードが正しくありません',
        400
      );
    }

    // パスワードを検証
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return errorResponse(
        'Bad Request',
        'メールアドレスまたはパスワードが正しくありません',
        400
      );
    }

    // トークンを生成
    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: refreshToken, expiresAt } = await generateRefreshToken(user.id);

    // リフレッシュトークンをDBに保存
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return serverErrorResponse();
  }
}
