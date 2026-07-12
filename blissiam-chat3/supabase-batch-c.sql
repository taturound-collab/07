-- ============================================================
-- NomGI — Batch C: บล็อกคู่ / ให้คะแนน / กันแมตช์ซ้อน / mood รวมของชุมชน
-- วิธีใช้: Supabase -> SQL Editor -> New query -> วางทั้งหมด -> Run (รันซ้ำได้)
-- ============================================================

-- ---------- #2 ตารางบล็อกผู้ใช้ ----------
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (blocker_id, blocked_id)
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blocks own select" ON blocks;
DROP POLICY IF EXISTS "blocks own insert" ON blocks;
DROP POLICY IF EXISTS "blocks own delete" ON blocks;
CREATE POLICY "blocks own select" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocks own insert" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks own delete" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

-- ---------- #10 ตารางให้คะแนนหลังจบแชท ----------
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rated_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ratings insert own" ON ratings;
DROP POLICY IF EXISTS "ratings admin read" ON ratings;
CREATE POLICY "ratings insert own" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "ratings admin read" ON ratings FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

-- ---------- #11 mood รวมของชุมชน (ไม่ระบุตัวตน — ไม่มี user_id) ----------
CREATE TABLE IF NOT EXISTS mood_pings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mood_pings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mood_pings insert" ON mood_pings;
DROP POLICY IF EXISTS "mood_pings admin read" ON mood_pings;
CREATE POLICY "mood_pings insert" ON mood_pings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mood_pings admin read" ON mood_pings FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

-- เผื่อยังไม่มีคอลัมน์ support_type (idempotent)
ALTER TABLE queue ADD COLUMN IF NOT EXISTS support_type TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS support_type TEXT;

-- ---------- match_users เวอร์ชันเต็ม: lock กันแมตช์ซ้อน + กันคู่ที่บล็อกกัน + support_type + presence ----------
CREATE OR REPLACE FUNCTION match_users()
RETURNS TRIGGER AS $$
DECLARE
    matched_user UUID;
    matched_support TEXT;
    new_room_id UUID;
    fresh_cutoff TIMESTAMPTZ := NOW() - INTERVAL '60 seconds';
    want_role TEXT := CASE WHEN NEW.role = 'venter' THEN 'listener' ELSE 'venter' END;
BEGIN
    -- #14 ล็อกระดับ transaction ให้การจับคู่ทำทีละคน (กัน race condition จับคนซ้ำ)
    PERFORM pg_advisory_xact_lock(hashtext('nomgi_match_users'));

    -- ล้างคิวผี (last_seen เก่ากว่า 90 วิ)
    UPDATE queue SET status = 'cancelled'
    WHERE status = 'waiting'
      AND user_id <> NEW.user_id
      AND user_id IN (SELECT id FROM profiles WHERE last_seen < NOW() - INTERVAL '90 seconds');

    -- (1) พยายามจับคู่ support_type ตรงกันก่อน + ยังอยู่จริง + ไม่ได้บล็อกกัน
    IF NEW.support_type IS NOT NULL THEN
        SELECT q.user_id, q.support_type INTO matched_user, matched_support
        FROM queue q
        JOIN profiles p ON p.id = q.user_id
        WHERE q.role = want_role AND q.status = 'waiting'
          AND q.identity_mode = NEW.identity_mode
          AND COALESCE(q.topic, 'general') = COALESCE(NEW.topic, 'general')
          AND q.user_id <> NEW.user_id
          AND p.last_seen > fresh_cutoff
          AND q.support_type IS NOT DISTINCT FROM NEW.support_type
          AND NOT EXISTS (
              SELECT 1 FROM blocks b
              WHERE (b.blocker_id = NEW.user_id AND b.blocked_id = q.user_id)
                 OR (b.blocker_id = q.user_id AND b.blocked_id = NEW.user_id))
        ORDER BY q.created_at ASC LIMIT 1;
    END IF;

    -- (2) fallback: จับใครก็ได้ที่ role/topic/mode ตรง ยังอยู่จริง และไม่ได้บล็อกกัน
    IF matched_user IS NULL THEN
        SELECT q.user_id, q.support_type INTO matched_user, matched_support
        FROM queue q
        JOIN profiles p ON p.id = q.user_id
        WHERE q.role = want_role AND q.status = 'waiting'
          AND q.identity_mode = NEW.identity_mode
          AND COALESCE(q.topic, 'general') = COALESCE(NEW.topic, 'general')
          AND q.user_id <> NEW.user_id
          AND p.last_seen > fresh_cutoff
          AND NOT EXISTS (
              SELECT 1 FROM blocks b
              WHERE (b.blocker_id = NEW.user_id AND b.blocked_id = q.user_id)
                 OR (b.blocker_id = q.user_id AND b.blocked_id = NEW.user_id))
        ORDER BY q.created_at ASC LIMIT 1;
    END IF;

    IF matched_user IS NOT NULL THEN
        INSERT INTO rooms (venter_id, listener_id, status, identity_mode, topic, support_type)
        VALUES (
            CASE WHEN NEW.role = 'venter' THEN NEW.user_id ELSE matched_user END,
            CASE WHEN NEW.role = 'listener' THEN NEW.user_id ELSE matched_user END,
            'active', NEW.identity_mode, COALESCE(NEW.topic, 'general'),
            COALESCE(NEW.support_type, matched_support)
        )
        RETURNING id INTO new_room_id;

        UPDATE queue SET status = 'matched', matched_room_id = new_room_id, matched_at = NOW()
        WHERE user_id = matched_user AND status = 'waiting';
        UPDATE queue SET status = 'matched', matched_room_id = new_room_id, matched_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger เดิมชี้ที่ฟังก์ชันนี้อยู่แล้ว
