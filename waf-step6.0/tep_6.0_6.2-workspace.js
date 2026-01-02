/* =========================================================
   WebAppForge – STEP 6 (STABILE)
   6.0 Workspace Foundation
   6.1 File Tree + Line Numbers
   6.2 Code Editor (FULL AREA) + Theme Toggle FIX
   ========================================================= */

(function () {
  "use strict";

  const EVT_PROJECT_REGISTERED = "waf:project-registered";

  let project = null;
  let files = [];
  let contents = {};
  let activeFile = null;
  let previewTimer = null;
  let theme = "dark";

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
        --text-dark:#eaeaea;
        --text-light:#0B1220;
        --lines-dark:rgba(255,255,255,.45);
        --lines-light:#888;
      }

      body.waf-dark{
        --editor-bg:var(--bg-dark);
        --editor-text:var(--text-dark);
        --editor-lines:var(--lines-dark);
      }
      body.waf-light{
        --editor-bg:var(--bg-light);
        --editor-text:var(--text-light);
        --editor-lines:var(--lines-light);
      }

      /* FILE TREE */
      .waf-tree{
        position:absolute;top:72px;left:0;bottom:0;width:260px;
        background:#0B1220;
        border-right:1px solid rgba(255,255,255,.08);
        padding:10px;overflow:auto;z-index:5
      }
      .waf-node{padding:6px 8px;border-radius:10px;cursor:pointer}
      .waf-node:hover{background:rgba(255,255,255,.06)}

      /* EDITOR = FULL AREA */
      .waf-editor{
        position:absolute;
        top:72px;
        left:260px;
        right:0;
        bottom:0;
        display:flex;
        background:var(--editor-bg);
      }

      .waf-lines{
        width:64px;
        background:rgba(0,0,0,.05);
        border-right:1px solid rgba(0,0,0,.1);
        color:var(--editor-lines);
        font-family:monospace;
        font-size:12px;
        text-align:right;
        padding-top:16px;
      }
      .waf-lines div{
        height:18px;
        line-height:18px;
        padding:0 12px;
      }

      .waf-text{
        flex:1;
        width:100%;
        height:100%;
        border:none;
        resize:none;
        padding:16px;
        font-family:monospace;
        font-size:13px;
        line-height:18px;
        background:var(--editor-bg);
        color:var(--editor-text);
        outline:none;
      }

      /* THEME TOGGLE – BOTTOM RIGHT */
      .waf-theme-toggle{
        position:absolute;
        bottom:18px;
        right:18px;
        width:44px;
        height:22px;
        border-radius:22px;
        background:#555;
        cursor:pointer;
        z-index:10;
      }
      .waf-theme-toggle::after{
        content:"";
        width:18px;height:18px;
        background:#fff;
        border-radius:50%;
        position:absolute;
        top:2px;left:2px;
        transition:.25s;
      }
      body.waf-light .waf-theme-toggle{
        background:#1F7CFF;
      }
      body.waf-light .waf-theme-toggle::after{
        left:24px;
      }
    `;
    document.head.appendChild(style);
  }

  /* =========================================================
     UI
     ========================================================= */
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
      <div class="waf-lines" id="wafLines"></div>
      <textarea class="waf-text" id="wafText" disabled></textarea>
      <div class="waf-theme-toggle" id="wafTheme"></div>
    `;
    document.body.appendChild(e);

    const ta = $("#wafText");
    const lines = $("#wafLines");

    ta.addEventListener("scroll", () => {
      lines.scrollTop = ta.scrollTop;
    });

    ta.oninput = () => {
      contents[activeFile] = ta.value;
      renderLines(ta.value);
      debouncePreview();
    };

    $("#wafTheme").onclick = toggleTheme;
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
    const ta = $("#wafText");
    ta.disabled = !isText(path);
    ta.value = contents[path] || "";
    renderLines(ta.value);
  }

  function debouncePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {}, 300);
  }

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark";
    document.body.classList.toggle("waf-dark", theme === "dark");
    document.body.classList.toggle("waf-light", theme === "light");
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
    buildTree();
    buildEditor();
    openFile("index.html");
  });

})();
