"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      const accessToken = localStorage.getItem("accessToken");
      
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          // トークンが無効な場合はログインページへ
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          router.push("/auth/login");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (refreshToken) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-primary)]">
        <div className="text-white">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-primary)]">
      {/* ヘッダー */}
      <header className="px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            QALinker
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/notifications"
              className="text-gray-400 hover:text-white transition-colors"
            >
              🔔 通知
            </Link>
            <Link
              href="/auth/settings"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ⚙️ 設定
            </Link>
            <span className="text-gray-400">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* ユーザー情報 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">プロフィール</h2>
            <div className="space-y-3 text-gray-300">
              <p><span className="text-gray-500">名前:</span> {user?.name}</p>
              <p><span className="text-gray-500">メール:</span> {user?.email}</p>
              <p>
                <span className="text-gray-500">役割:</span>{" "}
                {user?.role === "asker" ? "質問者" : user?.role === "responder" ? "回答者" : "管理者"}
              </p>
            </div>
          </div>

          {/* アクション */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">
              {user?.role === "asker" ? "質問する" : "回答する"}
            </h2>
            <p className="text-gray-400 mb-4">
              {user?.role === "asker"
                ? "気軽に質問を投げてみましょう。専門用語がわからなくても大丈夫です。"
                : "あなたの得意分野で誰かの役に立ちましょう。"}
            </p>
            <Link
              href={user?.role === "asker" ? "/auth/threads/new" : "/auth/responder"}
              className="btn-primary inline-block text-center"
            >
              {user?.role === "asker" ? "質問を投稿する" : "質問を見る"}
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
      </main>
    </div>
  );
}
