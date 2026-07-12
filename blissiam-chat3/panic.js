// ============================================================
// NomGI — Quick Exit / ปุ่มออกด่วน (ความปลอดภัยส่วนตัว)
// แถบเล็กๆ ริมซ้ายจอ + กด Esc สองครั้งเร็วๆ = เด้งออกไปหน้ากลางๆ ทันที
// ใช้ location.replace เพื่อไม่ทิ้งร่องรอยในประวัติย้อนกลับ (privacy)
// ห่อ IIFE กันตัวแปรชนกับสคริปต์อื่น (babel/global scope)
// ============================================================
(function () {
    'use strict';
    if (window.__nomgiExitLoaded) return;
    window.__nomgiExitLoaded = true;

    var SAFE_URL = 'https://www.google.com';

    function exitNow() {
        try { location.replace(SAFE_URL); }
        catch (e) { location.href = SAFE_URL; }
    }

    // ---- double-Esc ----
    var lastEsc = 0;
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            var now = Date.now();
            if (now - lastEsc < 600) { exitNow(); return; }
            lastEsc = now;
        }
    });

    // ---- แถบริมซ้าย ----
    function mount() {
        if (document.getElementById('nomgi-exit')) return;

        var css = document.createElement('style');
        css.textContent =
            '#nomgi-exit{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:99999;' +
            'display:flex;align-items:center;gap:0;overflow:hidden;max-width:34px;' +
            'background:#7a2e22;color:#fff;border:none;cursor:pointer;padding:0;' +
            'border-radius:0 14px 14px 0;box-shadow:0 6px 18px rgba(0,0,0,.18);' +
            'font-family:inherit;opacity:.5;transition:max-width .28s ease,opacity .2s ease;' +
            '-webkit-tap-highlight-color:transparent;}' +
            '#nomgi-exit:hover,#nomgi-exit:focus-visible{opacity:1;max-width:170px;outline:none;}' +
            '#nomgi-exit .ic{flex:0 0 34px;width:34px;height:40px;display:flex;align-items:center;' +
            'justify-content:center;font-size:17px;line-height:1;}' +
            '#nomgi-exit .lb{white-space:nowrap;font-size:12.5px;font-weight:700;padding-right:14px;}' +
            '#nomgi-exit .hint{display:block;font-size:9.5px;font-weight:500;opacity:.8;}' +
            '@media (prefers-reduced-motion: reduce){#nomgi-exit{transition:none;}}';
        document.head.appendChild(css);

        var btn = document.createElement('button');
        btn.id = 'nomgi-exit';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'ออกด่วน — ไปหน้ากลางๆ ทันที (กด Esc สองครั้ง)');
        btn.title = 'ออกด่วน (กด Esc สองครั้ง)';
        var icHtml = (window.NomGIcon ? window.NomGIcon('door-open', 18) : '✕');
        btn.innerHTML =
            '<span class="ic" aria-hidden="true">' + icHtml + '</span>' +
            '<span class="lb">ออกด่วน<span class="hint">Esc ×2</span></span>';
        btn.addEventListener('click', exitNow);
        document.body.appendChild(btn);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }

    window.NomGIExit = { now: exitNow };
})();
