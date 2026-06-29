// =====================================================================
// Google Chat → Slack アラートシステム
// Google Apps Script で動作。5分ごとに自動実行。
//
// 設定方法:
//   1. スクリプトプロパティに以下を設定（後述の setupProperties() を参照）
//   2. トリガーを設定: setupTrigger() を一度だけ実行
// =====================================================================

// ---- 設定キー (スクリプトプロパティで管理) ----
const PROP_SLACK_WEBHOOK  = 'SLACK_WEBHOOK_URL';   // Slack Incoming Webhook URL
const PROP_GEMINI_API_KEY = 'GEMINI_API_KEY';       // Gemini API キー（省略可）
const PROP_LAST_CHECKED   = 'LAST_CHECKED_TIME';    // 最後にチェックした時刻（自動管理）
const PROP_SLACK_CHANNEL  = 'SLACK_CHANNEL';        // 通知先チャンネル名（例: #alerts）

// Google Chat通知メールの送信元
const GOOGLE_CHAT_SENDER = 'chat-noreply@google.com';

// 重要キーワード（Gemini未使用時のフォールバック判定）
const ALERT_KEYWORDS = [
  'エラー', 'error', 'Error', 'ERROR',
  '障害', '不具合', '異常', '停止',
  '緊急', '至急', 'urgent', 'URGENT',
  '失敗', 'failed', 'Failed', 'FAILED',
  'down', 'Down', 'DOWN',
  '警告', 'warning', 'Warning', 'WARNING',
  'クリティカル', 'critical', 'Critical',
  '本番', '本番環境',
  'バグ', 'bug', 'Bug',
];

// =====================================================================
// メイン処理（トリガーから呼び出される）
// =====================================================================
function checkGoogleChatAlerts() {
  const props = PropertiesService.getScriptProperties();
  const slackWebhookUrl = props.getProperty(PROP_SLACK_WEBHOOK);

  if (!slackWebhookUrl) {
    console.error('SLACK_WEBHOOK_URL が設定されていません。setupProperties() を実行してください。');
    return;
  }

  const lastChecked = parseInt(props.getProperty(PROP_LAST_CHECKED) || '0');
  const now = Date.now();

  // Gmail でGoogle Chat通知メールを検索
  const messages = fetchGoogleChatMessages(lastChecked);

  if (messages.length === 0) {
    console.log('新着のGoogle Chatメッセージはありません。');
    props.setProperty(PROP_LAST_CHECKED, String(now));
    return;
  }

  console.log(`${messages.length}件のメッセージを検出しました。`);

  const geminiApiKey = props.getProperty(PROP_GEMINI_API_KEY);
  const slackChannel = props.getProperty(PROP_SLACK_CHANNEL) || '#general';

  for (const msg of messages) {
    let isImportant = false;
    let reason = '';
    let summary = '';

    if (geminiApiKey) {
      // Gemini AIで判定
      const result = classifyWithGemini(msg, geminiApiKey);
      isImportant = result.isImportant;
      reason = result.reason;
      summary = result.summary;
    } else {
      // キーワードベース判定（フォールバック）
      const match = ALERT_KEYWORDS.find(kw => msg.body.includes(kw) || msg.subject.includes(kw));
      isImportant = !!match;
      reason = match ? `キーワード「${match}」を検出` : '';
      summary = msg.body.slice(0, 200);
    }

    if (isImportant) {
      sendSlackAlert({
        webhookUrl: slackWebhookUrl,
        channel: slackChannel,
        subject: msg.subject,
        body: msg.body,
        reason,
        summary,
        timestamp: msg.timestamp,
        chatSpace: msg.chatSpace,
      });
      console.log(`アラート送信: ${msg.subject}`);
    } else {
      console.log(`スキップ（重要でない）: ${msg.subject}`);
    }
  }

  props.setProperty(PROP_LAST_CHECKED, String(now));
}

// =====================================================================
// Gmail からGoogle Chat通知メールを取得
// =====================================================================
function fetchGoogleChatMessages(sinceTimestamp) {
  // Gmail検索クエリ: Google Chat通知 & 未読 & 指定時刻以降
  // sinceTimestamp が 0 の場合は直近24時間分を取得
  const afterDate = sinceTimestamp > 0
    ? new Date(sinceTimestamp)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const afterStr = Utilities.formatDate(afterDate, 'UTC', 'yyyy/MM/dd');
  const query = `from:(${GOOGLE_CHAT_SENDER}) after:${afterStr}`;

  const threads = GmailApp.search(query, 0, 50);
  const messages = [];

  for (const thread of threads) {
    const msgs = thread.getMessages();
    for (const msg of msgs) {
      const msgDate = msg.getDate();
      if (msgDate.getTime() <= sinceTimestamp) continue;

      const body = extractPlainText(msg.getPlainBody());
      const subject = msg.getSubject();

      // メール本文からスペース名を抽出（"〇〇 | Google Chat" のような形式）
      const chatSpace = extractChatSpace(subject);

      messages.push({
        subject,
        body,
        chatSpace,
        timestamp: msgDate.getTime(),
        messageId: msg.getId(),
      });
    }
  }

  // 古い順に並べる
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

// メール本文から不要な部分を除去
function extractPlainText(rawBody) {
  return rawBody
    .replace(/https?:\/\/[^\s]+/g, '[URL]') // URLを短縮
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 1000); // 1000文字に制限
}

