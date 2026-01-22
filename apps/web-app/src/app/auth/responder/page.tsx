'use client';

import { useState, useEffect } from 'react';
import { responderApi } from '@/lib/api/client';
import AuthLayout from '@/components/AuthLayout';

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
  notified: 'bg-red-500/20 text-red-300',
  viewed: 'bg-yellow-500/20 text-yellow-300',
  answering: 'bg-blue-500/20 text-blue-300',
  answered: 'bg-green-500/20 text-green-300',
  declined: 'bg-gray-500/20 text-gray-400',
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-primary)]">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-white mb-8">回答者受信箱</h1>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6">{error}</div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <p className="text-gray-400">割り当てられた質問はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white/5 rounded-lg p-6 border border-white/10"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-medium text-white">
                  {assignment.thread.title ?? '無題'}
                </h2>
                <span
                  className={`px-2 py-1 rounded text-sm ${statusColors[assignment.status] ?? 'bg-gray-500/20'}`}
                >
                  {statusLabels[assignment.status] ?? assignment.status}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-400 mb-4">
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
                  className="bg-[var(--color-accent)] text-white px-4 py-2 rounded hover:opacity-90 transition text-sm"
                >
                  回答する
                </button>
                {assignment.status !== 'declined' && assignment.status !== 'answered' && (
                  <button
                    onClick={() => handleDecline(assignment.id)}
                    className="text-gray-400 hover:text-white px-4 py-2 text-sm transition"
                  >
                    辞退する
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AuthLayout>
  );
}
