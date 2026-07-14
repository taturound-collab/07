// ============================================================
// NomGI — Toast แจ้งเตือนในแอป (แทน alert() ของเบราว์เซอร์)
// ใช้ได้ทั้ง JS ธรรมดาและ React:  NomGIToast('บันทึกแล้ว', 'success')
//   type: 'success' | 'error' | 'info' (ค่าเริ่มต้น info)
// ห่อ IIFE · โทนสีตามธีม · เด้งลงมาจากด้านบน กลางจอ · หายเอง
// ============================================================
(function () {
    'use strict';
    if (window.NomGIToast) return;

    var injected = false;
    function injectCss() {
        if (injected) return; injected = true;
        var css = document.createElement('style');
        css.textContent =
            '#nomgi-toasts{position:fixed;top:calc(12px + env(safe-area-inset-top,0));left:50%;transform:translateX(-50%);' +
            'z-index:100000;display:flex;flex-direction:column;gap:8px;align-items:center;' +
            'pointer-events:none;width:max-content;max-width:92vw;}' +
            '.nomgi-toast{display:flex;align-items:center;gap:9px;pointer-events:auto;' +
            'background:var(--color-surface,#fff);color:var(--color-ink-900,#1a1a1a);' +
            'border:1px solid var(--color-line,#e8e3d9);border-left-width:4px;' +
            'border-radius:14px;padding:11px 16px;font-family:inherit;font-size:14px;font-weight:500;' +
            'box-shadow:0 10px 30px -10px rgba(0,0,0,.28);' +
            'animation:nomgiToastIn .32s cubic-bezier(.34,1.56,.64,1) forwards;max-width:100%;}' +
            '.nomgi-toast.out{animation:nomgiToastOut .28s ease forwards;}' +
            '.nomgi-toast .ic{flex:0 0 auto;display:inline-flex;}' +
            '.nomgi-toast.success{border-left-color:var(--color-primary-500,#4D7355);}' +
            '.nomgi-toast.success .ic{color:var(--color-primary-600,#3d5d44);}' +
            '.nomgi-toast.error{border-left-color:#c8563a;}' +
            '.nomgi-toast.error .ic{color:#c8563a;}' +
            '.nomgi-toast.info{border-left-color:var(--color-secondary-400,#A8662A);}' +
            '.nomgi-toast.info .ic{color:var(--color-secondary-500,#925621);}' +
            '@keyframes nomgiToastIn{from{opacity:0;transform:translateY(-14px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}' +
            '@keyframes nomgiToastOut{to{opacity:0;transform:translateY(-10px) scale(.97);}}' +
            '@media (prefers-reduced-motion:reduce){.nomgi-toast{animation:none;}.nomgi-toast.out{animation:none;opacity:0;}}';
        document.head.appendChild(css);
    }

    function container() {
        var c = document.getElementById('nomgi-toasts');
        if (!c) { c = document.createElement('div'); c.id = 'nomgi-toasts'; document.body.appendChild(c); }
        return c;
    }

    var ICONS = { success: 'check', error: 'alert-triangle', info: 'info' };

    function toast(message, type, duration) {
        if (!message) return;
        injectCss();
        type = (type === 'success' || type === 'error') ? type : 'info';
        var el = document.createElement('div');
        el.className = 'nomgi-toast ' + type;
        el.setAttribute('role', type === 'error' ? 'alert' : 'status');
        var ic = window.NomGIcon ? window.NomGIcon(ICONS[type], 18) : '';
        el.innerHTML = '<span class="ic" aria-hidden="true">' + ic + '</span><span></span>';
        el.lastChild.textContent = String(message);
        container().appendChild(el);
        var ms = duration || (type === 'error' ? 4200 : 2800);
        var t = setTimeout(dismiss, ms);
        el.addEventListener('click', dismiss);
        function dismiss() {
            clearTimeout(t);
            el.classList.add('out');
            setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
        }
    }

    window.NomGIToast = toast;
})();
