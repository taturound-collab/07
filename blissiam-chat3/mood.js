// ============================================================
// NomGI — Mood Check-in (บันทึกความรู้สึกก่อน-หลังคุย)
// เก็บใน localStorage เท่านั้น = ส่วนตัว ไม่ส่งขึ้นเซิร์ฟเวอร์ ไม่แชร์ใคร
// ห่อ IIFE กันตัวแปรหลุดเป็น global
//
// โครงสร้าง localStorage key 'nomgi_mood_log':
//   { pending: {score, at} | null, entries: [{before, after, at}] }
//
// ใช้:
//   NomGIMood.setPending(score)   // ก่อนเข้าคิว (1-5)
//   NomGIMood.commitAfter(score)  // หลังจบแชท (1-5) -> จับคู่กับ pending
//   NomGIMood.history()           // [{before, after, at}] เก่า->ใหม่
//   NomGIMood.stats()             // {total, improved, improvedPct, avgDelta}
//   NomGIMood.MOODS               // ตารางอีโมจิ/ป้าย 1-5
// ============================================================
(function () {
    const KEY = 'nomgi_mood_log';

    const MOODS = [
        { score: 1, emoji: '😢', label: 'แย่มาก',  color: '#c8563a' },
        { score: 2, emoji: '😔', label: 'ไม่ค่อยดี', color: '#d98a4c' },
        { score: 3, emoji: '😐', label: 'เฉยๆ',    color: '#c9a84c' },
        { score: 4, emoji: '🙂', label: 'พอโอเค',  color: '#7aa06b' },
        { score: 5, emoji: '😊', label: 'ดีมาก',   color: '#4f9d76' },
    ];

    function read() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return { pending: null, entries: [], daily: [], gratitude: [] };
            const d = JSON.parse(raw);
            return {
                pending: d.pending || null,
                entries: Array.isArray(d.entries) ? d.entries : [],
                daily: Array.isArray(d.daily) ? d.daily : [],
                gratitude: Array.isArray(d.gratitude) ? d.gratitude : [],
                sessions: Number.isFinite(d.sessions) ? d.sessions : 0,
            };
        } catch (e) {
            return { pending: null, entries: [], daily: [], gratitude: [], sessions: 0 };
        }
    }

    // ----- #7 เช็คอินรายวัน + streak -----
    function ymd(dt) {
        const d = dt || new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function checkedInToday() {
        const d = read();
        return d.daily.some(x => x.date === ymd());
    }
    // เช็คอินความรู้สึกวันนี้ (ครั้งเดียวต่อวัน) — คืน streak ปัจจุบัน
    function dailyCheckIn(score) {
        const d = read();
        const today = ymd();
        if (!d.daily.some(x => x.date === today)) {
            d.daily.push({ date: today, score: clamp(score) });
            if (d.daily.length > 400) d.daily = d.daily.slice(-400);
            write(d);
        }
        return streak();
    }
    // จำนวนวันติดต่อกันที่เช็คอิน (นับถึงวันนี้หรือเมื่อวาน)
    function streak() {
        const d = read();
        const set = new Set(d.daily.map(x => x.date));
        if (!set.size) return 0;
        let count = 0;
        let cur = new Date();
        // ถ้าวันนี้ยังไม่เช็คอิน แต่เมื่อวานเช็ค ให้เริ่มนับจากเมื่อวาน (ยังไม่ขาด)
        if (!set.has(ymd(cur))) cur.setDate(cur.getDate() - 1);
        while (set.has(ymd(cur))) { count++; cur.setDate(cur.getDate() - 1); }
        return count;
    }
    function dailyHistory() { return read().daily; }

    // ----- สรุปรายสัปดาห์ (7 วันล่าสุด) -----
    function weeklyStats() {
        const d = read();
        const days = [];
        for (let i = 6; i >= 0; i--) { const c = new Date(); c.setDate(c.getDate() - i); days.push(ymd(c)); }
        const daySet = new Set(days);
        const dailyThisWeek = d.daily.filter(x => daySet.has(x.date));
        const checkins = dailyThisWeek.length;
        const avgDaily = checkins ? (dailyThisWeek.reduce((s, x) => s + x.score, 0) / checkins) : 0;
        // เทียบครึ่งสัปดาห์แรกกับหลัง ดูแนวโน้ม
        const chatWeek = d.entries.filter(e => e.after != null && daySet.has((e.at || '').slice(0, 10)));
        const improvedChats = chatWeek.filter(e => e.before != null && e.after > e.before).length;
        const gratWeek = d.gratitude.filter(g => daySet.has((g.at || '').slice(0, 10))).length;
        return {
            checkins, avgDaily: Math.round(avgDaily * 10) / 10,
            chatCount: chatWeek.length, improvedChats, gratitudeCount: gratWeek,
            streak: streak(),
        };
    }

    // ----- สมุดขอบคุณ / คำถามประจำวัน -----
    function addGratitude(text) {
        const t = (text || '').toString().trim().slice(0, 300);
        if (!t) return;
        const d = read();
        d.gratitude.push({ text: t, at: new Date().toISOString(), date: ymd() });
        if (d.gratitude.length > 400) d.gratitude = d.gratitude.slice(-400);
        write(d);
    }
    function gratitudeToday() { const d = read(); return d.gratitude.some(g => g.date === ymd()); }
    function gratitudeList() { return read().gratitude; }

    function write(d) {
        try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    }

    function clamp(n) { return Math.min(5, Math.max(1, n | 0)); }

    function setPending(score) {
        const d = read();
        d.pending = { score: clamp(score), at: new Date().toISOString() };
        write(d);
    }

    function getPending() {
        return read().pending;
    }

    // บันทึกความรู้สึกหลังคุย (+ บันทึกสะท้อนใจ note ถ้ามี) จับคู่กับ pending แล้วเก็บเป็น entry
    function commitAfter(score, note) {
        const d = read();
        const after = (score == null) ? null : clamp(score);
        const before = d.pending ? d.pending.score : null;
        const n = (note || '').toString().trim().slice(0, 500);
        const entry = { before, after, at: new Date().toISOString() };
        if (n) entry.note = n;
        d.entries.push(entry);
        d.pending = null;
        if (d.entries.length > 200) d.entries = d.entries.slice(-200);
        write(d);
    }

    function history() { return read().entries; }

    function stats() {
        const e = read().entries.filter(x => x.before != null && x.after != null);
        const total = e.length;
        if (!total) return { total: 0, improved: 0, improvedPct: 0, avgDelta: 0 };
        let improved = 0, sum = 0;
        e.forEach(x => { const d = x.after - x.before; sum += d; if (d > 0) improved++; });
        return {
            total,
            improved,
            improvedPct: Math.round((improved / total) * 100),
            avgDelta: Math.round((sum / total) * 10) / 10,
        };
    }

    function moodOf(score) { return MOODS[clamp(score) - 1]; }

    // ----- ต้นไม้แห่งการเยียวยา: นับจำนวนครั้งที่ "ระบาย/พูดคุย" จบ -----
    // เรียกทุกครั้งที่ปิดบทสนทนาอย่างสมบูรณ์ -> ต้นไม้ส่วนตัวโตขึ้นทีละขั้น
    function recordSession() {
        const d = read();
        d.sessions = (d.sessions | 0) + 1;
        write(d);
        return d.sessions;
    }
    function sessionCount() { return read().sessions | 0; }

    window.NomGIMood = { MOODS, setPending, getPending, commitAfter, history, stats, moodOf,
        dailyCheckIn, checkedInToday, streak, dailyHistory,
        weeklyStats, addGratitude, gratitudeToday, gratitudeList,
        recordSession, sessionCount };

})();
