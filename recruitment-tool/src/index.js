import { HTML } from './html.js';

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

    // 候補者管理
    if (p === '/api/candidates' && m === 'GET')  return candidateList(request, env);
    if (p === '/api/candidates' && m === 'POST') return candidateCreate(request, env);
    if (/^\/api\/candidates\/[^/]+$/.test(p) && m === 'GET')    return candidateGet(env, p.split('/')[3]);
    if (/^\/api\/candidates\/[^/]+$/.test(p) && m === 'PUT')    return candidateUpdate(request, env, p.split('/')[3]);
    if (/^\/api\/candidates\/[^/]+$/.test(p) && m === 'DELETE') return candidateDelete(env, p.split('/')[3]);

    // ステージ変更・履歴
    if (/^\/api\/candidates\/[^/]+\/stage$/.test(p) && m === 'POST')  return stageChange(request, env, p.split('/')[3]);
    if (/^\/api\/candidates\/[^/]+\/history$/.test(p) && m === 'GET') return stageHistory(env, p.split('/')[3]);

    // 重複チェック
    if (p === '/api/duplicate-check' && m === 'GET') return duplicateCheck(request, env);

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
- selfPR: 自己PRセクション全体を読み込み、以下を含む300文字程度の文章（箇条書き・見出し番号不要）でまとめる。
  ①専門領域と経験年数の具体的な数字　②チーム規模・マネジメント実績の数字　③顧客折衝・契約管理の実績　④最新技術・ツールへの取り組み。
  「○○ファースト」等の抽象的フレーズは避け、数字・実績・技術名を優先して記述すること。
- qualifications: 取得資格（なければ必ず空文字。"不明"や"なし"は書かない）
- positionYears: 各ポジションの合計経験年数。経験なしは空文字。「X年Xか月」形式
  - PM: 1次請けとして顧客との契約調整・見積作成・リソース管理など実質的なPM業務を担った合計年数。肩書がPLでも1次請けでPM相当業務を担っている場合はカウントする
  - PL: プロジェクトリーダーとして従事した全プロジェクトの合計年数
- processYears: 各工程の合計経験年数。経験なしは空文字。「X年Xか月」形式
  - 調査・管理: PL/PMとして従事した全プロジェクト期間の合計（PL/PM役割には常に調査・管理が含まれるため、PL/PM在籍期間をすべてカウントする）
  - 要件定義: 要件定義・上流工程を担当した期間の合計。顧客との仕様調整・契約調整・見積作成・ベンダコントロールなども含む
  - 基本設計・詳細設計・製造: 明示されている場合のみカウント
  - テスト: QA・テスト業務に従事した全プロジェクト期間の合計
  - 運用・保守: 明示されている場合のみカウント
- devEnv: 開発環境・言語・OSを列挙。OS（iOS/Android等）はスキルシートに記載されている順番で先に列挙し、その後に言語・フレームワーク・ツールを経験年数が長い順に追加。「X年Xか月」形式
- projects: 案件を【古い順（開始日が早い順）】に並べる
  - position: 「PM」→「プロジェクトマネージャー」、「PL」→「プロジェクトリーダー」、「SE」→「SE」、「PG」→「PG」、「PMO」→「PMO」
  - teamSize: 「1-4名」「5-10名」「11-20名」「21名以上」のいずれか
  - devEnv: カンマ区切り（例: "iOS, Android"）
  - processes: 担当工程リスト。選択肢: ["調査・管理","要件定義","基本設計","詳細設計","製造","テスト","運用・保守"]。PL/PMとして従事した案件は必ず「調査・管理」を含める
  - content: 以下の形式で記載（300文字以内）。
    ■案件名
    【業務内容】
    ・主要業務1
    ・主要業務2（必要に応じて3行まで）

