import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-in-production'
);

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * アクセストークンを生成する
 */
export async function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const expiresIn = parseExpiresIn(ACCESS_TOKEN_EXPIRES_IN);
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

/**
 * リフレッシュトークンを生成する
 */
export async function generateRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const expiresIn = parseExpiresIn(REFRESH_TOKEN_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + parseExpiresInMs(REFRESH_TOKEN_EXPIRES_IN));
  
  const token = await new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
  
  return { token, expiresAt };
}

/**
 * アクセストークンを検証する
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * リフレッシュトークンを検証する
 */
export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'refresh') return null;
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

/**
 * 有効期限文字列をパースする（jose用）
 */
function parseExpiresIn(expiresIn: string): string {
  // jose は "15m", "7d" などの形式をそのまま受け付ける
  return expiresIn;
}

/**
 * 有効期限文字列をミリ秒に変換する
 */
function parseExpiresInMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // デフォルト15分
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}
