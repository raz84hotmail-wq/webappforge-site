/* ================================
   WebAppForge – STEP 4
   Create App Wizard
   ISOLATO – UI CONSISTENT – STABLE
================================ */

(function () {
  "use strict";

  const state = { appType: null, appName: "" };

  /* ---------------------------------------------------------
     STYLES
  --------------------------------------------------------- */
  function injectStylesOnce() {
    if (document.getElementById("wafStep4Styles")) return;

    const style = document.createElement("style");
    style.id = "wafStep4Styles";
    style.textContent = `
/* ===== Overlay ===== */
#wafStep4Modal{
  position:fixed;
  inset:0;
  display:none;
  align-items:center;
  justify-content:center;
  background:rgba(0,0,0,.6);
  z-index:9999;
}

/* ===== Modal ===== */
#wafStep4Modal .waf-modal{
  width:640px;
  max-width:calc(100vw - 40px);
  background:rgba(11,18,32,.95);
  border:1px solid rgba(255,255,255,.16);
  border-radius:20px;
  padding:24px;
  color:#fff;
  box-shadow:0 20px 70px rgba(0,0,0,.45);
  backdrop-filter:blur(10px);
}

#wafStep4Modal h3{
  margin:0;
  font-size:22px;
  font-weight:900;
}

#wafStep4Modal p{
  margin:6px 0 18px;
  opacity:.8;
  font-weight:600;
}

/* ===== App Types ===== */
.waf-types{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
  margin-bottom:16px;
}

.waf-type{
  height:64px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  border-radius:16px;
  font-size:16px;
  font-weight:800;
  cursor:pointer;
  user-select:none;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.18);
  transition:all .15s ease;
}

.waf-type:hover{
  transform:translateY(-1px);
  border-color:#1F7CFF;
}

.waf-type.active{
  background:linear-gradient(90deg,#1F7CFF,#E056FD);
  border:none;
  box-shadow:0 14px 40px rgba(224,86,253,.45);
}

/* ===== Input ===== */
.waf-input{
  width:100%;
  padding:14px 16px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,.18);
  background:rgba(255,255,255,.06);
  color:#fff;
  font-size:14px;
  font-weight:700;
  outline:none;
}

.waf-input::placeholder{
  color:rgba(255,255,255,.55);
}

/* ===== Actions ===== */
.waf-actions{
  display:flex;
  justify-content:flex-end;
  gap:12px;
  margin-top:18px;
}

/* ===== Buttons (WAF SYSTEM) ===== */
.waf-btn{
  padding:12px 18px;
  border-radius:14px;
  font-weight:900;
  font-size:13px;
  cursor:pointer;
  border:none;
  color:#fff;
  transition:all .15s ease;
}
/* ===== STEP 4 – ACTION BUTTONS EQUAL ===== */
.waf-actions{
  display:flex;
  gap:14px;
}

.waf-actions .waf-btn{
  flex:1;
  height:46px;
  font-size:15px;
}

/* CANCEL = POTENTE COME CONTINUE */
.waf-btn.secondary{
  background:linear-gradient(90deg,#1F7CFF,#4FA3FF);
  border:none;
  box-shadow:0 12px 30px rgba(31,124,255,.35);
}

.waf-btn.secondary:hover{
  filter:brightness(1.08);
}

/* CONTINUE resta com'è ma allineato */
.waf-btn.primary{
  box-shadow:0 12px 40px rgba(224,86,253,.45);
}
.waf-btn.primary{
  background:linear-gradient(90deg,#1F7CFF,#E056FD);
  box-shadow:0 12px 40px rgba(224,86,253,.45);
}

.waf-btn.primary:hover{
  transform:translateY(-1px);
  box-shadow:0 16px 50px rgba(224,86,253,.6);
}

.waf-btn.secondary{
  background:transparent;
  border:1px solid rgba(255,255,255,.22);
}

.waf-btn.secondary:hover{
  background:rgba(255,255,255,.08);
}

.waf-btn:disabled{
  opacity:.45;
  cursor:not-allowed;
  box-shadow:none;
  transform:none;
}
    `;
    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     MODAL
  --------------------------------------------------------- */
  function injectModalOnce() {
    if (document.getElementById("wafStep4Modal")) return;

    document.body.insertAdjacentHTML("beforeend", `
<div id="wafStep4Modal">
  <div class="waf-modal">
    <h3>Create your App</h3>
    <p>Select app type</p>

    <div class="waf-types">
      <div class="waf-type" data-type="web">🌐 Web</div>
      <div class="waf-type" data-type="pwa">📱 PWA</div>
      <div class="waf-type" data-type="ios">🍎 iOS</div>
      <div class="waf-type" data-type="android">🤖 Android</div>
    </div>

    <input id="wafAppName" class="waf-input" placeholder="App name"/>

    <div class="waf-actions">
      <button class="waf-btn secondary" id="wafCancel">Cancel</button>
      <button class="waf-btn primary" id="wafContinue" disabled>Continue</button>
    </div>
  </div>
</div>
    `);

    const modal = document.getElementById("wafStep4Modal");
    const types = modal.querySelectorAll(".waf-type");
    const input = document.getElementById("wafAppName");
    const btnContinue = document.getElementById("wafContinue");

    function update() {
      btnContinue.disabled = !(state.appType && input.value.trim());
    }

    types.forEach(t => {
      t.addEventListener("click", () => {
        types.forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        state.appType = t.dataset.type;
        update();
      });
    });

    input.addEventListener("input", update);

    document.getElementById("wafCancel").onclick = () => modal.style.display = "none";

    btnContinue.onclick = () => {
      state.appName = input.value.trim();
      if (!state.appType || !state.appName) return;

      document.dispatchEvent(
        new CustomEvent("waf:create-app", { detail: { ...state } })
      );
      modal.style.display = "none";
    };

    modal.addEventListener("click", e => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  /* ---------------------------------------------------------
     PUBLIC API
  --------------------------------------------------------- */
  window.WAF_STEP4 = {
    open() {
      injectStylesOnce();
      injectModalOnce();

      state.appType = null;
      state.appName = "";

      document.querySelectorAll(".waf-type").forEach(t => t.classList.remove("active"));
      document.getElementById("wafAppName").value = "";
      document.getElementById("wafContinue").disabled = true;

      const modal = document.getElementById("wafStep4Modal");
      modal.style.display = "flex";
      document.getElementById("wafAppName").focus();
    }
  };

})();
