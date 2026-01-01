/* ================================
   WebAppForge – STEP 4
   Create App Wizard (ISOLATO & STABILE)
   ================================ */

(function () {
  "use strict";

  /* ---------- STATE ---------- */
  const state = {
    appType: null,
    appName: ""
  };

  /* ---------- STYLES ---------- */
  const style = document.createElement("style");
  style.textContent = `
  .modal-overlay{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.6);
    display:none;
    align-items:center;
    justify-content:center;
    z-index:9999;
  }
  .modal{
    width:520px;
    background:#0B1220;
    border-radius:18px;
    padding:22px;
    color:#fff;
    border:1px solid rgba(255,255,255,.15);
  }
  .modal h3{margin-bottom:6px}
  .modal p{opacity:.8;margin-bottom:14px}
  .app-types{
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:14px;
    margin-bottom:16px;
  }
  .app-type{
    padding:16px;
    border-radius:14px;
    border:1px solid rgba(255,255,255,.15);
    cursor:pointer;
    text-align:center;
    transition:.2s;
  }
  .app-type.active{
    background:linear-gradient(90deg,#1F7CFF,#E056FD);
    border-color:#E056FD;
  }
  .modal input{
    width:100%;
    padding:12px;
    border-radius:12px;
    border:1px solid rgba(255,255,255,.15);
    background:rgba(255,255,255,.06);
    color:#fff;
    margin-bottom:14px;
  }
  .modal-actions{
    display:flex;
    justify-content:flex-end;
    gap:10px;
  }
  .modal-actions button{
    padding:10px 14px;
    border-radius:10px;
    border:none;
    cursor:pointer;
  }
  .btn-cancel{
    background:transparent;
    color:#fff;
    border:1px solid rgba(255,255,255,.25);
  }
  .btn-ok{
    background:linear-gradient(90deg,#1F7CFF,#E056FD);
    color:#fff;
    font-weight:700;
  }
  `;
  document.head.appendChild(style);

  /* ---------- HTML ---------- */
  function buildModal() {
    if (document.getElementById("wafStep4Modal")) return;

    const html = `
    <div class="modal-overlay" id="wafStep4Modal">
      <div class="modal">
        <h3>Create your App</h3>
        <p>Select app type</p>

        <div class="app-types">
          <div class="app-type" data-type="web">🌐 Web</div>
          <div class="app-type" data-type="pwa">📲 PWA</div>
          <div class="app-type" data-type="ios">🍎 iOS</div>
          <div class="app-type" data-type="android">🤖 Android</div>
        </div>

        <input id="wafAppName" placeholder="App name" />

        <div class="modal-actions">
          <button class="btn-cancel" id="wafCancel">Cancel</button>
          <button class="btn-ok" id="wafContinue">Continue</button>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);

    bindEvents();
  }

  /* ---------- EVENTS ---------- */
  function bindEvents() {
    const modal = document.getElementById("wafStep4Modal");
    const types = modal.querySelectorAll(".app-type");
    const input = modal.querySelector("#wafAppName");

    types.forEach(el => {
      el.addEventListener("click", () => {
        types.forEach(t => t.classList.remove("active"));
        el.classList.add("active");
        state.appType = el.dataset.type;
      });
    });

    document.getElementById("wafCancel").onclick = close;
    document.getElementById("wafContinue").onclick = () => {
      state.appName = input.value.trim();

      if (!state.appType || !state.appName) {
        alert("Select app type and name");
        return;
      }

      document.dispatchEvent(
        new CustomEvent("waf:create-app", {
          detail: { ...state }
        })
      );

      close();
    };
  }

  /* ---------- API ---------- */
  function open() {
    buildModal();
    document.getElementById("wafStep4Modal").style.display = "flex";
  }

  function close() {
    const m = document.getElementById("wafStep4Modal");
    if (m) m.style.display = "none";
  }

  /* ---------- EXPOSE (CRITICO) ---------- */
  window.WAF_STEP4 = { open };

  /* ---------- BOOT ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[WAF STEP 4] Ready");
  });

})();
