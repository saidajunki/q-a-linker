# API仕様

## 概要

QALinkerのREST API仕様。
ベースURL: `/api`

## 認証

認証が必要なエンドポイントは、リクエストヘッダーに以下を含める：

```
Authorization: Bearer <accessToken>
```

---

## エンドポイント一覧

### 認証 (`/api/auth`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | /auth/signup | サインアップ | 不要 |
| POST | /auth/login | ログイン | 不要 |
| POST | /auth/refresh | トークンリフレッシュ | 不要 |
| POST | /auth/logout | ログアウト | 必要 |
| GET | /auth/me | 現在のユーザー取得 | 必要 |

### スレッド (`/api/threads`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | /threads | 質問を投稿 | 必要 |
| GET | /threads | スレッド一覧取得 | 必要 |
| GET | /threads/:id | スレッド詳細取得 | 必要 |
| PATCH | /threads/:id | スレッド更新 | 必要 |
| POST | /threads/:id/close | スレッドをクローズ | 必要 |

### メッセージ (`/api/threads/:threadId/messages`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | /threads/:threadId/messages | 回答を投稿 | 必要 |
| GET | /threads/:threadId/messages | メッセージ一覧取得 | 必要 |

### 回答者受信箱 (`/api/responder`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | /responder/inbox | 割り当てられた質問一覧 | 必要 |
| POST | /responder/inbox/:assignmentId/view | 質問を閲覧済みにする | 必要 |
| POST | /responder/inbox/:assignmentId/decline | 質問を辞退する | 必要 |

### 評価 (`/api/feedback`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | /feedback | 評価を送信 | 必要 |

### 通知 (`/api/notifications`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | /notifications | 通知一覧取得 | 必要 |
| POST | /notifications/:id/read | 通知を既読にする | 必要 |
| POST | /notifications/read-all | 全通知を既読にする | 必要 |

### 通報 (`/api/reports`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | /reports | 通報を送信 | 必要 |

### ユーザー (`/api/users`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | /users/me | 自分のプロフィール取得 | 必要 |
| PATCH | /users/me | 自分のプロフィール更新 | 必要 |
| GET | /users/me/responder-profile | 回答者プロフィール取得 | 必要 |
| PATCH | /users/me/responder-profile | 回答者プロフィール更新 | 必要 |

---

## 詳細仕様

### POST /api/threads

質問を投稿する。

**リクエスト**:
```json
{
  "body": "Reactでstateが更新されないのですが、どうすればいいですか？"
}
```

**レスポンス** (201 Created):
```json
{
  "thread": {
    "id": "uuid",
    "askerId": "uuid",
    "title": "Reactのstate更新について",
    "status": "open",
    "category": "プログラミング",
    "estimatedLevel": "beginner",
    "createdAt": "2025-01-22T10:00:00Z"
  },
  "message": {
    "id": "uuid",
    "threadId": "uuid",
    "senderId": "uuid",
    "type": "question",
    "body": "Reactでstateが更新されないのですが、どうすればいいですか？",
    "isOriginal": true,
    "createdAt": "2025-01-22T10:00:00Z"
  },
  "aiArtifact": {
    "id": "uuid",
    "kind": "question_structured",
    "outputJson": {
      "categories": ["プログラミング", "React"],
      "estimatedLevel": "beginner",
      "intent": "stateが更新されない原因と解決方法を知りたい",
      "assumptions": ["Reactを使用している", "useStateを使っている可能性"],
      "missingInfo": ["具体的なコード", "エラーメッセージ"]
    }
  }
}
```

### GET /api/threads

スレッド一覧を取得する。

**クエリパラメータ**:
- `status`: open / answering / answered / closed
- `limit`: 取得件数（デフォルト: 20）
- `offset`: オフセット（デフォルト: 0）

