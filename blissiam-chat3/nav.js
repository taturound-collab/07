// ============================================================
// NomGI — แถบนำทางล่างสำหรับมือถือ (bottom navigation)
// inject เองเข้า DOM (เหมือน panic.js) โชว์เฉพาะจอมือถือ (<768px)
// ใช้ไอคอน Lucide จาก icons.js · รองรับ safe-area ของ iPhone
// ห่อ IIFE กันชนกับสคริปต์อื่น
// ============================================================
(function () {
    'use strict';
    if (window.__nomgiNavLoaded) return;
    window.__nomgiNavLoaded = true;

    // หน้า -> แสดง nav ตรงไหน active
    var ITEMS = [
        { file: 'index.html', label: 'หน้าแรก', icon: 'home' },
        { file: 'wall.html', label: 'กำแพง', icon: 'sticky-note' },
        { file: 'care.html', label: 'ดูแลใจ', icon: 'sprout' },
        { file: 'profile.html', label: 'ฉัน', icon: 'user' },
    ];
    // โชว์ nav เฉพาะหน้าหลักเหล่านี้ (ไม่โชว์ในแชท/คิว/กลุ่ม/ล็อกอิน/แอดมิน)
    var SHOW_ON = { 'index.html': 1, 'wall.html': 1, 'care.html': 1, 'profile.html': 1, '': 1, '/': 1 };

    function currentFile() {
        var p = location.pathname;
        var f = p.substring(p.lastIndexOf('/') + 1);
        return f || 'index.html';
    }

    function mount() {
        if (document.getElementById('nomgi-nav')) return;
        var cur = currentFile();
        if (!SHOW_ON[cur]) return;
        var icon = function (name, active) {
            return (window.NomGIcon ? window.NomGIcon(name, 22) : '');
        };

        var css = document.createElement('style');
        css.textContent =
            '#nomgi-nav{position:fixed;left:0;right:0;bottom:0;z-index:9998;display:none;' +
            'background:var(--color-surface,#fff);border-top:1px solid var(--color-line,#e8e3d9);' +
            'padding-bottom:env(safe-area-inset-bottom,0);' +
            'box-shadow:0 -2px 14px -8px rgba(0,0,0,.18);}' +
            '@media (max-width:767px){#nomgi-nav{display:flex;}' +
            'body{padding-bottom:calc(60px + env(safe-area-inset-bottom,0)) !important;}}' +
            '#nomgi-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
            'gap:2px;padding:8px 0 7px;text-decoration:none;color:var(--color-ink-400,#8a8a8a);' +
            'font-family:inherit;font-size:10.5px;font-weight:500;-webkit-tap-highlight-color:transparent;' +
            'transition:color .15s ease;}' +
            '#nomgi-nav a.active{color:var(--color-primary-600,#3d5d44);font-weight:600;}' +
            '#nomgi-nav a:active{transform:scale(0.94);}' +
            '#nomgi-nav a svg{width:22px;height:22px;}';
        document.head.appendChild(css);

        var nav = document.createElement('nav');
        nav.id = 'nomgi-nav';
        nav.setAttribute('aria-label', 'เมนูหลัก');
        var html = '';
        ITEMS.forEach(function (it) {
            var active = (it.file === cur) || (cur === '' && it.file === 'index.html');
            html += '<a href="' + it.file + '"' + (active ? ' class="active" aria-current="page"' : '') + '>' +
                '<span aria-hidden="true">' + icon(it.icon, active) + '</span>' +
                '<span>' + it.label + '</span></a>';
        });
        nav.innerHTML = html;
        document.body.appendChild(nav);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