出力JSON（このフォーマットのみ）:
{
  "selfPR":"自己PR300文字程度",
  "qualifications":"取得資格（なければ空文字）",
  "positionYears":{"PM":"X年Xか月","PL":"X年Xか月","PMO":"","SE":"","PG":""},
  "processYears":{"調査・管理":"X年Xか月","要件定義":"X年Xか月","基本設計":"","詳細設計":"","製造":"","テスト":"X年Xか月","運用・保守":""},
  "devEnv":[{"name":"iOS","years":"X年Xか月"},{"name":"Android","years":"X年Xか月"}],
  "projects":[{"position":"プロジェクトリーダー","startMonth":"2009年7月","endMonth":"2013年9月","teamSize":"11-20名","processes":["調査・管理","テスト"],"content":"■某メーカ向け端末検証\n【業務内容】\n・ガラケー、スマホ端末の機能試験（設計・実施）\n・PJ進捗管理","devEnv":"Android"}],
  "skills":{"experience":"PL、QAエンジニア","devEnvSummary":"iOS、Android","tools":"MagicPod","strengths":["強み1","強み2","強み3"]}
}`;

    const ai = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: 'JSONのみ出力。前置きや説明は不要。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 6000,
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
最新案件: ${(data.projects || []).slice(-2).map(p => p.content).join('、')}`;
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


// ── 候補者CRUD ────────────────────────────────────────────────────────

const VALID_STAGES = ['書類受領','スキルシート解析','スコアリング','一次面接','二次面接','オファー','入社','見送り','辞退'];

