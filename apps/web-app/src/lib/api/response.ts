import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * 成功レスポンスを返す
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * エラーレスポンスを返す
 */
export function errorResponse(
  error: string,
  message: string,
  status: number,
  details?: { field: string; message: string }[]
) {
  const body: { error: string; message: string; details?: typeof details } = {
    error,
    message,
  };
  
  if (details) {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}

/**
 * バリデーションエラーレスポンスを返す
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validationErrorResponse(error: ZodError<any>) {
  const details = error.issues.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return errorResponse('Bad Request', 'リクエストが不正です', 400, details);
}

/**
 * 認証エラーレスポンスを返す
 */
export function unauthorizedResponse(message: string = '認証が必要です') {
  return errorResponse('Unauthorized', message, 401);
}

/**
 * 権限エラーレスポンスを返す
 */
export function forbiddenResponse(message: string = 'アクセス権限がありません') {
  return errorResponse('Forbidden', message, 403);
}

/**
 * Not Foundレスポンスを返す
 */
export function notFoundResponse(message: string = 'リソースが見つかりません') {
  return errorResponse('Not Found', message, 404);
}

/**
 * コンフリクトレスポンスを返す
 */
export function conflictResponse(message: string) {
  return errorResponse('Conflict', message, 409);
}

/**
 * サーバーエラーレスポンスを返す
 */
export function serverErrorResponse(message: string = 'サーバーエラーが発生しました') {
  return errorResponse('Internal Server Error', message, 500);
}
