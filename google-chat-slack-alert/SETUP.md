# Google Chat → Slack アラートシステム セットアップガイド

Google Chatの重要なメッセージを検知して、Slackに自動通知します。
**費用：無料**（Google Apps Script + Gemini API 無料枠 + Slack無料プラン）

---

## 仕組み

```
Gmail（Google Chat通知メール）
  ↓ 5分ごとにチェック
Google Apps Script
  ↓ Gemini AI で重要度を判定
Slack Incoming Webhook
  ↓
あなたのSlackチャンネルにアラート
```

**前提**: Google Chatの通知設定でメール転送が有効になっている必要があります。

---

## セットアップ手順

### 1. Slack Incoming Webhook URLを取得

1. Slackワークスペースで [api.slack.com/apps](https://api.slack.com/apps) を開く
2. **「Create New App」** → 「From scratch」
3. App名: `Google Chat Monitor`、ワークスペースを選択
4. **「Incoming Webhooks」** → オンに切り替え
5. **「Add New Webhook to Workspace」** → 通知先チャンネルを選択
6. 表示された Webhook URL をコピー（`https://hooks.slack.com/services/...`）

### 2. Gemini APIキーを取得（任意・推奨）

1. [Google AI Studio](https://aistudio.google.com/) を開く
2. **「Get API Key」** → 「Create API key」
3. APIキーをコピー

> **省略した場合**: キーワード（エラー・障害・緊急など）でのみ判定します。

### 3. Google Chatのメール通知を有効化

1. Google Chat を開く（chat.google.com）
2. **設定** → **「通知」**
3. 通知方法: **「メールで受信」** をオンにする

### 4. Google Apps Scriptを作成

1. [script.google.com](https://script.google.com/) を開く
2. **「新しいプロジェクト」** をクリック
3. プロジェクト名を `Google Chat Slack Alert` に変更
4. `コード.gs` の中身を削除し、**`Code.gs` の内容をすべて貼り付け**
5. 左メニューの歯車アイコン（プロジェクトの設定）を開く
6. **「appsscript.json マニフェストファイルをエディタで表示する」** をオン
7. `appsscript.json` の内容を本リポジトリの `appsscript.json` で上書き

### 5. 初期設定を実行

1. Apps Script エディタで `setupProperties` 関数を選択
2. `Code.gs` の `setupProperties()` 内の値を書き換える:
   ```javascript
   [PROP_SLACK_WEBHOOK]:  'https://hooks.slack.com/services/実際のURL',
   [PROP_GEMINI_API_KEY]: '実際のAPIキー（省略可）',
   [PROP_SLACK_CHANNEL]:  '#alerts', // 通知先チャンネル
   ```
3. **「実行」** ボタンを押す
4. 初回は権限確認ダイアログが出るので **「許可」**

### 6. 動作テスト

1. `testSlackNotification` 関数を選択して実行
2. Slackに通知が届くことを確認

### 7. 自動実行トリガーを設定

1. `setupTrigger` 関数を選択して実行
2. 「5分ごとに自動実行されます」と表示されれば完了

---

## 動作確認

### ログの見方
- Apps Script エディタ → **「実行数」** メニュー
- 各実行のログ・エラーが確認できる

### テスト方法
```
testRun() を実行 → 直近24時間のGoogle Chatメールを手動チェック
```

---

## カスタマイズ

### 監視キーワードを追加（Gemini未使用時）

`Code.gs` の `ALERT_KEYWORDS` 配列にキーワードを追加:

```javascript
const ALERT_KEYWORDS = [
  'エラー', 'error', '障害',
  // ← ここに追加
  '自社キーワード', 'プロジェクト名',
];
```

### チェック間隔を変更

`setupTrigger()` 内を変更（最短1分）:

```javascript
.everyMinutes(5)  // ← 1, 5, 10, 15, 30 分から選択
```

### 通知先チャンネルを複数にしたい場合

`Code.gs` に複数のWebhook URLを設定して `sendSlackAlert()` を複数回呼ぶことで対応可能。

---

## 停止方法

Apps Script エディタで `removeTrigger()` を実行。

---

## 費用

| サービス | 無料枠 | 超過時 |
|----------|--------|--------|
| Google Apps Script | 実行6分/日、トリガー20個 | 超過なし（制限に達したら止まるだけ） |
| Gemini 1.5 Flash | 1日1,500リクエスト | 超過後は翌日にリセット |
| Slack Incoming Webhook | 無制限 | 無料 |

5分ごと実行 = 1日288回 → Gemini無料枠（1,500回/日）で十分対応可能。
