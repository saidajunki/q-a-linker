# コーディング規約

## 本ファイルの方針

汎用的なTypeScript/React/Next.jsのベストプラクティスは、実装時に以下を参照すること：
- Next.js公式ドキュメント: https://nextjs.org/docs
- React公式ドキュメント: https://react.dev
- TypeScript公式ドキュメント: https://www.typescriptlang.org/docs

本ファイルには、プロジェクト固有の規約のみ記載する。

---

## 命名規則（プロジェクト固有）

### ファイル・ディレクトリ
- コンポーネントファイル: PascalCase（例: `UserProfile.tsx`）
- ユーティリティ・フック: camelCase（例: `useAuth.ts`, `formatDate.ts`）
- ディレクトリ: kebab-case（例: `user-profile/`）

### 変数・関数
- 変数・関数: camelCase
- 定数: UPPER_SNAKE_CASE
- 型・インターフェース: PascalCase
- イベントハンドラ: handle + イベント名（例: `handleClick`）

## コメント（プロジェクト固有）

- 日本語でコメントを書く
- 「なぜ」を説明するコメントを優先
- JSDocで関数の説明を記載

## フォーマット（プロジェクト固有）

### Prettier設定
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## TypeScript設定（プロジェクト固有）

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- `any`は使用禁止。型が不明な場合は`unknown`を使用
