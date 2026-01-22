# 認証仕様

## 概要

QALinkerは、JWT（JSON Web Token）ベースの認証を採用する。
Web・モバイルアプリ両方からアクセス可能な設計とする。

## 認証フロー

### 1. サインアップ

```
POST /api/auth/signup
```

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "表示名"
}
```

**レスポンス**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "表示名",
    "role": "user"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

**バリデーション**:
- email: 有効なメールアドレス形式、ユニーク
- password: 8文字以上、英数字混合
- name: 1-50文字

**備考**:
- 全ユーザーは質問も回答も可能
- 登録時に自動的に`ResponderProfile`が作成される
- 得意タグは後から設定画面で追加可能

### 2. ログイン

```
POST /api/auth/login
```

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**レスポンス**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "表示名",
    "role": "user"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### 3. トークンリフレッシュ

```
POST /api/auth/refresh
```

**リクエスト**:
```json
{
  "refreshToken": "eyJhbG..."
}
```

**レスポンス**:
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."  // 新しいリフレッシュトークン
}
```

### 4. ログアウト

```
POST /api/auth/logout
```

**ヘッダー**:
```
Authorization: Bearer <accessToken>
```

**リクエスト**:
```json
{
  "refreshToken": "eyJhbG..."
}
```

**レスポンス**:
```json
{
  "message": "ログアウトしました"
}
```

### 5. 現在のユーザー取得

```
GET /api/auth/me
```

**ヘッダー**:
```
Authorization: Bearer <accessToken>
```

**レスポンス**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "表示名",
    "role": "user"
  }
}
```

---

## トークン仕様

### アクセストークン

- **有効期限**: 15分
- **用途**: API認証
- **ペイロード**:
  ```json
  {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "user",
    "iat": 1234567890,
    "exp": 1234568790
  }
  ```

### リフレッシュトークン

- **有効期限**: 7日
- **用途**: アクセストークンの更新
- **保存**: DBに保存（ハッシュ化）
- **ローテーション**: 使用時に新しいトークンを発行し、古いトークンは無効化

---

## セキュリティ要件

### パスワード

- bcrypt でハッシュ化（コスト係数: 12）
- 平文での保存禁止
- ログへの出力禁止

### トークン

- 署名アルゴリズム: HS256
- シークレットキー: 環境変数 `JWT_SECRET` から取得
- リフレッシュトークンはDBにハッシュ化して保存

### HTTPS

- 本番環境では必須
- ローカル開発では HTTP 許可

### レート制限

- ログイン: 5回/分（IPベース）
- サインアップ: 3回/分（IPベース）
- トークンリフレッシュ: 10回/分（ユーザーベース）

---

## エラーレスポンス

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "認証が必要です"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "アクセス権限がありません"
}
```

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "メールアドレスまたはパスワードが正しくありません"
}
```

### 409 Conflict

```json
{
  "error": "Conflict",
  "message": "このメールアドレスは既に登録されています"
}
```

---

## 認証が必要なエンドポイント

以下のエンドポイントは `Authorization: Bearer <accessToken>` ヘッダーが必要：

- `/api/threads/*` - スレッド関連
- `/api/messages/*` - メッセージ関連
- `/api/users/*` - ユーザー関連
- `/api/notifications/*` - 通知関連
- `/api/feedback/*` - 評価関連
- `/api/reports/*` - 通報関連

---

## 実装メモ

### 使用ライブラリ

- `jose`: JWT の生成・検証
- `bcrypt`: パスワードハッシュ
- `zod`: バリデーション

### 環境変数

```
JWT_SECRET=<32文字以上のランダム文字列>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```
