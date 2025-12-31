/* ================================
   WebAppForge – STEP 4
   Create App Wizard (ISOLATO)
   ================================ */

(function(){

/* ---------- STATE ---------- */
const state = {
  appType: null,
  appName: ''
};

/* ---------- MODAL HTML ---------- */
const modalHTML = `
<div class="modal-overlay" id="wafStep4Modal">
  <div class="modal">
    <h3>Create your App</h3>
    <p>Select app type</p>

    <div class="app-types">
      <div class="app-type" data-type="web">
        <h4>🌐 Web</h4>
        <p>Standard Web App</p>
      </div>
      <div class="app-type" data-type="pwa">
        <h4>📲 PWA</h4>
        <p>Installable Progressive Web App</p>
      </div>
      <div class="app-type" data-type="ios">
        <h4>🍎 iOS</h4>
        <p>Apple App Store</p>
      </div>
      <div class="app-type" data-type="android">
        <h4>🤖 Android</h4>
        <p>Google Play Store</p>
      </div>
    </div>

    <input id="wafAppName" placeholder="App name" />

    <div class="modal-actions">
      <button class="btn secondary" id="wafCancel">Cancel</button>
      <button class="btn" id="wafContinue">Continue</button>
    </div>
  </div>
</div>
`;

/* ---------- STYLES ---------- */
const style = document.createElement('style');
style.textContent = `
.modal-overlay{
  position:fixed;inset:0;
  background:rgba(0,0,0,.6);
  display:none;align-items:center;justify-content:center;
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
.modal input{
  width:100%;padding:12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.15);
  background:rgba(255,255,255,.06);
  color:#fff;
  margin-bottom:14px
}
.modal-actions{
  display:flex;gap:10px;justify-content:flex-end
}
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
.app-type h4{margin-bottom:6px}
.app-type p{font-size:12px;opacity:.8}
`;
document.head.appendChild(style);

/* ---------- INIT ---------- */
function init(){
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('wafStep4Modal');
  const types = modal.querySelectorAll('.app-type');
  const input = modal.querySelector('#wafAppName');

  types.forEach(el=>{
    el.addEventListener('click',()=>{
      types.forEach(t=>t.classList.remove('active'));
      el.classList.add('active');
      state.appType = el.dataset.type;
    });
  });

  modal.querySelector('#wafCancel').onclick = close;
  modal.querySelector('#wafContinue').onclick = ()=>{
    state.appName = input.value.trim();
    if(!state.appType || !state.appName){
      alert('Select app type and name');
      return;
    }
    console.log('✅ NEW APP CREATED', state);
    close();

    // 🔮 Hook futuro (Step 5, 6, 7…)
    document.dispatchEvent(
      new CustomEvent('waf:create-app', { detail: state })
    );
  };
}

/* ---------- API PUBBLICA ---------- */
function open(){
  const modal = document.getElementById('wafStep4Modal');
  if(modal) modal.style.display = 'flex';
}
function close(){
  const modal = document.getElementById('wafStep4Modal');
  if(modal) modal.style.display = 'none';
}

/* ---------- EXPOSE ---------- */
window.WAF_STEP4 = { open };

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', init);
})();
// Load STEP 5 controller (no dashboard.html changes)
(function(){
  const s = document.createElement('script');
  s.src = 'waf-step5-controller.js?v=' + Date.now(); // anti-cache
  s.async = false; // ⬅️ FONDAMENTALE
  document.head.appendChild(s);
})();
