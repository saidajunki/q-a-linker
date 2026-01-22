import { NextRequest } from 'next/server';
import { verifyAccessToken, JWTPayload } from './jwt';
import { unauthorizedResponse } from '@/lib/api/response';

/**
 * リクエストからアクセストークンを取得する
 */
export function getAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * 認証を検証し、ペイロードを返す
 */
export async function authenticate(request: NextRequest): Promise<JWTPayload | null> {
  const token = getAccessToken(request);
  if (!token) {
    return null;
  }
  return verifyAccessToken(token);
}

/**
 * 認証が必要なAPIハンドラーをラップする
 */
export function withAuth<T>(
  handler: (request: NextRequest, user: JWTPayload) => Promise<T>
) {
  return async (request: NextRequest) => {
    const user = await authenticate(request);
    if (!user) {
      return unauthorizedResponse();
    }
    return handler(request, user);
  };
}
