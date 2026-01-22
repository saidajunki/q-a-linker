'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { threadApi } from '@/lib/api/client';

interface AIAnalysis {
  categories: string[];
  estimatedLevel: string;
  intent: string;
  missingInfo: string[];
  suggestedTitle: string;
}

export default function NewThreadPage() {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

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
      const aiOutput = result.data.aiArtifact.outputJson as AIAnalysis;
      setAnalysis(aiOutput);
      setThreadId(result.data.thread.id);
      setShowConfirm(true);
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (threadId) {
      router.push(`/auth/threads/${threadId}`);
    }
  };

  const handleAddInfo = () => {
    if (threadId) {
      router.push(`/auth/threads/${threadId}?addInfo=true`);
    }
  };

  if (showConfirm && analysis) {
    return (
      <AuthLayout>
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold mb-6">質問を投稿しました！</h1>

            <div className="bg-[var(--color-highlight)]/20 border border-[var(--color-highlight)]/50 rounded-lg p-4 mb-6">
              <h2 className="font-medium text-[var(--color-highlight)] mb-2">
                AIによる分析結果
              </h2>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  <span className="text-gray-400">カテゴリ:</span>{' '}
                  {analysis.categories.join(', ')}
                </p>
                <p>
                  <span className="text-gray-400">推定レベル:</span>{' '}
                  {analysis.estimatedLevel === 'beginner'
                    ? '初心者'
                    : analysis.estimatedLevel === 'intermediate'
                      ? '中級者'
                      : '上級者'}
                </p>
                <p>
                  <span className="text-gray-400">質問の意図:</span>{' '}
                  {analysis.intent}
                </p>
              </div>
            </div>

            {analysis.missingInfo.length > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
                <h2 className="font-medium text-yellow-400 mb-2">
                  💡 追加情報があるとより良い回答が得られます
                </h2>
                <ul className="list-disc list-inside text-sm text-yellow-300 space-y-1">
                  {analysis.missingInfo.map((info, i) => (
                    <li key={i}>{info}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-gray-400 mb-6">
              回答者に通知が送信されました。回答が届くまでしばらくお待ちください。
            </p>

            <div className="flex gap-4">
              <button onClick={handleContinue} className="flex-1 btn-primary">
                質問を確認する
              </button>
              {analysis.missingInfo.length > 0 && (
                <button onClick={handleAddInfo} className="flex-1 btn-secondary">
                  追加情報を入力する
                </button>
              )}
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/auth/threads"
            className="text-[var(--color-highlight)] hover:underline text-sm"
          >
            ← 質問一覧に戻る
          </Link>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold mb-6">質問する</h1>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="body"
                className="block text-sm text-gray-400 mb-2"
              >
                質問内容
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-highlight)] transition-colors resize-none"
                placeholder="わからないこと、困っていることを自由に書いてください。専門用語がわからなくても大丈夫です。"
              />
              <p className="mt-2 text-sm text-gray-500">
                AIが質問を整理して、適切な回答者に届けます
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : '質問を投稿する'}
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
