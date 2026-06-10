const TEMPLATE_ID    = '1z8505JYG1GgXtSSov2OinavTOacKtXedd3GgLm9i3M0';
const DEST_FOLDER_ID = '1ciU0zvQexK3d264teCOeesj_1LLJFJjR';
const SCOPES         = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email';
const ALLOWED_DOMAIN = 'a-cial.com';

// ── ルーティング ────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p   = url.pathname;
    const m   = request.method;

    if (p === '/auth/start')           return authStart(env);
    if (p === '/auth/callback')        return authCallback(request, env);
    if (p === '/auth/google/callback') return authCallback(request, env);
    if (p === '/auth/debug')           return authDebug(request, env);

    if (p === '/api/analyze'   && m === 'POST') return apiAnalyze(request, env);
    if (p === '/api/sheet'     && m === 'POST') return apiSheet(request, env);
    if (p === '/api/questions' && m === 'POST') return apiQuestions(request, env);

    // スコア蓄積
    if (p === '/api/scores' && m === 'GET')  return scoreList(env);
    if (p === '/api/scores' && m === 'POST') return scoreSave(request, env);
    if (p.startsWith('/api/scores/') && m === 'DELETE') return scoreDelete(env, p.split('/')[3]);
    if (p.startsWith('/api/scores/') && m === 'PUT')    return scoreUpdate(request, env, p.split('/')[3]);

    // テンプレートCRUD
    if (p === '/api/templates' && m === 'GET')    return tplList(env);
    if (p === '/api/templates' && m === 'POST')   return tplCreate(request, env);
    if (p.startsWith('/api/templates/') && m === 'PUT')    return tplUpdate(request, env, p.split('/')[3]);
    if (p.startsWith('/api/templates/') && m === 'DELETE') return tplDelete(env, p.split('/')[3]);

    return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  },
};

// ── OAuth ───────────────────────────────────────────────────────────
function authStart(env) {
  const q = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code', scope: SCOPES, access_type: 'offline', prompt: 'consent',
  });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q}`, 302);
}

async function authCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error || !code) {
    return Response.redirect(`${new URL('/', request.url).href}?auth_err=${encodeURIComponent('Googleから拒否: ' + (error || 'コードなし'))}`, 302);
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, grant_type: 'authorization_code',
      client_id: env.GOOGLE_CLIENT_ID || '', client_secret: env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: env.GOOGLE_CALLBACK_URL || '' }),
  });
  const tok = await res.json();
  if (!tok.access_token) {
    const msg = encodeURIComponent('トークン取得失敗: ' + (tok.error_description || tok.error || JSON.stringify(tok)));
    return Response.redirect(`${new URL('/', request.url).href}?auth_err=${msg}`, 302);
  }

  // ドメインチェック
  const uInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  }).then(r => r.json()).catch(() => ({}));
  const email = uInfo.email || '';
  if (!email.endsWith('@' + ALLOWED_DOMAIN)) {
    const msg = encodeURIComponent(`アクセス拒否: ${email || '不明'} は許可されたドメインではありません（${ALLOWED_DOMAIN}のみ）`);
    return Response.redirect(`${new URL('/', request.url).href}?auth_err=${msg}`, 302);
  }

  const expiry = Date.now() + (tok.expires_in || 3600) * 1000;
  const ref = tok.refresh_token ? `localStorage.setItem('g_ref',${JSON.stringify(tok.refresh_token)});` : '';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>
try {
  localStorage.setItem('g_tok',${JSON.stringify(tok.access_token)});
  localStorage.setItem('g_exp',${JSON.stringify(String(expiry))});
  localStorage.setItem('g_email',${JSON.stringify(email)});
  ${ref}
  location.replace('/');
} catch(e) { location.replace('/?auth_err='+encodeURIComponent('localStorage: '+e.message)); }
</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function authDebug(request, env) {
  const info = {
    GOOGLE_CLIENT_ID:    env.GOOGLE_CLIENT_ID    ? env.GOOGLE_CLIENT_ID.slice(0,12)+'...' : '未設定',
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET ? '設定済み' : '未設定',
    GOOGLE_CALLBACK_URL: env.GOOGLE_CALLBACK_URL || '未設定',
    expected_callback:   new URL('/auth/callback', request.url).href,
    callback_matches:    env.GOOGLE_CALLBACK_URL === new URL('/auth/callback', request.url).href,
    ALLOWED_DOMAIN,
  };
  return new Response(JSON.stringify(info, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

// ── テンプレートCRUD ─────────────────────────────────────────────────
const J = { 'Content-Type': 'application/json; charset=utf-8' };
async function tplList(env) {
  const rows = await env.DB.prepare('SELECT * FROM q_templates ORDER BY category, sort_order').all();
  return new Response(JSON.stringify(rows.results), { headers: J });
}
async function tplCreate(request, env) {
  const { category, question } = await request.json();
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO q_templates (id,category,question) VALUES (?,?,?)').bind(id, category, question).run();
  return new Response(JSON.stringify({ id }), { headers: J });
}
async function tplUpdate(request, env, id) {
  const { question } = await request.json();
  await env.DB.prepare('UPDATE q_templates SET question=? WHERE id=?').bind(question, id).run();
  return new Response(JSON.stringify({ ok: true }), { headers: J });
}
async function tplDelete(env, id) {
  await env.DB.prepare('DELETE FROM q_templates WHERE id=?').bind(id).run();
  return new Response(JSON.stringify({ ok: true }), { headers: J });
}

// ── AI 解析 ─────────────────────────────────────────────────────────
async function apiAnalyze(request, env) {
  try {
    const { initial, month, price, pdfText } = await request.json();
    if (!pdfText || !initial || !month || !price)
      return new Response(JSON.stringify({ error: '必要なデータが不足しています' }), { status: 400, headers: J });
    const text = pdfText.length > 10000 ? pdfText.slice(0, 10000) + '\n...' : pdfText;
    const today = new Date();
    const nowYM = `${today.getFullYear()}年${today.getMonth() + 1}月`;

    const prompt = `スキルシートを解析し、以下のJSONのみを出力してください。余計な説明は一切不要です。

入力: イニシャル=${initial} 入社月=${month}月 単価=${price}万 現在=${nowYM}

スキルシート:
${text}

【抽出ルール】
- selfPR: 自己PRを300文字程度に要約（重要なスキル・実績・強みを残す）
- qualifications: 取得資格（なければ必ず空文字。"不明"や"なし"は書かない）
- positionYears: 各ポジションの合計経験年数。経験なしは空文字。「X年Xか月」形式
- processYears: 各工程の合計経験年数。経験なしは空文字
- devEnv: 開発環境・言語・OSを経験年数が長い順に列挙。「X年Xか月」形式
- projects: 案件を【新しい順】に並べる。contentは案件名のみ30〜50文字以内（詳細説明・箇条書き不要。■【】は除く）
- position: 「PM」→「プロジェクトマネージャー」、「PL」→「プロジェクトリーダー」、「SE」→「SE」、「PG」→「PG」、「PMO」→「PMO」
- teamSize: 「1-4名」「5-10名」「11-20名」「21名以上」のいずれか
- devEnv（案件内）: カンマ区切り（例: "iOS, Android"）
- processes: 担当工程リスト。選択肢: ["調査・管理","要件定義","基本設計","詳細設計","製造","テスト","運用・保守"]

