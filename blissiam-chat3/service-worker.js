// ============================================================
// NomGI — Service Worker (PWA)
// ตั้งใจให้ "เบาและปลอดภัย": แคชเฉพาะไอคอน/manifest (static)
// ส่วน HTML/JS ของแอปให้ผ่านไป network เสมอ — จะได้ไม่เสิร์ฟโค้ดเก่าค้าง
// (เคยเจอปัญหาจอขาวจากโค้ดค้างมาแล้ว จึงไม่แคช HTML)
// ============================================================
const CACHE = 'nomgi-static-v1';
const STATIC_ASSETS = [
    'assets/icon-192.png',
    'assets/icon-512.png',
    'manifest.webmanifest',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    // แคชเฉพาะ static assets ของเราเอง (cache-first) — ที่เหลือ network ตรงๆ
    const isStatic = url.origin === self.location.origin &&
        STATIC_ASSETS.some(a => url.pathname.endsWith(a));
    if (isStatic) {
        e.respondWith(
            caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
                return res;
            }))
        );
    }
    // navigation/HTML/JS อื่น: ปล่อยให้ browser ไป network ตามปกติ (ไม่แตะ)
});