// メール件名からGoogle Chatスペース名を抽出
function extractChatSpace(subject) {
  // 例: "田中さんが「スペース名」にメッセージを送信しました"
  const match = subject.match(/「(.+?)」/) || subject.match(/"(.+?)"/);
  return match ? match[1] : subject;
}

// =====================================================================
// Gemini AI で重要度判定
// =====================================================================
function classifyWithGemini(msg, apiKey) {
  const prompt = `
あなたはITシステムの監視担当者です。
以下のGoogle Chatメッセージを読み、システム障害・エラー・緊急対応が必要な内容かどうかを判定してください。

【メッセージ件名】
${msg.subject}

【メッセージ内容】
${msg.body}

以下のJSON形式のみで回答してください（説明不要）:
{
  "isImportant": true または false,
  "reason": "重要な理由を20文字以内で（重要でない場合は空文字）",
  "summary": "内容の要約を50文字以内"
}

判定基準:
- true: エラー、障害、停止、緊急、本番環境の問題、データ消失リスク、セキュリティインシデントなど
- false: 通常の業務連絡、雑談、情報共有、定例報告など
`.trim();

  try {
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        }),
        muteHttpExceptions: true,
      }
    );

    const result = JSON.parse(response.getContentText());
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Gemini API エラー:', e.message);
  }

  // フォールバック: キーワード判定
  const match = ALERT_KEYWORDS.find(kw => msg.body.includes(kw) || msg.subject.includes(kw));
  return {
    isImportant: !!match,
    reason: match ? `キーワード「${match}」を検出` : '',
    summary: msg.body.slice(0, 50),
  };
}

// =====================================================================
// Slack にアラート送信
// =====================================================================
function sendSlackAlert({ webhookUrl, channel, subject, body, reason, summary, timestamp, chatSpace }) {
  const date = new Date(timestamp);
  const dateStr = Utilities.formatDate(date, 'Asia/Tokyo', 'MM/dd HH:mm');

  const payload = {
    channel,
    username: 'Google Chat Monitor',
    icon_emoji: ':warning:',
    attachments: [
      {
        color: '#FF0000',
        pretext: ':rotating_light: *Google Chatで重要なメッセージを検知しました*',
        fields: [
          { title: 'スペース / 件名', value: chatSpace || subject, short: false },
          { title: '検知理由', value: reason || '重要メッセージ', short: true },
          { title: '受信時刻', value: dateStr, short: true },
          { title: '内容サマリー', value: summary || body.slice(0, 100), short: false },
        ],
        footer: 'Google Chat Alert Bot',
        ts: Math.floor(timestamp / 1000),
      },
    ],
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}

// =====================================================================
// 初期設定ユーティリティ
// =====================================================================

/**
 * 初回セットアップ: スクリプトプロパティを設定する
 * このコードの値を書き換えてから一度だけ実行する
 */
function setupProperties() {
  const props = PropertiesService.getScriptProperties();

  props.setProperties({
    [PROP_SLACK_WEBHOOK]:  'https://hooks.slack.com/services/XXXX/YYYY/ZZZZ', // ← 自分のWebhook URLに変更
    [PROP_GEMINI_API_KEY]: '',       // ← Gemini APIキーを入力（省略可：キーワード判定になる）
    [PROP_SLACK_CHANNEL]:  '#alerts', // ← 通知先チャンネル名
  });

  console.log('設定が完了しました。');
  console.log('次に setupTrigger() を実行してください。');
}

/**
 * トリガー設定: 5分ごとに checkGoogleChatAlerts() を実行
 * 一度だけ実行する
 */
function setupTrigger() {
  // 既存トリガーを削除（重複防止）
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'checkGoogleChatAlerts') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger('checkGoogleChatAlerts')
    .timeBased()
    .everyMinutes(5)
    .create();

  console.log('トリガーを設定しました。5分ごとに自動実行されます。');
}

/**
 * トリガー削除（停止したい時）
 */
function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'checkGoogleChatAlerts') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  console.log('トリガーを削除しました。');
}

/**
 * テスト実行: 直近24時間のメッセージを手動チェック
 */
function testRun() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(PROP_LAST_CHECKED, '0'); // リセットして直近24時間を対象に
  checkGoogleChatAlerts();
}

/**
 * Slack通知テスト
 */
function testSlackNotification() {
  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty(PROP_SLACK_WEBHOOK);
  const channel = props.getProperty(PROP_SLACK_CHANNEL) || '#alerts';

  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL が設定されていません。');
    return;
  }

  sendSlackAlert({
    webhookUrl,
    channel,
    subject: 'テスト通知',
    body: 'これはSlack通知のテストメッセージです。',
    reason: 'テスト実行',
    summary: 'テスト: Google Chat → Slack アラートが正常に動作しています',
    timestamp: Date.now(),
    chatSpace: 'テストスペース',
  });

  console.log('テスト通知を送信しました。');
}
