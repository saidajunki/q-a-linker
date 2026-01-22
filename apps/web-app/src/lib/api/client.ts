/**
 * APIクライアント
 */

const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 認証トークンを取得
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * 認証トークンを保存
 */
export function setToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

/**
 * リフレッシュトークンを保存
 */
export function setRefreshToken(token: string): void {
  localStorage.setItem('refreshToken', token);
}

/**
 * トークンをクリア
 */
export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * APIリクエストを送信
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error, message: data.message };
    }

    return { data };
  } catch (error) {
    console.error('API request error:', error);
    return { error: 'Network Error', message: 'ネットワークエラーが発生しました' };
  }
}

// 認証API
export const authApi = {
  signup: (email: string, password: string, name: string) =>
    request<{ user: { id: string; email: string; name: string }; accessToken: string; refreshToken: string }>(
      '/auth/signup',
      { method: 'POST', body: JSON.stringify({ email, password, name }) }
    ),

  login: (email: string, password: string) =>
    request<{ user: { id: string; email: string; name: string }; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  me: () =>
    request<{ user: { id: string; email: string; name: string; role: string } }>('/auth/me'),
};

// スレッドAPI
export const threadApi = {
  create: (body: string) =>
    request<{
      thread: { id: string; title: string; status: string };
      message: { id: string; body: string };
      aiArtifact: { outputJson: object };
    }>('/threads', { method: 'POST', body: JSON.stringify({ body }) }),

  list: (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const queryString = query.toString();
    return request<{
      threads: Array<{
        id: string;
        title: string;
        status: string;
        category: string;
        estimatedLevel: string;
        messageCount: number;
        createdAt: string;
      }>;
      total: number;
    }>(`/threads${queryString ? `?${queryString}` : ''}`);
  },

  get: (id: string) =>
    request<{
      thread: {
        id: string;
        askerId: string;
        title: string;
        status: string;
        category: string;
        estimatedLevel: string;
      };
      messages: Array<{
        id: string;
        type: string;
        body: string;
        sender: { id: string; name: string } | null;
        isOriginal: boolean;
        createdAt: string;
      }>;
      mergedAnswer: { id: string; body: string } | null;
    }>(`/threads/${id}`),

  postMessage: (threadId: string, body: string) =>
    request<{
      message: { id: string; body: string; type: string };
      simplifiedMessage: { id: string; body: string } | null;
    }>(`/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),

  close: (id: string) =>
    request<{ thread: { id: string; status: string } }>(`/threads/${id}/close`, { method: 'POST' }),
};

// 回答者受信箱API
export const responderApi = {
  inbox: (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const queryString = query.toString();
    return request<{
      assignments: Array<{
        id: string;
        thread: { id: string; title: string; category: string; estimatedLevel: string };
        status: string;
        notifiedAt: string;
      }>;
      total: number;
    }>(`/responder/inbox${queryString ? `?${queryString}` : ''}`);
  },

  view: (assignmentId: string) =>
    request<{ assignment: { id: string; status: string } }>(
      `/responder/inbox/${assignmentId}/view`,
      { method: 'POST' }
    ),

  decline: (assignmentId: string) =>
    request<{ assignment: { id: string; status: string } }>(
      `/responder/inbox/${assignmentId}/decline`,
      { method: 'POST' }
    ),
};

// 評価API
export const feedbackApi = {
  create: (threadId: string, messageId: string, kind: 'thanks' | 'helpful') =>
    request<{ feedback: { id: string } }>('/feedback', {
      method: 'POST',
      body: JSON.stringify({ threadId, messageId, kind }),
    }),
};
