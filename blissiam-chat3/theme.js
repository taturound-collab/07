// ============================================================
// Blissiam — Theme Engine
// ใช้ร่วมกันทุกหน้า: โหลดธีมจาก Supabase (site_settings) แล้วฉีด
// เป็น CSS custom properties บน :root ให้ Tailwind (ผ่าน config
// ที่ผูกกับ var(--primary-*) เป็นต้น) และ inline style ใช้ค่าจริง
// ============================================================

// ----- 6 ชุดสีสำเร็จรูป (ผ่าน WCAG AA contrast กับตัวอักษรขาวแล้ว) -----
// แต่ละชุดมี ramp 50-700 ให้ใช้ได้ทั้งพื้นหลังอ่อนและปุ่ม/ข้อความเข้ม
const THEME_PRESETS = {
    sage: {
        label: 'Sage · เขียวเซจ',
        primary: { 50: '#f3f7f1', 100: '#e3ece0', 200: '#c5dcc0', 300: '#9dc295', 400: '#739e6b', 500: '#4D7355', 600: '#3d5d44', 700: '#314936' },
        secondary: { 50: '#fbf3ea', 100: '#f3e0c8', 200: '#e6bf8e', 300: '#cc9655', 400: '#A8662A', 500: '#925621', 600: '#74441a' }
    },
    dusty_blue: {
        label: 'Dusty Blue · ฟ้าหม่น',
        primary: { 50: '#eef3f7', 100: '#dbe6ee', 200: '#aec7da', 300: '#7a9fbf', 400: '#517f9f', 500: '#3E6184', 600: '#324e6a', 700: '#293f56' },
        secondary: { 50: '#faf1ec', 100: '#f1ddd1', 200: '#e0b69d', 300: '#c68a66', 400: '#A8643F', 500: '#925637', 600: '#74432b' }
    },
    lavender: {
        label: 'Lavender Mist · ม่วงอ่อน',
        primary: { 50: '#f4f2f8', 100: '#e6e1ee', 200: '#c9bdda', 300: '#a594bf', 400: '#85709f', 500: '#6B5A91', 600: '#574876', 700: '#463a5f' },
        secondary: { 50: '#faf3e9', 100: '#f1e0c4', 200: '#e0c08a', 300: '#c69b50', 400: '#9C6B2E', 500: '#8a5e28', 600: '#6e4b20' }
    },
    warm_sand: {
        label: 'Warm Sand · ทรายอุ่น',
        primary: { 50: '#f8f1ea', 100: '#efdfca', 200: '#dcb98a', 300: '#c4925a', 400: '#a87543', 500: '#96623A', 600: '#794f2e', 700: '#604024' },
        secondary: { 50: '#eef4f1', 100: '#dbe7e1', 200: '#aecabf', 300: '#7eab99', 400: '#5f8c79', 500: '#4F7567', 600: '#3f5e53' }
    },
    terracotta: {
        label: 'Terracotta Soft · ดินเผาอ่อน',
        primary: { 50: '#faf0eb', 100: '#f1dcd0', 200: '#e1b39c', 300: '#cc8a6b', 400: '#bb724e', 500: '#A85C3B', 600: '#874a30', 700: '#6c3b27' },
        secondary: { 50: '#eef2f0', 100: '#dbe4e0', 200: '#aec5bd', 300: '#80a497', 400: '#608579', 500: '#4D6B61', 600: '#3d564e' }
    },
    rose_quartz: {
        label: 'Rose Quartz · กุหลาบควอตซ์',
        primary: { 50: '#faf1f3', 100: '#f1dee3', 200: '#e0b8c2', 300: '#c98a9b', 400: '#b06b7e', 500: '#9C5566', 600: '#7d4452', 700: '#643642' },
        secondary: { 50: '#eef3f1', 100: '#dbe6e2', 200: '#aecac1', 300: '#80a99c', 400: '#618c7d', 500: '#52746A', 600: '#415d55' }
    },
    playful_coral: {
        label: 'Playful Coral · คอรัลสดใส',
        primary: { 50: '#fdf0ec', 100: '#fbdcd2', 200: '#f8bcac', 300: '#f3927c', 400: '#ea6a50', 500: '#D6432E', 600: '#B33420', 700: '#8f2917' },
        secondary: { 50: '#eafaf8', 100: '#d3f0ec', 200: '#a3ddd6', 300: '#5cc4ba', 400: '#1ba296', 500: '#0E8074', 600: '#0b675d' }
    },
    candy_pop: {
        label: 'Candy Pop · หวานสดใส',
        primary: { 50: '#fdeef3', 100: '#fbdce8', 200: '#f7b8ce', 300: '#f086ac', 400: '#e8548a', 500: '#D6336C', 600: '#B0215A', 700: '#8c1a48' },
        secondary: { 50: '#fdf8ec', 100: '#f7ecd3', 200: '#ecd9a8', 300: '#dbbb6e', 400: '#c99a2e', 500: '#A6720A', 600: '#855B08' }
    }
};

