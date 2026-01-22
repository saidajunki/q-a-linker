# データモデル設計

## 概要

QALinkerのデータモデルは、Q&Aの流れを中心に設計されている。

```
User → Thread → Message → AIArtifact
         ↓
    Notification
         ↓
     Feedback
```

## エンティティ一覧

### User（ユーザー）

システムの全ユーザーを管理する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| email | String | メールアドレス（ユニーク） |
| passwordHash | String | パスワードハッシュ |
| name | String | 表示名 |
| role | Enum | user / admin |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

**備考**: 全ユーザーは質問も回答も可能。roleは権限管理のみに使用。

### ResponderProfile（回答者プロフィール）

ユーザーの回答者としての追加情報を管理する。全ユーザーに自動作成される。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| userId | UUID | User.id への外部キー |
| expertiseTags | String[] | 得意分野タグ |
| levelPreference | Enum? | beginner / intermediate / advanced（任意） |
| answerCount | Int | 回答数 |
| thanksCount | Int | ありがとう獲得数 |
| avgResponseTime | Int? | 平均返信時間（分） |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### Thread（質問スレッド）

1つの質問に対するスレッドを管理する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| askerId | UUID | 質問者のUser.id |
| title | String? | タイトル（AI生成、任意） |
| status | Enum | open / answering / answered / closed |
| category | String? | カテゴリ（AI推定） |
| estimatedLevel | Enum? | beginner / intermediate / advanced（AI推定） |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### Message（メッセージ）

スレッド内の質問・回答・システムメッセージを管理する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| threadId | UUID | Thread.id への外部キー |
| senderId | UUID | 送信者のUser.id |
| type | Enum | question / answer / system / merged_answer |
| body | String | 本文 |
| isOriginal | Boolean | 元の文章かどうか（AI翻訳前） |
| originalMessageId | UUID? | 翻訳元のMessage.id（翻訳版の場合） |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### AIArtifact（AI処理結果）

AIによる処理結果を保存する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| threadId | UUID | Thread.id への外部キー |
| kind | Enum | question_structured / answer_simplified / merged_answer / moderation |
| inputMessageIds | UUID[] | 入力となったMessage.id の配列 |
| outputJson | Json | AI出力（構造化データ） |
| outputText | String? | AI出力（テキスト） |
| model | String | 使用したAIモデル |
| createdAt | DateTime | 作成日時 |

### ThreadAssignment（回答者割り当て）

スレッドへの回答者割り当てを管理する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| threadId | UUID | Thread.id への外部キー |
| responderId | UUID | 回答者のUser.id |
| status | Enum | notified / viewed / answering / answered / declined |
| notifiedAt | DateTime | 通知日時 |
| viewedAt | DateTime? | 閲覧日時 |
| answeredAt | DateTime? | 回答日時 |

### Notification（通知）

ユーザーへの通知を管理する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| userId | UUID | User.id への外部キー |
| threadId | UUID? | Thread.id への外部キー（任意） |
| type | Enum | new_question / new_answer / merged_answer / thanks |
| title | String | 通知タイトル |
| body | String | 通知本文 |
| isRead | Boolean | 既読フラグ |
| createdAt | DateTime | 作成日時 |

### Feedback（評価）

回答への評価を管理する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| threadId | UUID | Thread.id への外部キー |
| messageId | UUID | Message.id への外部キー |
| fromUserId | UUID | 評価者のUser.id |
| toUserId | UUID | 被評価者のUser.id |
| kind | Enum | thanks / helpful |
| createdAt | DateTime | 作成日時 |

### Report（通報）

不適切なコンテンツの通報を管理する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| threadId | UUID | Thread.id への外部キー |
| messageId | UUID? | Message.id への外部キー（任意） |
| reporterId | UUID | 通報者のUser.id |
| reason | Enum | spam / harassment / inappropriate / other |
| description | String? | 詳細説明 |
| status | Enum | pending / reviewed / resolved / dismissed |
| createdAt | DateTime | 作成日時 |
| resolvedAt | DateTime? | 解決日時 |

### RefreshToken（リフレッシュトークン）

JWT認証のリフレッシュトークンを管理する。

| カラム | 型 | 説明 |
|--------|------|------|
| id | UUID | 主キー |
| userId | UUID | User.id への外部キー |
| token | String | トークン（ハッシュ化） |
| expiresAt | DateTime | 有効期限 |
| createdAt | DateTime | 作成日時 |
| revokedAt | DateTime? | 無効化日時 |

---

## Enum定義

### UserRole
- `user` - 一般ユーザー（質問・回答両方可能）
- `admin` - 管理者

### ThreadStatus
- `open` - 回答待ち
- `answering` - 回答中（誰かが回答を書いている）
- `answered` - 回答あり
- `closed` - クローズ

### MessageType
- `question` - 質問
- `answer` - 回答
- `system` - システムメッセージ
- `merged_answer` - 統合回答

### AIArtifactKind
- `question_structured` - 質問の構造化
- `answer_simplified` - 回答の簡略化
- `merged_answer` - 統合回答
- `moderation` - モデレーション

### AssignmentStatus
- `notified` - 通知済み
- `viewed` - 閲覧済み
- `answering` - 回答中
- `answered` - 回答済み
- `declined` - 辞退

### NotificationType
- `new_question` - 新しい質問
- `new_answer` - 新しい回答
- `merged_answer` - 統合回答完成
- `thanks` - ありがとう

### FeedbackKind
- `thanks` - ありがとう
- `helpful` - 役に立った

### ReportReason
- `spam` - スパム
- `harassment` - 嫌がらせ
- `inappropriate` - 不適切
- `other` - その他

### ReportStatus
- `pending` - 未対応
- `reviewed` - 確認中
- `resolved` - 解決済み
- `dismissed` - 却下

### Level
- `beginner` - 初心者
- `intermediate` - 中級者
- `advanced` - 上級者

---

## リレーション図

```
User
├── ResponderProfile (1:1, 全ユーザー)
├── Thread (1:N, 質問者として)
├── Message (1:N, 送信者として)
├── ThreadAssignment (1:N, 回答者として)
├── Notification (1:N)
├── Feedback (1:N, 評価者/被評価者として)
├── Report (1:N, 通報者として)
└── RefreshToken (1:N)

Thread
├── Message (1:N)
├── AIArtifact (1:N)
├── ThreadAssignment (1:N)
├── Notification (1:N)
├── Feedback (1:N)
└── Report (1:N)

Message
├── Feedback (1:N)
├── Report (1:N)
└── Message (1:1, 翻訳元)
```
