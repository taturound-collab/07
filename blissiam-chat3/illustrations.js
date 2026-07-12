// ============================================================
// NomGI — ภาพประกอบ flat SVG สไตล์ unDraw (ออกแบบเอง โทนเขียวแบรนด์)
// ใช้ CSS var ของธีม -> ปรับสี light/dark อัตโนมัติ · inline ไม่ต้อง build
// ห่อ IIFE กันตัวแปรหลุด global
//
// ใช้ React:  <div dangerouslySetInnerHTML={{ __html: NomGIllus('empty-wall') }} />
// ใช้ HTML :  el.innerHTML = NomGIllus('hero');  หรือ <i data-illus="hero"></i> + NomGIllus.render()
// ============================================================
(function () {
    // สีจากธีม (มี fallback เผื่อโหลด theme.js ไม่ทัน)
    var C = {
        p1: 'var(--color-primary-100, #e3ece0)',
        p3: 'var(--color-primary-300, #9dc295)',
        p4: 'var(--color-primary-400, #739e6b)',
        p5: 'var(--color-primary-500, #4D7355)',
        p6: 'var(--color-primary-600, #3d5d44)',
        s2: 'var(--color-secondary-200, #e6bf8e)',
        s3: 'var(--color-secondary-300, #cc9655)',
        s4: 'var(--color-secondary-400, #A8662A)',
        line: 'var(--color-line, #e8e3d9)',
        surf: 'var(--color-surface, #ffffff)',
    };

    // พุ่มใบ/ต้นไม้เล็ก (ใช้ซ้ำหลายฉาก)
    function plant(cx, cy, s) {
        s = s || 1;
        return '' +
            '<g transform="translate(' + cx + ',' + cy + ') scale(' + s + ')">' +
            '<path d="M0 0 C-2 -22 -14 -30 -22 -34 C-18 -18 -10 -6 0 0 Z" fill="' + C.p4 + '"/>' +
            '<path d="M0 0 C2 -26 14 -34 24 -38 C20 -20 10 -6 0 0 Z" fill="' + C.p5 + '"/>' +
            '<path d="M0 2 C0 -12 6 -22 10 -28" stroke="' + C.p6 + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
            '</g>';
    }

    // หัวใจเล็ก
    function heart(cx, cy, s, fill) {
        s = s || 1;
        return '<path transform="translate(' + cx + ',' + cy + ') scale(' + s + ')" d="M0 4 C-4 -2 -12 -1 -12 5 C-12 10 -6 13 0 18 C6 13 12 10 12 5 C12 -1 4 -2 0 4 Z" fill="' + (fill || C.s3) + '"/>';
    }

    // คนนั่งสงบ (หัว+ตัวโค้งมน)
    function personSitting(x, y, body, hair) {
        body = body || C.p5; hair = hair || C.p6;
        return '' +
            '<g transform="translate(' + x + ',' + y + ')">' +
            '<ellipse cx="0" cy="86" rx="60" ry="10" fill="' + C.p1 + '"/>' +
            '<path d="M-34 84 C-40 50 -30 30 0 30 C30 30 40 50 34 84 Z" fill="' + body + '"/>' +
            '<circle cx="0" cy="8" r="20" fill="' + C.s2 + '"/>' +
            '<path d="M-20 4 C-20 -14 20 -14 20 4 C20 -6 -20 -6 -20 4 Z" fill="' + hair + '"/>' +
            '<path d="M-30 84 C-30 66 -18 60 -6 62" stroke="' + C.p6 + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
            '</g>';
    }

    function svg(vb, inner, extra) {
        return '<svg viewBox="' + vb + '" fill="none" xmlns="http://www.w3.org/2000/svg" ' +
            'style="width:100%;height:auto;display:block;' + (extra || '') + '" role="img" aria-hidden="true" class="nomg-illus">' + inner + '</svg>';
    }

    var SCENES = {
        // หน้าแรก hero — คนนั่งกับต้นไม้ + หัวใจลอย
        'hero': function () {
            return svg('0 0 340 260',
                '<ellipse cx="170" cy="228" rx="150" ry="20" fill="' + C.p1 + '"/>' +
                '<circle cx="250" cy="90" r="70" fill="' + C.p1 + '" opacity="0.7"/>' +
                plant(84, 210, 2.1) + plant(268, 214, 1.6) +
                personSitting(170, 120, C.p5, C.p6) +
                heart(232, 70, 1.5, C.s3) + heart(268, 100, 1.0, C.p4) + heart(210, 96, 0.8, C.s3) +
                '<circle cx="122" cy="70" r="4" fill="' + C.s3 + '"/><circle cx="290" cy="150" r="3" fill="' + C.p4 + '"/>'
            );
        },
        // กำแพงให้กำลังใจว่าง — บอร์ดโน้ตกับหัวใจ
        'empty-wall': function () {
            return svg('0 0 300 220',
                '<ellipse cx="150" cy="196" rx="120" ry="16" fill="' + C.p1 + '"/>' +
                '<rect x="60" y="36" width="180" height="120" rx="12" fill="' + C.surf + '" stroke="' + C.line + '" stroke-width="2"/>' +
                '<rect x="80" y="58" width="64" height="46" rx="6" fill="' + C.p1 + '" transform="rotate(-4 112 81)"/>' +
                '<rect x="158" y="64" width="60" height="44" rx="6" fill="' + C.s2 + '" opacity="0.6" transform="rotate(3 188 86)"/>' +
                heart(196, 108, 1.3, C.s3) +
                '<line x1="92" y1="122" x2="128" y2="122" stroke="' + C.p3 + '" stroke-width="3" stroke-linecap="round"/>' +
                '<line x1="92" y1="132" x2="118" y2="132" stroke="' + C.p3 + '" stroke-width="3" stroke-linecap="round"/>' +
                plant(66, 190, 1.5) + plant(238, 192, 1.3) +
                heart(118, 26, 1.1, C.p4) + heart(210, 30, 0.9, C.s3)
            );
        },
        // คิวว่าง / กำลังรอเพื่อน — ม้านั่งกับต้นไม้
        'empty-queue': function () {
            return svg('0 0 300 220',
                '<ellipse cx="150" cy="196" rx="120" ry="16" fill="' + C.p1 + '"/>' +
                '<circle cx="150" cy="96" r="66" fill="' + C.p1 + '" opacity="0.65"/>' +
                personSitting(150, 96, C.p4, C.p6) +
                heart(150, 44, 1.2, C.s3) +
                '<path d="M120 60 q30 -18 60 0" stroke="' + C.p3 + '" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.7"/>' +
                plant(80, 188, 1.6) + plant(220, 190, 1.6)
            );
        },
        // เส้นทางดูแลใจว่าง — ทางเดินโค้ง + ต้นไม้
        'empty-journeys': function () {
            return svg('0 0 300 220',
                '<ellipse cx="150" cy="200" rx="130" ry="16" fill="' + C.p1 + '"/>' +
                '<path d="M60 196 C120 150 90 110 150 90 C210 70 180 40 240 34" stroke="' + C.p3 + '" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="2 20"/>' +
                plant(96, 172, 1.4) + plant(176, 120, 1.7) + plant(232, 60, 1.3) +
                '<circle cx="240" cy="34" r="12" fill="' + C.s3 + '"/>' + heart(240, 26, 0.7, C.surf) +
                '<circle cx="60" cy="196" r="8" fill="' + C.p5 + '"/>'
            );
        },
        // ทั่วไป (ยังไม่มีข้อมูล) — ต้นกล้าในถ้วย
        'empty-generic': function () {
            return svg('0 0 260 200',
                '<ellipse cx="130" cy="176" rx="90" ry="14" fill="' + C.p1 + '"/>' +
                '<path d="M96 120 L164 120 L156 172 L104 172 Z" fill="' + C.p1 + '" stroke="' + C.line + '" stroke-width="2"/>' +
                '<ellipse cx="130" cy="120" rx="34" ry="7" fill="' + C.s2 + '"/>' +
                plant(130, 118, 2.0) +
                heart(186, 78, 1.0, C.s3) + heart(80, 92, 0.8, C.p4) +
                '<circle cx="196" cy="120" r="3" fill="' + C.p4 + '"/><circle cx="66" cy="130" r="3" fill="' + C.s3 + '"/>'
            );
        },
        // ไม่พบหน้า 404 — เครื่องบินกระดาษหลงทาง
        'notfound': function () {
            return svg('0 0 320 220',
                '<ellipse cx="160" cy="196" rx="120" ry="16" fill="' + C.p1 + '"/>' +
                '<circle cx="160" cy="96" r="72" fill="' + C.p1 + '" opacity="0.6"/>' +
                '<path d="M40 60 Q120 40 150 96" stroke="' + C.p3 + '" stroke-width="2.5" fill="none" stroke-dasharray="3 10" stroke-linecap="round"/>' +
                '<g transform="translate(150,96) rotate(12)">' +
                '<path d="M0 0 L60 -20 L36 40 L26 16 Z" fill="' + C.p5 + '"/>' +
                '<path d="M60 -20 L26 16 L36 40 Z" fill="' + C.p6 + '"/>' +
                '<path d="M60 -20 L0 0 L26 16 Z" fill="' + C.p4 + '"/></g>' +
                plant(90, 188, 1.5) + plant(238, 190, 1.4) +
                heart(250, 70, 1.1, C.s3)
            );
        },
    };

    function NomGIllus(name) {
        var fn = SCENES[name] || SCENES['empty-generic'];
        return fn();
    }
    NomGIllus.render = function (root) {
        (root || document).querySelectorAll('[data-illus]').forEach(function (el) {
            if (el.getAttribute('data-illus-done')) return;
            el.innerHTML = NomGIllus(el.getAttribute('data-illus'));
            el.setAttribute('data-illus-done', '1');
        });
    };
    NomGIllus.names = function () { return Object.keys(SCENES); };

    window.NomGIllus = NomGIllus;
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', function () { NomGIllus.render(); });
    }
})();
