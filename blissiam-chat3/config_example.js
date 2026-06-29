// คัดลอกไฟล์นี้เป็น config.js แล้วใส่ค่าจริงจาก Supabase Dashboard
// Project Settings → API → Project URL & anon public key

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const GIPHY_API_KEY = 'your-giphy-api-key';
window.GIPHY_API_KEY = GIPHY_API_KEY;

function isSupabaseConfigured() {
    return SUPABASE_URL !== 'https://your-project.supabase.co'
        && SUPABASE_ANON_KEY !== 'your-anon-key'
        && SUPABASE_URL.startsWith('https://')
        && SUPABASE_ANON_KEY.length > 20;
}

if (!window.supabase) {
    console.error('[Blissiam] Supabase JS library not loaded. Load supabase.min.js before config.js');
} else if (isSupabaseConfigured()) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn('[Blissiam] Supabase not configured — edit config.js with your Project URL and Anon Key');
}
