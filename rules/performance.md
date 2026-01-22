# パフォーマンスルール

## 本ファイルの方針

汎用的なパフォーマンス最適化のベストプラクティスは、実装時に以下を参照すること：
- Next.js Production Checklist: https://nextjs.org/docs/app/guides/production-checklist
- Web Vitals: https://web.dev/vitals/

本ファイルには、プロジェクト固有の方針のみ記載する。

---

## 基本方針（プロジェクト固有）

- 早すぎる最適化は避ける
- ただしN+1問題など明らかな問題は最初から対策
- 計測してからボトルネックを特定

## 必須事項（プロジェクト固有）

### データベース
- 関連データはinclude/joinで一括取得（N+1対策）
- 必要なカラムのみ取得
- ページネーションを実装

### フロントエンド
- Next.js Imageコンポーネントを使用
- 大きなバンドルは分割（dynamic import）
