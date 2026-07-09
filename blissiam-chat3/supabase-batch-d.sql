-- ============================================================
-- NomGI — Batch D: React ข้อความ / แท็กความถนัด / อุทธรณ์การแบน
-- วิธีใช้: Supabase -> SQL Editor -> New query -> วางทั้งหมด -> Run (รันซ้ำได้)
-- (วงกลมแบ่งปันแบบมีเวลานัด ทำฝั่ง client ล้วน ไม่ต้องใช้ SQL)
-- ============================================================

-- ---------- React ข้อความด้วย emoji ----------
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (message_id, user_id, emoji)
);
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions select in room" ON message_reactions;
DROP POLICY IF EXISTS "reactions insert own" ON message_reactions;
DROP POLICY IF EXISTS "reactions delete own" ON message_reactions;

-- เห็น reaction ของข้อความในห้องที่ตัวเองอยู่
CREATE POLICY "reactions select in room" ON message_reactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM messages m JOIN rooms r ON r.id = m.room_id
        WHERE m.id = message_id AND (r.venter_id = auth.uid() OR r.listener_id = auth.uid())
    )
);
-- ใส่ reaction ของตัวเองบนข้อความในห้องที่ตัวเองอยู่
CREATE POLICY "reactions insert own" ON message_reactions FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM messages m JOIN rooms r ON r.id = m.room_id
        WHERE m.id = message_id AND (r.venter_id = auth.uid() OR r.listener_id = auth.uid())
    )
);
CREATE POLICY "reactions delete own" ON message_reactions FOR DELETE USING (user_id = auth.uid());

-- เปิด realtime ให้ตาราง reactions (ถ้ายังไม่ได้เปิด)
-- (ทำใน Dashboard -> Database -> Replication ก็ได้ หรือรันบรรทัดล่างนี้)
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

-- ---------- แท็กความถนัดของผู้รับฟัง ----------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties TEXT[];

-- อัปเดต view สาธารณะให้มี specialties (ยังไม่มี real_name/school เหมือนเดิม)
CREATE OR REPLACE VIEW public_profiles AS
SELECT id, display_name, avatar_color, avatar_url, ig_username, kudos_count,
       status, role_preference, specialties, created_at, last_seen
FROM profiles
WHERE is_banned = FALSE;
GRANT SELECT ON public_profiles TO authenticated;

-- ---------- ระบบอุทธรณ์การแบน ----------
CREATE TABLE IF NOT EXISTS ban_appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (LENGTH(message) BETWEEN 1 AND 1000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id)
);
ALTER TABLE ban_appeals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appeals insert own" ON ban_appeals;
DROP POLICY IF EXISTS "appeals select own" ON ban_appeals;
DROP POLICY IF EXISTS "appeals admin all" ON ban_appeals;

CREATE POLICY "appeals insert own" ON ban_appeals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "appeals select own" ON ban_appeals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "appeals admin all" ON ban_appeals FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
);
