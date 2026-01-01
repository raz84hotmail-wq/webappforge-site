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
      <div class="app-type" data-type="web">🌐 Web</div>
      <div class="app-type" data-type="pwa">📲 PWA</div>
      <div class="app-type" data-type="ios">🍎 iOS</div>
      <div class="app-type" data-type="android">🤖 Android</div>
    </div>

    <input id="wafAppName" placeholder="App name" />

    <div class="modal-actions">
      <button id="wafCancel">Cancel</button>
      <button id="wafContinue">Continue</button>
    </div>
  </div>
</div>
`;

/* ---------- STYLES ---------- */
const style = document.createElement('style');
style.textContent = `
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:9999}
.modal{width:520px;background:#0B1220;border-radius:18px;padding:22px;color:#fff}
.app-types{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:16px}
.app-type{padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.12);cursor:pointer}
.app-type.active{background:linear-gradient(90deg,#1F7CFF,#E056FD)}
`;
document.head.appendChild(style);

/* ---------- INIT ---------- */
function init(){
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('wafStep4Modal');
  const types = modal.querySelectorAll('.app-type');
  const input = modal.querySelector('#wafAppName');

  types.forEach(el=>{
    el.onclick = ()=>{
      types.forEach(t=>t.classList.remove('active'));
      el.classList.add('active');
      state.appType = el.dataset.type;
    };
  });

  document.getElementById('wafCancel').onclick = close;
  document.getElementById('wafContinue').onclick = ()=>{
    state.appName = input.value.trim();
    if(!state.appType || !state.appName) return alert('Missing data');

    document.dispatchEvent(
      new CustomEvent('waf:create-app', { detail: {...state} })
    );
    close();
  };
}

/* ---------- API ---------- */
function open(){
  const m = document.getElementById('wafStep4Modal');
  if(m) m.style.display = 'flex';
}
function close(){
  const m = document.getElementById('wafStep4Modal');
  if(m) m.style.display = 'none';
}

/* ---------- EXPOSE (FONDAMENTALE) ---------- */
window.WAF_STEP4 = { open };

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', init);

})();
