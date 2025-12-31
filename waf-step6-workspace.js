/* =========================================================
   WebAppForge – STEP 6
   6.0 Workspace Foundation
   6.1 File Tree / Project Explorer
   6.2 Code Editor (Base)
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     EVENTS
     --------------------------------------------------------- */
  const EVT_PROJECT_REGISTERED = "waf:project-registered";
  const EVT_FILE_SELECTED = "waf:file-selected";

  /* ---------------------------------------------------------
     STATE
     --------------------------------------------------------- */
  let currentProject = null;
  let filesIndex = [];
  let activeFile = null;
  let fileContents = {};

  /* ---------------------------------------------------------
     HELPERS
     --------------------------------------------------------- */
  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function safeLog(...args) {
    console.log("[WAF STEP 6]", ...args);
  }

  function dispatch(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
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
      .waf-ft-title{
        font-weight:800;
        margin-bottom:10px;
        opacity:.9;
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
      .waf-ft-file:hover{
        background:rgba(255,255,255,.06);
        opacity:1;
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
        right:0;
        bottom:0;
        background:#0B1220;
        display:flex;
        flex-direction:column;
        z-index:4;
      }
      .waf-editor-header{
        height:42px;
        display:flex;
        align-items:center;
        padding:0 14px;
        border-bottom:1px solid rgba(255,255,255,.08);
        font-size:13px;
        gap:10px;
      }
      .waf-editor-filename{
        font-weight:800;
      }
      .waf-editor-body{
        flex:1;
        padding:0;
      }
      .waf-editor-textarea{
        width:100%;
        height:100%;
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
    `;
    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     WORKSPACE BAR (6.0)
     --------------------------------------------------------- */
  function showWorkspaceBar(project) {
    if ($(".waf-workspace-bar")) return;

    const bar = document.createElement("div");
    bar.className = "waf-workspace-bar";
    bar.innerHTML = `
      <div class="waf-workspace-tag">${project.name}</div>
      <div class="waf-workspace-tag">${project.type.toUpperCase()}</div>
      <div class="waf-workspace-tag">${project.method}</div>
      <div style="opacity:.6;margin-left:auto">Workspace</div>
    `;
    document.body.appendChild(bar);
  }

  /* ---------------------------------------------------------
     FILE TREE (6.1)
     --------------------------------------------------------- */
  function buildFileTree(files) {
    const tree = document.createElement("div");
    tree.className = "waf-file-tree";
    tree.id = "wafFileTree";

    const title = document.createElement("div");
    title.className = "waf-ft-title";
    title.textContent = "Project Files";
    tree.appendChild(title);

    files.forEach(f => {
      const row = document.createElement("div");
      row.className = "waf-ft-file";
      row.textContent = f.path;
      row.dataset.path = f.path;
      row.onclick = () => openFile(f.path);
      tree.appendChild(row);
    });

    return tree;
  }

  /* ---------------------------------------------------------
     EDITOR (6.2)
     --------------------------------------------------------- */
  function ensureEditor() {
    if ($(".waf-editor")) return;

    const editor = document.createElement("div");
    editor.className = "waf-editor";
    editor.innerHTML = `
      <div class="waf-editor-header">
        <div class="waf-editor-filename">No file selected</div>
      </div>
      <div class="waf-editor-body">
        <textarea class="waf-editor-textarea" disabled></textarea>
      </div>
    `;
    document.body.appendChild(editor);
  }

  function openFile(path) {
    activeFile = path;

    document.querySelectorAll(".waf-ft-file")
      .forEach(el => el.classList.remove("active"));

    const row = document.querySelector(
      `.waf-ft-file[data-path="${CSS.escape(path)}"]`
    );
    if (row) row.classList.add("active");

    ensureEditor();

    const title = $(".waf-editor-filename");
    const textarea = $(".waf-editor-textarea");

    title.textContent = path;
    textarea.disabled = false;
    textarea.value = fileContents[path] || "";

    textarea.oninput = () => {
      fileContents[path] = textarea.value;
    };

    dispatch(EVT_FILE_SELECTED, { filePath: path });
    safeLog("Editor opened:", path);
  }

  /* ---------------------------------------------------------
     LOAD FILES (IndexedDB)
     --------------------------------------------------------- */
  function loadFilesFromIDB(projectId) {
    return new Promise(resolve => {
      const req = indexedDB.open("waf_projects_db", 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("projects", "readonly");
        const store = tx.objectStore("projects");
        const getReq = store.get(projectId);
        getReq.onsuccess = () => {
          const rec = getReq.result;
          if (!rec || !rec.files) return resolve([]);
          rec.files.forEach(f => {
            fileContents[f.path] = f.isBinary ? "" : f.content;
          });
          resolve(rec.files.map(f => ({ path: f.path })));
        };
      };
      req.onerror = () => resolve([]);
    });
  }

  /* ---------------------------------------------------------
     MAIN HANDLER
     --------------------------------------------------------- */
  function onProjectRegistered(e) {
    currentProject = e.detail;
    injectStyles();
    showWorkspaceBar(currentProject);
    ensureEditor();

    $(".waf-file-tree")?.remove();

    if (currentProject.method === "zip") {
      loadFilesFromIDB(currentProject.id).then(files => {
        filesIndex = files;
        document.body.appendChild(buildFileTree(filesIndex));
      });
    } else {
      filesIndex = [{ path: "index.html" }];
      fileContents["index.html"] = "";
      document.body.appendChild(buildFileTree(filesIndex));
    }
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  function boot() {
    document.addEventListener(EVT_PROJECT_REGISTERED, onProjectRegistered);
    safeLog("Loaded (6.0 + 6.1 + 6.2)");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
