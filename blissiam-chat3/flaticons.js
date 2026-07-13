// ============================================================
// NomGI — สติกเกอร์ไอคอนมีสีจาก Flaticon (แบบ drop-in)
// ห่อ IIFE กันตัวแปรหลุด global
//
// ⚠️ ลิขสิทธิ์: ไอคอนฟรีของ Flaticon "ต้องให้เครดิต" บนเว็บ
//    ระบบนี้เก็บชื่อผู้วาด + ลิงก์ไว้ในทะเบียน แล้วหน้า credits.html
//    จะสร้างเครดิตให้อัตโนมัติ — เพิ่มไอคอน = เพิ่มเครดิตเองทันที
//
// วิธีเพิ่มไอคอน (ทำโดยเจ้าของเว็บ ที่มีบัญชี Flaticon):
//   1) โหลดไฟล์ SVG จาก Flaticon มาไว้ที่โฟลเดอร์ assets/icons/
//   2) เพิ่ม 1 บรรทัดในทะเบียน STICKERS ข้างล่าง:
//        'mood-happy': { file: 'mood-happy.svg', author: 'Freepik', url: 'https://www.flaticon.com/free-icon/xxxxx' },
//   3) ใช้ในหน้าเว็บ:
//        <span dangerouslySetInnerHTML={{ __html: NomGISticker('mood-happy', 28) }} />   // React
//        el.innerHTML = NomGISticker('mood-happy', 28);                                  // HTML ธรรมดา
// ============================================================
(function () {
    var BASE = 'assets/icons/';

    // ---- ทะเบียนสติกเกอร์: name -> { file, author, url } ----
    // (ว่างไว้ก่อน — เติมเมื่อโหลดไฟล์จาก Flaticon มาแล้ว)
    var STICKERS = {
        // ตัวอย่าง (ยังไม่มีไฟล์จริง จึงคอมเมนต์ไว้):
        // 'mood-1': { file: 'mood-sad.svg',     author: 'Freepik', url: 'https://www.flaticon.com/free-icon/...' },
        // 'mood-5': { file: 'mood-happy.svg',   author: 'Freepik', url: 'https://www.flaticon.com/free-icon/...' },
        // 'tree':   { file: 'tree.svg',         author: 'Freepik', url: 'https://www.flaticon.com/free-icon/...' },
    };

    // คืน <img> ของสติกเกอร์ (คงสีเดิมของไอคอน) — ถ้าไม่มีในทะเบียน คืนกล่องเปล่าขนาดเท่ากัน
    function NomGISticker(name, size, extraClass) {
        var s = STICKERS[name];
        var px = size || 24;
        var cls = 'nomg-sticker' + (extraClass ? ' ' + extraClass : '');
        if (!s) {
            return '<span class="' + cls + '" style="display:inline-block;width:' + px + 'px;height:' + px + 'px" aria-hidden="true"></span>';
        }
        return '<img src="' + BASE + s.file + '" width="' + px + '" height="' + px + '" class="' + cls + '" alt="" loading="lazy" decoding="async" />';
    }

    // เพิ่มไอคอนแบบ runtime (ทางเลือก — ปกติแก้ในทะเบียนด้านบนตรงๆ ดีกว่า)
    NomGISticker.register = function (name, file, author, url) {
        STICKERS[name] = { file: file, author: author, url: url };
    };
    NomGISticker.has = function (name) { return !!STICKERS[name]; };
    NomGISticker.names = function () { return Object.keys(STICKERS); };
    // รายการเครดิต (ไม่ซ้ำผู้วาด) สำหรับหน้า credits.html
    NomGISticker.credits = function () {
        var seen = {};
        var out = [];
        Object.keys(STICKERS).forEach(function (k) {
            var s = STICKERS[k];
            var key = (s.author || '') + '|' + (s.url || '');
            if (seen[key]) return;
            seen[key] = 1;
            out.push({ author: s.author || 'Unknown', url: s.url || 'https://www.flaticon.com/' });
        });
        return out;
    };

    window.NomGISticker = NomGISticker;
})();
