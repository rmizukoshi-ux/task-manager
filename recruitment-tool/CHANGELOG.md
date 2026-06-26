# CHANGELOG

## v2.0.0 — 2026-06-26

### 概要
スキルシート解析ツールを候補者レコード中心のフルATS（採用管理システム）に改修。

### schema
- `score_results` テーブルを削除（`scores` APIは互換のため維持）
- `candidates` テーブルを追加（id, name, initial, email, phone, channel, stage, score_total, score_grade, score_detail, skills_data, sheet_url, drive_files, strengths, note）
- `pipeline_history` テーブルを追加（ステージ変更履歴、ON DELETE CASCADE）

### backend（src/index.js）
- `src/html.js` を分割して HTML をモジュール化
- **候補者CRUD**: `GET/POST /api/candidates`、`GET/PUT/DELETE /api/candidates/:id`
- **ステージ管理**: `POST /api/candidates/:id/stage`（pipeline_history に自動記録）、`GET /api/candidates/:id/history`
- **重複チェック**: `GET /api/duplicate-check`（name/email/phone で OR 検索）
- **Drive連携**: `GET/POST /api/candidates/:id/drive`、`DELETE /api/candidates/:id/drive/:fileId`
- **ファネル分析**: `GET /api/funnel`（ステージ別人数・変換率）
- **バグ修正**: `apiAnalyze` の10,000字制限を撤廃、`max_tokens` を8,000に増加、JSON parse エラー詳細化
- **AI強化**: `apiAnalyze` に strengths 抽出ルール（5観点・数字付き）を追加
- **AI強化**: `apiQuestions` を score_detail / strengths / 直近3案件を使った個別化プロンプトに刷新、`max_tokens` 2,000

### frontend（src/html.js）
- タブ構成を4タブ → 6タブに再設計
  - **Tab1 候補者管理**: リストビュー／カンバンビュー切替、ステージ別カラム、候補者詳細モーダル（ステージ変更・メモ・履歴）、新規追加フォーム
  - **Tab2 スキルシート解析**: 解析完了後に「候補者レコードに保存」ボタンを追加
  - **Tab3 スコアリング**: 機能維持
  - **Tab4 面接質問**: 機能維持
  - **Tab5 ファネル分析**: ステージ別人数バー・変換率・集計サマリ
  - **Tab6 設定**: テンプレート管理（旧Tab4から移動）
- XSS対策用 `esc()` ヘルパーをテンプレート描画全箇所に適用

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
