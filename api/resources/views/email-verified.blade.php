<!doctype html>
<html lang="{{ 'en' }}">
  <head>
    <meta charset="utf-8">
    <title>{{ 'Email Verified' }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style>
      :root{
        --bg1:#0b1220;          /* slate-950-ish */
        --bg2:#0f172a;          /* slate-900 */
        --card:#ffffff;
        --cardBorder:rgba(148,163,184,.35);
        --text:#0f172a;         /* slate-900 */
        --muted:#64748b;        /* slate-500 */
        --muted2:#94a3b8;       /* slate-400 */
        --indigo:#4f46e5;       /* indigo-600 */
        --indigo2:#6366f1;      /* indigo-500 */
        --success:#22c55e;
      }

      *{ box-sizing:border-box; }
      body{
        margin:0;
        min-height:100vh;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
        background:
          radial-gradient(1200px 600px at 10% 0%, rgba(99,102,241,.25), transparent 60%),
          radial-gradient(900px 500px at 90% 10%, rgba(168,85,247,.18), transparent 55%),
          linear-gradient(180deg, var(--bg1), var(--bg2));
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        color:var(--text);
      }

      .shell{
        width:100%;
        max-width:460px;
      }

      .card{
        position:relative;
        background:rgba(255,255,255,.92);
        backdrop-filter: blur(10px);
        border:1px solid var(--cardBorder);
        border-radius:18px;
        box-shadow:
          0 24px 60px rgba(2,6,23,.45),
          0 0 0 1px rgba(148,163,184,.10);
        overflow:hidden;
      }

      .card:before{
        content:"";
        position:absolute;
        inset:0;
        background: radial-gradient(600px 220px at 0% 0%, rgba(79,70,229,.18), transparent 60%);
        pointer-events:none;
      }

      .header{
        position:relative;
        padding:18px 18px 10px;
        display:flex;
        align-items:center;
        gap:12px;
      }

      .appIconWrap{
        position:relative;
        width:40px;
        height:40px;
        flex:0 0 40px;
      }

      .pulseRing{
        position:absolute;
        inset:0;
        border-radius:999px;
        border:1px solid rgba(99,102,241,.55);
        box-shadow:0 0 0 6px rgba(99,102,241,.12);
        animation:pulse 1.8s ease-in-out infinite;
        opacity:.9;
      }

      @keyframes pulse{
        0%{ transform:scale(1); opacity:.85; }
        70%{ transform:scale(1.12); opacity:.15; }
        100%{ transform:scale(1.12); opacity:0; }
      }

      .appIcon{
        position:relative;
        width:40px;
        height:40px;
        border-radius:999px;
        display:block;
        background:rgba(79,70,229,.10);
        border:1px solid rgba(148,163,184,.35);
      }

      .brand{
        display:flex;
        flex-direction:column;
        gap:2px;
        min-width:0;
      }

      .brandTop{
        display:flex;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
      }

      .title{
        font-size:16px;
        font-weight:800;
        letter-spacing:-0.01em;
        margin:0;
        line-height:1.2;
      }

      .badge{
        font-size:10px;
        font-weight:700;
        padding:3px 8px;
        border-radius:999px;
        background:rgba(34,197,94,.12);
        color:#15803d;
        text-transform:uppercase;
        letter-spacing:.06em;
      }

      .subtitle{
        font-size:12px;
        color:var(--muted);
        margin:0;
      }

      .divider{
        height:1px;
        background:linear-gradient(to right, transparent, rgba(148,163,184,.55), transparent);
      }

      .content{
        position:relative;
        padding:14px 18px 16px;
      }

      .msg{
        margin:0;
        font-size:13px;
        line-height:1.55;
        color:var(--text);
      }

      .msg + .msg{ margin-top:6px; }

      .msg.th{ color:var(--muted); }

      .countRow{
        margin-top:14px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        flex-wrap:wrap;
      }

      .pill{
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:6px 10px;
        border-radius:999px;
        background:rgba(15,23,42,.06);
        border:1px solid rgba(148,163,184,.35);
        color:#334155;
        font-size:12px;
        font-weight:600;
      }

      .num{
        font-variant-numeric: tabular-nums;
        color:var(--indigo);
        font-weight:800;
      }

      .progressTrack{
        margin-top:10px;
        height:6px;
        border-radius:999px;
        background:rgba(148,163,184,.35);
        overflow:hidden;
        position:relative;
      }

      .progressBar{
        position:absolute;
        inset:0;
        background:linear-gradient(90deg, var(--indigo), var(--indigo2), #a855f7);
        transform-origin:left;
        animation:shrink linear forwards;
      }

      @keyframes shrink{
        from{ transform:scaleX(1); }
        to{ transform:scaleX(0); }
      }

      .footer{
        padding:12px 18px 14px;
        font-size:11px;
        color:var(--muted2);
        text-align:center;
      }

      .footer a{
        color:var(--indigo);
        text-decoration:none;
        font-weight:700;
      }
      .footer a:hover{ text-decoration:underline; }

      @media (max-width:420px){
        .header{ padding:16px 14px 10px; }
        .content{ padding:12px 14px 14px; }
        .footer{ padding:12px 14px 14px; }
      }
    </style>
  </head>

  <body>
    <div class="shell">
      <div class="card">
        <div class="header">
          <div class="appIconWrap" aria-hidden="true">
            <div class="pulseRing"></div>
            <img
              class="appIcon"
              src="{{ config('app.url') . '/app-icon-rounded.png' }}"
              alt="{{ config('app.name') }}"
            />
          </div>

          <div class="brand">
            <div class="brandTop">
              <h1 class="title">{{ 'Email Verified' }}</h1>
              <span class="badge">{{ 'Secure' }}</span>
            </div>
            <p class="subtitle">
              {{ 'This window will close automatically in a few seconds.' }}
            </p>
          </div>
        </div>

        <div class="divider"></div>

        <div class="content">
          <p class="msg">
            {{ 'Your email has been verified successfully. You can close this window.' }}
          </p>
          <p class="msg th">
            {{ 'อีเมลของคุณได้รับการยืนยันเรียบร้อยแล้ว คุณสามารถปิดหน้าต่างนี้ได้' }}
          </p>

          <div class="countRow">
            <span class="pill">
              Auto close in <span class="num" id="countdown">5</span> seconds
            </span>
            <span class="pill">
              ปิดอัตโนมัติใน <span class="num" id="countdown-th">5</span> วิ
            </span>
          </div>

          <div class="progressTrack" aria-hidden="true">
            <div class="progressBar" id="bar"></div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="footer">
          <div>
            {{ "If this tab doesn't close automatically, you can safely close it yourself." }}
          </div>
          <div style="margin-top:4px;">
            {{ "หากแท็บไม่ปิดเอง ให้คุณปิดหน้าต่างนี้ได้เลย" }}
          </div>
        </div>
      </div>
    </div>

    <script>
      (function () {
        var TOTAL_SECONDS = Number({{ (int)(5) }});
        var remaining = TOTAL_SECONDS;

        var countdownEl = document.getElementById("countdown");
        var countdownThEl = document.getElementById("countdown-th");
        var bar = document.getElementById("bar");

        // sync progress duration with TOTAL_SECONDS
        if (bar) bar.style.animationDuration = TOTAL_SECONDS + "s";

        function tick() {
          remaining -= 1;
          if (remaining < 0) return;

          if (countdownEl) countdownEl.textContent = remaining;
          if (countdownThEl) countdownThEl.textContent = remaining;

          if (remaining === 0) {
            try { window.close(); } catch (e) {}
          }
        }

        if (countdownEl) countdownEl.textContent = remaining;
        if (countdownThEl) countdownThEl.textContent = remaining;

        var id = setInterval(tick, 1000);
        setTimeout(function () { clearInterval(id); }, (TOTAL_SECONDS + 2) * 1000);
      })();
    </script>
  </body>
</html>
