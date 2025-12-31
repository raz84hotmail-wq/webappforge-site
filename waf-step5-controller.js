/* =========================================================
   WebAppForge – STEP 5 (5.0 → 5.4) SUPER COMPLETO
   Controller + Method Picker + ZIP Import + Normalize + Registry
   (Non tocca dashboard.html)
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     5.0 — CREATE APP CONTROLLER (CORE DISPATCHER)
     --------------------------------------------------------- */

  const VERSION = "5.0.0";
  const EVT_CREATE_APP = "waf:create-app";              // emesso da Step4
  const EVT_METHOD_SELECTED = "waf:method-selected";    // interno step5
  const EVT_PROJECT_REGISTERED = "waf:project-registered";
  const EVT_PREVIEW_READY = "waf:preview-ready";
  const EVT_ERROR = "waf:error";

  const METHODS = {
    BLANK: "blank",
    ZIP: "zip",
    GITHUB: "github",
    AI: "ai"
  };

  const state = {
    // ricevuto da step4
    appName: "",
    appType: "",
    // scelto in step5.1
    method: "",
    // zip info
    zipFileName: "",
    // normalized project
    project: null
  };

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function uid(prefix = "waf") {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function dispatch(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function ensureIframe() {
    const iframe = document.querySelector(".preview iframe");
    if (!iframe) throw new Error("Preview iframe not found (.preview iframe).");
    return iframe;
  }

  function safeLog(...args) {
    console.log("[WAF STEP5]", ...args);
  }

  function showToast(msg) {
    // toast semplice, non invasivo
    let t = document.getElementById("wafToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "wafToast";
      t.style.cssText = `
        position:fixed;left:50%;bottom:20px;transform:translateX(-50%);
        background:rgba(10,16,30,.92);color:#fff;
        border:1px solid rgba(255,255,255,.14);
        border-radius:12px;padding:10px 12px;
        font-size:13px;z-index:10000;
        max-width:80vw;box-shadow:0 18px 60px rgba(0,0,0,.35);
        opacity:0;transition:opacity .2s;
      `;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(t._to);
    t._to = setTimeout(() => (t.style.opacity = "0"), 1800);
  }

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-waf-src="${src}"]`);
      if (existing) return resolve();

      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.dataset.wafSrc = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(s);
    });
  }

  /* ---------------------------------------------------------
     5.4 — STORAGE (LocalStorage + IndexedDB)
     - LocalStorage: lista progetti + metadata
     - IndexedDB: file binari (zip estratto) per “vera piattaforma”
     --------------------------------------------------------- */

  const LS_KEY = "waf:projects:index";
  const IDB_NAME = "waf_projects_db";
  const IDB_STORE = "projects";

  function readIndex() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function writeIndex(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  function openIDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbPut(record) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /* ---------------------------------------------------------
     UI: Step 5.1 — METHOD PICKER (modal)
     --------------------------------------------------------- */

  function injectStyles() {
    if (document.getElementById("wafStep5Styles")) return;

    const style = document.createElement("style");
    style.id = "wafStep5Styles";
    style.textContent = `
      .waf5-overlay{
        position:fixed;inset:0;
        background:rgba(0,0,0,.6);
        display:none;align-items:center;justify-content:center;
        z-index:10000;
      }
      .waf5-modal{
        width:560px;max-width:92vw;
        background:#0B1220;
        border:1px solid rgba(255,255,255,.12);
        border-radius:18px;
        padding:20px 20px 16px 20px;
        color:#fff;
        box-shadow:0 18px 60px rgba(0,0,0,.35);
      }
      .waf5-title{font-size:18px;font-weight:800;margin-bottom:6px}
      .waf5-sub{font-size:13px;opacity:.85;margin-bottom:14px;line-height:1.35}
      .waf5-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:14px 0 10px}
      .waf5-card{
        padding:14px;border-radius:14px;
        border:1px solid rgba(255,255,255,.12);
        background:rgba(255,255,255,.04);
        cursor:pointer;transition:.15s;
        user-select:none;
      }
      .waf5-card:hover{border-color:#1F7CFF}
      .waf5-card.active{
        border-color:#E056FD;
        background:linear-gradient(90deg,rgba(31,124,255,.25),rgba(224,86,253,.25));
      }
      .waf5-card.disabled{opacity:.45;cursor:not-allowed}
      .waf5-card h4{font-size:14px;margin-bottom:6px}
      .waf5-card p{font-size:12px;opacity:.85;line-height:1.25}
      .waf5-row{
        display:flex;gap:10px;justify-content:flex-end;align-items:center;margin-top:12px
      }
      .waf5-btn{
        padding:12px 14px;border-radius:12px;border:none;cursor:pointer;
        font-weight:800;color:#fff;
        background:linear-gradient(90deg,#1F7CFF,#E056FD);
        min-width:140px;
      }
      .waf5-btn.secondary{
        background:transparent;border:1px solid rgba(255,255,255,.16);
        font-weight:700;
      }
      .waf5-hidden{display:none!important}
      .waf5-file{
        width:100%;
        padding:12px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.15);
        background:rgba(255,255,255,.06);
        color:#fff;
      }
      .waf5-mini{font-size:12px;opacity:.75;margin-top:8px}
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    if (document.getElementById("waf5Overlay")) return;

    const html = `
      <div class="waf5-overlay" id="waf5Overlay">
        <div class="waf5-modal">
          <div class="waf5-title">Create App – Method</div>
          <div class="waf5-sub">
            <b>${escapeHtml(state.appName || "New App")}</b> • ${escapeHtml((state.appType || "").toUpperCase())}
            <br/>Choose how to create the project. (Step 5.1)
          </div>

          <div class="waf5-grid" id="waf5Methods">
            <div class="waf5-card" data-method="blank">
              <h4>✨ Blank Project</h4>
              <p>Start from a clean template. Fast + structured.</p>
            </div>
            <div class="waf5-card" data-method="zip">
              <h4>📦 Import ZIP</h4>
              <p>Upload your code as ZIP. We detect index.html and preview instantly.</p>
            </div>
            <div class="waf5-card disabled" data-method="github" title="Soon">
              <h4>🐙 GitHub Repo (Soon)</h4>
              <p>Connect and import a repository.</p>
            </div>
            <div class="waf5-card disabled" data-method="ai" title="Soon">
              <h4>🧠 AI Generate (Soon)</h4>
              <p>Describe your app and let AI generate structure + code.</p>
            </div>
          </div>

          <div id="waf5ZipRow" class="waf5-hidden">
            <input class="waf5-file" id="waf5ZipInput" type="file" accept=".zip" />
            <div class="waf5-mini">Tip: your ZIP should contain an <b>index.html</b> (any folder level).</div>
          </div>

          <div class="waf5-row">
            <button class="waf5-btn secondary" id="waf5Cancel">Cancel</button>
            <button class="waf5-btn" id="waf5Continue">Continue</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);

    const overlay = document.getElementById("waf5Overlay");
    const methods = document.getElementById("waf5Methods");
    const zipRow = document.getElementById("waf5ZipRow");
    const zipInput = document.getElementById("waf5ZipInput");

    let selected = "";

    methods.addEventListener("click", (e) => {
      const card = e.target.closest(".waf5-card");
      if (!card) return;
      if (card.classList.contains("disabled")) return;

      $all(".waf5-card", methods).forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      selected = card.dataset.method;

      zipRow.classList.toggle("waf5-hidden", selected !== METHODS.ZIP);
    });

    document.getElementById("waf5Cancel").onclick = () => closeModal();
    document.getElementById("waf5Continue").onclick = async () => {
      if (!selected) {
        alert("Select a method first.");
        return;
      }

      state.method = selected;

      if (selected === METHODS.ZIP) {
        const f = zipInput.files && zipInput.files[0];
        if (!f) {
          alert("Select a ZIP file.");
          return;
        }
        state.zipFileName = f.name;
        closeModal();
        dispatch(EVT_METHOD_SELECTED, { ...state, zipFile: f });
        return;
      }

      closeModal();
      dispatch(EVT_METHOD_SELECTED, { ...state });
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  function openModal() {
    ensureModal();
    const overlay = document.getElementById("waf5Overlay");
    overlay.style.display = "flex";
  }

  function closeModal() {
    const overlay = document.getElementById("waf5Overlay");
    if (overlay) overlay.style.display = "none";
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* ---------------------------------------------------------
     5.2 — ZIP IMPORT (JSZip + read files)
     --------------------------------------------------------- */

  async function importZip(zipFile) {
    // carica JSZip via CDN (senza toccare dashboard.html)
    // NB: GitHub Pages permette CDN.
    await loadScriptOnce("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js");

    if (!window.JSZip) throw new Error("JSZip not available after load.");

    showToast("Importing ZIP…");
    const zip = await window.JSZip.loadAsync(zipFile);

    // estrai tutti i file “normali” (no directory)
    const files = [];
    const entries = Object.keys(zip.files);

    for (const path of entries) {
      const entry = zip.files[path];
      if (entry.dir) continue;

      const lower = path.toLowerCase();
      const isBinary = !(
        lower.endsWith(".html") ||
        lower.endsWith(".htm") ||
        lower.endsWith(".css") ||
        lower.endsWith(".js") ||
        lower.endsWith(".json") ||
        lower.endsWith(".txt") ||
        lower.endsWith(".svg") ||
        lower.endsWith(".md")
      );

      const content = isBinary
        ? await entry.async("arraybuffer")
        : await entry.async("string");

      files.push({
        path: normalizePath(path),
        isBinary,
        content
      });
    }

    return files;
  }

  function normalizePath(p) {
    return String(p || "")
      .replaceAll("\\", "/")
      .replaceAll(/\/+/g, "/")
      .replaceAll(/^\.\//g, "")
      .replaceAll(/^\//g, "");
  }

  /* ---------------------------------------------------------
     5.3 — NORMALIZATION (detect index.html + Blob map + rewrite HTML)
     - Trova index.html anche in sottocartelle
     - Crea blob URLs per assets
     - Riscrive i riferimenti nel main HTML (best-effort)
     --------------------------------------------------------- */

  function detectEntry(files) {
    // preferisci root index.html
    const rootIndex = files.find(f => f.path.toLowerCase() === "index.html");
    if (rootIndex) return "index.html";

    // altrimenti prima occorrenza di */index.html
    const anyIndex = files.find(f => f.path.toLowerCase().endsWith("/index.html"));
    if (anyIndex) return anyIndex.path;

    // fallback: primo html
    const anyHtml = files.find(f => f.path.toLowerCase().endsWith(".html") || f.path.toLowerCase().endsWith(".htm"));
    if (anyHtml) return anyHtml.path;

    throw new Error("No HTML entry found in ZIP (missing index.html).");
  }

  function getDir(path) {
    const i = path.lastIndexOf("/");
    return i === -1 ? "" : path.slice(0, i + 1);
  }

  function joinPath(baseDir, rel) {
    if (!rel) return baseDir;
    if (/^https?:\/\//i.test(rel)) return rel;
    if (rel.startsWith("data:")) return rel;
    if (rel.startsWith("#")) return rel;
    if (rel.startsWith("/")) return rel; // non riscriviamo assoluti

    const stack = baseDir.split("/").filter(Boolean);
    const parts = rel.split("/");

    for (const part of parts) {
      if (!part || part === ".") continue;
      if (part === "..") stack.pop();
      else stack.push(part);
    }
    return stack.join("/");
  }

  function buildBlobMap(files) {
    const map = new Map(); // path -> blobURL
    const revoke = [];

    for (const f of files) {
      const mime = guessMime(f.path);
      const blob = f.isBinary
        ? new Blob([f.content], { type: mime })
        : new Blob([String(f.content)], { type: mime });
      const url = URL.createObjectURL(blob);
      map.set(f.path, url);
      revoke.push(url);
    }

    return { map, revoke };
  }

  function guessMime(path) {
    const p = path.toLowerCase();
    if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
    if (p.endsWith(".css")) return "text/css";
    if (p.endsWith(".js")) return "text/javascript";
    if (p.endsWith(".json")) return "application/json";
    if (p.endsWith(".svg")) return "image/svg+xml";
    if (p.endsWith(".png")) return "image/png";
    if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
    if (p.endsWith(".webp")) return "image/webp";
    if (p.endsWith(".gif")) return "image/gif";
    if (p.endsWith(".woff2")) return "font/woff2";
    if (p.endsWith(".woff")) return "font/woff";
    if (p.endsWith(".ttf")) return "font/ttf";
    return "application/octet-stream";
  }

  function rewriteHTML(entryHtml, entryDir, blobMap) {
    // riscrittura “best-effort” su href/src
    // NON è un bundler, ma migliora tantissimo la preview per quasi tutti i siti statici.

    let html = String(entryHtml);

    // sostituisci href/src relativi → blob url se matcha un file
    // pattern: href="..." src='...'
    html = html.replace(/(href|src)\s*=\s*["']([^"']+)["']/gi, (m, attr, val) => {
      const v = val.trim();
      if (!v) return m;
      if (/^https?:\/\//i.test(v) || v.startsWith("data:") || v.startsWith("#")) return m;

      const resolved = normalizePath(joinPath(entryDir, v));
      const blob = blobMap.get(resolved);
      if (!blob) return m; // se non troviamo, lasciamo com’è

      return `${attr}="${blob}"`;
    });

    // aggiungi “base” per aiutare path residuali (non assoluti), puntando alla dir entry
    // (Nota: base con blob non sempre risolve tutto, ma aiuta alcune risorse)
    if (!/<base\s/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (h) => `${h}\n<base href="${entryDir || "./"}">`);
    }

    return html;
  }

  async function normalizeProjectFromZip(files) {
    const entryPath = detectEntry(files);
    const entryDir = getDir(entryPath);

    const { map: blobMap, revoke } = buildBlobMap(files);

    const entryFile = files.find(f => f.path === entryPath);
    if (!entryFile || entryFile.isBinary) throw new Error("Entry HTML missing or invalid.");

    const rewritten = rewriteHTML(entryFile.content, entryDir, blobMap);

    // crea un blob per l’entry riscritto
    const entryBlob = new Blob([rewritten], { type: "text/html" });
    const entryUrl = URL.createObjectURL(entryBlob);
    revoke.push(entryUrl);

    return {
      entryPath,
      entryUrl,
      revokeUrls: revoke,
      fileCount: files.length,
      files
    };
  }

  /* ---------------------------------------------------------
     5.4 — PROJECT REGISTRATION (LocalStorage + IndexedDB)
     --------------------------------------------------------- */

  async function registerProject(projectNormalized) {
    const id = uid("proj");

    const meta = {
      id,
      name: state.appName,
      type: state.appType,
      method: state.method,
      createdAt: new Date().toISOString(),
      zipFileName: state.zipFileName || "",
      entryPath: projectNormalized.entryPath,
      fileCount: projectNormalized.fileCount,
      version: VERSION
    };

    // Local index (veloce)
    const index = readIndex();
    index.unshift(meta);
    writeIndex(index);

    // IndexedDB (vero storage)
    // NB: salviamo solo ciò che serve. Evitiamo blob URL (non persistono).
    if (state.method === METHODS.ZIP) {
      const filesForDB = projectNormalized.files.map(f => ({
        path: f.path,
        isBinary: f.isBinary,
        content: f.content
      }));
      await idbPut({ id, meta, files: filesForDB });
    } else {
      await idbPut({ id, meta, files: [] });
    }

    dispatch(EVT_PROJECT_REGISTERED, meta);
    return meta;
  }

  /* ---------------------------------------------------------
     Preview apply
     --------------------------------------------------------- */

  function applyPreview(entryUrl) {
    const iframe = ensureIframe();
    iframe.src = entryUrl;
    dispatch(EVT_PREVIEW_READY, { url: entryUrl });
  }

  /* ---------------------------------------------------------
     Main Orchestrator: handle Step4 → Step5
     --------------------------------------------------------- */

  function onCreateApp(e) {
    try {
      const d = e.detail || {};
      state.appType = String(d.appType || "").trim();
      state.appName = String(d.appName || "").trim();

      if (!state.appType || !state.appName) {
        throw new Error("Missing appType/appName from Step 4.");
      }

      // apri metodo (Step 5.1)
      openModal();
    } catch (err) {
      safeLog("Error on create-app:", err);
      dispatch(EVT_ERROR, { step: "5.0", message: err.message });
      alert(err.message);
    }
  }

  async function onMethodSelected(e) {
    try {
      const d = e.detail || {};
      state.method = d.method || state.method;

      if (state.method === METHODS.BLANK) {
        showToast("Creating blank project…");

        // Blank project: preview = index.html già presente nella repo (step3)
        // (per ora, preview resta com’è, ma registriamo progetto)
        const normalized = {
          entryPath: "index.html",
          entryUrl: ensureIframe().src,
          revokeUrls: [],
          fileCount: 0,
          files: []
        };

        const meta = await registerProject(normalized);
        showToast(`Project created: ${meta.name}`);
        return;
      }

      if (state.method === METHODS.ZIP) {
        const zipFile = d.zipFile;
        if (!zipFile) throw new Error("ZIP file missing.");
        showToast("Reading ZIP…");

        const files = await importZip(zipFile);
        showToast(`ZIP loaded (${files.length} files)…`);

        const normalized = await normalizeProjectFromZip(files);
        state.project = normalized;

        // preview immediata
        applyPreview(normalized.entryUrl);

        // registra progetto
        const meta = await registerProject(normalized);
        showToast(`Imported: ${meta.name} ✅`);
        return;
      }

      // future: github / ai
      alert("This method is coming soon.");
    } catch (err) {
      safeLog("Error on method-selected:", err);
      dispatch(EVT_ERROR, { step: "5.x", message: err.message });
      alert(err.message);
    }
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */

  function boot() {
    injectStyles();
    ensureModal();

    document.addEventListener(EVT_CREATE_APP, onCreateApp);
    document.addEventListener(EVT_METHOD_SELECTED, onMethodSelected);

    // Public debug API
    window.WAF_STEP5 = {
      version: VERSION,
      readIndex,
      state,
      openMethodPicker: openModal
    };

    safeLog("Loaded", VERSION);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