**レスポンス**:
```json
{
  "threads": [
    {
      "id": "uuid",
      "title": "Reactのstate更新について",
      "status": "open",
      "category": "プログラミング",
      "estimatedLevel": "beginner",
      "messageCount": 1,
      "createdAt": "2025-01-22T10:00:00Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### GET /api/threads/:id

スレッド詳細を取得する。

**レスポンス**:
```json
{
  "thread": {
    "id": "uuid",
    "askerId": "uuid",
    "title": "Reactのstate更新について",
    "status": "answered",
    "category": "プログラミング",
    "estimatedLevel": "beginner",
    "createdAt": "2025-01-22T10:00:00Z"
  },
  "messages": [
    {
      "id": "uuid",
      "type": "question",
      "body": "Reactでstateが更新されないのですが...",
      "sender": { "id": "uuid", "name": "質問者" },
      "isOriginal": true,
      "createdAt": "2025-01-22T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "answer",
      "body": "useStateの更新は非同期なので...",
      "sender": { "id": "uuid", "name": "回答者A" },
      "isOriginal": true,
      "createdAt": "2025-01-22T10:30:00Z"
    },
    {
      "id": "uuid",
      "type": "merged_answer",
      "body": "【統合回答】複数の回答をまとめると...",
      "sender": null,
      "isOriginal": false,
      "createdAt": "2025-01-22T11:00:00Z"
    }
  ],
  "mergedAnswer": {
    "id": "uuid",
    "body": "【統合回答】複数の回答をまとめると...",
    "createdAt": "2025-01-22T11:00:00Z"
  }
}
```

### POST /api/threads/:threadId/messages

回答を投稿する。

**リクエスト**:
```json
{
  "body": "useStateの更新は非同期で行われるため、更新直後にstateを参照しても古い値が返ります。useEffectを使って変更を監視するか、関数形式で更新してください。"
}
```

**レスポンス** (201 Created):
```json
{
  "message": {
    "id": "uuid",
    "threadId": "uuid",
    "senderId": "uuid",
    "type": "answer",
    "body": "useStateの更新は非同期で...",
    "isOriginal": true,
    "createdAt": "2025-01-22T10:30:00Z"
  },
  "simplifiedMessage": {
    "id": "uuid",
    "threadId": "uuid",
    "type": "answer",
    "body": "【初心者向け】Reactのstateは...",
    "isOriginal": false,
    "originalMessageId": "uuid",
    "createdAt": "2025-01-22T10:30:00Z"
  }
}
```

### GET /api/responder/inbox

回答者に割り当てられた質問一覧を取得する。

**クエリパラメータ**:
- `status`: notified / viewed / answering / answered / declined
- `limit`: 取得件数（デフォルト: 20）
- `offset`: オフセット（デフォルト: 0）

**レスポンス**:
```json
{
  "assignments": [
    {
      "id": "uuid",
      "thread": {
        "id": "uuid",
        "title": "Reactのstate更新について",
        "category": "プログラミング",
        "estimatedLevel": "beginner"
      },
      "status": "notified",
      "notifiedAt": "2025-01-22T10:00:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

### POST /api/feedback

評価を送信する。

**リクエスト**:
```json
{
  "threadId": "uuid",
  "messageId": "uuid",
  "kind": "thanks"
}
```

**レスポンス** (201 Created):
```json
{
  "feedback": {
    "id": "uuid",
    "threadId": "uuid",
    "messageId": "uuid",
    "kind": "thanks",
    "createdAt": "2025-01-22T12:00:00Z"
  }
}
```

### POST /api/reports

通報を送信する。

**リクエスト**:
```json
{
  "threadId": "uuid",
  "messageId": "uuid",
  "reason": "harassment",
  "description": "攻撃的な表現が含まれています"
}
```

**レスポンス** (201 Created):
```json
{
  "report": {
    "id": "uuid",
    "status": "pending",
    "createdAt": "2025-01-22T12:00:00Z"
  }
}
```

---

## 共通エラーレスポンス

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "リクエストが不正です",
  "details": [
    { "field": "email", "message": "有効なメールアドレスを入力してください" }
  ]
}
```

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

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "リソースが見つかりません"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "サーバーエラーが発生しました"
}
```