出力JSON（このフォーマットのみ）:
{
  "selfPR":"自己PR300文字程度",
  "qualifications":"取得資格（なければ空文字）",
  "positionYears":{"PM":"","PL":"X年Xか月","PMO":"","SE":"","PG":""},
  "processYears":{"調査・管理":"X年Xか月","要件定義":"","基本設計":"","詳細設計":"","製造":"","テスト":"X年Xか月","運用・保守":""},
  "devEnv":[{"name":"Android","years":"X年Xか月"}],
  "projects":[{"position":"プロジェクトリーダー","startMonth":"2024年4月","endMonth":"2026年3月","teamSize":"11-20名","processes":["テスト"],"content":"某キャリア向けアプリ検証","devEnv":"iOS, Android"}],
  "skills":{"experience":"PL、QAエンジニア","devEnvSummary":"iOS、Android","tools":"MagicPod","strengths":["強み1","強み2","強み3"]}
}`;

    const ai = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: 'JSONのみ出力。前置きや説明は不要。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
    });
    const raw = ai?.response || '';
    const m2 = raw.match(/\{[\s\S]*\}/);
    if (!m2) throw new Error('AI応答からJSONを取得できませんでした: ' + raw.slice(0, 200));
    const data = JSON.parse(m2[0]);
    return new Response(JSON.stringify({ summary: buildSummary(initial, month, price, data), data }), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

function buildSummary(initial, month, price, d) {
  const s = d.skills || {};
  const strengths = (s.strengths || []).map(x => `・${x}`).join('\n');
  return `〇${month}月稼働
商流：弊社の正社員
平行：提案のみ
ｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰ
【氏　名】${initial}
【所　属】弊社正社員
【スキル】
▼担当経験
${s.experience || '　'}
▼開発環境
${s.devEnvSummary || '　'}
▼ツール他
${s.tools || '　'}
【単価】${price}万円
【契約形態】準委任／派遣
【稼働】${month}月〜
【備考】
${strengths || '　'}
ｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰｰ`;
}

// ── AI 面接質問生成 ──────────────────────────────────────────────────
async function apiQuestions(request, env) {
  const { data } = await request.json();

  // AI生成（失敗しても続行）
  let aiQ = {};
  try {
    const profile = `スキル概要: ${data.skills?.experience || ''}
開発環境: ${data.skills?.devEnvSummary || ''}
ポジション経験: ${JSON.stringify(data.positionYears || {})}
工程経験: ${JSON.stringify(data.processYears || {})}
最新案件: ${(data.projects || []).slice(0, 2).map(p => p.content).join('、')}`;
    const prompt = `以下の候補者プロフィールに基づき、面接で使える深掘り質問を日本語で生成してください。JSONのみ出力。説明不要。
候補者プロフィール:
${profile}
出力形式:
{"技術深掘り":["質問1","質問2","質問3"],"上流工程・PM経験":["質問1","質問2"],"AI活用":["質問1","質問2"]}
各カテゴリ2〜3問。候補者の経験に具体的に即した質問にすること。`;
    const ai = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'system', content: 'JSONのみ出力。' }, { role: 'user', content: prompt }],
      max_tokens: 1500,
    });
    const raw = ai?.response || '';
    const m2 = raw.match(/\{[\s\S]*\}/);
    if (m2) aiQ = JSON.parse(m2[0]);
  } catch (_) {}

  // D1テンプレート（失敗しても続行）
  const tpl = {};
  try {
    const tplRows = await env.DB.prepare('SELECT * FROM q_templates ORDER BY category, sort_order').all();
    for (const r of (tplRows.results || [])) {
      if (!tpl[r.category]) tpl[r.category] = [];
      tpl[r.category].push({ id: r.id, question: r.question });
    }
  } catch (_) {}

  return new Response(JSON.stringify({ aiQuestions: aiQ, templates: tpl }), { headers: J });
}

// ── スコア蓄積 ──────────────────────────────────────────────────────
async function scoreList(env) {
  try {
    const rows = await env.DB.prepare('SELECT * FROM score_results ORDER BY created_at DESC LIMIT 100').all();
    return new Response(JSON.stringify(rows.results || []), { headers: J });
  } catch (_) {
    return new Response('[]', { headers: J });
  }
}

async function scoreUpdate(request, env, id) {
  try {
    const { status } = await request.json();
    await env.DB.prepare('UPDATE score_results SET status = ? WHERE id = ?').bind(status, id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

async function scoreDelete(env, id) {
  try {
    await env.DB.prepare('DELETE FROM score_results WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

async function scoreSave(request, env) {
  try {
    const { candidate, fullname, status, total, grade, detail } = await request.json();
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO score_results (id,candidate,fullname,status,total,grade,detail) VALUES (?,?,?,?,?,?,?)')
      .bind(id, candidate || '不明', fullname || '', status || '', total, grade, JSON.stringify(detail)).run();
    return new Response(JSON.stringify({ ok: true }), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

// ── シート作成・転記 ────────────────────────────────────────────────
async function apiSheet(request, env) {
  try {
    const { initial, data, accessToken } = await request.json();
    if (!accessToken) return new Response(JSON.stringify({ error: 'Google認証が必要です' }), { status: 401, headers: J });
    const auth = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const copyRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${TEMPLATE_ID}/copy?supportsAllDrives=true`,
      { method: 'POST', headers: auth, body: JSON.stringify({ name: `スキルシート_${initial}`, parents: [DEST_FOLDER_ID] }) }
    );
    if (!copyRes.ok) {
      const e = await copyRes.json().catch(() => ({}));
      throw new Error(`コピー失敗(${copyRes.status}): ${e.error?.message || JSON.stringify(e)}`);
    }
    const { id: sid } = await copyRes.json();

    const infoRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}`, { headers: auth });
    const info = await infoRes.json();
    const tab = info.sheets?.find(s => s.properties.title === '経験者用');
    const tabId = tab ? tab.properties.sheetId : 0;

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}:batchUpdate`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ requests: [{ updateSheetProperties: { properties: { sheetId: tabId, title: initial }, fields: 'title' } }] }),
    });

    const cellData = buildCellValues(initial, data);
    const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values:batchUpdate`,
      { method: 'POST', headers: auth, body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: cellData }) }
    );
    const writeBody = await writeRes.json();
    const writeErr = !writeRes.ok ? (writeBody.error?.message || `HTTP ${writeRes.status}`) : null;

    return new Response(JSON.stringify({ sheetUrl: `https://docs.google.com/spreadsheets/d/${sid}/edit`, writeErr }), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

