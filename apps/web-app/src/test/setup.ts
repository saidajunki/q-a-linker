// テスト用セットアップ
// 環境変数の設定
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
