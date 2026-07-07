// ============================================================
// NomGI — Safety / Crisis detection
// ตรวจจับข้อความที่อาจบ่งชี้ความเสี่ยง (ทำร้ายตัวเอง/ฆ่าตัวตาย ฯลฯ)
// แล้วให้หน้าเว็บแสดงการ์ดสายด่วนช่วยเหลือ — ทำงานฝั่ง client เท่านั้น
// ไม่ส่งข้อความไปไหน (เป็นความเป็นส่วนตัวของผู้ใช้)
//
// ห่อ IIFE กันตัวแปรหลุดเป็น global
// ใช้:  window.NomGISafety.isRisky(text) -> true/false
//       window.NomGISafety.HOTLINES -> [{name, phone, note, href}]
// ============================================================
(function () {

    // คำ/วลีที่อาจบ่งชี้ความเสี่ยง (ไทย + อังกฤษ) — ตั้งใจให้ครอบคลุมแต่ไม่ก้าวก่าย
    // ใช้ตรวจแบบ "มีคำเหล่านี้อยู่ในข้อความ" เพื่อ "เสนอความช่วยเหลือ" ไม่ใช่บล็อก
    const RISK_PATTERNS = [
        // ฆ่าตัวตาย / จบชีวิต
        'ฆ่าตัวตาย', 'ฆ่าตัวเอง', 'อยากตาย', 'ไม่อยากอยู่', 'ไม่อยากมีชีวิต',
        'จบชีวิต', 'จบทุกอย่าง', 'ไม่อยากตื่น', 'หายไปจากโลก', 'ตายไปซะ',
        'ตายดีกว่า', 'อยู่ไปก็ไร้ค่า', 'เป็นภาระ', 'ไม่มีใครสนใจถ้าฉันตาย',
        // ทำร้ายตัวเอง
        'ทำร้ายตัวเอง', 'กรีดข้อมือ', 'กรีดแขน', 'ทำร้ายร่างกายตัวเอง',
        'กินยาเกินขนาด', 'กินยาตาย',
        // อังกฤษ
        'kill myself', 'want to die', 'end my life', 'suicide', 'suicidal',
        'self harm', 'self-harm', 'cut myself', 'overdose', "don't want to live",
        'better off dead', 'no reason to live',
    ];

    function normalize(s) {
        return (s || '').toString().toLowerCase().replace(/\s+/g, ' ');
    }

    function isRisky(text) {
        const t = normalize(text);
        if (!t) return false;
        return RISK_PATTERNS.some(p => t.indexOf(p) !== -1);
    }

    // สายด่วนช่วยเหลือในไทย
    const HOTLINES = [
        { name: 'สายด่วนสุขภาพจิต กรมสุขภาพจิต', phone: '1323', note: 'ฟรี ตลอด 24 ชม.', href: 'tel:1323' },
        { name: 'สมาคมสะมาริตันส์ (รับฟังผู้ที่คิดสั้น)', phone: '02-113-6789', note: 'ทุกวัน 12:00–22:00 น.', href: 'tel:021136789' },
        { name: 'ฉุกเฉินทางการแพทย์', phone: '1669', note: 'เหตุฉุกเฉิน เสี่ยงอันตรายถึงชีวิต', href: 'tel:1669' },
    ];

    window.NomGISafety = { isRisky, HOTLINES, RISK_PATTERNS };

})();