// ----- 4 ฟอนต์ให้เลือก (รองรับไทยทั้งหมด) -----
const FONT_SETS = {
    kanit: { label: 'Kanit · มั่นใจ ชัดเจน', family: "'Kanit', sans-serif", googleParam: 'Kanit:wght@300;400;500;600;700;800' },
    mitr: { label: 'Mitr · นุ่มนวล สงบ', family: "'Mitr', sans-serif", googleParam: 'Mitr:wght@300;400;500;600;700' },
    sarabun: { label: 'Sarabun · อบอุ่น คลาสสิก', family: "'Sarabun', sans-serif", googleParam: 'Sarabun:wght@300;400;500;600;700' },
    bai_jamjuree: { label: 'Bai Jamjuree · เป็นกันเอง', family: "'Bai Jamjuree', sans-serif", googleParam: 'Bai+Jamjuree:wght@300;400;500;600;700' }
};

const DEFAULT_THEME_KEY = 'sage';
const DEFAULT_FONT_KEY = 'kanit';

// ----- Dark / Light mode: พื้นหลัง-ตัวอักษร (paper/ink) แยกจากสีธีมหลัก -----
const COLOR_SCHEMES = {
    light: {
        paper: { 50: '#fdfcfa', 100: '#f6f3ee', 200: '#ece7de', 300: '#ddd6c9' },
        ink: { 900: '#1a1a1a', 700: '#3a3a3a', 500: '#6b6b6b', 400: '#8a8a8a', 300: '#b0b0b0', 200: '#c2c2c2' },
        line: '#e8e3d9',
        surface: '#ffffff'
    },
    dark: {
        paper: { 50: '#15151a', 100: '#1c1c22', 200: '#26262e', 300: '#33333d' },
        ink: { 900: '#f2f2f0', 700: '#d4d4d0', 500: '#a8a8a4', 400: '#8a8a86', 300: '#6b6b68', 200: '#54544f' },
        line: 'rgba(255,255,255,0.08)',
        surface: '#1e1e24'
    }
};

const COLOR_SCHEME_KEY = 'blissiam_color_scheme';

function applyColorScheme(mode) {
    const resolved = mode === 'dark' || mode === 'light' ? mode : getPreferredColorScheme();
    const scheme = COLOR_SCHEMES[resolved];
    const root = document.documentElement;

    Object.entries(scheme.paper).forEach(([shade, hex]) => {
        root.style.setProperty(`--color-paper-${shade}`, hex);
    });
    Object.entries(scheme.ink).forEach(([shade, hex]) => {
        root.style.setProperty(`--color-ink-${shade}`, hex);
    });
    root.style.setProperty('--color-line', scheme.line);
    root.style.setProperty('--color-surface', scheme.surface);
    root.classList.toggle('dark', resolved === 'dark');

    localStorage.setItem(COLOR_SCHEME_KEY, resolved);
    return resolved;
}

function getPreferredColorScheme() {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function toggleColorScheme() {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    return applyColorScheme(current === 'dark' ? 'light' : 'dark');
}

// ใช้ค่าที่ผู้ใช้เคยเลือกไว้ทันทีตอนโหลดสคริปต์ (กัน flash สีผิด) เหมือน applyTheme
applyColorScheme(getPreferredColorScheme());

// ฉีด CSS variables ลง :root จาก preset ที่เลือก
function applyTheme(themeKey, fontKey) {
    const theme = THEME_PRESETS[themeKey] || THEME_PRESETS[DEFAULT_THEME_KEY];
    const font = FONT_SETS[fontKey] || FONT_SETS[DEFAULT_FONT_KEY];
    const root = document.documentElement;

    Object.entries(theme.primary).forEach(([shade, hex]) => {
        root.style.setProperty(`--color-primary-${shade}`, hex);
    });
    Object.entries(theme.secondary).forEach(([shade, hex]) => {
        root.style.setProperty(`--color-secondary-${shade}`, hex);
    });
    root.style.setProperty('--font-body', font.family);

    // โหลดฟอนต์จาก Google Fonts แบบไดนามิก ถ้ายังไม่เคยโหลด
    const linkId = 'blissiam-dynamic-font';
    let link = document.getElementById(linkId);
    const href = `https://fonts.googleapis.com/css2?family=${font.googleParam}&display=swap`;
    if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;

    if (document.body) document.body.style.fontFamily = font.family;
}

// โหลดธีมจาก Supabase แล้วฉีดทันที — เรียกครั้งเดียวตอนหน้าเว็บเริ่มโหลด
// ปลอดภัยแม้ยังไม่ login เพราะ policy "Site settings are publicly readable"
async function loadAndApplyTheme() {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) {
            applyTheme(DEFAULT_THEME_KEY, DEFAULT_FONT_KEY);
            return;
        }
        const { data, error } = await supabase
            .from('site_settings')
            .select('theme_key, font_key')
            .eq('id', 1)
            .single();

        if (error || !data) {
            applyTheme(DEFAULT_THEME_KEY, DEFAULT_FONT_KEY);
            return;
        }
        applyTheme(data.theme_key, data.font_key);
    } catch (err) {
        console.warn('[Blissiam] โหลดธีมไม่สำเร็จ ใช้ค่าเริ่มต้นแทน:', err.message);
        applyTheme(DEFAULT_THEME_KEY, DEFAULT_FONT_KEY);
    }
}

// ใช้ค่าเริ่มต้นทันทีก่อน (กัน flash สีผิด) แล้วค่อยอัปเดตจาก DB ทับ
applyTheme(DEFAULT_THEME_KEY, DEFAULT_FONT_KEY);
window.BlissiamTheme = {
    THEME_PRESETS, FONT_SETS, applyTheme, loadAndApplyTheme,
    COLOR_SCHEMES, applyColorScheme, getPreferredColorScheme, toggleColorScheme
};
