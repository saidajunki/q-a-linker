import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logoutSchema } from '@/lib/validations/auth';
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = logoutSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { refreshToken } = result.data;

    // トークンを無効化（存在しなくてもエラーにしない）
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return successResponse({ message: 'ログアウトしました' });
  } catch (error) {
    console.error('Logout error:', error);
    return serverErrorResponse();
  }
}
