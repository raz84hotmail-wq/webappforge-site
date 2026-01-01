/* =========================================================
   WebAppForge – STEP 6
   6.0 Workspace Foundation
   6.1.x File Tree / Project Explorer (folders + collapsible + search)
   6.2.x Code Editor (Base) + GitHub-like line numbers
   6.3 Live Sync Editor ↔ Preview + iPhone Preview (device toggle)
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

  // Files
  let filesIndex = [];              // [{path}]
  let fileContents = {};            // path -> string (solo testo)
  let activeFile = null;

  // Preview
  let previewTimer = null;
  let autoSync = true;              // HTML/CSS live (JS controllato)
  let allowJsAuto = false;          // JS auto off (sicuro)
  let deviceMode = "mobile";        // mobile | desktop
  let rotated = false;

  /* ---------------------------------------------------------
     HELPERS
     --------------------------------------------------------- */
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function safeLog(...args) { console.log("[WAF STEP 6]", ...args); }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isTextFile(path) {
    const p = String(path || "").toLowerCase();
    return (
      p.endsWith(".html") || p.endsWith(".htm") ||
      p.endsWith(".css") ||
      p.endsWith(".js") ||
      p.endsWith(".json") ||
      p.endsWith(".txt") ||
      p.endsWith(".md") ||
      p.endsWith(".svg")
    );
  }

  function normalizePath(p) {
    return String(p || "")
      .replaceAll("\\", "/")
      .replaceAll(/\/+/g, "/")
      .replaceAll(/^\.\//g, "")
      .replaceAll(/^\//g, "");
  }

  function joinPath(baseDir, rel) {
    if (!rel) return baseDir || "";
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith("data:") || rel.startsWith("#")) return rel;
    if (rel.startsWith("/")) return rel; // lasciamo assoluti

    const stack = (baseDir || "").split("/").filter(Boolean);
    const parts = String(rel).split("/");

    for (const part of parts) {
      if (!part || part === ".") continue;
      if (part === "..") stack.pop();
      else stack.push(part);
    }
    return stack.join("/");
  }

  function getDir(path) {
    const i = String(path).lastIndexOf("/");
    return i === -1 ? "" : path.slice(0, i + 1);
  }

  function debouncePreview(ms = 350) {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, ms);
  }

  /* ---------------------------------------------------------
     STYLES
     --------------------------------------------------------- */
  function injectStyles() {
    if ($("#wafStep6Styles")) return;

    const style = document.createElement("style");
    style.id = "wafStep6Styles";
    style.textContent = `
      /* ===== WORKSPACE BAR (6.0) ===== */
      .waf-workspace-bar{
        position:absolute;
        top:72px;left:0;right:0;
        height:48px;
        background:rgba(10,16,30,.92);
        border-bottom:1px solid rgba(255,255,255,.1);
        display:flex;
        align-items:center;
        padding:0 14px;
        gap:10px;
        z-index:6;
        color:#fff;
        font-size:13px;
      }
      .waf-workspace-tag{
        padding:4px 8px;
        border-radius:8px;
        background:rgba(255,255,255,.08);
        font-weight:800;
      }
      .waf-ws-right{margin-left:auto;display:flex;gap:8px;align-items:center;opacity:.95}
      .waf-ws-btn{
        padding:8px 10px;
        border-radius:10px;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.14);
        color:#fff;
        cursor:pointer;
        font-weight:800;
        font-size:12px;
      }
      .waf-ws-btn:active{transform:translateY(1px)}
      .waf-ws-toggle{
        display:flex;align-items:center;gap:6px;
        font-size:12px;opacity:.9;
        padding:6px 8px;border-radius:10px;
        border:1px solid rgba(255,255,255,.14);
        background:rgba(255,255,255,.06);
      }
      .waf-ws-toggle input{transform:scale(1.05)}

      /* ===== FILE TREE (6.1.x) ===== */
      .waf-file-tree{
        position:absolute;
        top:120px; left:0; bottom:0;
        width:280px;
        background:rgba(11,18,32,.95);
        border-right:1px solid rgba(255,255,255,.08);
        padding:10px 10px 14px 10px;
        overflow:auto;
        z-index:5;
        font-size:13px;
      }
      .waf-ft-head{
        display:flex;flex-direction:column;gap:10px;
        margin-bottom:10px;
      }
      .waf-ft-title{
        font-weight:900;opacity:.92;
        display:flex;align-items:center;gap:8px;
      }
      .waf-ft-search{
        width:100%;
        padding:10px 10px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.14);
        background:rgba(255,255,255,.06);
        color:#fff;
        outline:none;
        font-size:13px;
      }
      .waf-ft-node{
        user-select:none;
        border-radius:10px;
        padding:6px 8px;
        cursor:pointer;
        opacity:.9;
        display:flex;
        align-items:center;
        gap:8px;
      }
      .waf-ft-node:hover{background:rgba(255,255,255,.06);opacity:1}
      .waf-ft-node.active{
        background:linear-gradient(90deg,rgba(31,124,255,.25),rgba(224,86,253,.25));
        font-weight:800;
        opacity:1;
      }
      .waf-ft-indent{display:inline-block;width:14px}
      .waf-ft-icon{width:18px;text-align:center;opacity:.95}
      .waf-ft-muted{opacity:.6}

      /* ===== EDITOR (6.2.x) ===== */
      .waf-editor{
        position:absolute;
        top:120px;
        left:280px;
        right:380px;
        bottom:0;
        background:#0B1220;
        display:flex;
        flex-direction:column;
        z-index:4;
        border-right:1px solid rgba(255,255,255,.08);
      }
      .waf-editor-header{
        height:42px;
        padding:0 14px;
        display:flex;
        align-items:center;
        gap:10px;
        border-bottom:1px solid rgba(255,255,255,.08);
        font-size:13px;
      }
      .waf-editor-filename{font-weight:900}
      .waf-editor-badge{
        padding:4px 8px;border-radius:999px;
        background:rgba(255,255,255,.06);
        border:1px solid rgba(255,255,255,.12);
        opacity:.9;font-weight:800;font-size:12px;
      }

      .waf-editor-body{
        flex:1;
        display:flex;
        overflow:hidden;
      }
      .waf-lines{
        width:56px;
        padding:16px 0;
        background:rgba(255,255,255,.02);
        border-right:1px solid rgba(255,255,255,.08);
        overflow:hidden;
        color:rgba(255,255,255,.55);
        font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size:12px;
        line-height:1.5;
        text-align:right;
        user-select:none;
      }
      .waf-lines div{padding:0 10px}
      .waf-editor-textarea{
        flex:1;
        background:#0B1220;
        color:#fff;
        border:none;
        outline:none;
        resize:none;
        padding:16px;
        font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size:13px;
        line-height:1.5;
        overflow:auto;
      }

      /* ===== PREVIEW (iPhone mock) ===== */
      .waf-preview{
        position:absolute;
        top:120px;
        right:0;
        bottom:0;
        width:380px;
        background:rgba(0,0,0,.55);
        display:flex;
        flex-direction:column;
        z-index:4;
      }
      .waf-preview-top{
        height:42px;
        display:flex;
        align-items:center;
        gap:8px;
        padding:0 10px;
        border-bottom:1px solid rgba(255,255,255,.08);
        background:rgba(10,16,30,.72);
        color:#fff;
        font-size:12px;
      }
      .waf-preview-top .spacer{flex:1}
      .waf-preview-btn{
        padding:8px 10px;
        border-radius:10px;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.14);
        color:#fff;
        cursor:pointer;
        font-weight:900;
        font-size:12px;
      }
      .waf-preview-canvas{
        flex:1;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
      }
      .waf-phone{
        width:320px;
        height:660px;
        background:#111;
        border-radius:40px;
        padding:14px;
        box-shadow:0 0 0 6px #222, 0 18px 60px rgba(0,0,0,.45);
        position:relative;
        transition:.2s;
      }
      .waf-phone.rotated{
        width:660px;
        height:320px;
      }
      .waf-phone .notch{
        position:absolute;
        top:10px;left:50%;
        transform:translateX(-50%);
        width:140px;height:18px;
        border-radius:999px;
        background:#000;
        opacity:.75;
        z-index:2;
      }
      .waf-phone iframe{
        width:100%;
        height:100%;
        border:none;
        border-radius:26px;
        background:#fff;
      }
      .waf-desktop-frame{
        width:100%;
        height:100%;
        border:none;
        border-radius:14px;
        background:#fff;
        box-shadow:0 18px 60px rgba(0,0,0,.25);
      }
      .waf-hidden{display:none!important}
    `;
    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     UI BUILDERS (6.0 / 6.1 / 6.2 / Preview)
     --------------------------------------------------------- */
  function showWorkspaceBar(p) {
    if ($(".waf-workspace-bar")) return;

    const bar = document.createElement("div");
    bar.className = "waf-workspace-bar";
    bar.innerHTML = `
      <div class="waf-workspace-tag">${escapeHtml(p.name)}</div>
      <div class="waf-workspace-tag">${escapeHtml(String(p.type || "").toUpperCase())}</div>
      <div class="waf-workspace-tag">${escapeHtml(String(p.method || ""))}</div>

      <div class="waf-ws-right">
        <div class="waf-ws-toggle" title="HTML/CSS auto sync">
          <input id="wafAutoSync" type="checkbox" checked />
          <span>Auto Sync</span>
        </div>
        <div class="waf-ws-toggle" title="Auto-run JS in preview (not recommended)">
          <input id="wafAllowJsAuto" type="checkbox" />
          <span>JS Auto</span>
        </div>
        <button class="waf-ws-btn" id="wafForceRefresh">Refresh</button>
      </div>
    `;
    document.body.appendChild(bar);

    $("#wafAutoSync").addEventListener("change", (e) => {
      autoSync = !!e.target.checked;
      if (autoSync) debouncePreview(10);
    });

    $("#wafAllowJsAuto").addEventListener("change", (e) => {
      allowJsAuto = !!e.target.checked;
      // per sicurezza: se lo attivi, forziamo refresh manuale (non live)
      if (allowJsAuto) {
        // niente
      }
    });

    $("#wafForceRefresh").addEventListener("click", () => {
      updatePreview(true);
    });
  }

  function ensureFileTree() {
    $(".waf-file-tree")?.remove();

    const tree = document.createElement("div");
    tree.className = "waf-file-tree";
    tree.id = "wafFileTree";

    tree.innerHTML = `
      <div class="waf-ft-head">
        <div class="waf-ft-title">📁 Project Explorer</div>
        <input class="waf-ft-search" id="wafFtSearch" placeholder="Search files..." />
      </div>
      <div id="wafFtBody"></div>
    `;

    document.body.appendChild(tree);

    $("#wafFtSearch").addEventListener("input", () => {
      renderTree();
    });
  }

  function ensureEditor() {
    if ($(".waf-editor")) return;

    const ed = document.createElement("div");
    ed.className = "waf-editor";
    ed.innerHTML = `
      <div class="waf-editor-header">
        <div class="waf-editor-filename" id="wafEditorFile">No file selected</div>
        <div class="waf-editor-badge" id="wafEditorHint">Open a file from the tree</div>
      </div>

      <div class="waf-editor-body">
        <div class="waf-lines" id="wafLines"></div>
        <textarea class="waf-editor-textarea" id="wafEditor" disabled spellcheck="false"></textarea>
      </div>
    `;
    document.body.appendChild(ed);

    const ta = $("#wafEditor");
    const lines = $("#wafLines");

    // scroll sync line numbers
    ta.addEventListener("scroll", () => {
      lines.scrollTop = ta.scrollTop;
    });

    // input -> update lines + preview
    ta.addEventListener("input", () => {
      if (!activeFile) return;
      fileContents[activeFile] = ta.value;
      renderLineNumbers(ta.value);

      // live rules:
      // - HTML/CSS always live if autoSync
      // - JS only if allowJsAuto (otherwise manual refresh)
      if (!autoSync) return;

      const lower = activeFile.toLowerCase();
      const isJs = lower.endsWith(".js");
      if (isJs && !allowJsAuto) return;

      debouncePreview(350);
    });
  }

  function ensurePreview() {
    if ($(".waf-preview")) return;

    const wrap = document.createElement("div");
    wrap.className = "waf-preview";
    wrap.innerHTML = `
      <div class="waf-preview-top">
        <button class="waf-preview-btn" id="wafModeMobile">📱</button>
        <button class="waf-preview-btn" id="wafModeDesktop">🖥️</button>
        <button class="waf-preview-btn" id="wafRotate">⤾</button>
        <div class="spacer"></div>
        <span style="opacity:.8">Preview</span>
      </div>

      <div class="waf-preview-canvas">
        <div class="waf-phone" id="wafPhone">
          <div class="notch"></div>
          <iframe id="wafPreviewFrame"></iframe>
        </div>

        <iframe class="waf-desktop-frame waf-hidden" id="wafPreviewDesktop"></iframe>
      </div>
    `;
    document.body.appendChild(wrap);

    $("#wafModeMobile").addEventListener("click", () => {
      deviceMode = "mobile";
      updatePreview(true);
      applyDeviceMode();
    });
    $("#wafModeDesktop").addEventListener("click", () => {
      deviceMode = "desktop";
      updatePreview(true);
      applyDeviceMode();
    });
    $("#wafRotate").addEventListener("click", () => {
      rotated = !rotated;
      $("#wafPhone").classList.toggle("rotated", rotated);
    });

    applyDeviceMode();
  }

  function applyDeviceMode() {
    const phone = $("#wafPhone");
    const desk = $("#wafPreviewDesktop");
    if (!phone || !desk) return;

    const isMobile = deviceMode === "mobile";
    phone.classList.toggle("waf-hidden", !isMobile);
    desk.classList.toggle("waf-hidden", isMobile);
  }

  /* ---------------------------------------------------------
     6.1.x — TREE DATA (folders + collapsible + search)
     --------------------------------------------------------- */
  function buildTreeModel(paths) {
    const root = { type: "dir", name: "", path: "", children: new Map() };

    for (const p0 of paths) {
      const p = normalizePath(p0);
      const parts = p.split("/").filter(Boolean);

      let node = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (isLast) {
          node.children.set(part, { type: "file", name: part, path: p });
        } else {
          if (!node.children.has(part)) {
            const dirPath = parts.slice(0, i + 1).join("/") + "/";
            node.children.set(part, { type: "dir", name: part, path: dirPath, children: new Map(), open: true });
          }
          node = node.children.get(part);
        }
      }
    }

    return root;
  }

  // open state per directory path
  const dirOpenState = new Map(); // dirPath -> bool

  function renderTree() {
    const body = $("#wafFtBody");
    if (!body) return;

    const search = ($("#wafFtSearch")?.value || "").trim().toLowerCase();

    // Build model sorted (folders first, then files)
    const model = buildTreeModel(filesIndex.map(f => f.path));

    body.innerHTML = "";
    renderNodeChildren(body, model, 0, search);
  }

  function sortChildren(map) {
    const dirs = [];
    const files = [];

    for (const [name, node] of map.entries()) {
      if (node.type === "dir") dirs.push([name, node]);
      else files.push([name, node]);
    }

    dirs.sort((a, b) => a[0].localeCompare(b[0]));
    files.sort((a, b) => a[0].localeCompare(b[0]));

    return [...dirs, ...files];
  }

  function matchesSearch(node, search) {
    if (!search) return true;
    if (node.type === "file") return node.path.toLowerCase().includes(search);
    // dir: show if any child matches
    for (const [, child] of node.children.entries()) {
      if (child.type === "file" && child.path.toLowerCase().includes(search)) return true;
      if (child.type === "dir" && matchesSearch(child, search)) return true;
    }
    return false;
  }

  function renderNodeChildren(container, dirNode, depth, search) {
    const childrenSorted = sortChildren(dirNode.children);

    for (const [, node] of childrenSorted) {
      if (!matchesSearch(node, search)) continue;

      const row = document.createElement("div");
      row.className = "waf-ft-node";
      row.style.paddingLeft = `${8 + depth * 14}px`;

      if (node.type === "dir") {
        const isOpen = dirOpenState.has(node.path) ? dirOpenState.get(node.path) : true;
        dirOpenState.set(node.path, isOpen);

        row.innerHTML = `
          <span class="waf-ft-icon">${isOpen ? "📂" : "📁"}</span>
          <span>${escapeHtml(node.name)}</span>
          <span class="waf-ft-muted" style="margin-left:auto">${isOpen ? "▾" : "▸"}</span>
        `;

        row.addEventListener("click", () => {
          dirOpenState.set(node.path, !dirOpenState.get(node.path));
          renderTree();
        });

        container.appendChild(row);

        if (dirOpenState.get(node.path)) {
          renderNodeChildren(container, node, depth + 1, search);
        }
      } else {
        row.dataset.path = node.path;
        row.innerHTML = `
          <span class="waf-ft-icon">📄</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(node.name)}</span>
        `;
        row.addEventListener("click", () => openFile(node.path));
        container.appendChild(row);

        if (activeFile === node.path) row.classList.add("active");
      }
    }
  }

  /* ---------------------------------------------------------
     6.2.x — EDITOR + LINE NUMBERS
     --------------------------------------------------------- */
  function renderLineNumbers(text) {
    const lines = $("#wafLines");
    if (!lines) return;

    const count = Math.max(1, String(text || "").split("\n").length);
    let html = "";
    for (let i = 1; i <= count; i++) html += `<div>${i}</div>`;
    lines.innerHTML = html;
  }

  function setEditorContent(path, content) {
    ensureEditor();

    $("#wafEditorFile").textContent = path;
    $("#wafEditorHint").textContent = isTextFile(path) ? "Editing" : "Binary/unsupported";

    const ta = $("#wafEditor");
    if (!isTextFile(path)) {
      ta.value = "";
      ta.disabled = true;
      renderLineNumbers("");
      return;
    }

    ta.disabled = false;
    ta.value = content || "";
    renderLineNumbers(ta.value);
  }

  function highlightActiveInTree(path) {
    $all(".waf-ft-node").forEach(el => el.classList.remove("active"));
    const row = $(`.waf-ft-node[data-path="${CSS.escape(path)}"]`);
    if (row) row.classList.add("active");
  }

  function openFile(path) {
    activeFile = path;

    // highlight
    highlightActiveInTree(path);

    // content
    const txt = fileContents[path] || "";
    setEditorContent(path, txt);

    // if it’s important for preview, sync (optional)
    if (autoSync) {
      const lower = path.toLowerCase();
      const isJs = lower.endsWith(".js");
      if (!isJs || allowJsAuto) debouncePreview(200);
    }
  }

  /* ---------------------------------------------------------
     6.3 — LIVE PREVIEW BUILD (srcdoc)
     - HTML/CSS live
     - JS only if allowJsAuto OR manual refresh
     --------------------------------------------------------- */
  function resolveIfLocal(entryDir, ref) {
    const resolved = normalizePath(joinPath(entryDir, ref));
    return fileContents.hasOwnProperty(resolved) ? resolved : null;
  }

  function inlineAssetsForIndexHtml(rawHtml) {
    let html = String(rawHtml || "");
    const entryDir = getDir("index.html");

    // Inline local CSS referenced by <link rel="stylesheet" href="...">
    html = html.replace(/<link([^>]+)rel=["']stylesheet["']([^>]+)>/gi, (m) => {
      const hrefMatch = m.match(/href\s*=\s*["']([^"']+)["']/i);
      if (!hrefMatch) return m;
      const href = hrefMatch[1].trim();
      if (/^https?:\/\//i.test(href) || href.startsWith("data:")) return m;

      const localPath = resolveIfLocal(entryDir, href);
      if (!localPath) return m;

      const css = String(fileContents[localPath] || "");
      return `<style data-waf-inline="css" data-waf-path="${escapeHtml(localPath)}">\n${css}\n</style>`;
    });

    // Inline local JS referenced by <script src="..."></script>
    html = html.replace(/<script([^>]+)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a, src, b) => {
      const s = String(src || "").trim();
      if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return m;

      const localPath = resolveIfLocal(entryDir, s);
      if (!localPath) return m;

      if (!allowJsAuto) {
        // keep script tag but disable it to avoid auto-run
        return `<!-- JS disabled (enable JS Auto or press Refresh) : ${escapeHtml(localPath)} -->`;
      }

      const js = String(fileContents[localPath] || "");
      return `<script data-waf-inline="js" data-waf-path="${escapeHtml(localPath)}">\n${js}\n</script>`;
    });

    // Ensure <base> to help relative links (best-effort)
    if (!/<base\s/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (h) => `${h}\n<base href="./">`);
    }

    return html;
  }

  function updatePreview(force = false) {
    ensurePreview();

    // RULES:
    // - if autoSync OFF, update only when force=true
    if (!autoSync && !force) return;

    const indexHtml = fileContents["index.html"] || "";
    if (!indexHtml.trim()) return;

    const finalHtml = inlineAssetsForIndexHtml(indexHtml);

    if (deviceMode === "mobile") {
      const iframe = $("#wafPreviewFrame");
      if (iframe) iframe.srcdoc = finalHtml;
    } else {
      const iframe = $("#wafPreviewDesktop");
      if (iframe) iframe.srcdoc = finalHtml;
    }
  }

  /* ---------------------------------------------------------
     LOAD FILES FROM INDEXEDDB (from Step 5.4)
     - reads record {id, meta, files[]}
     --------------------------------------------------------- */
  function loadFilesFromIDB(projectId) {
    return new Promise((resolve) => {
      const req = indexedDB.open("waf_projects_db", 1);

      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("projects", "readonly");
        const store = tx.objectStore("projects");
        const getReq = store.get(projectId);

        getReq.onsuccess = () => {
          const rec = getReq.result;
          if (!rec || !Array.isArray(rec.files)) return resolve([]);

          const paths = [];
          for (const f of rec.files) {
            const path = normalizePath(f.path);
            paths.push({ path });

            // keep only text content in editor
            if (f.isBinary) {
              // ignore binary in editor for now
              continue;
            }
            if (isTextFile(path)) fileContents[path] = String(f.content || "");
          }

          resolve(paths);
        };
        getReq.onerror = () => resolve([]);
      };

      req.onerror = () => resolve([]);
    });
  }

  /* ---------------------------------------------------------
     PROJECT HANDLER (6.0→6.3 boot)
     --------------------------------------------------------- */
  async function onProjectRegistered(e) {
    currentProject = e.detail || {};
    injectStyles();

    showWorkspaceBar(currentProject);
    ensureFileTree();
    ensureEditor();
    ensurePreview();

    // reset
    filesIndex = [];
    fileContents = {};
    activeFile = null;

    if (String(currentProject.method || "") === "zip" && currentProject.id) {
      // load from IDB (imported zip)
      filesIndex = await loadFilesFromIDB(currentProject.id);

      // fallback: ensure index.html exists if present in contents
      if (!filesIndex.some(f => f.path.toLowerCase() === "index.html") && fileContents["index.html"]) {
        filesIndex.unshift({ path: "index.html" });
      }
    } else {
      // blank project fallback
      filesIndex = [{ path: "index.html" }, { path: "style.css" }, { path: "app.js" }];
      fileContents["index.html"] =
`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(currentProject.name || "WebAppForge App")}</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <h1>Hello WebAppForge 🚀</h1>
  <p>Edit files on the left.</p>
  <script src="app.js"></script>
</body>
</html>`;
      fileContents["style.css"] = `body{font-family:system-ui,Arial,sans-serif;padding:18px}`;
      fileContents["app.js"] = `console.log("WebAppForge: app.js loaded");`;
    }

    renderTree();

    // open index.html by default if exists
    if (fileContents["index.html"] !== undefined) {
      openFile("index.html");
      updatePreview(true);
    } else if (filesIndex[0]?.path) {
      openFile(filesIndex[0].path);
      updatePreview(true);
    }

    safeLog("Workspace ready:", {
      project: currentProject,
      files: filesIndex.length
    });
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  function boot() {
    document.addEventListener(EVT_PROJECT_REGISTERED, onProjectRegistered);
    safeLog("Loaded (6.0 + 6.1.x + 6.2.x + 6.3 + iPhone Preview)");
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", boot)
    : boot();

})();
