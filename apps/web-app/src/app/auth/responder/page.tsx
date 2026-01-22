'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { responderApi } from '@/lib/api/client';

interface Assignment {
  id: string;
  thread: {
    id: string;
    title: string;
    category: string;
    estimatedLevel: string;
  };
  status: string;
  notifiedAt: string;
}

const statusLabels: Record<string, string> = {
  notified: '未読',
  viewed: '閲覧済み',
  answering: '回答中',
  answered: '回答済み',
  declined: '辞退',
};

const statusColors: Record<string, string> = {
  notified: 'bg-red-100 text-red-800',
  viewed: 'bg-yellow-100 text-yellow-800',
  answering: 'bg-blue-100 text-blue-800',
  answered: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-800',
};

export default function ResponderInboxPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    const result = await responderApi.inbox();
    if (result.error) {
      setError(result.message ?? 'エラーが発生しました');
    } else if (result.data) {
      setAssignments(result.data.assignments);
    }
    setLoading(false);
  };

  const handleView = async (assignmentId: string, threadId: string) => {
    await responderApi.view(assignmentId);
    window.location.href = `/auth/threads/${threadId}`;
  };

  const handleDecline = async (assignmentId: string) => {
    if (!confirm('この質問を辞退しますか？')) return;
    const result = await responderApi.decline(assignmentId);
    if (result.error) {
      alert(result.message ?? 'エラーが発生しました');
    } else {
      loadAssignments();
    }
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
          <h1 className="text-2xl font-bold text-gray-900">回答者受信箱</h1>
          <Link
            href="/auth/dashboard"
            className="text-blue-600 hover:underline text-sm"
          >
            ダッシュボードに戻る
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">割り当てられた質問はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-medium text-gray-900">
                    {assignment.thread.title ?? '無題'}
                  </h2>
                  <span
                    className={`px-2 py-1 rounded text-sm ${statusColors[assignment.status] ?? 'bg-gray-100'}`}
                  >
                    {statusLabels[assignment.status] ?? assignment.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                  {assignment.thread.category && (
                    <span>カテゴリ: {assignment.thread.category}</span>
                  )}
                  {assignment.thread.estimatedLevel && (
                    <span>レベル: {assignment.thread.estimatedLevel}</span>
                  )}
                  <span>
                    {new Date(assignment.notifiedAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleView(assignment.id, assignment.thread.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                  >
                    回答する
                  </button>
                  {assignment.status !== 'declined' && assignment.status !== 'answered' && (
                    <button
                      onClick={() => handleDecline(assignment.id)}
                      className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm"
                    >
                      辞退する
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
