'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      // AI分析結果を表示
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
    // 不足情報を追加するためにスレッドページへ
    if (threadId) {
      router.push(`/auth/threads/${threadId}?addInfo=true`);
    }
  };

  if (showConfirm && analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              質問を投稿しました！
            </h1>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="font-medium text-blue-900 mb-2">AIによる分析結果</h2>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <span className="font-medium">カテゴリ:</span>{' '}
                  {analysis.categories.join(', ')}
                </p>
                <p>
                  <span className="font-medium">推定レベル:</span>{' '}
                  {analysis.estimatedLevel === 'beginner' ? '初心者' : 
                   analysis.estimatedLevel === 'intermediate' ? '中級者' : '上級者'}
                </p>
                <p>
                  <span className="font-medium">質問の意図:</span>{' '}
                  {analysis.intent}
                </p>
              </div>
            </div>

            {analysis.missingInfo.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h2 className="font-medium text-yellow-900 mb-2">
                  💡 追加情報があるとより良い回答が得られます
                </h2>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                  {analysis.missingInfo.map((info, i) => (
                    <li key={i}>{info}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              回答者に通知が送信されました。回答が届くまでしばらくお待ちください。
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleContinue}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                質問を確認する
              </button>
              {analysis.missingInfo.length > 0 && (
                <button
                  onClick={handleAddInfo}
                  className="flex-1 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
                >
                  追加情報を入力する
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
