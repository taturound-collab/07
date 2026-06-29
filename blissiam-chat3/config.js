// ============================================================
// Blissiam Chat — Supabase Configuration
// แก้ไขค่าด้านล่างให้ตรงกับ Project ของคุณ
// (Project Settings → API → Project URL & anon public key)
// ============================================================

const SUPABASE_URL = 'https://ziresubcgpbpmeuiagdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcmVzdWJjZ3BicG1ldWlhZ2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjU3MDAsImV4cCI6MjA5ODE0MTcwMH0.LIeilmBS5kCwcvgRE8D-olxs7DrHqTqCwCzGKF3628k';

// Giphy API key สำหรับค้นหามีมในแชท (สมัครฟรีที่ developers.giphy.com)
const GIPHY_API_KEY = 'GlVGYHqc3SyCE33918nYjgCqQf1aSN9S';
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
