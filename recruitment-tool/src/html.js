export const HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>採用管理ツール</title>
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

.nav-tabs{background:#1f2937;display:flex;gap:2px;padding:0 24px;overflow-x:auto;}
.nav-tab{padding:10px 16px;font-size:12px;font-weight:600;color:#9ca3af;border:none;background:none;font-family:inherit;cursor:pointer;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;white-space:nowrap;}
.nav-tab.active{color:#fff;border-bottom-color:#6366f1;}
.nav-tab:hover:not(.active){color:#d1d5db;}

.page{display:none;} .page.active{display:block;}
.wrap{max-width:860px;margin:28px auto;padding:0 16px 60px;}

.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06);}
.card-title{font-size:13px;font-weight:700;color:#374151;margin-bottom:16px;display:flex;align-items:center;gap:6px;}
.badge{background:#111827;color:#fff;border-radius:4px;padding:2px 7px;font-size:10px;}
.badge-indigo{background:#6366f1;}
.badge-green{background:#059669;}
.badge-orange{background:#d97706;}
.badge-violet{background:#7c3aed;}

.flabel{display:block;font-size:11px;color:#6b7280;margin-bottom:4px;font-weight:600;letter-spacing:.04em;}
input[type=text],input[type=number],textarea,select{width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:7px;font-family:inherit;font-size:13px;color:#111827;outline:none;transition:border .15s,box-shadow .15s;background:#fff;}
input:focus,textarea:focus,select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);}
textarea{resize:vertical;min-height:100px;}
.frow{display:flex;gap:12px;flex-wrap:wrap;} .frow .fg{flex:1;min-width:120px;}

.tab-bar{display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:16px;}
.tab{padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:none;font-family:inherit;color:#6b7280;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s;}
.tab.active{color:#111827;border-bottom-color:#111827;}
.tab-panel{display:none;} .tab-panel.active{display:block;}

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
.del-btn{flex-shrink:0;width:18px;height:18px;border-radius:4px;border:none;background:transparent;color:#9ca3af;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;padding:0;}
.del-btn:hover{background:#fee2e2;color:#b91c1c;}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;border-radius:8px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:background .15s,box-shadow .15s;}
.btn-primary{background:#111827;color:#fff;width:100%;}
.btn-primary:hover:not(:disabled){background:#1f2937;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;}
.btn-google{background:#fff;color:#374151;border:1px solid #d1d5db;padding:7px 14px;font-size:12px;}
.btn-google:hover{background:#f9fafb;}
.btn-sm{padding:5px 12px;font-size:12px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;cursor:pointer;font-family:inherit;border-radius:6px;transition:background .1s;}
.btn-sm:hover{background:#e5e7eb;}
.btn-danger{background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;}
.btn-danger:hover{background:#fecaca;}
.btn-indigo{background:#6366f1;color:#fff;border:none;padding:8px 16px;border-radius:7px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;}
.btn-indigo:hover{background:#4f46e5;}

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

.err-box{padding:10px 14px;border-radius:7px;font-size:12px;margin-top:10px;background:#fef2f2;border:1px solid #fca5a5;color:#b91c1c;display:none;white-space:pre-wrap;}
.result{display:none;} .result.show{display:block;}
.result-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.result-label{font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.04em;}
.copy-btn{padding:4px 10px;border-radius:5px;border:1px solid #d1d5db;background:#fff;font-size:11px;cursor:pointer;font-family:inherit;transition:background .1s;}
.copy-btn:hover{background:#f3f4f6;} .copy-btn.copied{border-color:#86efac;color:#166534;background:#f0fdf4;}
.pre-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:14px;font-family:'Courier New',monospace;font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-word;max-height:320px;overflow-y:auto;}
.sheet-banner{margin-top:12px;padding:16px 20px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.sheet-banner .sb-text{font-size:13px;font-weight:700;color:#166534;}
.sheet-banner .sb-sub{font-size:11px;color:#059669;margin-top:2px;}
.sheet-link{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:7px;background:#111827;color:#fff;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap;}
.sheet-link:hover{background:#1f2937;}

/* Scoring */
.score-grid{display:flex;flex-direction:column;gap:12px;}
.score-row{display:flex;align-items:center;gap:12px;}
.score-label{flex:1;font-size:12px;font-weight:600;color:#374151;}
.score-select{flex:2;padding:7px 10px;border-radius:7px;border:1px solid #d1d5db;font-size:12px;font-family:inherit;}
.score-pts{flex-shrink:0;width:44px;text-align:center;font-size:13px;font-weight:700;color:#6366f1;}
.score-result{display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:10px;margin-top:16px;border:2px solid;flex-wrap:wrap;}
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
.q-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:7px;border:1px solid #e5e7eb;margin-bottom:6px;background:#fff;}
.q-item.selected{background:#f5f3ff;border-color:#c4b5fd;}
.q-check{margin-top:2px;width:16px;height:16px;flex-shrink:0;cursor:pointer;}
.q-content{flex:1;}
.q-text{font-size:12px;color:#374151;line-height:1.6;}
.q-memo{width:100%;margin-top:6px;padding:6px 8px;border:1px solid #d1d5db;border-radius:5px;font-size:11px;font-family:inherit;resize:vertical;min-height:50px;display:none;}
.q-item.selected .q-memo{display:block;}
.q-actions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;}

/* Template manager */
.tpl-item{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:7px;border:1px solid #e5e7eb;margin-bottom:6px;background:#fff;}
.tpl-text{flex:1;font-size:12px;color:#374151;}
.tpl-cat{font-size:10px;padding:2px 6px;border-radius:4px;background:#e0f2fe;color:#075985;font-weight:600;flex-shrink:0;}
.add-form{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
.add-form select,.add-form input{flex:1;min-width:120px;}

/* === 候補者管理 === */
.cand-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
.cand-toolbar input{flex:1;min-width:160px;max-width:260px;}
.view-toggle{display:flex;border:1px solid #d1d5db;border-radius:7px;overflow:hidden;}
.view-toggle button{padding:6px 12px;font-size:12px;font-family:inherit;border:none;background:#fff;cursor:pointer;color:#6b7280;}
.view-toggle button.active{background:#111827;color:#fff;}

/* リストビュー */
.cand-table{width:100%;border-collapse:collapse;font-size:12px;}
.cand-table th{padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;white-space:nowrap;}
.cand-table td{padding:8px 10px;border-bottom:1px solid #f3f4f6;vertical-align:middle;}
.cand-table tr:hover td{background:#f9fafb;}
.stage-chip{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;white-space:nowrap;}
.grade-chip{display:inline-block;width:22px;height:22px;border-radius:50%;font-size:11px;font-weight:700;text-align:center;line-height:22px;}
.grade-A{background:#dcfce7;color:#166534;} .grade-B{background:#dbeafe;color:#1e40af;}
.grade-C{background:#fef9c3;color:#92400e;} .grade-D{background:#fee2e2;color:#b91c1c;}
.grade-x{background:#f3f4f6;color:#9ca3af;}

/* カンバン */
.kanban-wrap{overflow-x:auto;padding-bottom:8px;}
.kanban-board{display:flex;gap:12px;min-width:max-content;align-items:flex-start;}
.kanban-col{width:200px;flex-shrink:0;}
.kanban-header{padding:8px 12px;border-radius:8px 8px 0 0;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:space-between;}
.kanban-body{background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;min-height:80px;padding:8px;display:flex;flex-direction:column;gap:6px;}
.kanban-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;cursor:pointer;transition:box-shadow .15s;font-size:12px;}
.kanban-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.1);border-color:#c4b5fd;}
.kanban-card .kc-name{font-weight:700;color:#111827;margin-bottom:2px;}
.kanban-card .kc-meta{color:#9ca3af;font-size:10px;}
.kanban-empty{font-size:11px;color:#d1d5db;text-align:center;padding:12px 0;}
.kanban-count{background:rgba(255,255,255,.3);border-radius:10px;padding:1px 6px;font-size:10px;}

/* 候補者詳細モーダル */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;}
.modal{background:#fff;border-radius:14px;width:100%;max-width:640px;max-height:88vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.2);}
.modal-header{padding:20px 24px 0;display:flex;align-items:center;justify-content:space-between;}
.modal-header h2{font-size:16px;font-weight:700;}
.modal-close{width:32px;height:32px;border-radius:8px;border:none;background:#f3f4f6;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;}
.modal-close:hover{background:#e5e7eb;}
.modal-body{padding:20px 24px 24px;}
.modal-section{margin-bottom:16px;}
.modal-section-title{font-size:11px;font-weight:700;color:#6b7280;letter-spacing:.05em;margin-bottom:8px;text-transform:uppercase;}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.info-item{font-size:12px;} .info-item .ik{color:#9ca3af;} .info-item .iv{font-weight:600;color:#111827;}
.stage-select-inline{padding:6px 10px;border-radius:6px;border:1px solid #d1d5db;font-size:12px;font-family:inherit;background:#fff;}
.strengths-list{display:flex;flex-wrap:wrap;gap:6px;}
.strength-chip{background:#ede9fe;color:#6d28d9;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;}
.note-area{width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:12px;font-family:inherit;min-height:60px;resize:vertical;}

/* 候補者新規フォーム */
.cand-form-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;}
.cand-form{background:#fff;border-radius:14px;width:100%;max-width:520px;max-height:88vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.2);padding:24px;}

/* ファネル */
.funnel-wrap{display:flex;flex-direction:column;gap:12px;}
.funnel-row{display:flex;align-items:center;gap:12px;}
.funnel-stage{width:140px;font-size:12px;font-weight:600;color:#374151;flex-shrink:0;}
.funnel-bar-wrap{flex:1;background:#f3f4f6;border-radius:6px;overflow:hidden;height:28px;}
.funnel-bar{height:100%;border-radius:6px;display:flex;align-items:center;padding-left:10px;font-size:12px;font-weight:700;color:#fff;transition:width .5s;min-width:2px;}
.funnel-count{width:50px;text-align:right;font-size:13px;font-weight:700;color:#374151;flex-shrink:0;}
.funnel-conv{width:60px;text-align:right;font-size:11px;color:#6b7280;flex-shrink:0;}
.funnel-total-row{margin-top:16px;padding:12px 16px;background:#f9fafb;border-radius:8px;display:flex;gap:24px;flex-wrap:wrap;}
.funnel-stat{font-size:12px;} .funnel-stat .fs-n{font-size:22px;font-weight:700;color:#111827;} .funnel-stat .fs-l{color:#6b7280;}
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
  <button class="nav-tab active" onclick="showPage('page-cand',this)" id="nav-cand">候補者管理</button>
  <button class="nav-tab" onclick="showPage('page-sheet',this)">スキルシート解析</button>
  <button class="nav-tab" onclick="showPage('page-score',this)" id="nav-score">スコアリング</button>
  <button class="nav-tab" onclick="showPage('page-questions',this)">面接質問</button>
  <button class="nav-tab" onclick="showPage('page-funnel',this)">ファネル分析</button>
  <button class="nav-tab" onclick="showPage('page-settings',this)">設定</button>
</div>

<!-- ===== 候補者管理 ===== -->
<div id="page-cand" class="page active">
<div class="wrap">
  <div class="card">
    <div class="cand-toolbar">
      <input type="text" id="cand-search" placeholder="氏名・メール・チャネルで検索..." oninput="filterCandidates()" style="font-size:12px;">
      <select id="cand-stage-filter" onchange="filterCandidates()" style="width:auto;padding:7px 10px;font-size:12px;flex-shrink:0;">
        <option value="">全ステージ</option>
        <option>書類受領</option><option>スキルシート解析</option><option>スコアリング</option>
        <option>一次面接</option><option>二次面接</option><option>オファー</option>
        <option>入社</option><option>見送り</option><option>辞退</option>
      </select>
      <div class="view-toggle">
        <button id="vt-list" class="active" onclick="switchCandView('list')">☰ リスト</button>
        <button id="vt-kanban" onclick="switchCandView('kanban')">⬛ カンバン</button>
      </div>
      <button class="btn-indigo" onclick="openNewCandForm()">＋ 候補者追加</button>
    </div>
    <div id="cand-content"><p style="font-size:12px;color:#9ca3af;text-align:center;padding:24px 0;">読み込み中...</p></div>
  </div>
</div>
</div>

<!-- ===== スキルシート解析 ===== -->
<div id="page-sheet" class="page">
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
    <div style="margin-top:16px;padding:14px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">
      <div style="font-size:12px;font-weight:700;color:#1e40af;margin-bottom:8px;">候補者レコードとして保存</div>
      <div class="frow" style="margin-bottom:8px;">
        <div class="fg"><label class="flabel">氏名（フルネーム）</label><input type="text" id="save-cand-name" placeholder="例: 山田 太郎"></div>
        <div class="fg"><label class="flabel">メールアドレス</label><input type="text" id="save-cand-email" placeholder="example@email.com"></div>
        <div class="fg"><label class="flabel">流入チャネル</label>
          <select id="save-cand-channel">
            <option value="">-- 選択 --</option>
            <option>エージェント</option><option>直接応募</option><option>リファラル</option><option>SNS</option><option>その他</option>
          </select>
        </div>
      </div>
      <button class="btn-sm" id="save-cand-btn" onclick="saveCandidateFromResult()">候補者に保存する</button>
      <span id="save-cand-status" style="font-size:11px;color:#059669;margin-left:8px;display:none;"></span>
    </div>
    <div style="margin-top:16px">
      <div class="result-header">
        <div class="result-label">営業・採用向けサマリ</div>
        <button class="copy-btn" id="cs-btn" onclick="copyText('summary-text','cs-btn')">コピー</button>
      </div>
      <div class="pre-box" id="summary-text"></div>
    </div>
    <div style="margin-top:16px;border-top:1px solid #e5e7eb;padding-top:14px;">
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
    <div class="card-title"><span class="badge badge-indigo">スコアリング</span> 候補者評価</div>
    <div id="score-sheet-ref" style="display:none;margin-bottom:14px;padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:12px;color:#374151;font-weight:600;">関連スキルシート</span>
      <a id="score-sheet-url" href="#" target="_blank" style="font-size:12px;color:#2563eb;text-decoration:none;">スプレッドシートを開く →</a>
    </div>
    <div class="frow" style="margin-bottom:14px;">
      <div class="fg"><label class="flabel">候補者名（イニシャル等）</label><input id="score-candidate" placeholder="例: A.Y" style="width:100%;"></div>
      <div class="fg"><label class="flabel">フルネーム</label><input id="score-fullname" placeholder="例: 山田 太郎" style="width:100%;"></div>
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

<!-- ===== ファネル分析 ===== -->
<div id="page-funnel" class="page">
<div class="wrap">
  <div class="card">
    <div class="card-title"><span class="badge badge-violet">ファネル分析</span> ステージ別進捗</div>
    <button class="btn-sm" onclick="loadFunnel()" style="margin-bottom:16px;">更新</button>
    <div id="funnel-content"><p style="font-size:12px;color:#9ca3af;text-align:center;padding:24px 0;">読み込み中...</p></div>
  </div>
</div>
</div>

<!-- ===== 設定 ===== -->
<div id="page-settings" class="page">
<div class="wrap">
  <div class="card">
    <div class="card-title"><span class="badge badge-orange">テンプレート管理</span> 面接質問テンプレートの追加・削除</div>
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

<!-- 候補者詳細モーダル -->
<div class="modal-overlay" id="cand-modal" style="display:none;" onclick="if(event.target===this)closeCandModal()">
  <div class="modal">
    <div class="modal-header">
      <h2 id="modal-name">候補者詳細</h2>
      <button class="modal-close" onclick="closeCandModal()">×</button>
    </div>
    <div class="modal-body" id="modal-body"></div>
  </div>
</div>

<!-- 候補者新規登録フォーム -->
<div class="cand-form-overlay" id="new-cand-overlay" style="display:none;" onclick="if(event.target===this)closeNewCandForm()">
  <div class="cand-form">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <div style="font-size:15px;font-weight:700;">候補者を追加</div>
      <button class="modal-close" onclick="closeNewCandForm()">×</button>
    </div>
    <div class="frow" style="margin-bottom:10px;">
      <div class="fg"><label class="flabel">氏名 *</label><input type="text" id="nc-name" placeholder="山田 太郎"></div>
      <div class="fg"><label class="flabel">イニシャル</label><input type="text" id="nc-initial" placeholder="Y.T"></div>
    </div>
    <div class="frow" style="margin-bottom:10px;">
      <div class="fg"><label class="flabel">メール</label><input type="text" id="nc-email" placeholder="example@email.com"></div>
      <div class="fg"><label class="flabel">電話</label><input type="text" id="nc-phone" placeholder="090-0000-0000"></div>
    </div>
    <div class="frow" style="margin-bottom:10px;">
      <div class="fg"><label class="flabel">流入チャネル</label>
        <select id="nc-channel">
          <option value="">-- 選択 --</option>
          <option>エージェント</option><option>直接応募</option><option>リファラル</option><option>SNS</option><option>その他</option>
        </select>
      </div>
      <div class="fg"><label class="flabel">初期ステージ</label>
        <select id="nc-stage">
          <option>書類受領</option><option>スキルシート解析</option><option>スコアリング</option>
          <option>一次面接</option><option>二次面接</option><option>オファー</option>
        </select>
      </div>
    </div>
    <label class="flabel">メモ</label>
    <textarea id="nc-note" placeholder="備考・メモ..." style="margin-bottom:12px;min-height:60px;"></textarea>
    <div style="display:flex;gap:8px;">
      <button class="btn-indigo" style="flex:1;" onclick="submitNewCandidate()">登録する</button>
      <button class="btn-sm" onclick="closeNewCandForm()">キャンセル</button>
    </div>
    <div id="nc-err" style="font-size:12px;color:#b91c1c;margin-top:8px;display:none;"></div>
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
  if (id === 'page-settings') loadTemplates();
  if (id === 'page-cand') loadCandidates();
  if (id === 'page-funnel') loadFunnel();
}

function switchTab(panelId, tabEl) {
  document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
  document.getElementById(panelId).classList.add('active');
  tabEl.classList.add('active');
  activeTab = (panelId === 'tab-paste') ? 'paste' : 'upload';
  checkReady();
}

// ── ファイル管理 ────────────────────────────────────────────────────
var fileEntries = [], seq = 0, activeTab = 'upload';
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

function checkReady() {
  var hasBasic = (document.getElementById('initial')||{}).value&&(document.getElementById('initial').value.trim())
    && (document.getElementById('month')||{}).value&&document.getElementById('month').value.trim()
    && (document.getElementById('price')||{}).value&&document.getElementById('price').value.trim();
  var hasContent = activeTab==='upload' ? fileEntries.some(function(e){ return e.state==='ok'; }) : ((document.getElementById('paste-text')||{}).value||'').trim().length > 0;
  var btn = document.getElementById('run-btn');
  if (btn) btn.disabled = !(hasBasic && hasContent && getToken());
}

function setStep(id, state) {
  var el = document.getElementById(id);
  if (!el) return;
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
    { label:'フル出社OK', value:2 },{ label:'ハイブリッド希望', value:1 },{ label:'フルリモート希望', value:0 },
  ]},
  { id:'workstyle2', label:'働き方②（雇用形態）', options:[
    { label:'フルタイム希望', value:1 },{ label:'それ以外', value:0 },
  ]},
  { id:'experience', label:'経験', options:[
    { label:'エンジニア3年以上＋PM経験あり', value:3 },
    { label:'エンジニア3年以上＋PL/PMO/要件定義いずれか', value:2 },
    { label:'エンジニア3年以上（上記以外）', value:1 },
    { label:'それ以外', value:0 },
  ]},
  { id:'infra', label:'技術スタック（インフラ）', options:[
    { label:'AWS/Azure/OCI/GCP 実務経験あり', value:2 },{ label:'資格のみあり', value:1 },{ label:'それ以外', value:0 },
  ]},
  { id:'ai', label:'AI使用経験・意欲', options:[
    { label:'使用経験あり', value:2 },{ label:'意欲・勉強経験あり', value:1 },{ label:'なし', value:0 },
  ]},
  { id:'recentjob', label:'直近の職歴', options:[
    { label:'ブランクなし', value:2 },{ label:'1年未満のブランク', value:1 },{ label:'1年以上のブランク', value:0 },
  ]},
];
var scoreValues = {};

function buildScoreGrid() {
  var grid = document.getElementById('score-grid');
  if (!grid) return;
  grid.innerHTML = SCORE_AXES.map(function(axis) {
    scoreValues[axis.id] = axis.options[0].value;
    var opts = axis.options.map(function(o) {
      return '<option value="'+o.value+'">'+o.label+'（'+o.value+'点）</option>';
    }).join('');
    return '<div class="score-row">'
      + '<div class="score-label">'+axis.label+'</div>'
      + '<select class="score-select" data-axis="'+axis.id+'" onchange="onScoreChange(this)">'+opts+'</select>'
      + '<div class="score-pts" id="pts-'+axis.id+'">'+axis.options[0].value+'</div>'
      + '</div>';
  }).join('');
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
  document.getElementById('score-result').className = 'score-result '+grade;
}

function copyScore() {
  var total = document.getElementById('score-total').textContent;
  var grade = document.getElementById('score-judge').textContent;
  var desc  = document.getElementById('score-desc').textContent;
  var lines = ['【スコアリング結果】', '合計: '+total+'/16点', '判定: '+grade+'（'+desc+'）', ''];
  SCORE_AXES.forEach(function(axis) {
    var sel = document.querySelector('[data-axis="'+axis.id+'"]');
    if (sel) lines.push(axis.label+': '+sel.options[sel.selectedIndex].text);
  });
  navigator.clipboard.writeText(lines.join('\\n'));
}

function resetScore() {
  scoreValues = {};
  buildScoreGrid();
  document.getElementById('score-candidate').value = '';
  document.getElementById('score-fullname').value = '';
}

async function saveScore() {
  var candidate = document.getElementById('score-candidate').value.trim();
  if (!candidate) { alert('候補者名（イニシャル等）を入力してください'); return; }
  var fullname = document.getElementById('score-fullname').value.trim();
  var total = parseInt(document.getElementById('score-total').textContent) || 0;
  var grade = document.getElementById('score-judge').textContent;
  var detail = {};
  SCORE_AXES.forEach(function(axis) {
    var sel = document.querySelector('[data-axis="'+axis.id+'"]');
    detail[axis.label] = sel ? sel.options[sel.selectedIndex].text : '';
  });
  try {
    var res = await fetch('/api/scores', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ candidate:candidate, fullname:fullname, status:'', total:total, grade:grade, detail:detail }) });
    if (!res.ok) throw new Error('保存失敗');
    document.getElementById('score-candidate').value = '';
    document.getElementById('score-fullname').value = '';
    loadScoreHistory();
  } catch(e) { alert('保存に失敗しました: '+e.message); }
}

var scoreHistoryData = [];
async function loadScoreHistory() {
  try { scoreHistoryData = await fetch('/api/scores').then(function(r){ return r.json(); }); }
  catch(_) { scoreHistoryData = []; }
  var box = document.getElementById('score-history');
  if (!scoreHistoryData.length) {
    box.innerHTML = '<p style="font-size:12px;color:#9ca3af;text-align:center;padding:16px 0;">まだ保存されたスコアはありません</p>';
    return;
  }
  var STATUS_COLORS = {
    '一次面接調整中':'#6366f1','一次面接設置済み':'#2563eb','二次面接調整中':'#0891b2',
    'オファー面談調整中':'#7c3aed','営業中':'#374151','入社':'#16a34a',
    '辞退（面接前）':'#9ca3af','辞退（面接後）':'#6b7280',
    'お見送り（面接前）':'#dc2626','お見送り（面接後）':'#b91c1c'
  };
  var html = '<table class="cand-table"><thead><tr>'
    + '<th>日時</th><th>氏名</th><th>ステータス</th><th>スコア</th><th>判定</th><th></th>'
    + '</tr></thead><tbody>';
  scoreHistoryData.forEach(function(r, i) {
    var dt = r.created_at ? r.created_at.replace('T',' ').slice(0,16) : '';
    var gc = {A:'#16a34a',B:'#2563eb',C:'#d97706',D:'#dc2626'}[r.grade] || '#6b7280';
    var nameText = r.fullname ? r.fullname+' ('+r.candidate+')' : r.candidate;
    var stOpts = ['','一次面接調整中','一次面接設置済み','二次面接調整中','オファー面談調整中','営業中','入社','辞退（面接前）','辞退（面接後）','お見送り（面接前）','お見送り（面接後）']
      .map(function(s){ return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+(s||'-- 未設定 --')+'</option>'; }).join('');
    var sc = STATUS_COLORS[r.status] || '';
    var stStyle = 'font-size:11px;padding:3px 6px;border-radius:6px;border:1px solid #d1d5db;cursor:pointer;font-family:inherit;'
      + (sc ? 'background:'+sc+';color:#fff;border-color:transparent;font-weight:600;' : '');
    html += '<tr>'
      + '<td style="color:#6b7280;white-space:nowrap;">'+dt+'</td>'
      + '<td style="font-weight:600;">'+nameText+'</td>'
      + '<td><select data-rid="'+r.id+'" onchange="updateScoreStatus(this)" style="'+stStyle+'">'+stOpts+'</select></td>'
      + '<td style="text-align:center;">'+r.total+'/16</td>'
      + '<td style="text-align:center;font-weight:700;color:'+gc+';">'+r.grade+'</td>'
      + '<td><div style="display:flex;gap:4px;">'
      + '<button class="btn-sm" data-idx="'+i+'" onclick="showScoreDetail(this.dataset.idx)">詳細</button>'
      + '<button class="btn-sm btn-danger" data-idx="'+i+'" onclick="deleteScore(this.dataset.idx)">削除</button>'
      + '</div></td></tr>';
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}

function showScoreDetail(idx) {
  var r = scoreHistoryData[parseInt(idx)]; if (!r) return;
  var detail = {}; try { detail = JSON.parse(r.detail); } catch(_) {}
  var nameStr = r.fullname ? r.fullname+' ('+r.candidate+')' : r.candidate;
  var lines = ['【'+nameStr+'】','選考ステータス: '+(r.status||'未設定'),'合計: '+r.total+'/16点　判定: '+r.grade,''];
  Object.keys(detail).forEach(function(k){ lines.push(k+': '+detail[k]); });
  alert(lines.join('\\n'));
}

async function updateScoreStatus(sel) {
  var id = sel.dataset.rid; var status = sel.value;
  var COLOR = {'一次面接調整中':'#6366f1','入社':'#16a34a','お見送り（面接前）':'#dc2626','お見送り（面接後）':'#b91c1c'};
  var c = COLOR[status] || '';
  sel.style.background = c || '#fff'; sel.style.color = c ? '#fff' : '';
  sel.style.borderColor = c ? 'transparent' : '#d1d5db'; sel.style.fontWeight = c ? '600' : '';
  try { await fetch('/api/scores/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status:status }) }); }
  catch(e) { alert('更新に失敗しました'); }
}

async function deleteScore(idx) {
  var r = scoreHistoryData[parseInt(idx)]; if (!r) return;
  if (!confirm((r.fullname||r.candidate)+' のスコアを削除しますか？')) return;
  try {
    var res = await fetch('/api/scores/'+r.id, { method:'DELETE' });
    if (!res.ok) throw new Error('削除失敗');
    loadScoreHistory();
  } catch(e) { alert('削除に失敗しました: '+e.message); }
}

// ── 面接質問 ────────────────────────────────────────────────────────
var qState = {}, qData = null;

function showQuestionsInResult(data) {
  var box = document.getElementById('result-questions'); if (!box) return;
  var cats = ['技術深掘り','上流工程・PM経験','AI活用','スポーツ経歴','共通'];
  var html = '';
  cats.forEach(function(cat) {
    var aiQs  = (data.aiQuestions && data.aiQuestions[cat]) || [];
    var tplQs = (data.templates   && data.templates[cat])   || [];
    var all = aiQs.concat(tplQs.map(function(q){ return q.question; }));
    if (!all.length) return;
    html += '<div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:4px;">'+cat+'</div>';
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
    var aiQs  = (data.aiQuestions && data.aiQuestions[cat]) || [];
    var tplQs = (data.templates   && data.templates[cat])   || [];
    if (!aiQs.length && !tplQs.length) return;
    html += '<div class="q-category"><div class="q-cat-header"><span>'+cat+'</span>';
    if (aiQs.length) html += '<span class="q-cat-badge q-ai-badge">AI生成: '+aiQs.length+'問</span>';
    html += '</div>';
    aiQs.forEach(function(q, i) {
      var id = 'ai-'+cat+'-'+i;
      if (!qState[id]) qState[id] = { checked:false, memo:'' };
      html += renderQItem(id, q, 'AI');
    });
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
  var badge = type==='AI' ? '<span class="q-cat-badge q-ai-badge" style="margin-left:6px;font-size:9px;">AI</span>' : '';
  var chk = s.checked ? ' checked' : '';
  return '<div class="'+(s.checked?'q-item selected':'q-item')+'" id="qi-'+id+'" data-qid="'+id+'">'
    + '<input type="checkbox" class="q-check"'+chk+' onchange="toggleQ(this)">'
    + '<div class="q-content"><div class="q-text">'+text+badge+'</div>'
    + '<textarea class="q-memo" placeholder="面接メモを入力..." oninput="memoQ(this)">'+s.memo+'</textarea>'
    + '</div></div>';
}

function toggleQ(checkbox) {
  var id = checkbox.closest('[data-qid]').dataset.qid;
  if (!qState[id]) qState[id] = { checked:false, memo:'' };
  qState[id].checked = checkbox.checked;
  var item = document.getElementById('qi-'+id);
  if (qState[id].checked) item.classList.add('selected'); else item.classList.remove('selected');
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
function resetQuestions() { qState = {}; if (qData) renderQuestions(qData); }

// ── テンプレート管理 ─────────────────────────────────────────────────
async function loadTemplates() {
  var res = await fetch('/api/templates').then(function(r){ return r.json(); });
  var cats = ['技術深掘り','上流工程・PM経験','AI活用','スポーツ経歴','共通'];
  var bycat = {};
  (res || []).forEach(function(t){ if (!bycat[t.category]) bycat[t.category] = []; bycat[t.category].push(t); });
  var html = '';
  cats.forEach(function(cat) {
    var items = bycat[cat] || []; if (!items.length) return;
    html += '<div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px;">'+cat+'</div>';
    items.forEach(function(t) {
      html += '<div class="tpl-item"><div class="tpl-text">'+t.question+'</div>'
        + '<button class="btn-sm btn-danger" style="flex-shrink:0" data-tid="'+t.id+'" onclick="delTemplate(this.dataset.tid)">削除</button></div>';
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

// ── 候補者管理 ────────────────────────────────────────────────────
var candidatesData = [], candViewMode = 'list';
var STAGE_COLORS = {
  '書類受領':'#6b7280','スキルシート解析':'#2563eb','スコアリング':'#7c3aed',
  '一次面接':'#0891b2','二次面接':'#0e7490','オファー':'#d97706',
  '入社':'#16a34a','見送り':'#dc2626','辞退':'#9ca3af'
};
var VALID_STAGES = ['書類受領','スキルシート解析','スコアリング','一次面接','二次面接','オファー','入社','見送り','辞退'];

function switchCandView(mode) {
  candViewMode = mode;
  document.getElementById('vt-list').classList.toggle('active', mode==='list');
  document.getElementById('vt-kanban').classList.toggle('active', mode==='kanban');
  renderCandidates(candidatesData);
}

async function loadCandidates() {
  try {
    candidatesData = await fetch('/api/candidates').then(function(r){ return r.json(); });
    if (!Array.isArray(candidatesData)) candidatesData = [];
  } catch(_) { candidatesData = []; }
  renderCandidates(candidatesData);
}

function filterCandidates() {
  var q = (document.getElementById('cand-search').value||'').toLowerCase();
  var stage = document.getElementById('cand-stage-filter').value;
  var filtered = candidatesData.filter(function(c) {
    var matchQ = !q || (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.channel||'').toLowerCase().includes(q);
    var matchS = !stage || c.stage === stage;
    return matchQ && matchS;
  });
  renderCandidates(filtered);
}

function renderCandidates(list) {
  var box = document.getElementById('cand-content');
  if (candViewMode === 'kanban') {
    renderKanban(list, box);
  } else {
    renderCandList(list, box);
  }
}

function renderCandList(list, box) {
  if (!list.length) {
    box.innerHTML = '<p style="font-size:12px;color:#9ca3af;text-align:center;padding:24px 0;">候補者がいません</p>';
    return;
  }
  var html = '<table class="cand-table"><thead><tr>'
    + '<th>氏名</th><th>ステージ</th><th>スコア</th><th>チャネル</th><th>登録日</th><th></th>'
    + '</tr></thead><tbody>';
  list.forEach(function(c) {
    var grade = c.score_grade || '-';
    var gc = 'grade-'+(grade==='A'||grade==='B'||grade==='C'||grade==='D' ? grade : 'x');
    var dt = (c.created_at||'').slice(0,10);
    var sc = STAGE_COLORS[c.stage] || '#9ca3af';
    html += '<tr onclick="openCandModal(\''+c.id+'\')" style="cursor:pointer;">'
      + '<td style="font-weight:700;">'+esc(c.name)+(c.initial?'<span style="color:#9ca3af;font-weight:400;font-size:11px;margin-left:4px;">('+esc(c.initial)+')</span>':'')+'</td>'
      + '<td><span class="stage-chip" style="background:'+sc+'20;color:'+sc+';">'+esc(c.stage)+'</span></td>'
      + '<td style="text-align:center;"><span class="grade-chip '+gc+'">'+grade+'</span></td>'
      + '<td style="color:#6b7280;">'+esc(c.channel||'-')+'</td>'
      + '<td style="color:#9ca3af;white-space:nowrap;">'+dt+'</td>'
      + '<td onclick="event.stopPropagation()"><div style="display:flex;gap:4px;">'
      + '<button class="btn-sm btn-danger" onclick="deleteCandidate(\''+c.id+'\')" style="font-size:11px;padding:3px 8px;">削除</button>'
      + '</div></td></tr>';
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}

function renderKanban(list, box) {
  var activeStages = ['書類受領','スキルシート解析','スコアリング','一次面接','二次面接','オファー'];
  var endStages    = ['入社','見送り','辞退'];
  var byStage = {};
  VALID_STAGES.forEach(function(s){ byStage[s] = []; });
  list.forEach(function(c){ if (byStage[c.stage]) byStage[c.stage].push(c); });

  function colHtml(stages) {
    return stages.map(function(s) {
      var sc = STAGE_COLORS[s] || '#9ca3af';
      var cards = byStage[s];
      var cardsHtml = cards.length ? cards.map(function(c) {
        var grade = c.score_grade || '';
        var gc = 'grade-'+(grade==='A'||grade==='B'||grade==='C'||grade==='D' ? grade : 'x');
        return '<div class="kanban-card" onclick="openCandModal(\''+c.id+'\')">'
          + '<div class="kc-name">'+esc(c.name)+'</div>'
          + '<div class="kc-meta">'+(c.initial||'')+(grade?' &nbsp;<span class="grade-chip '+gc+'" style="font-size:9px;width:18px;height:18px;line-height:18px;">'+grade+'</span>':'')+'</div>'
          + (c.channel ? '<div class="kc-meta" style="margin-top:2px;">'+esc(c.channel)+'</div>' : '')
          + '</div>';
      }).join('') : '<div class="kanban-empty">—</div>';
      return '<div class="kanban-col">'
        + '<div class="kanban-header" style="background:'+sc+'20;color:'+sc+';">'
        + '<span>'+s+'</span><span class="kanban-count" style="background:'+sc+'40;">'+cards.length+'</span>'
        + '</div>'
        + '<div class="kanban-body">'+cardsHtml+'</div>'
        + '</div>';
    }).join('');
  }

  box.innerHTML = '<div class="kanban-wrap"><div class="kanban-board">'+colHtml(activeStages)+'</div></div>'
    + '<div style="margin-top:12px;border-top:1px solid #e5e7eb;padding-top:12px;">'
    + '<div style="font-size:11px;font-weight:700;color:#9ca3af;margin-bottom:8px;">完了</div>'
    + '<div class="kanban-wrap"><div class="kanban-board">'+colHtml(endStages)+'</div></div>'
    + '</div>';
}

// ── 候補者詳細モーダル ─────────────────────────────────────────────
var currentCandId = null;

async function openCandModal(id) {
  currentCandId = id;
  var modal = document.getElementById('cand-modal');
  document.getElementById('modal-body').innerHTML = '<div style="text-align:center;padding:32px;"><span class="spinner"></span></div>';
  modal.style.display = 'flex';

  try {
    var c = await fetch('/api/candidates/'+id).then(function(r){ return r.json(); });
    var history = await fetch('/api/candidates/'+id+'/history').then(function(r){ return r.json(); });
    document.getElementById('modal-name').textContent = c.name;
    var strengths = [];
    try { strengths = JSON.parse(c.strengths||'[]'); } catch(_){}
    var stageOpts = VALID_STAGES.map(function(s){ return '<option value="'+s+'"'+(c.stage===s?' selected':'')+'>'+s+'</option>'; }).join('');
    var strengthsHtml = strengths.length ? strengths.map(function(s){ return '<span class="strength-chip">'+esc(s)+'</span>'; }).join('') : '<span style="font-size:12px;color:#9ca3af;">なし</span>';
    var histHtml = history.length ? '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      + history.map(function(h){
        return '<tr style="border-bottom:1px solid #f3f4f6;">'
          + '<td style="padding:4px 6px;color:#9ca3af;white-space:nowrap;">'+(h.created_at||'').slice(0,16)+'</td>'
          + '<td style="padding:4px 6px;color:#6b7280;">'+(h.from_stage||'—')+'</td>'
          + '<td style="padding:4px 6px;color:#374151;">→ '+esc(h.to_stage)+'</td>'
          + '</tr>';
      }).join('') + '</table>'
      : '<p style="font-size:12px;color:#9ca3af;">変更履歴なし</p>';

    document.getElementById('modal-body').innerHTML =
      '<div class="modal-section">'
      + '<div class="info-grid">'
      + mkInfo('イニシャル', c.initial||'—') + mkInfo('メール', c.email||'—')
      + mkInfo('電話', c.phone||'—') + mkInfo('チャネル', c.channel||'—')
      + '</div></div>'
      + '<div class="modal-section"><div class="modal-section-title">ステージ</div>'
      + '<div style="display:flex;align-items:center;gap:10px;">'
      + '<select class="stage-select-inline" id="modal-stage-sel" onchange="changeCandStage(this.value)">'+stageOpts+'</select>'
      + '</div></div>'
      + '<div class="modal-section"><div class="modal-section-title">強み</div><div class="strengths-list">'+strengthsHtml+'</div></div>'
      + (c.sheet_url ? '<div class="modal-section"><div class="modal-section-title">スキルシート</div><a href="'+esc(c.sheet_url)+'" target="_blank" style="font-size:12px;color:#2563eb;">スプレッドシートを開く →</a></div>' : '')
      + '<div class="modal-section"><div class="modal-section-title">メモ</div>'
      + '<textarea class="note-area" id="modal-note" onblur="saveCandNote()">'+esc(c.note||'')+'</textarea></div>'
      + '<div class="modal-section"><div class="modal-section-title">ステージ変更履歴</div>'+histHtml+'</div>'
      + '<div style="display:flex;gap:8px;margin-top:16px;">'
      + '<button class="btn-sm btn-danger" onclick="deleteCandidate(\''+c.id+'\',true)">削除</button>'
      + '</div>';
  } catch(e) {
    document.getElementById('modal-body').innerHTML = '<p style="color:#b91c1c;font-size:12px;">読み込み失敗: '+e.message+'</p>';
  }
}

function mkInfo(label, val) {
  return '<div class="info-item"><span class="ik">'+label+': </span><span class="iv">'+esc(String(val))+'</span></div>';
}

function closeCandModal() {
  document.getElementById('cand-modal').style.display = 'none';
  currentCandId = null;
}

async function changeCandStage(newStage) {
  if (!currentCandId) return;
  try {
    var res = await fetch('/api/candidates/'+currentCandId+'/stage', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ to_stage:newStage, changed_by: localStorage.getItem('g_email')||'' })
    });
    if (!res.ok) throw new Error('ステージ変更失敗');
    var c = candidatesData.find(function(x){ return x.id===currentCandId; });
    if (c) c.stage = newStage;
    filterCandidates();
    // 履歴を再読み込み
    var history = await fetch('/api/candidates/'+currentCandId+'/history').then(function(r){ return r.json(); });
    var histHtml = history.length ? '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      + history.map(function(h){
        return '<tr style="border-bottom:1px solid #f3f4f6;">'
          + '<td style="padding:4px 6px;color:#9ca3af;white-space:nowrap;">'+(h.created_at||'').slice(0,16)+'</td>'
          + '<td style="padding:4px 6px;color:#6b7280;">'+(h.from_stage||'—')+'</td>'
          + '<td style="padding:4px 6px;color:#374151;">→ '+esc(h.to_stage)+'</td>'
          + '</tr>';
      }).join('') + '</table>'
      : '<p style="font-size:12px;color:#9ca3af;">変更履歴なし</p>';
    var histSection = document.querySelector('#modal-body .modal-section:last-of-type');
    // find by title
    document.querySelectorAll('#modal-body .modal-section-title').forEach(function(el){
      if (el.textContent === 'ステージ変更履歴') { el.nextSibling.innerHTML = histHtml; }
    });
  } catch(e) { alert('ステージ変更に失敗しました: '+e.message); }
}

async function saveCandNote() {
  if (!currentCandId) return;
  var note = (document.getElementById('modal-note')||{}).value || '';
  try {
    await fetch('/api/candidates/'+currentCandId, {
      method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ note:note })
    });
    var c = candidatesData.find(function(x){ return x.id===currentCandId; });
    if (c) c.note = note;
  } catch(_) {}
}

async function deleteCandidate(id, fromModal) {
  var c = candidatesData.find(function(x){ return x.id===id; });
  if (!confirm((c ? c.name : '候補者')+' を削除しますか？')) return;
  try {
    var res = await fetch('/api/candidates/'+id, { method:'DELETE' });
    if (!res.ok) throw new Error('削除失敗');
    if (fromModal) closeCandModal();
    await loadCandidates();
  } catch(e) { alert('削除に失敗しました: '+e.message); }
}

// ── 候補者新規登録フォーム ─────────────────────────────────────────
function openNewCandForm() {
  document.getElementById('nc-name').value = '';
  document.getElementById('nc-initial').value = '';
  document.getElementById('nc-email').value = '';
  document.getElementById('nc-phone').value = '';
  document.getElementById('nc-channel').value = '';
  document.getElementById('nc-stage').value = '書類受領';
  document.getElementById('nc-note').value = '';
  document.getElementById('nc-err').style.display = 'none';
  document.getElementById('new-cand-overlay').style.display = 'flex';
}
function closeNewCandForm() { document.getElementById('new-cand-overlay').style.display = 'none'; }

async function submitNewCandidate() {
  var name = document.getElementById('nc-name').value.trim();
  if (!name) { showNcErr('氏名は必須です'); return; }
  try {
    var res = await fetch('/api/candidates', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name: name,
        initial: document.getElementById('nc-initial').value.trim(),
        email:   document.getElementById('nc-email').value.trim(),
        phone:   document.getElementById('nc-phone').value.trim(),
        channel: document.getElementById('nc-channel').value,
        stage:   document.getElementById('nc-stage').value,
        note:    document.getElementById('nc-note').value.trim(),
      })
    });
    var d = await res.json();
    if (!res.ok) throw new Error(d.error || '登録失敗');
    closeNewCandForm();
    await loadCandidates();
  } catch(e) { showNcErr(e.message); }
}
function showNcErr(msg) {
  var el = document.getElementById('nc-err');
  el.textContent = msg; el.style.display = 'block';
}

// ── 解析結果から候補者を保存 ─────────────────────────────────────
var lastAnalyzeData = null;

async function saveCandidateFromResult() {
  var name = document.getElementById('save-cand-name').value.trim();
  if (!name) { alert('氏名を入力してください'); return; }
  var btn = document.getElementById('save-cand-btn');
  btn.disabled = true;
  try {
    var payload = {
      name: name,
      initial:   (lastAnalyzeData && lastAnalyzeData.initial) || document.getElementById('initial').value.trim(),
      email:     document.getElementById('save-cand-email').value.trim(),
      channel:   document.getElementById('save-cand-channel').value,
      stage:     'スキルシート解析',
      skills_data: lastAnalyzeData,
      strengths:   lastAnalyzeData && lastAnalyzeData.skills && lastAnalyzeData.skills.strengths ? lastAnalyzeData.skills.strengths : [],
      sheet_url:   (document.getElementById('sheet-link')||{}).href || '',
    };
    var res = await fetch('/api/candidates', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    var d = await res.json();
    if (!res.ok) throw new Error(d.error || '保存失敗');
    var st = document.getElementById('save-cand-status');
    st.textContent = '✓ 候補者レコードに保存しました（ID: '+d.id+'）';
    st.style.display = 'inline';
    btn.textContent = '✓ 保存済み';
  } catch(e) {
    alert('保存に失敗しました: '+e.message);
    btn.disabled = false;
  }
}

// ── ファネル分析 ───────────────────────────────────────────────────
var FUNNEL_COLORS = ['#6b7280','#2563eb','#7c3aed','#0891b2','#0e7490','#d97706','#16a34a','#dc2626','#9ca3af'];

async function loadFunnel() {
  document.getElementById('funnel-content').innerHTML = '<p style="font-size:12px;color:#9ca3af;text-align:center;padding:24px 0;">読み込み中...</p>';
  try {
    var data = await fetch('/api/funnel').then(function(r){ return r.json(); });
    if (data.error) throw new Error(data.error);
    var funnel = data.funnel || [];
    var total  = data.total || 0;
    var maxCount = Math.max.apply(null, funnel.map(function(f){ return f.count; }).concat([1]));

    var rows = funnel.map(function(f, i) {
      var pct = Math.round((f.count / maxCount) * 100);
      var color = FUNNEL_COLORS[i] || '#9ca3af';
      var convHtml = (f.conversion != null) ? f.conversion+'%' : '';
      return '<div class="funnel-row">'
        + '<div class="funnel-stage">'+esc(f.stage)+'</div>'
        + '<div class="funnel-bar-wrap"><div class="funnel-bar" style="width:'+pct+'%;background:'+color+';">'+( f.count > 0 ? '' : '')+'</div></div>'
        + '<div class="funnel-count">'+f.count+'人</div>'
        + '<div class="funnel-conv">'+convHtml+'</div>'
        + '</div>';
    }).join('');

    var activeCount = funnel.filter(function(f){ return ['書類受領','スキルシート解析','スコアリング','一次面接','二次面接','オファー'].includes(f.stage); }).reduce(function(s,f){ return s+f.count; },0);
    var offerCount = (funnel.find(function(f){ return f.stage==='オファー'; })||{}).count || 0;

    document.getElementById('funnel-content').innerHTML =
      '<div class="funnel-wrap">'+rows+'</div>'
      + '<div class="funnel-total-row">'
      + '<div class="funnel-stat"><div class="fs-n">'+total+'</div><div class="fs-l">総候補者数</div></div>'
      + '<div class="funnel-stat"><div class="fs-n">'+activeCount+'</div><div class="fs-l">選考中</div></div>'
      + '<div class="funnel-stat"><div class="fs-n">'+offerCount+'</div><div class="fs-l">オファー段階</div></div>'
      + '</div>';
  } catch(e) {
    document.getElementById('funnel-content').innerHTML = '<p style="font-size:12px;color:#b91c1c;">読み込み失敗: '+e.message+'</p>';
  }
}

// ── メイン処理（スキルシート解析） ──────────────────────────────────
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
  var saveSt = document.getElementById('save-cand-status');
  if (saveSt) { saveSt.style.display = 'none'; }
  var saveBtn = document.getElementById('save-cand-btn');
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '候補者に保存する'; }
  ['ps1','ps2','ps3','ps4'].forEach(function(id){ setStep(id,''); });
  setStep('ps1','active');

  try {
    var r1 = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ initial:initial, month:month, price:price, pdfText:pdfText }) });
    var d1 = await r1.json();
    if (!r1.ok || d1.error) throw new Error(d1.error || '解析エラー');
    lastAnalyzeData = d1.data;
    if (lastAnalyzeData) lastAnalyzeData.initial = initial;
    setStep('ps1','done'); setStep('ps2','active');

    var r2 = await fetch('/api/sheet', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ initial:initial, data:d1.data, accessToken:token }) });
    var d2 = await r2.json();
    if (!r2.ok || d2.error) {
      if (r2.status === 401) { clearToken(); updateAuthUI(); throw new Error('Googleセッション切れ。再認証してください。'); }
      throw new Error(d2.error || 'シート作成エラー');
    }
    setStep('ps2','done'); setStep('ps3','done'); setStep('ps4','active');

    var r3 = await fetch('/api/questions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ data:d1.data }) });
    var d3 = await r3.json().catch(function(){ return {}; });
    setStep('ps4','done');

    document.getElementById('sheet-link').href = d2.sheetUrl;
    if (lastAnalyzeData) lastAnalyzeData.sheet_url = d2.sheetUrl;
    document.getElementById('summary-text').textContent = d1.summary;
    document.getElementById('result-card').classList.add('show');
    document.getElementById('result-card').scrollIntoView({ behavior:'smooth', block:'start' });

    buildScoreGrid();
    document.getElementById('score-candidate').value = initial;
    document.getElementById('score-sheet-url').href = d2.sheetUrl;
    document.getElementById('score-sheet-ref').style.display = 'flex';

    renderQuestions(d3);
    showQuestionsInResult(d3);

    var nameGuess = (d1.data && d1.data.name) ? d1.data.name : '';
    document.getElementById('save-cand-name').value = nameGuess;

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

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 初期化 ──────────────────────────────────────────────────────────
try { updateAuthUI(); } catch(e) {}
try { buildScoreGrid(); } catch(e) {}
try { loadScoreHistory(); } catch(e) {}
try { loadCandidates(); } catch(e) {}

(function() {
  var p = new URLSearchParams(location.search);
  var e = p.get('auth_err');
  if (e) {
    var box = document.getElementById('error-box');
    if (box) { box.textContent = 'Google認証エラー: ' + decodeURIComponent(e); box.style.display = 'block'; }
    history.replaceState(null,'','/');
  }
})();
</script>
</body>
</html>`;
