/* =========================================================
   WebAppForge – STEP 6
   6.0 Workspace Foundation
   6.1 File Tree / Project Explorer
   6.2 Code Editor (Base)
   6.3 Live Preview Sync + iPhone Preview
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     EVENTS
     --------------------------------------------------------- */
  const EVT_PROJECT_REGISTERED = "waf:project-registered";

  /* ---------------------------------------------------------
     STATE
     --------------------------------------------------------- */
  let currentProject = null;
  let filesIndex = [];
  let activeFile = null;
  let fileContents = {};
  let previewTimer = null;

  /* ---------------------------------------------------------
     HELPERS
     --------------------------------------------------------- */
  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function safeLog(...args) {
    console.log("[WAF STEP 6]", ...args);
  }

  /* ---------------------------------------------------------
     STYLES
     --------------------------------------------------------- */
  function injectStyles() {
    if ($("#wafStep6Styles")) return;

    const style = document.createElement("style");
    style.id = "wafStep6Styles";
    style.textContent = `
      /* ===== WORKSPACE BAR ===== */
      .waf-workspace-bar{
        position:absolute;
        top:72px;left:0;right:0;
        height:48px;
        background:rgba(10,16,30,.92);
        border-bottom:1px solid rgba(255,255,255,.1);
        display:flex;
        align-items:center;
        padding:0 16px;
        gap:10px;
        z-index:6;
        color:#fff;
        font-size:13px;
      }
      .waf-workspace-tag{
        padding:4px 8px;
        border-radius:8px;
        background:rgba(255,255,255,.08);
        font-weight:700;
      }

      /* ===== FILE TREE ===== */
      .waf-file-tree{
        position:absolute;
        top:120px;
        left:0;
        bottom:0;
        width:260px;
        background:rgba(11,18,32,.95);
        border-right:1px solid rgba(255,255,255,.08);
        padding:12px 10px;
        overflow:auto;
        z-index:5;
        font-size:13px;
      }
      .waf-ft-file{
        padding:6px 8px;
        border-radius:8px;
        cursor:pointer;
        opacity:.85;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .waf-ft-file.active{
        background:linear-gradient(
          90deg,
          rgba(31,124,255,.25),
          rgba(224,86,253,.25)
        );
        font-weight:700;
        opacity:1;
      }

      /* ===== EDITOR ===== */
      .waf-editor{
        position:absolute;
        top:120px;
        left:260px;
        right:360px;
        bottom:0;
        background:#0B1220;
        display:flex;
        flex-direction:column;
        z-index:4;
      }
      .waf-editor-header{
        height:42px;
        padding:0 14px;
        display:flex;
        align-items:center;
        border-bottom:1px solid rgba(255,255,255,.08);
        font-weight:700;
      }
      .waf-editor-textarea{
        flex:1;
        background:#0B1220;
        color:#fff;
        border:none;
        outline:none;
        resize:none;
        padding:16px;
        font-family:monospace;
        font-size:13px;
        line-height:1.5;
      }

      /* ===== IPHONE PREVIEW ===== */
      .waf-preview{
        position:absolute;
        top:120px;
        right:0;
        bottom:0;
        width:360px;
        background:#000;
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:4;
      }
      .waf-phone{
        width:320px;
        height:650px;
        background:#111;
        border-radius:38px;
        padding:14px;
        box-shadow:0 0 0 6px #222;
      }
      .waf-phone iframe{
        width:100%;
        height:100%;
        border:none;
        border-radius:24px;
        background:#fff;
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     UI BUILDERS
     --------------------------------------------------------- */
  function showWorkspaceBar(p) {
    if ($(".waf-workspace-bar")) return;
    const bar = document.createElement("div");
    bar.className = "waf-workspace-bar";
    bar.innerHTML = `
      <div class="waf-workspace-tag">${p.name}</div>
      <div class="waf-workspace-tag">${p.type.toUpperCase()}</div>
      <div class="waf-workspace-tag">${p.method}</div>
      <div style="margin-left:auto;opacity:.6">Workspace</div>
    `;
    document.body.appendChild(bar);
  }

  function buildFileTree(files) {
    const tree = document.createElement("div");
    tree.className = "waf-file-tree";
    files.forEach(f => {
      const row = document.createElement("div");
      row.className = "waf-ft-file";
      row.textContent = f.path;
      row.onclick = () => openFile(f.path);
      tree.appendChild(row);
    });
    document.body.appendChild(tree);
  }

  function ensureEditor() {
    if ($(".waf-editor")) return;
    const ed = document.createElement("div");
    ed.className = "waf-editor";
    ed.innerHTML = `
      <div class="waf-editor-header" id="wafEditorFile">No file</div>
      <textarea class="waf-editor-textarea" disabled></textarea>
    `;
    document.body.appendChild(ed);
  }

  function ensurePreview() {
    if ($(".waf-preview")) return;
    const p = document.createElement("div");
    p.className = "waf-preview";
    p.innerHTML = `
      <div class="waf-phone">
        <iframe id="wafPreviewFrame"></iframe>
      </div>
    `;
    document.body.appendChild(p);
  }

  /* ---------------------------------------------------------
     EDIT + LIVE PREVIEW (6.3)
     --------------------------------------------------------- */
  function openFile(path) {
    activeFile = path;
    ensureEditor();
    ensurePreview();

    $("#wafEditorFile").textContent = path;
    const ta = $(".waf-editor-textarea");
    ta.disabled = false;
    ta.value = fileContents[path] || "";

    ta.oninput = () => {
      fileContents[path] = ta.value;
      schedulePreview();
    };
  }

  function schedulePreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 400);
  }

  function updatePreview() {
    const html = fileContents["index.html"];
    if (!html) return;
    const iframe = $("#wafPreviewFrame");
    iframe.srcdoc = html;
  }

  /* ---------------------------------------------------------
     LOAD PROJECT
     --------------------------------------------------------- */
  function onProjectRegistered(e) {
    currentProject = e.detail;
    injectStyles();
    showWorkspaceBar(currentProject);
    ensureEditor();
    ensurePreview();

    filesIndex = [{ path: "index.html" }];
    fileContents["index.html"] = "";
    buildFileTree(filesIndex);
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  function boot() {
    document.addEventListener(EVT_PROJECT_REGISTERED, onProjectRegistered);
    safeLog("Loaded (6.0 → 6.3)");
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", boot)
    : boot();

})();
