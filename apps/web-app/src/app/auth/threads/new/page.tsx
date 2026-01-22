'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { threadApi } from '@/lib/api/client';

export default function NewThreadPage() {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError('質問を入力してください');
      return;
    }

    setLoading(true);
    setError('');

    const result = await threadApi.create(body);
    if (result.error) {
      setError(result.message ?? 'エラーが発生しました');
      setLoading(false);
    } else if (result.data) {
      router.push(`/auth/threads/${result.data.thread.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/auth/threads"
            className="text-blue-600 hover:underline text-sm"
          >
            ← 質問一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">質問する</h1>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="body"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                質問内容
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="わからないこと、困っていることを自由に書いてください。専門用語がわからなくても大丈夫です。"
              />
              <p className="mt-2 text-sm text-gray-500">
                AIが質問を整理して、適切な回答者に届けます
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : '質問を投稿する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
