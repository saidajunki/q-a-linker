'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
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
  open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  answering: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  answered: 'bg-green-500/20 text-green-400 border-green-500/50',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
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
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">読み込み中...</div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">質問一覧</h1>
          <Link href="/auth/threads/new" className="btn-primary">
            質問する
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {threads.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 mb-4">まだ質問がありません</p>
            <Link
              href="/auth/threads/new"
              className="text-[var(--color-highlight)] hover:underline"
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
                className="block card hover:border-white/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-medium">
                    {thread.title ?? '無題'}
                  </h2>
                  <span
                    className={`px-2 py-1 rounded text-sm border ${statusColors[thread.status] ?? 'bg-gray-500/20 text-gray-400'}`}
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
    </AuthLayout>
  );
}
