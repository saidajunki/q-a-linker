"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="text-xl font-bold text-white hover:text-[var(--color-highlight)] transition-colors">
          QALinker
        </Link>

        {/* ナビゲーション */}
        <nav className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 text-sm bg-[var(--color-highlight)] text-white rounded-full hover:bg-[#ff6b6b] transition-colors"
          >
            新規登録
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
