import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { signupSchema } from '@/lib/validations/auth';
import {
  successResponse,
  validationErrorResponse,
  conflictResponse,
  serverErrorResponse,
} from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { email, password, name } = result.data;

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return conflictResponse('このメールアドレスは既に登録されています');
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password);

    // ユーザーを作成（全員userロール）
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'user',
      },
    });

    // 全ユーザーにResponderProfileを作成（質問も回答も可能にするため）
    await prisma.responderProfile.create({
      data: {
        userId: user.id,
        expertiseTags: [],
      },
    });

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

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    console.error('Signup error:', error);
    return serverErrorResponse();
  }
}
