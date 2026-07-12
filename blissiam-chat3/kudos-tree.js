// ============================================================
// NomGI — ต้นไม้น้ำใจ (Kudos Tree)
// แปลงจำนวน "แต้มความใจดี" (kudos_count) เป็นภาพต้นไม้ที่ค่อยๆ โต
// ห่อ IIFE เพื่อไม่ให้ตัวแปรระดับบนสุดกลายเป็น global (กันชนกับหน้าอื่น)
// ใช้: window.NomGIKudos.plantSvg(count, size) -> คืน SVG string
//      window.NomGIKudos.stage(count) -> { level, label }
// ============================================================
(function () {

    // ระดับการเติบโตตามจำนวนน้ำใจ
    function stage(count) {
        const c = Math.max(0, count | 0);
        if (c === 0) return { level: 0, label: 'เมล็ดพันธุ์' };
        if (c < 3)   return { level: 1, label: 'ต้นอ่อน' };
        if (c < 8)   return { level: 2, label: 'ต้นเล็ก' };
        if (c < 20)  return { level: 3, label: 'ต้นโต' };
        if (c < 50)  return { level: 4, label: 'ต้นใหญ่' };
        return { level: 5, label: 'ต้นไม้ออกดอก' };
    }

    // สร้างจุดดอก/ผลแบบกระจายรอบพุ่ม (deterministic ตาม count จะได้ไม่กระพริบ)
    function blossoms(count, cx, cy, spread) {
        const n = Math.min(count, 14);
        let out = '';
        for (let i = 0; i < n; i++) {
            const a = (i * 137.5) * Math.PI / 180;       // golden angle
            const r = spread * (0.35 + 0.6 * (i / (n + 1)));
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r * 0.8;
            const petal = (i % 3 === 0)
                ? 'var(--color-secondary-400, #e0a04c)'
                : 'var(--color-primary-300, #9dc295)';
            out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2.4 + (i % 3)).toFixed(1)}" fill="${petal}" opacity="0.9"/>`;
        }
        return out;
    }

    // คืน SVG ต้นไม้ตามจำนวนน้ำใจ
    function plantSvg(count, size) {
        size = size || 160;
        const s = stage(count);
        const lvl = s.level;
        const soil = 'var(--color-secondary-200, #e6bf8e)';
        const trunk = 'var(--color-secondary-500, #925621)';
        const leaf = 'var(--color-primary-400, #739e6b)';
        const leafDark = 'var(--color-primary-600, #3d5d44)';
        const pot = 'var(--color-primary-100, #e3ece0)';

        // ความสูงลำต้น + ขนาดพุ่มโตตาม level
        const trunkTop = 150 - Math.min(lvl, 5) * 16;   // level สูง -> ลำต้นสูง
        const canopyR = 12 + Math.min(lvl, 5) * 9;

        let parts = '';
        // กระถาง + ดิน
        parts += `<ellipse cx="100" cy="182" rx="46" ry="10" fill="rgba(0,0,0,0.06)"/>`;
        parts += `<path d="M64 156 L136 156 L128 182 L72 182 Z" fill="${pot}" stroke="var(--color-line,#e8e3d9)" stroke-width="1.5"/>`;
        parts += `<ellipse cx="100" cy="156" rx="36" ry="7" fill="${soil}"/>`;

        if (lvl === 0) {
            // เมล็ด
            parts += `<ellipse cx="100" cy="150" rx="7" ry="9" fill="${trunk}"/>`;
            parts += `<path d="M100 150 q3 -6 8 -7" stroke="${leaf}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
        } else {
            // ลำต้น
            parts += `<path d="M97 156 Q99 ${(trunkTop + 20)} 100 ${trunkTop}" stroke="${trunk}" stroke-width="${3 + lvl}" fill="none" stroke-linecap="round"/>`;
            if (lvl >= 3) {
                parts += `<path d="M100 ${trunkTop + 26} q-16 -6 -24 -18" stroke="${trunk}" stroke-width="${2 + lvl * 0.4}" fill="none" stroke-linecap="round"/>`;
                parts += `<path d="M100 ${trunkTop + 34} q16 -6 24 -16" stroke="${trunk}" stroke-width="${2 + lvl * 0.4}" fill="none" stroke-linecap="round"/>`;
            }
            // พุ่มใบ
            parts += `<circle cx="100" cy="${trunkTop}" r="${canopyR}" fill="${leaf}"/>`;
            parts += `<circle cx="${100 - canopyR * 0.6}" cy="${trunkTop + 6}" r="${canopyR * 0.7}" fill="${leafDark}" opacity="0.85"/>`;
            parts += `<circle cx="${100 + canopyR * 0.6}" cy="${trunkTop + 4}" r="${canopyR * 0.72}" fill="${leaf}"/>`;
            parts += `<circle cx="100" cy="${trunkTop - canopyR * 0.4}" r="${canopyR * 0.66}" fill="${leafDark}" opacity="0.8"/>`;
            // ดอก/ผล เมื่อโตพอ
            if (lvl >= 4) parts += blossoms(count, 100, trunkTop, canopyR);
        }

        return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${s.label}">${parts}</svg>`;
    }

    // #9 ตราน้ำใจ (badges) ตามจำนวน kudos สะสม
    const BADGES = [
        { min: 0,  icon: '🌱', name: 'ผู้เริ่มต้น' },
        { min: 3,  icon: '🍃', name: 'ผู้รับฟัง' },
        { min: 8,  icon: '🌿', name: 'ผู้ห่วงใย' },
        { min: 20, icon: '🌳', name: 'ผู้ให้กำลังใจ' },
        { min: 50, icon: '🌸', name: 'ต้นไม้แห่งน้ำใจ' },
        { min: 100,icon: '🏆', name: 'ผู้แบ่งปันน้ำใจตัวจริง' },
    ];
    // คืน badge ปัจจุบัน + อันถัดไป (เหลืออีกกี่แต้ม)
    function badge(count) {
        const c = Math.max(0, count | 0);
        let cur = BADGES[0], next = null;
        for (let i = 0; i < BADGES.length; i++) {
            if (c >= BADGES[i].min) cur = BADGES[i];
            else { next = BADGES[i]; break; }
        }
        return { current: cur, next, remaining: next ? next.min - c : 0 };
    }

    window.NomGIKudos = { plantSvg, stage, badge, BADGES };

})();