function buildCellValues(tabName, d) {
  const t = tabName.replace(/'/g, "\\'");
  const out = [];
  const add = (range, val) => {
    if (val !== null && val !== undefined && val !== '') out.push({ range: `'${t}'!${range}`, values: [[String(val)]] });
  };
  add('F4', tabName);
  if (d.selfPR) add('F5', d.selfPR);
  if (d.qualifications) add('F9', d.qualifications);
  ['PM','PL','PMO','SE','PG'].forEach((p, i) => { if (d.positionYears?.[p]) add(`E${15+i}`, d.positionYears[p]); });
  ['調査・管理','要件定義','基本設計','詳細設計','製造','テスト','運用・保守'].forEach((p, i) => { if (d.processYears?.[p]) add(`J${15+i}`, d.processYears[p]); });
  (d.devEnv || []).forEach((e, i) => {
    if (i >= 21) return;
    let row, nc, yc;
    if (i < 7)       { row = 15+i;     nc='M'; yc='P'; }
    else if (i < 14) { row = 15+(i-7); nc='S'; yc='V'; }
    else             { row = 15+(i-14);nc='Y'; yc='AB'; }
    add(`${nc}${row}`, e.name); add(`${yc}${row}`, e.years);
  });
  const procOff = { '調査・管理':2,'要件定義':4,'基本設計':6,'詳細設計':8,'製造':10,'テスト':12,'運用・保守':14 };
  (d.projects || []).forEach((proj, idx) => {
    if (idx >= 20) return;
    const f = 23 + idx * 16;
    add(`V${f}`, proj.position); add(`G${f}`, proj.startMonth); add(`L${f}`, proj.endMonth);
    add(`AC${f}`, proj.teamSize); add(`G${f+2}`, proj.content); add(`V${f+2}`, proj.devEnv);
    (proj.processes || []).forEach(proc => { const off = procOff[proc]; if (off !== undefined) add(`F${f+off}`, '〇'); });
  });
  return out;
}

// ── HTML ─────────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>採用ツール</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans JP',sans-serif;background:#f3f4f6;color:#111827;min-height:100vh;font-size:14px;}
header{background:#111827;color:#f9fafb;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
header h1{font-size:16px;font-weight:700;letter-spacing:.04em;}
.auth-area{display:flex;align-items:center;gap:8px;}
.auth-badge{font-size:11px;padding:3px 8px;border-radius:4px;}
.auth-badge.ok{background:#d1fae5;color:#065f46;}
.auth-badge.ng{background:#fee2e2;color:#991b1b;}

/* Nav tabs */
.nav-tabs{background:#1f2937;display:flex;gap:2px;padding:0 24px;}
.nav-tab{padding:10px 18px;font-size:12px;font-weight:600;color:#9ca3af;border:none;background:none;font-family:inherit;cursor:pointer;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;}
.nav-tab.active{color:#fff;border-bottom-color:#6366f1;}
.nav-tab:hover:not(.active){color:#d1d5db;}

.page{display:none;} .page.active{display:block;}
.wrap{max-width:800px;margin:32px auto;padding:0 16px 60px;}

/* Cards */
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.06);}
.card-title{font-size:13px;font-weight:700;color:#374151;margin-bottom:16px;display:flex;align-items:center;gap:6px;}
.badge{background:#111827;color:#fff;border-radius:4px;padding:2px 7px;font-size:10px;}
.badge-indigo{background:#6366f1;}
.badge-green{background:#059669;}
.badge-orange{background:#d97706;}

.flabel{display:block;font-size:11px;color:#6b7280;margin-bottom:4px;font-weight:600;letter-spacing:.04em;}
input[type=text],input[type=number],textarea,select{width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:7px;font-family:inherit;font-size:13px;color:#111827;outline:none;transition:border .15s,box-shadow .15s;background:#fff;}
input:focus,textarea:focus,select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);}
textarea{resize:vertical;min-height:120px;}
.frow{display:flex;gap:12px;} .frow .fg{flex:1;}

/* Tab bar inside card */
.tab-bar{display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:16px;}
.tab{padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:none;font-family:inherit;color:#6b7280;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s;}
.tab.active{color:#111827;border-bottom-color:#111827;}
.tab-panel{display:none;} .tab-panel.active{display:block;}

/* Upload */
.upload-zone{border:2px dashed #d1d5db;border-radius:8px;padding:28px 24px;text-align:center;cursor:pointer;transition:border .2s,background .2s;position:relative;}
.upload-zone:hover,.upload-zone.drag{border-color:#6366f1;background:#eef2ff;}
.upload-zone .icon{font-size:28px;margin-bottom:6px;}
.upload-zone p{font-size:13px;color:#6b7280;} .upload-zone p strong{color:#111827;} .upload-zone p.sub{font-size:11px;margin-top:3px;color:#9ca3af;}
#pdf-input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.file-list{margin-top:10px;display:flex;flex-direction:column;gap:6px;}
.file-row{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:7px;border:1px solid #e5e7eb;background:#f9fafb;font-size:12px;}
.file-row .fn{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#374151;}
.file-row .fc{color:#9ca3af;font-size:11px;flex-shrink:0;}
.file-row .fs{flex-shrink:0;font-size:11px;font-weight:700;}
.file-row.loading .fs{color:#1e40af;} .file-row.ok .fs{color:#166534;} .file-row.err .fs{color:#b91c1c;}
.file-row.ok{border-color:#86efac;background:#f0fdf4;} .file-row.err{border-color:#fca5a5;background:#fef2f2;}
.del-btn{flex-shrink:0;width:18px;height:18px;border-radius:4px;border:none;background:transparent;color:#9ca3af;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;padding:0;transition:background .1s,color .1s;}
.del-btn:hover{background:#fee2e2;color:#b91c1c;}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;border-radius:8px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:background .15s,box-shadow .15s;}
.btn-primary{background:#111827;color:#fff;width:100%;}
.btn-primary:hover:not(:disabled){background:#1f2937;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;}
.btn-google{background:#fff;color:#374151;border:1px solid #d1d5db;padding:7px 14px;font-size:12px;}
.btn-google:hover{background:#f9fafb;}
.btn-sm{padding:5px 12px;font-size:12px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;cursor:pointer;font-family:inherit;border-radius:6px;}
.btn-sm:hover{background:#e5e7eb;}
.btn-danger{background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;}
.btn-danger:hover{background:#fecaca;}

/* Progress */
.progress{display:none;margin-top:14px;}
.progress.show{display:block;}
.step-list{display:flex;flex-direction:column;gap:6px;margin-top:8px;}
.prog-step{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:7px;background:#f9fafb;border:1px solid #e5e7eb;font-size:12px;color:#6b7280;}
.prog-step .picon{width:18px;height:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.prog-step.active{background:#eff6ff;border-color:#bfdbfe;color:#1e40af;font-weight:600;}
.prog-step.done{background:#f0fdf4;border-color:#86efac;color:#166534;}
.prog-step.err{background:#fef2f2;border-color:#fca5a5;color:#b91c1c;}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid #bfdbfe;border-top-color:#1e40af;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

/* Result */
.err-box{padding:10px 14px;border-radius:7px;font-size:12px;margin-top:10px;background:#fef2f2;border:1px solid #fca5a5;color:#b91c1c;display:none;white-space:pre-wrap;}
.result{display:none;} .result.show{display:block;}
.result-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.result-label{font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.04em;}
.copy-btn{padding:4px 10px;border-radius:5px;border:1px solid #d1d5db;background:#fff;font-size:11px;cursor:pointer;font-family:inherit;transition:background .1s;}
.copy-btn:hover{background:#f3f4f6;} .copy-btn.copied{border-color:#86efac;color:#166534;background:#f0fdf4;}
.pre-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:14px;font-family:'Courier New',monospace;font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-word;max-height:360px;overflow-y:auto;}
.sheet-banner{margin-top:12px;padding:16px 20px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.sheet-banner .sb-text{font-size:13px;font-weight:700;color:#166534;}
.sheet-banner .sb-sub{font-size:11px;color:#059669;margin-top:2px;}
.sheet-link{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:7px;background:#111827;color:#fff;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap;transition:background .15s;}
.sheet-link:hover{background:#1f2937;}

/* Scoring */
.status-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;}
.status-tab{padding:4px 11px;border-radius:20px;border:1px solid #d1d5db;background:#fff;font-size:11px;cursor:pointer;white-space:nowrap;color:#374151;font-family:inherit;transition:all .15s;}
.status-tab:hover{border-color:#9ca3af;}
.status-tab.active{border-color:transparent;color:#fff;font-weight:600;}
.score-grid{display:flex;flex-direction:column;gap:12px;}
.score-row{display:flex;align-items:center;gap:12px;}
.score-label{flex:1;font-size:12px;font-weight:600;color:#374151;}
.score-select{flex:2;padding:7px 10px;border-radius:7px;border:1px solid #d1d5db;font-size:12px;font-family:inherit;}
.score-pts{flex-shrink:0;width:44px;text-align:center;font-size:13px;font-weight:700;color:#6366f1;}
.score-result{display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:10px;margin-top:16px;border:2px solid;}
.score-result.A{background:#f0fdf4;border-color:#86efac;}
.score-result.B{background:#eff6ff;border-color:#bfdbfe;}
.score-result.C{background:#fffbeb;border-color:#fcd34d;}
.score-result.D{background:#fef2f2;border-color:#fca5a5;}
.score-total{font-size:28px;font-weight:700;}
.score-total.A{color:#166534;} .score-total.B{color:#1e40af;} .score-total.C{color:#92400e;} .score-total.D{color:#b91c1c;}
.score-judge{font-size:20px;font-weight:700;}
.score-judge.A{color:#166534;} .score-judge.B{color:#1e40af;} .score-judge.C{color:#92400e;} .score-judge.D{color:#b91c1c;}
.score-desc{font-size:12px;color:#6b7280;}

/* Interview Questions */
.q-category{margin-bottom:20px;}
.q-cat-header{font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;padding:8px 12px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:space-between;}
.q-cat-badge{font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;}
.q-ai-badge{background:#ede9fe;color:#6d28d9;}
.q-tpl-badge{background:#e0f2fe;color:#075985;}
.q-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:7px;border:1px solid #e5e7eb;margin-bottom:6px;background:#fff;}
.q-item.selected{background:#f5f3ff;border-color:#c4b5fd;}
.q-check{margin-top:2px;width:16px;height:16px;flex-shrink:0;cursor:pointer;}
.q-content{flex:1;}
.q-text{font-size:12px;color:#374151;line-height:1.6;}
.q-memo{width:100%;margin-top:6px;padding:6px 8px;border:1px solid #d1d5db;border-radius:5px;font-size:11px;font-family:inherit;resize:vertical;min-height:50px;display:none;}
.q-item.selected .q-memo{display:block;}
.q-actions{display:flex;gap:8px;margin-top:8px;}

/* Template manager */
.tpl-item{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:7px;border:1px solid #e5e7eb;margin-bottom:6px;background:#fff;}
.tpl-text{flex:1;font-size:12px;color:#374151;}
.tpl-cat{font-size:10px;padding:2px 6px;border-radius:4px;background:#e0f2fe;color:#075985;font-weight:600;flex-shrink:0;}
.add-form{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
.add-form select,.add-form input{flex:1;min-width:120px;}
</style>
</head>
<body>
<header>
  <h1>採用管理ツール</h1>
  <div class="auth-area">
    <span class="auth-badge ng" id="auth-badge">未接続</span>
    <span id="auth-email" style="font-size:11px;color:#9ca3af;"></span>
    <button class="btn btn-google" id="auth-btn" onclick="handleAuth()">Googleと連携</button>
  </div>
</header>

<div class="nav-tabs">
  <button class="nav-tab active" onclick="showPage('page-sheet',this)">スキルシート作成</button>
  <button class="nav-tab" id="nav-score" onclick="showPage('page-score',this)">スコアリング</button>
  <button class="nav-tab" onclick="showPage('page-questions',this)">面接質問</button>
  <button class="nav-tab" onclick="showPage('page-tpl',this)">テンプレート管理</button>
</div>

<!-- ===== スキルシート ===== -->
<div id="page-sheet" class="page active">
<div class="wrap">

  <div class="card">
    <div class="card-title"><span class="badge">STEP 1</span> 基本情報</div>
    <div class="frow">
      <div class="fg"><label class="flabel">イニシャル（例：Y.M）</label><input type="text" id="initial" placeholder="Y.M" oninput="checkReady()"></div>
      <div class="fg"><label class="flabel">入社月（例：7）</label><input type="number" id="month" placeholder="7" min="1" max="12" oninput="checkReady()"></div>
      <div class="fg"><label class="flabel">単価（万円）</label><input type="number" id="price" placeholder="65" oninput="checkReady()"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-title"><span class="badge">STEP 2</span> スキルシート</div>
    <div class="tab-bar">
      <button class="tab active" onclick="switchTab('tab-upload',this)">📄 PDFをアップロード</button>
      <button class="tab" onclick="switchTab('tab-paste',this)">📋 テキスト貼り付け</button>
    </div>
    <div id="tab-upload" class="tab-panel active">
      <div class="upload-zone" id="drop-zone">
        <input type="file" id="pdf-input" accept=".pdf" multiple onchange="handleFiles(this.files)">
        <div class="icon">📄</div>
        <p><strong>クリックしてPDFを選択</strong>（複数可）</p>
        <p class="sub">またはここにドラッグ＆ドロップ</p>
      </div>
      <div class="file-list" id="file-list"></div>
    </div>
    <div id="tab-paste" class="tab-panel">
      <label class="flabel">スキルシートのテキストを貼り付け</label>
      <p style="font-size:11px;color:#6b7280;margin-bottom:8px">PDFをChromeで開き Ctrl+A → Ctrl+C → 貼り付け</p>
      <textarea id="paste-text" placeholder="ここに貼り付け..." oninput="checkReady()"></textarea>
    </div>
  </div>

  <div class="card">
    <div class="card-title"><span class="badge">STEP 3</span> 解析してシートを自動作成</div>
    <button class="btn btn-primary" id="run-btn" onclick="run()" disabled>解析してスプレッドシートに自動転記する</button>
    <div class="progress" id="progress">
      <div class="step-list">
        <div class="prog-step" id="ps1"><div class="picon">1</div>AIがPDFを解析中...</div>
        <div class="prog-step" id="ps2"><div class="picon">2</div>スプレッドシートをコピー中...</div>
        <div class="prog-step" id="ps3"><div class="picon">3</div>データを転記中...</div>
        <div class="prog-step" id="ps4"><div class="picon">4</div>面接質問を生成中...</div>
      </div>
    </div>
    <div class="err-box" id="error-box"></div>
  </div>

  <div class="card result" id="result-card">
    <div class="card-title"><span class="badge badge-green">完了</span> 作成完了</div>
    <div class="sheet-banner">
      <div><div class="sb-text">✓ スプレッドシートに転記しました</div><div class="sb-sub">内容を確認してから共有してください</div></div>
      <a class="sheet-link" id="sheet-link" href="#" target="_blank">スプレッドシートを開く →</a>
    </div>
    <div style="margin-top:20px">
      <div class="result-header">
        <div class="result-label">営業・採用向けサマリ</div>
        <button class="copy-btn" id="cs-btn" onclick="copyText('summary-text','cs-btn')">コピー</button>
      </div>
      <div class="pre-box" id="summary-text"></div>
    </div>
    <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:16px;">
      <div class="result-header" style="margin-bottom:10px;">
        <div class="result-label">生成された面接質問</div>
        <button class="copy-btn" onclick="copyQuestions()">選択してコピー</button>
      </div>
      <div id="result-questions" style="font-size:12px;color:#374151;line-height:1.7;"></div>
    </div>
  </div>

</div>
</div>

<!-- ===== スコアリング ===== -->
<div id="page-score" class="page">
<div class="wrap">
  <div class="card">
    <div class="card-title"><span class="badge badge-indigo">スコアリング</span> 候補者評価（手動入力）</div>
    <div id="score-sheet-ref" style="display:none;margin-bottom:14px;padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;align-items:center;justify-content:space-between;">
      <span style="font-size:12px;color:#374151;font-weight:600;">関連スキルシート</span>
      <a id="score-sheet-url" href="#" target="_blank" style="font-size:12px;color:#2563eb;text-decoration:none;">スプレッドシートを開く →</a>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
      <div>
        <label style="font-size:11px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">候補者名（イニシャル等）</label>
        <input id="score-candidate" placeholder="例: A.Y" style="width:140px;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;">
      </div>
      <div>
        <label style="font-size:11px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">フルネーム</label>
        <input id="score-fullname" placeholder="例: 山田 太郎" style="width:180px;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;">
      </div>
    </div>
    <div class="score-grid" id="score-grid"></div>
    <div class="score-result D" id="score-result" style="margin-top:16px;">
      <div>
        <div class="score-total D" id="score-total">0</div>
        <div style="font-size:11px;color:#6b7280;">/ 16点</div>
      </div>
      <div>
        <div class="score-judge D" id="score-judge">D</div>
        <div class="score-desc" id="score-desc">見送り</div>
      </div>
      <div style="flex:1;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn-sm" onclick="saveScore()">保存する</button>
        <button class="btn-sm" onclick="copyScore()">コピー</button>
        <button class="btn-sm" onclick="resetScore()">リセット</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-title"><span class="badge badge-indigo">蓄積データ</span> スコア履歴</div>
    <div id="score-history"><p style="font-size:12px;color:#9ca3af;text-align:center;padding:16px 0;">読み込み中...</p></div>
  </div>
</div>
</div>

<!-- ===== 面接質問 ===== -->
<div id="page-questions" class="page">
<div class="wrap">
  <div class="card">
    <div class="card-title"><span class="badge badge-indigo">面接質問</span> 質問を選択・メモ追記</div>
    <p style="font-size:12px;color:#6b7280;margin-bottom:16px">スキルシートを完成させると上部にAI生成の質問が追加されます。チェックした質問と面接メモをコピーできます。</p>
    <div id="q-container">
      <p style="font-size:12px;color:#9ca3af;text-align:center;padding:32px 0;">スキルシートを作成するとAI生成質問が追加されます</p>
    </div>
    <div class="q-actions" style="margin-top:12px;">
      <button class="btn-sm" onclick="copyQuestions()">選択した質問をコピー</button>
      <button class="btn-sm" onclick="resetQuestions()">選択をリセット</button>
    </div>
  </div>
</div>
</div>

<!-- ===== テンプレート管理 ===== -->
<div id="page-tpl" class="page">
<div class="wrap">
  <div class="card">
    <div class="card-title"><span class="badge badge-orange">テンプレート管理</span> 面接質問テンプレートの追加・編集・削除</div>
    <div id="tpl-list"></div>
    <div class="add-form">
      <select id="tpl-cat">
        <option value="技術深掘り">技術深掘り</option>
        <option value="上流工程・PM経験">上流工程・PM経験</option>
        <option value="AI活用">AI活用</option>
        <option value="スポーツ経歴">スポーツ経歴</option>
        <option value="共通">共通</option>
      </select>
      <input type="text" id="tpl-q" placeholder="新しい質問を入力...">
      <button class="btn-sm" onclick="addTemplate()">追加</button>
    </div>
  </div>
</div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
// ── トークン管理 ────────────────────────────────────────────────────
function getToken() {
  var tok = localStorage.getItem('g_tok');
  var exp = parseInt(localStorage.getItem('g_exp') || '0');
  return (tok && Date.now() < exp) ? tok : null;
}
function clearToken() {
  ['g_tok','g_exp','g_ref','g_email'].forEach(function(k){ localStorage.removeItem(k); });
}
function updateAuthUI() {
  var tok = getToken();
  var email = localStorage.getItem('g_email') || '';
  var badge = document.getElementById('auth-badge');
  var emailEl = document.getElementById('auth-email');
  var btn = document.getElementById('auth-btn');
  if (tok) {
    badge.textContent = '✓ 連携済み'; badge.className = 'auth-badge ok';
    emailEl.textContent = email; btn.textContent = '再認証';
  } else {
    badge.textContent = '未接続'; badge.className = 'auth-badge ng';
    emailEl.textContent = ''; btn.textContent = 'Googleと連携';
  }
  checkReady();
}
function handleAuth() {
  if (getToken()) { clearToken(); updateAuthUI(); return; }
  location.href = '/auth/start';
}

// ── PDF.js ──────────────────────────────────────────────────────────
(function() {
  if (typeof pdfjsLib === 'undefined') return;
  var src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  fetch(src).then(function(r){return r.blob();})
    .then(function(b){ pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(b); })
    .catch(function(){ pdfjsLib.GlobalWorkerOptions.workerSrc = src; });
})();

// ── ナビゲーション ──────────────────────────────────────────────────
function showPage(id, tab) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(t){ t.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  tab.classList.add('active');
  if (id === 'page-tpl') loadTemplates();
}

// ── タブ ─────────────────────────────────────────────────────────────
var activeTab = 'upload';
function switchTab(panelId, tabEl) {
  document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
  document.getElementById(panelId).classList.add('active');
  tabEl.classList.add('active');
  activeTab = (panelId === 'tab-paste') ? 'paste' : 'upload';
  checkReady();
}

// ── ファイル管理 ────────────────────────────────────────────────────
var fileEntries = [], seq = 0;
(function() {
  var dz = document.getElementById('drop-zone');
  if (!dz) return;
  dz.addEventListener('dragover', function(e){ e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', function(){ dz.classList.remove('drag'); });
  dz.addEventListener('drop', function(e){ e.preventDefault(); dz.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
})();

function handleFiles(files) {
  for (var i = 0; i < files.length; i++) {
    if (files[i].type !== 'application/pdf') { alert(files[i].name + ' はPDFではありません'); continue; }
    processFile(files[i]);
  }
  document.getElementById('pdf-input').value = '';
}
function processFile(file) {
  var id = ++seq;
  fileEntries.push({ id:id, name:file.name, state:'loading', text:'', chars:0 });
  renderFiles(); checkReady();
  if (typeof pdfjsLib === 'undefined') { return updEntry(id,'err','',0); }
  var reader = new FileReader();
  reader.onload = function(e) {
    pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise.then(function(pdf) {
      var ps = [];
      for (var p = 1; p <= pdf.numPages; p++) ps.push(p);
      return ps.reduce(function(chain, n) {
        return chain.then(function(acc) {
          return pdf.getPage(n).then(function(pg) {
            return pg.getTextContent().then(function(c) {
              acc.push(c.items.map(function(i){ return i.str; }).join(' ')); return acc;
            });
          });
        });
      }, Promise.resolve([]));
    }).then(function(pages) {
      var text = pages.join('\\n').trim();
      if (!text) { updEntry(id,'err','',0); return; }
      updEntry(id,'ok',text,text.length);
    }).catch(function(){ updEntry(id,'err','',0); });
  };
  reader.onerror = function(){ updEntry(id,'err','',0); };
  reader.readAsArrayBuffer(file);
}
function updEntry(id,state,text,chars) {
  var e = fileEntries.find(function(x){ return x.id===id; });
  if (e) { e.state=state; e.text=text||''; e.chars=chars; }
  renderFiles(); checkReady();
}
function removeEntry(id) {
  fileEntries = fileEntries.filter(function(x){ return x.id!==id; });
  renderFiles(); checkReady();
}
function renderFiles() {
  var list = document.getElementById('file-list');
  if (!fileEntries.length) { list.innerHTML=''; return; }
  list.innerHTML = fileEntries.map(function(e) {
    var icon = e.state==='loading' ? '<span class="spinner"></span>' : e.state==='ok' ? '✓' : '✗';
    var chars = e.state==='ok' ? '<span class="fc">'+e.chars.toLocaleString()+'文字</span>' : '';
    return '<div class="file-row '+e.state+'"><span>📄</span><span class="fn">'+e.name+'</span>'+chars+'<span class="fs">'+icon+'</span><button class="del-btn" onclick="removeEntry('+e.id+')">×</button></div>';
  }).join('');
}

// ── ボタン状態 ──────────────────────────────────────────────────────
function checkReady() {
  var hasBasic = document.getElementById('initial').value.trim() && document.getElementById('month').value.trim() && document.getElementById('price').value.trim();
  var hasContent = activeTab==='upload' ? fileEntries.some(function(e){ return e.state==='ok'; }) : document.getElementById('paste-text').value.trim().length > 0;
  document.getElementById('run-btn').disabled = !(hasBasic && hasContent && getToken());
}

// ── プログレス ──────────────────────────────────────────────────────
function setStep(id, state) {
  var el = document.getElementById(id);
  var icon = state==='active' ? '<span class="spinner"></span>' : state==='done' ? '✓' : state==='err' ? '✗' : el.querySelector('.picon').textContent;
  el.className = 'prog-step ' + (state||'');
  el.querySelector('.picon').innerHTML = icon;
}

// ── スコアリング設定 ────────────────────────────────────────────────
var SCORE_AXES = [
  { id:'residence', label:'居住地', options:[
    { label:'東京都・大阪府', value:4 },
    { label:'神奈川県・愛知県・福岡県・兵庫県・千葉県・埼玉県', value:3 },
    { label:'京都府・群馬県・滋賀県・静岡県・栃木県・長野県・奈良県・岐阜県・三重県・山梨県', value:2 },
    { label:'福島県・茨城県・和歌山県・宮城県・石川県・富山県・新潟県・福井県', value:1 },
    { label:'それ以外', value:0 },
  ]},
  { id:'workstyle1', label:'働き方①（出社スタイル）', options:[
    { label:'フル出社OK', value:2 },
    { label:'ハイブリッド希望', value:1 },
    { label:'フルリモート希望', value:0 },
  ]},
  { id:'workstyle2', label:'働き方②（雇用形態）', options:[
    { label:'フルタイム希望', value:1 },
    { label:'それ以外', value:0 },
  ]},
  { id:'experience', label:'経験', options:[
    { label:'エンジニア3年以上＋PM経験あり', value:3 },
    { label:'エンジニア3年以上＋PL/PMO/要件定義いずれか', value:2 },
    { label:'エンジニア3年以上（上記以外）', value:1 },
    { label:'それ以外', value:0 },
  ]},
  { id:'infra', label:'技術スタック（インフラ）', options:[
    { label:'AWS/Azure/OCI/GCP 実務経験あり', value:2 },
    { label:'資格のみあり', value:1 },
    { label:'それ以外', value:0 },
  ]},
  { id:'ai', label:'AI使用経験・意欲', options:[
    { label:'使用経験あり', value:2 },
    { label:'意欲・勉強経験あり', value:1 },
    { label:'なし', value:0 },
  ]},
  { id:'recentjob', label:'直近の職歴', options:[
    { label:'ブランクなし', value:2 },
    { label:'1年未満のブランク', value:1 },
    { label:'1年以上のブランク', value:0 },
  ]},
];
var scoreValues = {};

function buildScoreGrid() {
  var grid = document.getElementById('score-grid');
  grid.innerHTML = SCORE_AXES.map(function(axis) {
    scoreValues[axis.id] = 0;
    var opts = axis.options.map(function(o) {
      return '<option value="'+o.value+'">'+o.label+'（'+o.value+'点）</option>';
    }).join('');
    return '<div class="score-row">'
      + '<div class="score-label">'+axis.label+'</div>'
      + '<select class="score-select" data-axis="'+axis.id+'" onchange="onScoreChange(this)">'
      + opts + '</select>'
      + '<div class="score-pts" id="pts-'+axis.id+'">'+axis.options[0].value+'</div>'
      + '</div>';
  }).join('');
  // 初期値セット
  SCORE_AXES.forEach(function(a){ scoreValues[a.id] = a.options[0].value; });
  calcScore();
}

function onScoreChange(sel) {
  var axis = sel.dataset.axis;
  var val = parseInt(sel.value);
  scoreValues[axis] = val;
  document.getElementById('pts-'+axis).textContent = val;
  calcScore();
}

function calcScore() {
  var total = Object.values(scoreValues).reduce(function(s,v){ return s+(v||0); }, 0);
  var grade = total >= 12 ? 'A' : total >= 9 ? 'B' : total >= 6 ? 'C' : 'D';
  var desc  = { A:'優先面接', B:'面接対象', C:'要検討', D:'見送り' };
  document.getElementById('score-total').textContent = total;
  document.getElementById('score-total').className = 'score-total '+grade;
  document.getElementById('score-judge').textContent = grade;
  document.getElementById('score-judge').className = 'score-judge '+grade;
  document.getElementById('score-desc').textContent = desc[grade];
  var res = document.getElementById('score-result');
  res.className = 'score-result '+grade;
}

function copyScore() {
  var total = document.getElementById('score-total').textContent;
  var grade = document.getElementById('score-judge').textContent;
  var desc  = document.getElementById('score-desc').textContent;
  var lines = ['【スコアリング結果】', '合計: '+total+'/16点', '判定: '+grade+'（'+desc+'）', ''];
  SCORE_AXES.forEach(function(axis) {
    var sel = document.querySelector('[data-axis="'+axis.id+'"]');
    var opt = sel.options[sel.selectedIndex];
    lines.push(axis.label+': '+opt.text);
  });
  navigator.clipboard.writeText(lines.join('\\n'));
}

function resetScore() {
  scoreValues = {};
  buildScoreGrid();
  document.getElementById('score-candidate').value = '';
  document.getElementById('score-fullname').value = '';
}

var STATUS_COLORS = {
  '一次面接調整中':'#6366f1','一次面接設置済み':'#2563eb','二次面接調整中':'#0891b2',
  'オファー面談調整中':'#7c3aed','営業中':'#374151','入社':'#16a34a',
  '辞退（面接前）':'#9ca3af','辞退（面接後）':'#6b7280',
  'お見送り（面接前）':'#dc2626','お見送り（面接後）':'#b91c1c'
};


async function saveScore() {
  var candidate = document.getElementById('score-candidate').value.trim();
  if (!candidate) { alert('候補者名（イニシャル等）を入力してください'); return; }
  var fullname = document.getElementById('score-fullname').value.trim();
  var status   = '';
  var total = parseInt(document.getElementById('score-total').textContent) || 0;
  var grade = document.getElementById('score-judge').textContent;
  var detail = {};
  SCORE_AXES.forEach(function(axis) {
    var sel = document.querySelector('[data-axis="'+axis.id+'"]');
    detail[axis.label] = sel ? sel.options[sel.selectedIndex].text : '';
  });
  try {
    var res = await fetch('/api/scores', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ candidate:candidate, fullname:fullname, status:status, total:total, grade:grade, detail:detail }) });
    if (!res.ok) throw new Error('保存失敗');
    document.getElementById('score-candidate').value = '';
    document.getElementById('score-fullname').value = '';
    loadScoreHistory();
  } catch(e) {
    alert('保存に失敗しました: '+e.message);
  }
}

var scoreHistoryData = [];
async function loadScoreHistory() {
  try {
    scoreHistoryData = await fetch('/api/scores').then(function(r){ return r.json(); });
  } catch(_) { scoreHistoryData = []; }
  var box = document.getElementById('score-history');
  if (!scoreHistoryData.length) {
    box.innerHTML = '<p style="font-size:12px;color:#9ca3af;text-align:center;padding:16px 0;">まだ保存されたスコアはありません</p>';
    return;
  }
  var html = '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
    + '<thead><tr style="background:#f9fafb;">'
    + '<th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;">日時</th>'
    + '<th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;">氏名</th>'
    + '<th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;">選考ステータス</th>'
    + '<th style="padding:6px 8px;text-align:center;border-bottom:1px solid #e5e7eb;">スコア</th>'
    + '<th style="padding:6px 8px;text-align:center;border-bottom:1px solid #e5e7eb;">判定</th>'
    + '<th style="padding:6px 8px;border-bottom:1px solid #e5e7eb;"></th>'
    + '</tr></thead><tbody>';
  scoreHistoryData.forEach(function(r, i) {
    var dt = r.created_at ? r.created_at.replace('T',' ').slice(0,16) : '';
    var gradeColor = {A:'#16a34a',B:'#2563eb',C:'#d97706',D:'#dc2626'}[r.grade] || '#6b7280';
    var nameText = r.fullname ? r.fullname+' ('+r.candidate+')' : r.candidate;
    var stOpts = ['','一次面接調整中','一次面接設置済み','二次面接調整中','オファー面談調整中','営業中','入社','辞退（面接前）','辞退（面接後）','お見送り（面接前）','お見送り（面接後）']
      .map(function(s){ return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+( s||'-- 未設定 --')+'</option>'; }).join('');
    var stColor = STATUS_COLORS[r.status] || '';
    var stStyle = 'font-size:11px;padding:3px 6px;border-radius:6px;border:1px solid #d1d5db;cursor:pointer;font-family:inherit;'
      + (stColor ? 'background:'+stColor+';color:#fff;border-color:transparent;font-weight:600;' : '');
    var stSelect = '<select data-rid="'+r.id+'" onchange="updateStatus(this)" style="'+stStyle+'">'+stOpts+'</select>';
    html += '<tr style="border-bottom:1px solid #f3f4f6;">'
      + '<td style="padding:6px 8px;color:#6b7280;white-space:nowrap;">'+dt+'</td>'
      + '<td style="padding:6px 8px;font-weight:600;">'+nameText+'</td>'
      + '<td style="padding:6px 8px;">'+stSelect+'</td>'
      + '<td style="padding:6px 8px;text-align:center;">'+r.total+'/16</td>'
      + '<td style="padding:6px 8px;text-align:center;"><span style="font-weight:700;color:'+gradeColor+';">'+r.grade+'</span></td>'
      + '<td style="padding:6px 8px;display:flex;gap:4px;">'
      + '<button class="btn-sm" data-idx="'+i+'" onclick="showScoreDetail(this.dataset.idx)">詳細</button>'
      + '<button class="btn-sm btn-danger" data-idx="'+i+'" onclick="deleteScore(this.dataset.idx)">削除</button>'
      + '</td>'
      + '</tr>';
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}

function showScoreDetail(idx) {
  var r = scoreHistoryData[parseInt(idx)];
  if (!r) return;
  var detail = {};
  try { detail = JSON.parse(r.detail); } catch(_) {}
  var nameStr = r.fullname ? r.fullname+' ('+r.candidate+')' : r.candidate;
  var lines = ['【'+nameStr+'】', '選考ステータス: '+(r.status||'未設定'), '合計: '+r.total+'/16点　判定: '+r.grade, ''];
  Object.keys(detail).forEach(function(k){ lines.push(k+': '+detail[k]); });
  alert(lines.join('\\n'));
}

async function updateStatus(sel) {
  var id = sel.dataset.rid;
  var status = sel.value;
  var color = STATUS_COLORS[status] || '';
  sel.style.background = color || '#fff';
  sel.style.color = color ? '#fff' : '';
  sel.style.borderColor = color ? 'transparent' : '#d1d5db';
  sel.style.fontWeight = color ? '600' : '';
  try {
    await fetch('/api/scores/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status:status }) });
    var row = scoreHistoryData.find(function(r){ return r.id === id; });
    if (row) row.status = status;
  } catch(e) {
    alert('更新に失敗しました');
  }
}

async function deleteScore(idx) {
  var r = scoreHistoryData[parseInt(idx)];
  if (!r) return;
  var nameStr = r.fullname || r.candidate;
  if (!confirm(nameStr+' のスコアを削除しますか？')) return;
  try {
    var res = await fetch('/api/scores/'+r.id, { method:'DELETE' });
    if (!res.ok) throw new Error('削除失敗');
    loadScoreHistory();
  } catch(e) {
    alert('削除に失敗しました: '+e.message);
  }
}

// ── 面接質問 ────────────────────────────────────────────────────────
var qState = {}; // { qId: { checked, memo } }
var qData  = null;

function showQuestionsInResult(data) {
  var box = document.getElementById('result-questions');
  if (!box) return;
  var cats = ['技術深掘り','上流工程・PM経験','AI活用','スポーツ経歴','共通'];
  var html = '';
  cats.forEach(function(cat) {
    var aiQs  = (data.aiQuestions && data.aiQuestions[cat]) || [];
    var tplQs = (data.templates   && data.templates[cat])   || [];
    var all = aiQs.concat(tplQs.map(function(q){ return q.question; }));
    if (!all.length) return;
    html += '<div style="margin-bottom:12px;">'
      + '<div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.03em;">'+cat+'</div>';
    all.forEach(function(q, i) {
      var badge = (i < aiQs.length) ? '<span style="font-size:9px;background:#6366f1;color:#fff;padding:1px 5px;border-radius:4px;margin-left:5px;vertical-align:middle;">AI</span>' : '';
      html += '<div style="padding:4px 0;color:#374151;">・'+q+badge+'</div>';
    });
    html += '</div>';
  });
  box.innerHTML = html || '<p style="color:#9ca3af;">質問データがありません</p>';
}

function renderQuestions(data) {
  qData = data;
  var container = document.getElementById('q-container');
  var cats = ['技術深掘り','上流工程・PM経験','AI活用','スポーツ経歴','共通'];
  var html = '';
  cats.forEach(function(cat) {
    var aiQs  = (data.aiQuestions  && data.aiQuestions[cat])  || [];
    var tplQs = (data.templates    && data.templates[cat])    || [];
    if (!aiQs.length && !tplQs.length) return;
    html += '<div class="q-category">';
    html += '<div class="q-cat-header"><span>'+cat+'</span>';
    if (aiQs.length) html += '<span class="q-cat-badge q-ai-badge">AI生成: '+aiQs.length+'問</span>';
    html += '</div>';
    // AI生成
    aiQs.forEach(function(q, i) {
      var id = 'ai-'+cat+'-'+i;
      if (!qState[id]) qState[id] = { checked:false, memo:'' };
      html += renderQItem(id, q, 'AI');
    });
    // テンプレート
    tplQs.forEach(function(q) {
      var id = 'tpl-'+q.id;
      if (!qState[id]) qState[id] = { checked:false, memo:'' };
      html += renderQItem(id, q.question, 'テンプレート');
    });
    html += '</div>';
  });
  container.innerHTML = html || '<p style="font-size:12px;color:#9ca3af;text-align:center;padding:32px 0;">質問データがありません</p>';
}

function renderQItem(id, text, type) {
  var s = qState[id] || { checked:false, memo:'' };
  var cls = s.checked ? 'q-item selected' : 'q-item';
  var badge = type==='AI' ? '<span class="q-cat-badge q-ai-badge" style="margin-left:6px;font-size:9px;">AI</span>' : '';
  var chk = s.checked ? ' checked' : '';
  return '<div class="'+cls+'" id="qi-'+id+'" data-qid="'+id+'">'
    + '<input type="checkbox" class="q-check"'+chk+' onchange="toggleQ(this)">'
    + '<div class="q-content">'
    + '<div class="q-text">'+text+badge+'</div>'
    + '<textarea class="q-memo" placeholder="面接メモを入力..." oninput="memoQ(this)">'+s.memo+'</textarea>'
    + '</div></div>';
}

function toggleQ(checkbox) {
  var id = checkbox.closest('[data-qid]').dataset.qid;
  if (!qState[id]) qState[id] = { checked:false, memo:'' };
  qState[id].checked = checkbox.checked;
  var item = document.getElementById('qi-'+id);
  if (qState[id].checked) item.classList.add('selected'); else item.classList.remove('selected');
  var memo = item.querySelector('.q-memo');
  memo.style.display = qState[id].checked ? 'block' : 'none';
}

function memoQ(textarea) {
  var id = textarea.closest('[data-qid]').dataset.qid;
  if (!qState[id]) qState[id] = { checked:false, memo:'' };
  qState[id].memo = textarea.value;
}

function copyQuestions() {
  var lines = ['【面接質問・メモ】'];
  document.querySelectorAll('.q-item.selected').forEach(function(el) {
    var text = el.querySelector('.q-text').textContent.replace(/AI$/,'').trim();
    var memo = el.querySelector('.q-memo').value.trim();
    lines.push('Q: '+text);
    if (memo) lines.push('  メモ: '+memo);
    lines.push('');
  });
  if (lines.length === 1) { alert('質問が選択されていません'); return; }
  navigator.clipboard.writeText(lines.join('\\n'));
}

function resetQuestions() {
  qState = {};
  if (qData) renderQuestions(qData);
}

// ── テンプレート管理 ─────────────────────────────────────────────────
async function loadTemplates() {
  var res = await fetch('/api/templates').then(function(r){ return r.json(); });
  var cats = ['技術深掘り','上流工程・PM経験','AI活用','スポーツ経歴','共通'];
  var bycat = {};
  (res || []).forEach(function(t){ if (!bycat[t.category]) bycat[t.category] = []; bycat[t.category].push(t); });
  var html = '';
  cats.forEach(function(cat) {
    var items = bycat[cat] || [];
    if (!items.length) return;
    html += '<div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px;">'+cat+'</div>';
    items.forEach(function(t) {
      html += '<div class="tpl-item">'
        + '<div class="tpl-text">'+t.question+'</div>'
        + '<button class="btn-sm btn-danger" style="flex-shrink:0" data-tid="'+t.id+'" onclick="delTemplate(this.dataset.tid)">削除</button>'
        + '</div>';
    });
    html += '</div>';
  });
  document.getElementById('tpl-list').innerHTML = html || '<p style="font-size:12px;color:#9ca3af;">テンプレートがありません</p>';
}

async function addTemplate() {
  var cat = document.getElementById('tpl-cat').value;
  var q   = document.getElementById('tpl-q').value.trim();
  if (!q) return;
  await fetch('/api/templates', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ category:cat, question:q }) });
  document.getElementById('tpl-q').value = '';
  loadTemplates();
}

async function delTemplate(id) {
  if (!confirm('このテンプレートを削除しますか？')) return;
  await fetch('/api/templates/'+id, { method:'DELETE' });
  loadTemplates();
}

// ── メイン処理 ──────────────────────────────────────────────────────
async function run() {
  var initial = document.getElementById('initial').value.trim();
  var month   = document.getElementById('month').value.trim();
  var price   = document.getElementById('price').value.trim();
  var token   = getToken();
  var pdfText = activeTab === 'upload'
    ? fileEntries.filter(function(e){ return e.state==='ok'; }).map(function(e){ return '=== '+e.name+' ===\\n'+e.text; }).join('\\n\\n')
    : document.getElementById('paste-text').value.trim();
  if (!pdfText || !token) return;

  document.getElementById('run-btn').disabled = true;
  document.getElementById('progress').classList.add('show');
  document.getElementById('error-box').style.display = 'none';
  document.getElementById('result-card').classList.remove('show');
  ['ps1','ps2','ps3','ps4'].forEach(function(id){ setStep(id,''); });
  setStep('ps1','active');

  try {
    // 1. AI解析
    var r1 = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ initial, month, price, pdfText }) });
    var d1 = await r1.json();
    if (!r1.ok || d1.error) throw new Error(d1.error || '解析エラー');
    setStep('ps1','done'); setStep('ps2','active');

    // 2. シート作成
    var r2 = await fetch('/api/sheet', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ initial, data:d1.data, accessToken:token }) });
    var d2 = await r2.json();
    if (!r2.ok || d2.error) {
      if (r2.status === 401) { clearToken(); updateAuthUI(); throw new Error('Googleセッション切れ。再認証してください。'); }
      throw new Error(d2.error || 'シート作成エラー');
    }
    setStep('ps2','done'); setStep('ps3','done'); setStep('ps4','active');

    // 3. 面接質問生成（並行）
    var r3 = await fetch('/api/questions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ data:d1.data }) });
    var d3 = await r3.json().catch(function(){ return {}; });
    setStep('ps4','done');

    // 結果表示
    document.getElementById('sheet-link').href = d2.sheetUrl;
    document.getElementById('summary-text').textContent = d1.summary;
    document.getElementById('result-card').classList.add('show');
    document.getElementById('result-card').scrollIntoView({ behavior:'smooth', block:'start' });

    // スコアリングページに候補者情報・シートリンクを自動反映
    buildScoreGrid();
    document.getElementById('score-candidate').value = initial;
    var sheetRef = document.getElementById('score-sheet-ref');
    document.getElementById('score-sheet-url').href = d2.sheetUrl;
    sheetRef.style.display = 'flex';

    // 面接質問ページに反映（AI失敗時もテンプレートを表示）
    renderQuestions(d3);

    // 結果カードに面接質問プレビューを表示
    showQuestionsInResult(d3);

    // 完了後にポップアップで案内
    setTimeout(function(){
      var go = confirm('スキルシートを作成しました。\\nスコアリング・面接質問を確認しますか？');
      if (go) {
        document.getElementById('nav-score').click();
      }
    }, 500);

  } catch(err) {
    ['ps1','ps2','ps3','ps4'].forEach(function(id){
      if (document.getElementById(id).classList.contains('active')) setStep(id,'err');
    });
    var box = document.getElementById('error-box');
    box.textContent = 'エラー: ' + err.message;
    box.style.display = 'block';
  } finally {
    document.getElementById('run-btn').disabled = false;
    checkReady();
  }
}

function copyText(id, btnId) {
  navigator.clipboard.writeText(document.getElementById(id).textContent).then(function() {
    var btn = document.getElementById(btnId);
    btn.textContent='コピー完了!'; btn.classList.add('copied');
    setTimeout(function(){ btn.textContent='コピー'; btn.classList.remove('copied'); }, 2000);
  });
}

// ── 初期化 ──────────────────────────────────────────────────────────
try { updateAuthUI(); } catch(e) { console.error('updateAuthUI error:', e); }
try { buildScoreGrid(); } catch(e) { console.error('buildScoreGrid error:', e); }
try { loadScoreHistory(); } catch(e) { console.error('loadScoreHistory error:', e); }

(function() {
  var p = new URLSearchParams(location.search);
  var e = p.get('auth_err');
  if (e) {
    var box = document.getElementById('error-box');
    box.textContent = 'Google認証エラー: ' + decodeURIComponent(e);
    box.style.display = 'block';
    history.replaceState(null,'','/');
  }
})();
</script>
</body>
</html>`;
