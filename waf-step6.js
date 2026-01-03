/* =========================================================
 WebAppForge – STEP 6 (STABILE)
 6.0 Workspace Foundation
 6.1 File Tree
 6.2 Code Editor + Line Numbers
 6.3 Live Preview (Mobile / Desktop)
 ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     EVENT
     ========================================================= */
  const EVT_PROJECT_REGISTERED = "waf:project-registered";

  /* =========================================================
     STATE
     ========================================================= */
  let project = null;
  let files = [];
  let contents = {};
  let activeFile = null;

  let autoSync = true;
  let allowJsAuto = false;
  let deviceMode = "mobile";
  let previewTimer = null;

  /* =========================================================
     HELPERS
     ========================================================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const esc = s =>
    String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const isText = p =>
    /\.(html?|css|js|json|txt|md|svg)$/i.test(p || "");

  const log = (...a) => console.log("[WAF STEP 6]", ...a);

  /* =========================================================
     STYLES
     ========================================================= */
  function injectStyles() {
    if ($("#wafStep6Styles")) return;

    const style = document.createElement("style");
    style.id = "wafStep6Styles";
    style.textContent = `
      /* ===== EXISTING STYLES (INTOCCATI) ===== */

      .waf-bar{
        position:absolute;top:72px;left:0;right:0;height:48px;
        background:rgba(10,16,30,.95);
        border-bottom:1px solid rgba(255,255,255,.1);
        display:flex;align-items:center;gap:10px;
        padding:0 14px;z-index:6;font-size:13px
      }
      .waf-tag{padding:4px 8px;border-radius:8px;
        background:rgba(255,255,255,.08);font-weight:800}
      .waf-right{margin-left:auto;display:flex;gap:8px}
      .waf-btn{padding:8px 10px;border-radius:10px;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.14);
        color:#fff;font-weight:800;cursor:pointer}

      .waf-tree{
        position:absolute;top:120px;left:0;bottom:0;width:280px;
        background:rgba(11,18,32,.95);
        border-right:1px solid rgba(255,255,255,.08);
        padding:10px;overflow:auto;z-index:5;
        display:flex;flex-direction:column
      }

      .waf-node{padding:6px 8px;border-radius:10px;
        cursor:pointer;opacity:.9;display:flex;gap:8px}
      .waf-node:hover{background:rgba(255,255,255,.06)}
      .waf-node.active{
        background:linear-gradient(90deg,
          rgba(31,124,255,.25),rgba(224,86,253,.25));
        font-weight:800
      }

      /* ===== AGGIUNTA: FOOTER FILE TREE ===== */
      .waf-tree-footer{
        margin-top:auto;
        padding:10px 6px 6px;
        border-top:1px solid rgba(255,255,255,.08);
        display:flex;
        align-items:center;
        justify-content:flex-start
      }

      .waf-theme-toggle{
        display:flex;
        align-items:center;
        gap:8px;
        padding:6px 10px;
        border-radius:12px;
        background:rgba(255,255,255,.08);
        cursor:pointer;
        font-weight:800;
        user-select:none
      }

      /* ===== LIGHT THEME ===== */
      body[data-theme="light"]{
        background:#f4f6fb;
        color:#111
      }
      body[data-theme="light"] .waf-tree{
        background:#ffffff
      }
      body[data-theme="light"] .waf-editor{
        background:#ffffff
      }
      body[data-theme="light"] .waf-text{
        background:#ffffff;
        color:#000
      }
    `;
    document.head.appendChild(style);
  }

  /* =========================================================
     UI BUILD
     ========================================================= */
  function buildBar() {
    const bar = document.createElement("div");
    bar.className = "waf-bar";
    bar.innerHTML = `
      <div class="waf-tag">${esc(project.name)}</div>
      <div class="waf-tag">${esc(project.type || "")}</div>
      <div class="waf-right">
        <label class="waf-tag">
          <input id="wafAuto" type="checkbox" checked> Auto
        </label>
        <button class="waf-btn" id="wafRefresh">Refresh</button>
      </div>
    `;
    document.body.appendChild(bar);

    $("#wafAuto").onchange = e => autoSync = e.target.checked;
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

    /* ===== AGGIUNTA: TOGGLE GIORNO / NOTTE ===== */
    const footer = document.createElement("div");
    footer.className = "waf-tree-footer";
    footer.innerHTML = `
      <div class="waf-theme-toggle" id="wafThemeToggle">
        🌙 / ☀️
      </div>
    `;
    t.appendChild(footer);

    footer.onclick = () => {
      document.body.dataset.theme =
        document.body.dataset.theme === "light" ? "" : "light";
    };

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
    ta.oninput = () => {
      if (!activeFile) return;
      contents[activeFile] = ta.value;
      if (autoSync) debouncePreview();
    };
  }

  function buildPreview() {
    const p = document.createElement("div");
    p.className = "waf-preview";
    p.innerHTML = `
      <div class="waf-preview-top">
        <button class="waf-btn" id="wafMobile">📱</button>
        <button class="waf-btn" id="wafDesktop">🖥️</button>
      </div>
      <div class="waf-canvas">
        <div class="waf-phone" id="wafPhone">
          <iframe id="wafFrame"></iframe>
        </div>
      </div>
    `;
    document.body.appendChild(p);
  }

  function enablePhoneDrag() {
    const phone = $("#wafPhone");
    const canvas = phone?.parentElement;
    if (!phone || !canvas) return;

    let dragging = false;
    let sx = 0, sy = 0, sl = 0, st = 0;

    phone.style.position = "absolute";
    phone.style.cursor = "grab";

    const stopDrag = () => dragging = false;

    phone.addEventListener("mousedown", e => {
      if (e.target.tagName === "IFRAME") return;
      dragging = true;
      const r = phone.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY;
      sl = r.left - c.left; st = r.top - c.top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", e => {
      if (!dragging) return;
      phone.style.left = sl + (e.clientX - sx) + "px";
      phone.style.top = st + (e.clientY - sy) + "px";
    });

    document.addEventListener("mouseup", stopDrag);
  }

  /* =========================================================
     BOOT
     ========================================================= */
  document.addEventListener(EVT_PROJECT_REGISTERED, e => {
    project = e.detail;
    files = project.files || ["index.html", "style.css", "app.js"];
    contents = project.contents || {};
    injectStyles();
    buildBar();
    buildTree();
    buildEditor();
    buildPreview();
    enablePhoneDrag();
    log("READY");
  });

})();
