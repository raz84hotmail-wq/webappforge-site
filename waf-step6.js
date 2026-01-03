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
        padding:10px;overflow:auto;z-index:5
      }
      .waf-node{padding:6px 8px;border-radius:10px;
        cursor:pointer;opacity:.9;display:flex;gap:8px}
      .waf-node:hover{background:rgba(255,255,255,.06)}
      .waf-node.active{
        background:linear-gradient(90deg,
          rgba(31,124,255,.25),rgba(224,86,253,.25));
        font-weight:800
      }

      .waf-editor{
        position:absolute;top:120px;left:280px;right:380px;bottom:0;
        background:#0B1220;display:flex;flex-direction:column;
        border-right:1px solid rgba(255,255,255,.08)
      }
      .waf-editor-head{
        height:42px;display:flex;align-items:center;
        gap:10px;padding:0 14px;border-bottom:1px solid rgba(255,255,255,.08)
      }
      .waf-editor-body{flex:1;display:flex;overflow:hidden}
      .waf-lines{
        width:56px;background:rgba(255,255,255,.03);
        border-right:1px solid rgba(255,255,255,.08);
        color:rgba(255,255,255,.5);
        font-family:monospace;font-size:12px;text-align:right
      }
      .waf-lines div{padding:0 10px}
      .waf-text{
        flex:1;background:#0B1220;color:#fff;border:none;
        resize:none;padding:16px;font-family:monospace;
        font-size:13px;outline:none
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
        padding:14px;box-shadow:0 18px 60px rgba(0,0,0,.45)
      }
      .waf-phone iframe{width:100%;height:100%;border:none;border-radius:26px}
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
      renderLines(ta.value);
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

  /* =========================================================
     DRAG PHONE (FIX DEFINITIVO)
     ========================================================= */
  function enablePhoneDrag() {
    const phone = $("#wafPhone");
    const canvas = phone?.parentElement;
    if (!phone || !canvas) return;

    let dragging = false;
    let sx = 0, sy = 0, sl = 0, st = 0;

    phone.style.position = "absolute";
    phone.style.cursor = "grab";

    phone.addEventListener("mousedown", e => {
      if (e.target.tagName === "IFRAME") return;
      dragging = true;
      phone.style.cursor = "grabbing";

      const r = phone.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      sx = e.clientX;
      sy = e.clientY;
      sl = r.left - c.left;
      st = r.top - c.top;

      e.preventDefault();
    });

    document.addEventListener("mousemove", e => {
      if (!dragging) return;
      phone.style.left = sl + (e.clientX - sx) + "px";
      phone.style.top  = st + (e.clientY - sy) + "px";
    });

    const stop = () => {
      if (!dragging) return;
      dragging = false;
      phone.style.cursor = "grab";
    };

    document.addEventListener("mouseup", stop);
    document.addEventListener("mouseleave", stop);
    window.addEventListener("blur", stop);
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
    openFile("index.html");
    enablePhoneDrag();
    log("READY");
  });

})();
