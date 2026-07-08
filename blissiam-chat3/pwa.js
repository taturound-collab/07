// ============================================================
// NomGI — PWA loader
// ฉีด <link manifest> + <meta theme-color> ให้ทุกหน้าที่โหลดไฟล์นี้
// แล้วลงทะเบียน service worker (ติดตั้งเป็นแอปบนมือถือได้)
// ห่อ IIFE กันตัวแปรหลุด global
// ============================================================
(function () {
    try {
        if (!document.querySelector('link[rel="manifest"]')) {
            const link = document.createElement('link');
            link.rel = 'manifest';
            link.href = 'manifest.webmanifest';
            document.head.appendChild(link);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = '#4D7355';
            document.head.appendChild(meta);
        }
        // iOS: ให้เพิ่มลงหน้าจอแล้วเปิดเต็มจอ
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const m = document.createElement('meta');
            m.name = 'apple-mobile-web-app-capable';
            m.content = 'yes';
            document.head.appendChild(m);
        }
    } catch (e) {}

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('service-worker.js').catch(function () {});
        });
    }
})();
