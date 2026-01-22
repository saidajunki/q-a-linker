'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { threadApi, feedbackApi } from '@/lib/api/client';

interface Message {
  id: string;
  type: string;
  body: string;
  sender: { id: string; name: string } | null;
  isOriginal: boolean;
  createdAt: string;
}

interface Thread {
  id: string;
  askerId: string;
  title: string;
  status: string;
  category: string;
  estimatedLevel: string;
}

const typeLabels: Record<string, string> = {
  question: '質問',
  answer: '回答',
  merged_answer: '統合回答',
  system: 'システム',
};

const typeColors: Record<string, string> = {
  question: 'bg-blue-500/20 border-blue-500/50',
  answer: 'bg-green-500/20 border-green-500/50',
  merged_answer: 'bg-purple-500/20 border-purple-500/50',
  system: 'bg-gray-500/20 border-gray-500/50',
};

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadThread();
  }, [id]);

  const loadThread = async () => {
    setLoading(true);
    const result = await threadApi.get(id);
    if (result.error) {
      setError(result.message ?? 'エラーが発生しました');
    } else if (result.data) {
      setThread(result.data.thread);
      setMessages(result.data.messages);
    }
    setLoading(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setReplying(true);
    const result = await threadApi.postMessage(id, replyBody);
    if (result.error) {
      setError(result.message ?? 'エラーが発生しました');
    } else {
      setReplyBody('');
      loadThread();
    }
    setReplying(false);
  };

  const handleThanks = async (messageId: string) => {
    const result = await feedbackApi.create(id, messageId, 'thanks');
    if (result.error) {
      alert(result.message ?? 'エラーが発生しました');
    } else {
      alert('ありがとうを送信しました！');
    }
  };

  const handleClose = async () => {
    if (!confirm('このスレッドをクローズしますか？')) return;
    const result = await threadApi.close(id);
    if (result.error) {
      alert(result.message ?? 'エラーが発生しました');
    } else {
      loadThread();
    }
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

  if (!thread) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400">
            {error || 'スレッドが見つかりません'}
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/auth/threads"
            className="text-[var(--color-highlight)] hover:underline text-sm"
          >
            ← 質問一覧に戻る
          </Link>
        </div>

        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-xl font-bold">{thread.title ?? '無題'}</h1>
            {thread.status !== 'closed' && (
              <button
                onClick={handleClose}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                クローズする
              </button>
            )}
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            {thread.category && <span>カテゴリ: {thread.category}</span>}
            {thread.estimatedLevel && (
              <span>レベル: {thread.estimatedLevel}</span>
            )}
            <span>ステータス: {thread.status}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-4 ${typeColors[message.type] ?? 'bg-white/5 border-white/20'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {typeLabels[message.type] ?? message.type}
                  </span>
                  {message.sender && (
                    <span className="text-sm text-gray-500">
                      by {message.sender.name}
                    </span>
                  )}
                  {!message.isOriginal && (
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">
                      AI翻訳
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleString('ja-JP')}
                </span>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">{message.body}</p>
              {message.type === 'answer' && message.isOriginal && (
                <button
                  onClick={() => handleThanks(message.id)}
                  className="mt-3 text-sm text-[var(--color-highlight)] hover:underline"
                >
                  ありがとうを送る
                </button>
              )}
            </div>
          ))}
        </div>

        {thread.status !== 'closed' && (
          <div className="card">
            <h2 className="text-lg font-medium mb-4">返信する</h2>
            <form onSubmit={handleReply}>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-highlight)] transition-colors resize-none mb-4"
                placeholder="追加の質問や回答を入力..."
              />
              <button
                type="submit"
                disabled={replying || !replyBody.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replying ? '送信中...' : '送信'}
              </button>
            </form>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
