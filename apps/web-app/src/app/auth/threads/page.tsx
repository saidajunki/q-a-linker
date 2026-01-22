'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { threadApi } from '@/lib/api/client';

interface Thread {
  id: string;
  title: string;
  status: string;
  category: string;
  estimatedLevel: string;
  messageCount: number;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  open: '回答待ち',
  answering: '回答中',
  answered: '回答済み',
  closed: 'クローズ',
};

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  answering: 'bg-blue-100 text-blue-800',
  answered: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    setLoading(true);
    const result = await threadApi.list();
    if (result.error) {
      setError(result.message ?? 'エラーが発生しました');
    } else if (result.data) {
      setThreads(result.data.threads);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">質問一覧</h1>
          <Link
            href="/auth/threads/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            質問する
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {threads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">まだ質問がありません</p>
            <Link
              href="/auth/threads/new"
              className="text-blue-600 hover:underline"
            >
              最初の質問を投稿する
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/auth/threads/${thread.id}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-medium text-gray-900">
                    {thread.title ?? '無題'}
                  </h2>
                  <span
                    className={`px-2 py-1 rounded text-sm ${statusColors[thread.status] ?? 'bg-gray-100'}`}
                  >
                    {statusLabels[thread.status] ?? thread.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  {thread.category && <span>カテゴリ: {thread.category}</span>}
                  <span>メッセージ: {thread.messageCount}件</span>
                  <span>
                    {new Date(thread.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
