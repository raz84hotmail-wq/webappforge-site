/* ================================
   WebAppForge – STEP 4
   Create App Wizard (ISOLATO & STABILE)
   ================================ */

(function () {
  "use strict";

  console.log("[WAF STEP 4] loading...");

  /* ---------- STATE ---------- */
  const state = {
    appType: null,
    appName: ""
  };

  /* ---------- INIT ---------- */
  function init() {
    if (document.getElementById("wafStep4Modal")) return;

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
        z-index:9999
      }
      .modal{
        width:520px;
        background:#0B1220;
        border-radius:18px;
        border:1px solid rgba(255,255,255,.12);
        padding:22px;
        color:#fff
      }
      .modal h3{margin-bottom:10px}
      .modal p{opacity:.85;margin-bottom:14px}
      .app-types{
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:14px;
        margin-bottom:16px
      }
      .app-type{
        padding:16px;
        border-radius:14px;
        border:1px solid rgba(255,255,255,.12);
        background:rgba(255,255,255,.04);
        cursor:pointer;
        text-align:center;
        transition:.2s
      }
      .app-type:hover{border-color:#1F7CFF}
      .app-type.active{
        background:linear-gradient(
          90deg,
          rgba(31,124,255,.25),
          rgba(224,86,253,.25)
        );
        border-color:#E056FD
      }
      .modal input{
        width:100%;
        padding:12px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.15);
        background:rgba(255,255,255,.06);
        color:#fff;
        margin-bottom:14px
      }
      .modal-actions{
        display:flex;
        gap:10px;
        justify-content:flex-end
      }
      .waf-btn{
  padding:12px 18px;
  border-radius:12px;
  border:none;
  cursor:pointer;
  font-weight:700;
  color:#fff;
  background:linear-gradient(90deg,#1F7CFF,#E056FD);
}

.waf-btn.secondary{
  background:transparent;
  border:1px solid rgba(255,255,255,0.16);
  color:#fff;
}
    `;
    document.head.appendChild(style);

    /* ---------- HTML ---------- */
    document.body.insertAdjacentHTML(
      "beforeend",
      `
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
            <button id="wafCancel" class="waf-btn secondary">Cancel</button>
<button id="wafContinue" class="waf-btn">Continue</button>
          </div>
        </div>
      </div>
      `
    );

    /* ---------- LOGIC ---------- */
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

    document.getElementById("wafCancel").onclick = () => {
      modal.style.display = "none";
    };

    document.getElementById("wafContinue").onclick = () => {
      state.appName = input.value.trim();
      if (!state.appType || !state.appName) {
        alert("Select app type and name");
        return;
      }

      console.log("[WAF STEP 4] create app", state);

      document.dispatchEvent(
        new CustomEvent("waf:create-app", { detail: { ...state } })
      );

      modal.style.display = "none";
    };

    console.log("[WAF STEP 4] ready");
  }

  /* ---------- API PUBBLICA ---------- */
  window.WAF_STEP4 = {
    open() {
      init();
      document.getElementById("wafStep4Modal").style.display = "flex";
    }
  };

  console.log("[WAF STEP 4] loaded");
})();