async function candidateList(request, env) {
  try {
    const url = new URL(request.url);
    const stage = url.searchParams.get('stage');
    let query = 'SELECT * FROM candidates ORDER BY updated_at DESC';
    let rows;
    if (stage) {
      rows = await env.DB.prepare('SELECT * FROM candidates WHERE stage = ? ORDER BY updated_at DESC').bind(stage).all();
    } else {
      rows = await env.DB.prepare(query).all();
    }
    return new Response(JSON.stringify(rows.results || []), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

async function candidateCreate(request, env) {
  try {
    const body = await request.json();
    const { name, initial, email, phone, channel, stage, note } = body;
    if (!name) return new Response(JSON.stringify({ error: '氏名は必須です' }), { status: 400, headers: J });
    const id = crypto.randomUUID();
    const s = stage && VALID_STAGES.includes(stage) ? stage : '書類受領';
    await env.DB.prepare(
      'INSERT INTO candidates (id,name,initial,email,phone,channel,stage,note) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(id, name, initial || '', email || '', phone || '', channel || '', s, note || '').run();
    return new Response(JSON.stringify({ id }), { status: 201, headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

async function candidateGet(env, id) {
  try {
    const row = await env.DB.prepare('SELECT * FROM candidates WHERE id = ?').bind(id).first();
    if (!row) return new Response(JSON.stringify({ error: '候補者が見つかりません' }), { status: 404, headers: J });
    return new Response(JSON.stringify(row), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

async function candidateUpdate(request, env, id) {
  try {
    const body = await request.json();
    const row = await env.DB.prepare('SELECT * FROM candidates WHERE id = ?').bind(id).first();
    if (!row) return new Response(JSON.stringify({ error: '候補者が見つかりません' }), { status: 404, headers: J });

    const name        = body.name        !== undefined ? body.name        : row.name;
    const initial     = body.initial     !== undefined ? body.initial     : row.initial;
    const email       = body.email       !== undefined ? body.email       : row.email;
    const phone       = body.phone       !== undefined ? body.phone       : row.phone;
    const channel     = body.channel     !== undefined ? body.channel     : row.channel;
    const stage       = body.stage && VALID_STAGES.includes(body.stage) ? body.stage : row.stage;
    const score_total = body.score_total !== undefined ? body.score_total : row.score_total;
    const score_grade = body.score_grade !== undefined ? body.score_grade : row.score_grade;
    const score_detail= body.score_detail!== undefined ? JSON.stringify(body.score_detail) : row.score_detail;
    const skills_data = body.skills_data !== undefined ? JSON.stringify(body.skills_data) : row.skills_data;
    const sheet_url   = body.sheet_url   !== undefined ? body.sheet_url   : row.sheet_url;
    const drive_files = body.drive_files !== undefined ? JSON.stringify(body.drive_files) : row.drive_files;
    const strengths   = body.strengths   !== undefined ? JSON.stringify(body.strengths)   : row.strengths;
    const note        = body.note        !== undefined ? body.note        : row.note;

    await env.DB.prepare(`
      UPDATE candidates SET
        name=?,initial=?,email=?,phone=?,channel=?,stage=?,
        score_total=?,score_grade=?,score_detail=?,skills_data=?,
        sheet_url=?,drive_files=?,strengths=?,note=?,
        updated_at=datetime('now')
      WHERE id=?
    `).bind(name,initial,email,phone,channel,stage,
            score_total,score_grade,score_detail,skills_data,
            sheet_url,drive_files,strengths,note,id).run();

    return new Response(JSON.stringify({ ok: true }), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

async function candidateDelete(env, id) {
  try {
    const row = await env.DB.prepare('SELECT id FROM candidates WHERE id = ?').bind(id).first();
    if (!row) return new Response(JSON.stringify({ error: '候補者が見つかりません' }), { status: 404, headers: J });
    await env.DB.prepare('DELETE FROM candidates WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

async function duplicateCheck(request, env) {
  try {
    const url = new URL(request.url);
    const name  = url.searchParams.get('name')  || '';
    const email = url.searchParams.get('email') || '';
    const phone = url.searchParams.get('phone') || '';

    const conditions = [];
    const binds = [];
    if (name)  { conditions.push('name = ?');  binds.push(name); }
    if (email) { conditions.push('email = ?'); binds.push(email); }
    if (phone) { conditions.push('phone = ?'); binds.push(phone); }

    if (!conditions.length) return new Response(JSON.stringify([]), { headers: J });

    const sql = `SELECT id,name,initial,email,phone,stage FROM candidates WHERE ${conditions.join(' OR ')} LIMIT 10`;
    const rows = await env.DB.prepare(sql).bind(...binds).all();
    return new Response(JSON.stringify(rows.results || []), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

// ── ステージ管理 ───────────────────────────────────────────────────────

async function stageChange(request, env, id) {
  try {
    const { to_stage, changed_by, note } = await request.json();
    if (!to_stage) return new Response(JSON.stringify({ error: 'to_stage は必須です' }), { status: 400, headers: J });
    if (!VALID_STAGES.includes(to_stage)) {
      return new Response(JSON.stringify({ error: `無効なステージ: ${to_stage}` }), { status: 400, headers: J });
    }

    const row = await env.DB.prepare('SELECT stage FROM candidates WHERE id = ?').bind(id).first();
    if (!row) return new Response(JSON.stringify({ error: '候補者が見つかりません' }), { status: 404, headers: J });

    const from_stage = row.stage;

    // candidates.stage を更新
    await env.DB.prepare(
      "UPDATE candidates SET stage = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(to_stage, id).run();

    // pipeline_history に記録
    const histId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO pipeline_history (id,candidate_id,from_stage,to_stage,changed_by,note) VALUES (?,?,?,?,?,?)'
    ).bind(histId, id, from_stage, to_stage, changed_by || '', note || '').run();

    return new Response(JSON.stringify({ ok: true, from_stage, to_stage }), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}

async function stageHistory(env, id) {
  try {
    const row = await env.DB.prepare('SELECT id FROM candidates WHERE id = ?').bind(id).first();
    if (!row) return new Response(JSON.stringify({ error: '候補者が見つかりません' }), { status: 404, headers: J });

    const rows = await env.DB.prepare(
      'SELECT * FROM pipeline_history WHERE candidate_id = ? ORDER BY created_at ASC'
    ).bind(id).all();
    return new Response(JSON.stringify(rows.results || []), { headers: J });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: J });
  }
}
