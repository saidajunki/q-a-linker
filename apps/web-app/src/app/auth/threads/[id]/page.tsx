'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
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
  question: 'bg-blue-50 border-blue-200',
  answer: 'bg-green-50 border-green-200',
  merged_answer: 'bg-purple-50 border-purple-200',
  system: 'bg-gray-50 border-gray-200',
};

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error || 'スレッドが見つかりません'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/auth/threads"
            className="text-blue-600 hover:underline text-sm"
          >
            ← 質問一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-xl font-bold text-gray-900">
              {thread.title ?? '無題'}
            </h1>
            {thread.status !== 'closed' && (
              <button
                onClick={handleClose}
                className="text-sm text-gray-500 hover:text-gray-700"
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
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-4 ${typeColors[message.type] ?? 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {typeLabels[message.type] ?? message.type}
                  </span>
                  {message.sender && (
                    <span className="text-sm text-gray-500">
                      by {message.sender.name}
                    </span>
                  )}
                  {!message.isOriginal && (
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                      AI翻訳
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(message.createdAt).toLocaleString('ja-JP')}
                </span>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap">{message.body}</p>
              {message.type === 'answer' && message.isOriginal && (
                <button
                  onClick={() => handleThanks(message.id)}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  ありがとうを送る
                </button>
              )}
            </div>
          ))}
        </div>

        {thread.status !== 'closed' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">返信する</h2>
            <form onSubmit={handleReply}>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
                placeholder="追加の質問や回答を入力..."
              />
              <button
                type="submit"
                disabled={replying || !replyBody.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replying ? '送信中...' : '送信'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
