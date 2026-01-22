# Rules

QALinker 開発ルール・ガイドライン

## 方針

**ローカル保持するもの**
- プロジェクト固有の設定・規約
- チーム固有の価値観・優先順位
- Web検索で揺らぎやすい判断基準

**リモート参照するもの（実装時に都度参照）**
- 汎用的な技術ベストプラクティス → 公式ドキュメント
- セキュリティの詳細 → OWASP、公式ドキュメント
- アクセシビリティの詳細 → WCAG、公式ドキュメント

## ルール一覧

| カテゴリ | 説明 | ファイル | 参照タイミング |
|---------|------|---------|---------------|
| 常時適用 | 優先順位・価値観 | `always.md` | 常に |
| Git運用 | ブランチ戦略、コミット規約 | `git.md` | コミット作成時 |
| コーディング規約 | 命名規則、フォーマット | `coding.md` | コード実装時 |
| アーキテクチャ | ディレクトリ構成、依存関係 | `architecture.md` | 設計時 |
| テスト方針 | テストツール、配置、優先順位 | `testing.md` | テスト作成時 |
| セキュリティ | 基本方針、必須事項 | `security.md` | 実装時 |
| パフォーマンス | 基本方針、必須事項 | `performance.md` | 実装時 |
| アクセシビリティ | 基本方針、チェックリスト | `accessibility.md` | UI実装時 |

## ビジョンドキュメント

設計判断に迷った際は、以下のドキュメントを参照すること：

- `docs/vision/philosophy.md` - 設計哲学と判断指針
- `docs/vision/business-model.md` - ビジネスモデル
- `docs/vision/roadmap.md` - フェーズ別計画
- `docs/vision/knowledge-architecture.md` - ナレッジベース設計

## 外部参照先（実装時に都度参照）

| カテゴリ | 参照先 |
|---------|--------|
| Next.js | https://nextjs.org/docs |
| React | https://react.dev |
| TypeScript | https://www.typescriptlang.org/docs |
| Vitest | https://vitest.dev |
| Playwright | https://playwright.dev |
| WCAG | https://www.w3.org/WAI/WCAG22/quickref/ |
| OWASP | https://owasp.org/www-project-top-ten/ |

## 運用方針

- ルールの実体はこのディレクトリに記載
- 汎用的なベストプラクティスは公式ドキュメントを参照
- 各AIツールの設定（`.kiro/steering/`等）からは参照のみ
- 作業内容に応じて、関連するルールファイルを読み込む
