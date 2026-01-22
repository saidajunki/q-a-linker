'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/auth/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/auth/login');
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-primary)]">
        <div className="text-white">読み込み中...</div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* ユーザー情報 */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">プロフィール</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              <span className="text-gray-500">名前:</span> {user?.name}
            </p>
            <p>
              <span className="text-gray-500">メール:</span> {user?.email}
            </p>
            <p>
              <span className="text-gray-500">役割:</span>{' '}
              {user?.role === 'asker'
                ? '質問者'
                : user?.role === 'responder'
                  ? '回答者'
                  : '管理者'}
            </p>
          </div>
        </div>

        {/* アクション */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            {user?.role === 'asker' ? '質問する' : '回答する'}
          </h2>
          <p className="text-gray-400 mb-4">
            {user?.role === 'asker'
              ? '気軽に質問を投げてみましょう。専門用語がわからなくても大丈夫です。'
              : 'あなたの得意分野で誰かの役に立ちましょう。'}
          </p>
          <Link
            href={
              user?.role === 'asker' ? '/auth/threads/new' : '/auth/responder'
            }
            className="btn-primary inline-block text-center"
          >
            {user?.role === 'asker' ? '質問を投稿する' : '質問を見る'}
          </Link>
        </div>

        {/* 履歴 */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">履歴</h2>
          <p className="text-gray-400 mb-4">
            過去の質問や回答を確認できます。
          </p>
          <Link
            href="/auth/threads"
            className="btn-secondary inline-block text-center"
          >
            質問一覧を見る
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
