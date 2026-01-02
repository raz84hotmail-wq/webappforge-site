/* =========================================================
   WebAppForge – STEP 6 (STABILE)
   6.0 Workspace Foundation
   6.1 File Tree + Line Numbers (FIX)
   6.2 Code Editor + Day/Night Toggle (GOODBARBER STYLE)
   6.3 Live Preview
   ========================================================= */

(function () {
  "use strict";

  const EVT_PROJECT_REGISTERED = "waf:project-registered";

  let project = null;
  let files = [];
  let contents = {};
  let activeFile = null;

  let autoSync = true;
  let previewTimer = null;
  let theme = "dark"; // dark | light

  const $ = (s, r = document) => r.querySelector(s);

  const esc = s =>
    String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const isText = p => /\.(html?|css|js|json|txt|md|svg)$/i.test(p || "");

  /* =========================================================
     STYLES
     ========================================================= */
  function injectStyles() {
    if ($("#wafStep6Styles")) return;

    const style = document.createElement("style");
    style.id = "wafStep6Styles";
    style.textContent = `
      :root{
        --bg-dark:#0B1220;
        --bg-light:#ffffff;
        --text-dark:#ffffff;
        --text-light:#0B1220;
        --line-dark:rgba(255,255,255,.45);
        --line-light:#999;
      }

      body.waf-light{
        --editor-bg:var(--bg-light);
        --editor-text:var(--text-light);
        --lines:var(--line-light);
      }
      body.waf-dark{
        --editor-bg:var(--bg-dark);
        --editor-text:var(--text-dark);
        --lines:var(--line-dark);
      }

      .waf-bar{
        position:absolute;top:72px;left:0;right:0;height:48px;
        background:rgba(10,16,30,.95);
        border-bottom:1px solid rgba(255,255,255,.1);
        display:flex;align-items:center;gap:10px;
        padding:0 14px;z-index:6;font-size:13px
      }
      .waf-tag{
        padding:4px 8px;border-radius:8px;
        background:rgba(255,255,255,.08);font-weight:800
      }
      .waf-right{margin-left:auto;display:flex;gap:10px;align-items:center}
      .waf-btn{
        padding:8px 10px;border-radius:10px;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.14);
        color:#fff;font-weight:800;cursor:pointer
      }

      /* GOODBARBER TOGGLE */
      .waf-toggle{
        width:44px;height:22px;border-radius:22px;
        background:#555;position:relative;cursor:pointer
      }
      .waf-toggle::after{
        content:"";width:18px;height:18px;
        background:#fff;border-radius:50%;
        position:absolute;top:2px;left:2px;
        transition:.25s
      }
      body.waf-light .waf-toggle{background:#1F7CFF}
      body.waf-light .waf-toggle::after{left:24px}

      .waf-tree{
        position:absolute;top:120px;left:0;bottom:0;width:280px;
        background:rgba(11,18,32,.95);
        border-right:1px solid rgba(255,255,255,.08);
        padding:10px;overflow:auto;z-index:5
      }
      .waf-node{padding:6px 8px;border-radius:10px;cursor:pointer}
      .waf-node:hover{background:rgba(255,255,255,.06)}

      .waf-editor{
        position:absolute;top:120px;left:280px;right:380px;bottom:0;
        display:flex;flex-direction:column;
        background:var(--editor-bg);
        border-right:1px solid rgba(255,255,255,.08)
      }
      .waf-editor-head{
        height:42px;display:flex;align-items:center;
        padding:0 14px;border-bottom:1px solid rgba(255,255,255,.08)
      }
      .waf-editor-body{flex:1;display:flex;overflow:hidden}

      .waf-lines{
        width:64px;
        background:rgba(0,0,0,.04);
        border-right:1px solid rgba(0,0,0,.08);
        color:var(--lines);
        font-family:monospace;font-size:12px;
        text-align:right;padding-top:16px
      }
      .waf-lines div{height:18px;line-height:18px;padding:0 12px}

      .waf-text{
        flex:1;border:none;resize:none;
        padding:16px;font-family:monospace;
        font-size:13px;line-height:18px;
        background:var(--editor-bg);
        color:var(--editor-text);
        outline:none
      }

      body.waf-dark .waf-text{
        color:#EAEAEA;
      }
      body.waf-dark .waf-text::selection{
        background:#6A1B9A;color:#fff
      }

      .waf-preview{
        position:absolute;top:120px;right:0;bottom:0;width:380px;
        background:rgba(0,0,0,.55);display:flex;flex-direction:column
      }
      .waf-preview-top{
        height:42px;display:flex;align-items:center;
        gap:8px;padding:0 10px;border-bottom:1px solid rgba(255,255,255,.08)
      }
      .waf-canvas{flex:1;display:flex;align-items:center;justify-content:center}
      .waf-phone{
        width:320px;height:660px;background:#111;border-radius:40px;
        padding:14px
      }
      .waf-phone iframe{width:100%;height:100%;border:none;border-radius:26px}
    `;
    document.head.appendChild(style);
  }

  /* =========================================================
     UI
     ========================================================= */
  function buildBar() {
    const bar = document.createElement("div");
    bar.className = "waf-bar";
    bar.innerHTML = `
      <div class="waf-tag">${esc(project.name)}</div>
      <div class="waf-right">
        <span>🌙</span>
        <div class="waf-toggle" id="wafTheme"></div>
        <span>☀️</span>
        <button class="waf-btn" id="wafRefresh">Refresh</button>
      </div>
    `;
    document.body.appendChild(bar);

    $("#wafTheme").onclick = toggleTheme;
    $("#wafRefresh").onclick = () => renderPreview(true);
  }

  function buildTree() {
    const t = document.createElement("div");
    t.className = "waf-tree";
    files.forEach(f => {
      const n = document.createElement("div");
      n.className = "waf-node";
      n.textContent = f;
      n.onclick = () => openFile(f);
      t.appendChild(n);
    });
    document.body.appendChild(t);
  }

  function buildEditor() {
    const e = document.createElement("div");
    e.className = "waf-editor";
    e.innerHTML = `
      <div class="waf-editor-head" id="wafFileName">No file</div>
      <div class="waf-editor-body">
        <div class="waf-lines" id="wafLines"></div>
        <textarea class="waf-text" id="wafText" disabled></textarea>
      </div>
    `;
    document.body.appendChild(e);

    const ta = $("#wafText");
    const lines = $("#wafLines");

    ta.addEventListener("scroll", () => lines.scrollTop = ta.scrollTop);

    ta.oninput = () => {
      contents[activeFile] = ta.value;
      renderLines(ta.value);
      debouncePreview();
    };
  }

  function buildPreview() {
    const p = document.createElement("div");
    p.className = "waf-preview";
    p.innerHTML = `
      <div class="waf-preview-top"></div>
      <div class="waf-canvas">
        <div class="waf-phone">
          <iframe id="wafFrame"></iframe>
        </div>
      </div>
    `;
    document.body.appendChild(p);
  }

  /* =========================================================
     LOGIC
     ========================================================= */
  function renderLines(txt) {
    const l = $("#wafLines");
    const c = Math.max(1, txt.split("\n").length);
    l.innerHTML = Array.from({ length: c }, (_, i) => `<div>${i + 1}</div>`).join("");
  }

  function openFile(path) {
    activeFile = path;
    $("#wafFileName").textContent = path;
    const ta = $("#wafText");
    ta.disabled = !isText(path);
    ta.value = contents[path] || "";
    renderLines(ta.value);
    renderPreview(true);
  }

  function debouncePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 300);
  }

  function renderPreview(force = false) {
    const html = contents["index.html"];
    if (html) $("#wafFrame").srcdoc = html;
  }

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark";
    document.body.classList.toggle("waf-light", theme === "light");
    document.body.classList.toggle("waf-dark", theme === "dark");
  }

  /* =========================================================
     BOOT
     ========================================================= */
  document.addEventListener(EVT_PROJECT_REGISTERED, e => {
    project = e.detail;
    files = project.files || ["index.html", "style.css", "app.js"];
    contents = project.contents || {};
    document.body.classList.add("waf-dark");
    injectStyles();
    buildBar();
    buildTree();
    buildEditor();
    buildPreview();
    openFile("index.html");
  });

})();
