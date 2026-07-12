-- ============================================================
-- NomGI — #6 วงกลมแบ่งปัน (ห้องกลุ่ม 3-4 คนตามหัวข้อ)
-- ------------------------------------------------------------
-- ห้องกลุ่มแบบเปิดตลอด (lobby): เข้าได้ทุกเมื่อ ระบบหาห้องหัวข้อเดียวกัน
-- ที่ยังไม่เต็ม (สูงสุด 4 คน) ถ้าไม่มีก็สร้างใหม่ให้ — ทุกคน anonymous
--
-- วิธีใช้: Supabase -> SQL Editor -> New query -> วางทั้งหมด -> Run (รันซ้ำได้)
-- ============================================================

-- ---------- ตาราง ----------
CREATE TABLE IF NOT EXISTS group_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic TEXT NOT NULL DEFAULT 'general',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    max_members INT NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_room_id UUID NOT NULL REFERENCES group_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE (group_room_id, user_id)
);

-- ใช้ตาราง messages เดิม โดยเพิ่มคอลัมน์กลุ่ม (room_id เป็น NULL ได้เมื่อเป็นข้อความกลุ่ม)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_room_id UUID REFERENCES group_rooms(id) ON DELETE CASCADE;
ALTER TABLE messages ALTER COLUMN room_id DROP NOT NULL;

-- ---------- RLS ----------
ALTER TABLE group_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- helper: ผู้ใช้เป็นสมาชิกที่ยัง active ของห้องกลุ่มนี้ไหม
CREATE OR REPLACE FUNCTION is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM group_members
        WHERE group_room_id = gid AND user_id = auth.uid() AND left_at IS NULL
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "group_rooms readable by authed" ON group_rooms;
CREATE POLICY "group_rooms readable by authed" ON group_rooms
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "group_members readable by authed" ON group_members;
CREATE POLICY "group_members readable by authed" ON group_members
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "leave own membership" ON group_members;
CREATE POLICY "leave own membership" ON group_members
    FOR UPDATE USING (user_id = auth.uid());

-- messages: สมาชิกกลุ่มอ่าน/ส่งข้อความในกลุ่มตัวเองได้ (เพิ่มเข้ากับ policy เดิมของ 1:1)
DROP POLICY IF EXISTS "Group messages viewable by members" ON messages;
CREATE POLICY "Group messages viewable by members" ON messages
    FOR SELECT USING (group_room_id IS NOT NULL AND is_group_member(group_room_id));

DROP POLICY IF EXISTS "Group members can send" ON messages;
CREATE POLICY "Group members can send" ON messages
    FOR INSERT WITH CHECK (
        group_room_id IS NOT NULL AND sender_id = auth.uid() AND is_group_member(group_room_id)
    );

-- ---------- ฟังก์ชันเข้าห้อง ----------
-- หา group_room หัวข้อเดียวกันที่ยังเปิด+ไม่เต็ม ถ้าไม่มีสร้างใหม่ แล้ว add ตัวเองเป็นสมาชิก
-- คืน uuid ของห้องกลุ่ม
CREATE OR REPLACE FUNCTION join_group(p_topic TEXT)
RETURNS UUID AS $$
DECLARE
    gid UUID;
BEGIN
    -- ถ้าเราอยู่ในห้องกลุ่มที่ยังเปิดอยู่แล้ว ให้กลับเข้าห้องเดิม
    SELECT gm.group_room_id INTO gid
    FROM group_members gm JOIN group_rooms gr ON gr.id = gm.group_room_id
    WHERE gm.user_id = auth.uid() AND gm.left_at IS NULL AND gr.status = 'open'
      AND gr.topic = COALESCE(p_topic, 'general')
    LIMIT 1;
    IF gid IS NOT NULL THEN RETURN gid; END IF;

    -- หาห้องเปิดที่ยังไม่เต็ม (นับสมาชิก active < max_members)
    SELECT gr.id INTO gid
    FROM group_rooms gr
    WHERE gr.status = 'open' AND gr.topic = COALESCE(p_topic, 'general')
      AND (SELECT COUNT(*) FROM group_members m WHERE m.group_room_id = gr.id AND m.left_at IS NULL) < gr.max_members
    ORDER BY gr.created_at ASC LIMIT 1;

    -- ไม่มี -> สร้างใหม่
    IF gid IS NULL THEN
        INSERT INTO group_rooms (topic) VALUES (COALESCE(p_topic, 'general')) RETURNING id INTO gid;
    END IF;

    -- add ตัวเองเป็นสมาชิก (ถ้าเคยออกไปแล้วกลับเข้ามา ให้เคลียร์ left_at)
    INSERT INTO group_members (group_room_id, user_id) VALUES (gid, auth.uid())
    ON CONFLICT (group_room_id, user_id) DO UPDATE SET left_at = NULL, joined_at = NOW();

    RETURN gid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ออกจากห้องกลุ่ม
CREATE OR REPLACE FUNCTION leave_group(p_gid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE group_members SET left_at = NOW()
    WHERE group_room_id = p_gid AND user_id = auth.uid() AND left_at IS NULL;

    -- ถ้าไม่มีสมาชิก active เหลือ ให้ปิดห้อง
    UPDATE group_rooms SET status = 'closed'
    WHERE id = p_gid
      AND NOT EXISTS (SELECT 1 FROM group_members m WHERE m.group_room_id = p_gid AND m.left_at IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------- Realtime ----------
-- เปิด Realtime ให้ group_members (เห็นคนเข้า/ออก) — messages เปิดอยู่แล้ว
-- Dashboard: Database -> Replication -> เปิด group_members, group_rooms
