/* ================================
   WebAppForge – STEP 4
   Create App Wizard (ISOLATO & UI CONSISTENT)
   ================================ */

(function () {
  "use strict";

  const state = { appType: null, appName: "" };

  function injectStylesOnce() {
    if (document.getElementById("wafStep4Styles")) return;

    const style = document.createElement("style");
    style.id = "wafStep4Styles";
    style.textContent = `
      /* ===== Overlay + Modal ===== */
      #wafStep4Modal{
        position:fixed !important;
        inset:0 !important;
        display:none !important;
        align-items:center !important;
        justify-content:center !important;
        background:rgba(0,0,0,.55) !important;
        z-index:9999 !important;
      }
      #wafStep4Modal .waf-modal{
        width:640px !important;
        max-width:calc(100vw - 40px) !important;
        background:rgba(11,18,32,.92) !important;
        border:1px solid rgba(255,255,255,.14) !important;
        border-radius:18px !important;
        padding:22px !important;
        color:#fff !important;
        box-shadow:0 18px 60px rgba(0,0,0,.35) !important;
        backdrop-filter: blur(8px) !important;
      }
      #wafStep4Modal h3{
        margin:0 0 6px 0 !important;
        font-size:22px !important;
        font-weight:800 !important;
      }
      #wafStep4Modal p{
        margin:0 0 14px 0 !important;
        opacity:.85 !important;
        font-size:14px !important;
        font-weight:600 !important;
      }

      /* ===== App types ===== */
      #wafStep4Modal .waf-types{
        display:grid !important;
        grid-template-columns:1fr 1fr !important;
        gap:14px !important;
        margin-bottom:14px !important;
      }
      #wafStep4Modal .waf-type{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:10px !important;
        height:64px !important;
        border-radius:16px !important;
        border:1px solid rgba(255,255,255,.16) !important;
        background:rgba(255,255,255,.05) !important;
        cursor:pointer !important;
        user-select:none !important;
        font-weight:800 !important;
        font-size:16px !important;
        transition:transform .12s ease, border-color .12s ease, background .12s ease !important;
      }
      #wafStep4Modal .waf-type:hover{
        border-color:rgba(31,124,255,.8) !important;
        transform:translateY(-1px) !important;
      }
      #wafStep4Modal .waf-type.active{
        border-color:rgba(224,86,253,.95) !important;
        background:linear-gradient(
          90deg,
          rgba(31,124,255,.22),
          rgba(224,86,253,.18)
        ) !important;
      }

      /* ===== Input ===== */
      #wafStep4Modal .waf-input{
        width:100% !important;
        padding:12px 14px !important;
        border-radius:14px !important;
        border:1px solid rgba(255,255,255,.16) !important;
        background:rgba(255,255,255,.06) !important;
        color:#fff !important;
        outline:none !important;
        font-size:14px !important;
        font-weight:700 !important;
      }
      #wafStep4Modal .waf-input::placeholder{
        color:rgba(255,255,255,.55) !important;
        font-weight:700 !important;
      }

      /* ===== Actions ===== */
      #wafStep4Modal .waf-actions{
        margin-top:14px !important;
        display:flex !important;
        justify-content:flex-end !important;
        gap:10px !important;
      }

      /* ===== Buttons (IDENTICI AL DESIGN SYSTEM) ===== */
      #wafStep4Modal .waf-btn{
        -webkit-appearance:none !important;
        appearance:none !important;
        border:none !important;
        outline:none !important;
        cursor:pointer !important;

        padding:12px 16px !important;
        border-radius:12px !important;
        font-weight:800 !important;
        font-size:13px !important;
        color:#fff !important;

        background:linear-gradient(90deg,#1F7CFF,#E056FD) !important;
        box-shadow:0 10px 30px rgba(0,0,0,.18) !important;
        transition:transform .12s ease, filter .12s ease, opacity .12s ease !important;
      }
      #wafStep4Modal .waf-btn:hover{ filter:brightness(1.06) !important; }
      #wafStep4Modal .waf-btn:active{ transform:translateY(1px) !important; }

      #wafStep4Modal .waf-btn.secondary{
        background:transparent !important;
        border:1px solid rgba(255,255,255,.18) !important;
        color:#fff !important;
        box-shadow:none !important;
      }
      #wafStep4Modal .waf-btn.secondary:hover{
        background:rgba(255,255,255,.06) !important;
      }

      #wafStep4Modal .waf-btn:disabled{
        opacity:.45 !important;
        cursor:not-allowed !important;
        filter:none !important;
        transform:none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function injectModalOnce() {
    if (document.getElementById("wafStep4Modal")) return;

    const html = `
      <div id="wafStep4Modal" aria-hidden="true">
        <div class="waf-modal">
          <h3>Create your App</h3>
          <p>Select app type</p>

          <div class="waf-types">
            <div class="waf-type" data-type="web">🌐 <span>Web</span></div>
            <div class="waf-type" data-type="pwa">📲 <span>PWA</span></div>
            <div class="waf-type" data-type="ios">🍎 <span>iOS</span></div>
            <div class="waf-type" data-type="android">🤖 <span>Android</span></div>
          </div>

          <input class="waf-input" id="wafAppName" placeholder="App name" />

          <div class="waf-actions">
            <button class="waf-btn secondary" id="wafCancel" type="button">Cancel</button>
            <button class="waf-btn" id="wafContinue" type="button" disabled>Continue</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);

    const modal = document.getElementById("wafStep4Modal");
    const types = modal.querySelectorAll(".waf-type");
    const input = document.getElementById("wafAppName");
    const btnCancel = document.getElementById("wafCancel");
    const btnContinue = document.getElementById("wafContinue");

    function updateContinueState() {
      const ok = !!state.appType && !!input.value.trim();
      btnContinue.disabled = !ok;
    }

    types.forEach((el) => {
      el.addEventListener("click", () => {
        types.forEach((t) => t.classList.remove("active"));
        el.classList.add("active");
        state.appType = el.dataset.type;
        updateContinueState();
      });
    });

    input.addEventListener("input", updateContinueState);

    btnCancel.addEventListener("click", () => {
      modal.style.display = "none";
    });

    btnContinue.addEventListener("click", () => {
      state.appName = input.value.trim();
      if (!state.appType || !state.appName) return;

      document.dispatchEvent(
        new CustomEvent("waf:create-app", { detail: { ...state } })
      );

      modal.style.display = "none";
    });

    // click fuori per chiudere
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  window.WAF_STEP4 = {
    open() {
      injectStylesOnce();
      injectModalOnce();

      const modal = document.getElementById("wafStep4Modal");
      const input = document.getElementById("wafAppName");

      // reset UI (ma NON resetto appType se vuoi mantenerlo, qui resetto tutto)
      state.appType = null;
      state.appName = "";
      document.querySelectorAll("#wafStep4Modal .waf-type").forEach(t => t.classList.remove("active"));
      input.value = "";
      document.getElementById("wafContinue").disabled = true;

      modal.style.display = "flex";
      input.focus();
    }
  };

})();
