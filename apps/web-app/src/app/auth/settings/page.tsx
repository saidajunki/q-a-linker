'use client';

import { useState, useEffect } from 'react';
import AuthLayout from '@/components/AuthLayout';

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
      const userRes = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setName(userData.user.name);
      }

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-primary)]">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">設定</h1>

        {error && (
          <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-green-500/20 text-green-300 p-4 rounded-lg mb-6">{success}</div>
        )}

        {/* 基本情報 */}
        <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
          <h2 className="text-lg font-medium text-white mb-4">基本情報</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            />
          </div>
        </div>

        {/* 回答者設定 */}
        <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
          <h2 className="text-lg font-medium text-white mb-4">回答者設定</h2>
          <p className="text-sm text-gray-400 mb-4">
            得意分野を設定すると、関連する質問が届くようになります
          </p>

          {/* 得意分野タグ */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              得意分野（最大10個）
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {expertiseTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[var(--color-accent)]/20 text-[var(--color-accent)] px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:opacity-70"
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
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
              <button
                onClick={() => addTag(newTag)}
                disabled={!newTag || expertiseTags.length >= 10}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
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
                    className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded hover:bg-white/20 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 得意なレベル */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              得意な説明レベル
            </label>
            <select
              value={levelPreference}
              onChange={(e) => setLevelPreference(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            >
              <option value="" className="bg-[var(--color-primary)]">指定なし</option>
              <option value="beginner" className="bg-[var(--color-primary)]">初心者向け</option>
              <option value="intermediate" className="bg-[var(--color-primary)]">中級者向け</option>
              <option value="advanced" className="bg-[var(--color-primary)]">上級者向け</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              設定したレベルの質問が優先的に届きます
            </p>
          </div>

          {/* 統計情報 */}
          {profile && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-gray-300 mb-3">あなたの実績</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-white">{profile.answerCount}</div>
                  <div className="text-xs text-gray-500">回答数</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-white">{profile.thanksCount}</div>
                  <div className="text-xs text-gray-500">ありがとう</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-white">
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
          className="w-full bg-[var(--color-accent)] text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </AuthLayout>
  );
}
