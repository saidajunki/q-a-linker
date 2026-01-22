'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ResponderProfile {
  id: string;
  expertiseTags: string[];
  levelPreference: string | null;
  answerCount: number;
  thanksCount: number;
  avgResponseTime: number | null;
}

const SUGGESTED_TAGS = [
  'プログラミング', 'React', 'JavaScript', 'Python', 'TypeScript',
  '健康', '医療', '法律', '税務', 'キャリア', '転職',
  '生活', '料理', '子育て', '教育', '金融', '投資',
];

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ResponderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // フォーム状態
  const [name, setName] = useState('');
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [levelPreference, setLevelPreference] = useState<string>('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      // ユーザー情報取得
      const userRes = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setName(userData.user.name);
      }

      // 回答者プロフィール取得
      const profileRes = await fetch('/api/users/me/responder-profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.responderProfile) {
          setProfile(profileData.responderProfile);
          setExpertiseTags(profileData.responderProfile.expertiseTags || []);
          setLevelPreference(profileData.responderProfile.levelPreference || '');
        }
      }
    } catch {
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('accessToken');

    try {
      // ユーザー名更新
      const userRes = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!userRes.ok) {
        throw new Error('プロフィールの更新に失敗しました');
      }

      // 回答者プロフィール更新
      const profileRes = await fetch('/api/users/me/responder-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expertiseTags,
          levelPreference: levelPreference || null,
        }),
      });

      if (!profileRes.ok) {
        throw new Error('回答者プロフィールの更新に失敗しました');
      }

      setSuccess('設定を保存しました');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !expertiseTags.includes(tag) && expertiseTags.length < 10) {
      setExpertiseTags([...expertiseTags, tag]);
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setExpertiseTags(expertiseTags.filter((t) => t !== tag));
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/auth/dashboard" className="text-blue-600 hover:underline text-sm">
            ← ダッシュボードに戻る
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">設定</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{success}</div>
        )}

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">基本情報</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 回答者設定 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">回答者設定</h2>
          <p className="text-sm text-gray-500 mb-4">
            得意分野を設定すると、関連する質問が届くようになります
          </p>

          {/* 得意分野タグ */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              得意分野（最大10個）
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {expertiseTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
                placeholder="タグを入力..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => addTag(newTag)}
                disabled={!newTag || expertiseTags.length >= 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                追加
              </button>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">おすすめのタグ：</p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_TAGS.filter((t) => !expertiseTags.includes(t)).slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 得意なレベル */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              得意な説明レベル
            </label>
            <select
              value={levelPreference}
              onChange={(e) => setLevelPreference(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">指定なし</option>
              <option value="beginner">初心者向け</option>
              <option value="intermediate">中級者向け</option>
              <option value="advanced">上級者向け</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              設定したレベルの質問が優先的に届きます
            </p>
          </div>

          {/* 統計情報 */}
          {profile && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">あなたの実績</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{profile.answerCount}</div>
                  <div className="text-xs text-gray-500">回答数</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{profile.thanksCount}</div>
                  <div className="text-xs text-gray-500">ありがとう</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile.avgResponseTime ? `${profile.avgResponseTime}分` : '-'}
                  </div>
                  <div className="text-xs text-gray-500">平均応答時間</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  );
}
