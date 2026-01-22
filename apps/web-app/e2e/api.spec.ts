import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8070/api';

// テスト用のユニークなメールアドレスを生成
const generateEmail = () => `api-test-${Date.now()}@example.com`;

test.describe('認証API', () => {
  test('POST /api/auth/signup - 新規登録', async ({ request }) => {
    const email = generateEmail();
    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email,
        password: 'TestPassword123',
        name: 'APIテストユーザー',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(email);
    expect(data.user.role).toBe('user');
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
  });

  test('POST /api/auth/signup - 重複メールアドレスでエラー', async ({ request }) => {
    const email = generateEmail();

    // 1回目の登録
    await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email,
        password: 'TestPassword123',
        name: 'ユーザー1',
      },
    });

    // 2回目の登録（重複）
    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email,
        password: 'TestPassword123',
        name: 'ユーザー2',
      },
    });

    expect(response.status()).toBe(409);
  });

  test('POST /api/auth/login - ログイン', async ({ request }) => {
    const email = generateEmail();
    const password = 'TestPassword123';

    // 先に登録
    const signupRes = await request.post(`${API_BASE}/auth/signup`, {
      data: { email, password, name: 'ログインテスト' },
    });
    expect(signupRes.status()).toBe(201);

    // ログイン
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
  });

  test('GET /api/auth/me - 認証済みユーザー情報取得', async ({ request }) => {
    const email = generateEmail();

    // 登録してトークン取得
    const signupRes = await request.post(`${API_BASE}/auth/signup`, {
      data: { email, password: 'TestPassword123', name: 'Meテスト' },
    });
    const { accessToken } = await signupRes.json();

    // ユーザー情報取得
    const response = await request.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.user.email).toBe(email);
  });

  test('GET /api/auth/me - 未認証でエラー', async ({ request }) => {
    const response = await request.get(`${API_BASE}/auth/me`);
    expect(response.status()).toBe(401);
  });
});

test.describe('スレッドAPI', () => {
  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const email = generateEmail();
    const signupRes = await request.post(`${API_BASE}/auth/signup`, {
      data: { email, password: 'TestPassword123', name: 'スレッドテスト' },
    });
    const data = await signupRes.json();
    accessToken = data.accessToken;
  });

  test('POST /api/threads - 質問投稿', async ({ request }) => {
    const response = await request.post(`${API_BASE}/threads`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { body: 'Reactでstateが更新されないのですが？' },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.thread).toBeDefined();
    expect(data.thread.status).toBe('open');
    expect(data.message).toBeDefined();
    expect(data.aiArtifact).toBeDefined();
    expect(data.aiArtifact.outputJson.categories).toContain('プログラミング');
  });

  test('GET /api/threads - 質問一覧取得', async ({ request }) => {
    // 先に質問を投稿
    await request.post(`${API_BASE}/threads`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { body: '一覧テスト用の質問' },
    });

    const response = await request.get(`${API_BASE}/threads`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.threads).toBeDefined();
    expect(data.threads.length).toBeGreaterThan(0);
  });

  test('GET /api/threads/:id - 質問詳細取得', async ({ request }) => {
    // 質問を投稿
    const createRes = await request.post(`${API_BASE}/threads`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { body: '詳細テスト用の質問' },
    });
    const { thread } = await createRes.json();

    // 詳細取得
    const response = await request.get(`${API_BASE}/threads/${thread.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.thread.id).toBe(thread.id);
    expect(data.messages).toBeDefined();
    expect(data.messages.length).toBeGreaterThan(0);
  });

  test('POST /api/threads/:id/close - スレッドクローズ', async ({ request }) => {
    // 質問を投稿
    const createRes = await request.post(`${API_BASE}/threads`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { body: 'クローズテスト用の質問' },
    });
    const { thread } = await createRes.json();

    // クローズ
    const response = await request.post(`${API_BASE}/threads/${thread.id}/close`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.thread.status).toBe('closed');
  });
});

test.describe('評価API', () => {
  test('POST /api/feedback - 評価送信（自分のメッセージにはエラー）', async ({ request }) => {
    const email = generateEmail();
    const signupRes = await request.post(`${API_BASE}/auth/signup`, {
      data: { email, password: 'TestPassword123', name: '評価テスト' },
    });
    const { accessToken } = await signupRes.json();

    // 質問を投稿
    const createRes = await request.post(`${API_BASE}/threads`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { body: '評価テスト用の質問' },
    });
    const { thread, message } = await createRes.json();

    // 自分のメッセージに評価（エラーになるはず）
    const response = await request.post(`${API_BASE}/feedback`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        threadId: thread.id,
        messageId: message.id,
        kind: 'thanks',
      },
    });

    expect(response.status()).toBe(403);
  });
});

test.describe('通報API', () => {
  test('POST /api/reports - 通報送信', async ({ request }) => {
    const email = generateEmail();
    const signupRes = await request.post(`${API_BASE}/auth/signup`, {
      data: { email, password: 'TestPassword123', name: '通報テスト' },
    });
    const { accessToken } = await signupRes.json();

    // 質問を投稿
    const createRes = await request.post(`${API_BASE}/threads`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { body: '通報テスト用の質問' },
    });
    const { thread } = await createRes.json();

    // 通報
    const response = await request.post(`${API_BASE}/reports`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        threadId: thread.id,
        reason: 'spam',
        description: 'テスト通報',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.report.status).toBe('pending');
  });
});
