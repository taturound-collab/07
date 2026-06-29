// ============================================================
// Blissiam — Chat Background Presets (36+ แบบ)
// ใช้ใน chat.html: เลือกสี / ไล่สี / ภาพพื้นหลัง
// ============================================================

const CHAT_BACKGROUNDS = [
    // — สีพื้นเรียบ (12) —
    { id: 'solid-cream', label: 'ครีมอ่อน', type: 'color', value: '#f8f6f1' },
    { id: 'solid-sage', label: 'เขียวเซจ', type: 'color', value: '#eef4ef' },
    { id: 'solid-sky', label: 'ฟ้าสบาย', type: 'color', value: '#eef5fa' },
    { id: 'solid-lavender', label: 'ม่วงพาสเทล', type: 'color', value: '#f3f0f8' },
    { id: 'solid-peach', label: 'พีชอุ่น', type: 'color', value: '#fdf3ee' },
    { id: 'solid-mint', label: 'มินต์สด', type: 'color', value: '#edf8f4' },
    { id: 'solid-rose', label: 'โรสพิงค์', type: 'color', value: '#faf0f3' },
    { id: 'solid-sand', label: 'ทรายทะเล', type: 'color', value: '#f7f2ea' },
    { id: 'solid-slate', label: 'เทาอ่อน', type: 'color', value: '#f1f3f5' },
    { id: 'solid-honey', label: 'น้ำผึ้ง', type: 'color', value: '#faf6ed' },
    { id: 'solid-ice', label: 'น้ำแข็ง', type: 'color', value: '#f0f7ff' },
    { id: 'solid-blush', label: 'บลัช', type: 'color', value: '#fdf2f0' },

    // — ไล่สี (12) —
    { id: 'grad-aurora', label: 'ออโรรา', type: 'gradient', value: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #f3e5f5 100%)' },
    { id: 'grad-sunset', label: 'พระอาทิตย์ตก', type: 'gradient', value: 'linear-gradient(160deg, #fff1e6 0%, #ffd6c0 40%, #c9e4f6 100%)' },
    { id: 'grad-forest', label: 'ป่าเขียว', type: 'gradient', value: 'linear-gradient(180deg, #e8f0e8 0%, #d4e8d4 50%, #c5dcc5 100%)' },
    { id: 'grad-ocean', label: 'มหาสมุทร', type: 'gradient', value: 'linear-gradient(180deg, #e8f4fc 0%, #cce5f5 50%, #b8d9f0 100%)' },
    { id: 'grad-dusk', label: 'ยามเย็น', type: 'gradient', value: 'linear-gradient(145deg, #f5eef8 0%, #e8dff5 50%, #dde8f5 100%)' },
    { id: 'grad-morning', label: 'ยามเช้า', type: 'gradient', value: 'linear-gradient(120deg, #fff9f0 0%, #fef3e2 50%, #fce8d5 100%)' },
    { id: 'grad-sakura', label: 'ซากุระ', type: 'gradient', value: 'linear-gradient(180deg, #fdf2f6 0%, #f8e0ea 50%, #f5d0e0 100%)' },
    { id: 'grad-earth', label: 'ธรรมชาติ', type: 'gradient', value: 'linear-gradient(160deg, #f0ebe3 0%, #e5ddd0 50%, #d9cfc0 100%)' },
    { id: 'grad-mist', label: 'หมอกเบา', type: 'gradient', value: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)' },
    { id: 'grad-golden', label: 'ทองอ่อน', type: 'gradient', value: 'linear-gradient(135deg, #fffbf0 0%, #fff3d6 50%, #ffe8b8 100%)' },
    { id: 'grad-calm', label: 'สงบ', type: 'gradient', value: 'linear-gradient(145deg, #edf7f1 0%, #e8f0f8 50%, #f0edf8 100%)' },
    { id: 'grad-warm', label: 'อบอุ่น', type: 'gradient', value: 'linear-gradient(160deg, #fff5eb 0%, #ffe4cc 50%, #ffd9b8 100%)' },

    // — ภาพพื้นหลัง (18) — Unsplash (ฟรี, เหมาะกับพื้นที่พูดคุย) —
    { id: 'img-mist-forest', label: 'ป่าหมอก', type: 'image', value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=80' },
    { id: 'img-calm-lake', label: 'ทะเลสาบ', type: 'image', value: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=900&q=80' },
    { id: 'img-soft-clouds', label: 'เมฆนุ่ม', type: 'image', value: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=900&q=80' },
    { id: 'img-green-hills', label: 'เนินเขา', type: 'image', value: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=80' },
    { id: 'img-sunset-sea', label: 'ทะเลยามเย็น', type: 'image', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80' },
    { id: 'img-cherry', label: 'ดอกไม้', type: 'image', value: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=900&q=80' },
    { id: 'img-rain-window', label: 'ฝนที่หน้าต่าง', type: 'image', value: 'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=900&q=80' },
    { id: 'img-stars', label: 'ดวงดาว', type: 'image', value: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=900&q=80' },
    { id: 'img-mountain', label: 'ภูเขา', type: 'image', value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80' },
    { id: 'img-beach', label: 'ชายหาด', type: 'image', value: 'https://images.unsplash.com/photo-1473496165774-6ca010bdab9b?w=900&q=80' },
    { id: 'img-autumn', label: 'ใบไม้ร่วง', type: 'image', value: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80' },
    { id: 'img-lavender-field', label: 'ทุ่งลาเวนเดอร์', type: 'image', value: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=900&q=80' },
    { id: 'img-cozy-room', label: 'ห้องอบอุ่น', type: 'image', value: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&q=80' },
    { id: 'img-coffee', label: 'กาแฟยามเช้า', type: 'image', value: 'https://images.unsplash.com/photo-1495474472287-4d89bcf2f2e2?w=900&q=80' },
    { id: 'img-bokeh', label: 'แสงโบเก้', type: 'image', value: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=80' },
    { id: 'img-water', label: 'ลายน้ำ', type: 'image', value: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=900&q=80' },
    { id: 'img-northern', label: 'แสงเหนือ', type: 'image', value: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=900&q=80' },
    { id: 'img-meadow', label: 'ทุ่งหญ้า', type: 'image', value: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80' },
];

const DEFAULT_CHAT_BG = 'solid-cream';
const CHAT_BG_STORAGE_KEY = 'blissiam_chat_bg';

function getChatBackground(id) {
    return CHAT_BACKGROUNDS.find(b => b.id === id) || CHAT_BACKGROUNDS.find(b => b.id === DEFAULT_CHAT_BG);
}

function getSavedChatBackgroundId() {
    return localStorage.getItem(CHAT_BG_STORAGE_KEY) || DEFAULT_CHAT_BG;
}

function saveChatBackgroundId(id) {
    localStorage.setItem(CHAT_BG_STORAGE_KEY, id);
}

function applyChatBackgroundStyle(bg) {
    if (!bg) return {};
    if (bg.type === 'color') return { backgroundColor: bg.value };
    if (bg.type === 'gradient') return { background: bg.value };
    if (bg.type === 'image') return {
        backgroundImage: `linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.82)), url(${bg.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    };
    return {};
}

function getChatBackgroundThumbStyle(bg) {
    if (!bg) return {};
    if (bg.type === 'color') return { backgroundColor: bg.value };
    if (bg.type === 'gradient') return { background: bg.value };
    if (bg.type === 'image') return {
        backgroundImage: `url(${bg.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };
    return {};
}

window.BlissiamChatBg = {
    CHAT_BACKGROUNDS,
    DEFAULT_CHAT_BG,
    getChatBackground,
    getSavedChatBackgroundId,
    saveChatBackgroundId,
    applyChatBackgroundStyle,
    getChatBackgroundThumbStyle,
};
