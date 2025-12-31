/* =========================================================
   WebAppForge – STEP 6 (6.0)
   Workspace / Editor Foundation
   ========================================================= */

(function () {
  "use strict";

  const EVT_PROJECT_REGISTERED = "waf:project-registered";

  let currentProject = null;

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function safeLog(...args) {
    console.log("[WAF STEP6]", ...args);
  }

  /* ---------------------------------------------------------
     UI Injection
     --------------------------------------------------------- */

  function injectStyles() {
    if (document.getElementById("wafStep6Styles")) return;

    const style = document.createElement("style");
    style.id = "wafStep6Styles";
    style.textContent = `
      .waf-workspace-bar{
        position:absolute;
        top:0;left:0;right:0;
        height:48px;
        background:rgba(10,16,30,.9);
        border-bottom:1px solid rgba(255,255,255,.1);
        display:flex;
        align-items:center;
        padding:0 16px;
        gap:12px;
        z-index:5;
        color:#fff;
        font-size:13px;
      }
      .waf-workspace-tag{
        padding:4px 8px;
        border-radius:8px;
        background:rgba(255,255,255,.08);
        font-weight:700;
      }
    `;
    document.head.appendChild(style);
  }

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
     Event Handlers
     --------------------------------------------------------- */

  function onProjectRegistered(e) {
    currentProject = e.detail;
    safeLog("Project loaded into workspace:", currentProject);

    injectStyles();
    showWorkspaceBar(currentProject);
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */

  function boot() {
    document.addEventListener(EVT_PROJECT_REGISTERED, onProjectRegistered);
    safeLog("Loaded");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
