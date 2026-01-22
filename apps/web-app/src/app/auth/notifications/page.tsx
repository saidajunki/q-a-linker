'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  threadId: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  new_question: '❓',
  new_answer: '💬',
  merged_answer: '📝',
  thanks: '🙏',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const res = await fetch('/api/notifications?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        setError('通知の読み込みに失敗しました');
      }
    } catch {
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem('accessToken');
    await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    loadNotifications();
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('accessToken');
    await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    loadNotifications();
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">通知</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400">{unreadCount}件の未読</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-[var(--color-accent)] hover:opacity-80 transition"
            >
              すべて既読にする
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6">{error}</div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white/5 rounded-lg p-8 text-center">
            <p className="text-gray-400">通知はありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white/5 rounded-lg p-4 border border-white/10 ${
                  !notification.isRead ? 'border-l-4 border-l-[var(--color-accent)]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {typeIcons[notification.type] ?? '📢'}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-white">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{notification.body}</p>
                    <div className="flex gap-3 mt-2">
                      {notification.threadId && (
                        <Link
                          href={`/auth/threads/${notification.threadId}`}
                          className="text-sm text-[var(--color-accent)] hover:opacity-80 transition"
                        >
                          スレッドを見る
                        </Link>
                      )}
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-gray-400 hover:text-white transition"
                        >
                          既読にする
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
