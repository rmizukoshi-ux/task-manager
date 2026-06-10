# CHANGELOG

## 2026-06-10

### fix
- `SyntaxError: Unexpected string` 修正: HTMLテンプレートリテラル内の `\'` を data属性方式に変更 (`renderQItem`, `loadTemplates`, `querySelector`)
- `toggleQ` / `memoQ` を id文字列ではなく DOM要素（`this`）受け取りに変更

### feat
- スコアリング結果の蓄積機能: D1 `score_results` テーブル + `POST /api/scores` + `GET /api/scores`
- スコアリングページに候補者名入力・保存ボタン・リセットボタン・履歴テーブル・詳細ダイアログを追加

### fix
- 面接質問: AI生成・D1テンプレート取得を独立した try/catch に分離し、どちらが失敗しても残りを表示
- 面接質問: スキルシート作成後に常に `renderQuestions()` を呼ぶよう修正（エラー時も表示）
- ページ初期化時に `loadScoreHistory()` を呼ぶよう修正
