"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"asker" | "responder">("asker");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setError(data.details.map((d: { message: string }) => d.message).join(", "));
        } else {
          setError(data.message || "登録に失敗しました");
        }
        return;
      }

      // トークンを保存
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // ダッシュボードへリダイレクト
      router.push("/auth/dashboard");
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-primary)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-gradient">
            QALinker
          </Link>
          <p className="text-gray-400 mt-2">新規登録</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm text-gray-400 mb-2">
              名前
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-highlight)] transition-colors"
              placeholder="表示名"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-highlight)] transition-colors"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-highlight)] transition-colors"
              placeholder="8文字以上、英数字混合"
            />
            <p className="text-xs text-gray-500 mt-1">8文字以上、英字と数字を含めてください</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              利用目的
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("asker")}
                className={`p-4 rounded-lg border transition-colors ${
                  role === "asker"
                    ? "border-[var(--color-highlight)] bg-[var(--color-highlight)]/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl mb-2">❓</div>
                <div className="font-medium">質問したい</div>
                <div className="text-xs text-gray-400 mt-1">質問者として登録</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("responder")}
                className={`p-4 rounded-lg border transition-colors ${
                  role === "responder"
                    ? "border-[var(--color-highlight)] bg-[var(--color-highlight)]/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl mb-2">💡</div>
                <div className="font-medium">回答したい</div>
                <div className="text-xs text-gray-400 mt-1">回答者として登録</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "登録中..." : "登録する"}
          </button>

          <p className="text-center text-gray-400 text-sm">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/auth/login" className="text-[var(--color-highlight)] hover:underline">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
