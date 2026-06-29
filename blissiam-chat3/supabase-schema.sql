-- ============================================================
-- Blissiam Chat - Supabase Database Schema
-- ============================================================
-- 1. รัน script นี้ใน Supabase SQL Editor
-- 2. ไปที่ Database > Replication เปิด realtime สำหรับ tables: messages, queue, rooms
-- 3. ไปที่ Authentication > Settings เปิด Anonymous Sign-Ins
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (ข้อมูลผู้ใช้)
-- display_name: ชื่อที่ใช้แสดงตอนเลือกโหมด "ไม่ระบุตัวตน"
-- real_name, school: ข้อมูลตัวจริง บังคับกรอกตอนสมัคร
--   *ไม่เปิดเผยผ่านการ SELECT ตารางตรงๆ* — ดูได้เฉพาะผ่านฟังก์ชัน
--   get_partner_identity() ด้านล่าง ซึ่งตรวจสอบก่อนว่าผู้ขอและเจ้าของ
--   ข้อมูลอยู่ในห้องแชทเดียวกันที่ identity_mode = 'revealed' จริง
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    real_name TEXT NOT NULL,
    school TEXT NOT NULL,
    avatar_color TEXT DEFAULT '#c4956a',
    avatar_url TEXT,
    ig_username TEXT,
    kudos_count INT NOT NULL DEFAULT 0,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'in_chat', 'waiting', 'admin')),
    role_preference TEXT CHECK (role_preference IN ('venter', 'listener', 'any')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- หมายเหตุสำคัญ: Postgres RLS ควบคุมได้ระดับ "แถว" ไม่ใช่ "คอลัมน์"
-- จึงต้องกันไม่ให้ query ตรงเห็น real_name/school ของคนอื่นได้เลย
-- โดยอนุญาตให้ "เห็นแถวคนอื่น" ได้ แต่ real_name/school ของแถวคนอื่น
-- จะถูกซ่อนด้วย VIEW ด้านล่าง (public_profiles) ที่ทุกหน้าในแอปต้อง
-- ใช้แทนการ select จากตาราง profiles ตรงๆ ยกเว้นแถวของตัวเอง
CREATE POLICY "Profiles are viewable by authenticated users" 
    ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- VIEW สาธารณะ: ไม่มี real_name/school เลย — ใช้แทน profiles ในทุกหน้า
-- ที่ไม่ใช่เจ้าของโปรไฟล์เอง (queue list, room participant lookups ฯลฯ)
CREATE OR REPLACE VIEW public_profiles AS
SELECT id, display_name, avatar_color, avatar_url, ig_username, kudos_count, status, role_preference, created_at, last_seen
FROM profiles
WHERE is_banned = FALSE;

GRANT SELECT ON public_profiles TO authenticated;

-- ============================================================
-- ROOMS (ห้องแชท)
-- identity_mode: 'anonymous' (เห็นชื่อสุ่ม) หรือ 'revealed' (เห็นชื่อจริง+โรงเรียน)
--   ถูกกำหนดตอนจับคู่ และคงที่ตลอดห้องนั้น ไม่สลับกลางทาง
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    listener_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'reported')),
    identity_mode TEXT NOT NULL DEFAULT 'anonymous' CHECK (identity_mode IN ('anonymous', 'revealed')),
    topic TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    ended_by UUID REFERENCES profiles(id)
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms viewable by participants" 
    ON rooms FOR SELECT USING (
        auth.uid() = venter_id OR auth.uid() = listener_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

CREATE POLICY "Users can create rooms" 
    ON rooms FOR INSERT WITH CHECK (auth.uid() = venter_id OR auth.uid() = listener_id);

CREATE POLICY "Participants can update rooms" 
    ON rooms FOR UPDATE USING (auth.uid() = venter_id OR auth.uid() = listener_id);

CREATE POLICY "Admins can update any room"
    ON rooms FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

-- ============================================================
-- MESSAGES (ข้อความในแชท)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 4000),
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'meme', 'emoji')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_system BOOLEAN DEFAULT FALSE
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages viewable by room participants" 
    ON messages FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rooms 
            WHERE id = room_id AND (venter_id = auth.uid() OR listener_id = auth.uid())
        ) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

CREATE POLICY "Users can send messages in their rooms" 
    ON messages FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND EXISTS (
            SELECT 1 FROM rooms 
            WHERE id = room_id AND (venter_id = auth.uid() OR listener_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete own messages in their rooms"
    ON messages FOR DELETE USING (
        sender_id = auth.uid() AND EXISTS (
            SELECT 1 FROM rooms
            WHERE id = room_id AND status = 'active'
            AND (venter_id = auth.uid() OR listener_id = auth.uid())
        )
    );

CREATE POLICY "Admins can delete any message"
    ON messages FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

-- ============================================================
-- QUEUE (คิวรอจับคู่)
-- identity_mode: เลือกตอนเข้าคิว จะจับคู่ได้เฉพาะคนที่เลือกโหมดเดียวกัน
-- ============================================================
CREATE TABLE IF NOT EXISTS queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('venter', 'listener')),
    identity_mode TEXT NOT NULL DEFAULT 'anonymous' CHECK (identity_mode IN ('anonymous', 'revealed')),
    topic TEXT NOT NULL DEFAULT 'general',
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'cancelled')),
    matched_room_id UUID REFERENCES rooms(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    matched_at TIMESTAMPTZ
);

ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Queue viewable by admins" 
    ON queue FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

CREATE POLICY "Users can manage own queue" 
    ON queue FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- REPORTS (รายงานปัญหา)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES profiles(id),
    reported_user_id UUID REFERENCES profiles(id),
    room_id UUID REFERENCES rooms(id),
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports viewable by admins" 
    ON reports FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

CREATE POLICY "Users can create reports" 
    ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update reports"
    ON reports FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

-- ============================================================
-- ADMIN ACCOUNTS (ใช้ร่วมกับ Supabase Auth)
-- ============================================================
-- หมายเหตุ: สร้าง admin ผ่าน Supabase Auth แล้วเพิ่ม metadata { "role": "admin" }
-- หรือใช้ trigger ด้านล่างนี้:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, real_name, school, status)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'User-' || substr(NEW.id::text, 1, 6)),
        COALESCE(NEW.raw_user_meta_data->>'real_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'school', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'offline')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- REALTIME SETUP
-- ============================================================
-- รันใน Supabase Dashboard: Database > Replication > Realtime
-- เปิดใช้งาน realtime สำหรับ tables: messages, queue, rooms

-- หรือรันคำสั่งนี้ (ถ้ามีสิทธิ):
-- BEGIN;
--   DROP PUBLICATION IF EXISTS supabase_realtime;
--   CREATE PUBLICATION supabase_realtime;
-- COMMIT;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages, queue, rooms;

-- ============================================================
-- MATCHING FUNCTION (จับคู่อัตโนมัติ)
-- จับคู่เฉพาะคนที่เลือก identity_mode และ topic เดียวกันเท่านั้น
-- (ระบุตัวตน จับกับระบุตัวตน / ไม่ระบุ จับกับไม่ระบุ)
-- ============================================================
CREATE OR REPLACE FUNCTION match_users()
RETURNS TRIGGER AS $$
DECLARE
    matched_user UUID;
    new_room_id UUID;
BEGIN
    IF NEW.role = 'venter' THEN
        SELECT user_id INTO matched_user 
        FROM queue 
        WHERE role = 'listener' AND status = 'waiting' 
          AND identity_mode = NEW.identity_mode
          AND COALESCE(topic, 'general') = COALESCE(NEW.topic, 'general')
          AND user_id != NEW.user_id
        ORDER BY created_at ASC LIMIT 1;
    ELSE
        SELECT user_id INTO matched_user 
        FROM queue 
        WHERE role = 'venter' AND status = 'waiting' 
          AND identity_mode = NEW.identity_mode
          AND COALESCE(topic, 'general') = COALESCE(NEW.topic, 'general')
          AND user_id != NEW.user_id
        ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF matched_user IS NOT NULL THEN
        -- Create room
        INSERT INTO rooms (venter_id, listener_id, status, identity_mode, topic)
        VALUES (
            CASE WHEN NEW.role = 'venter' THEN NEW.user_id ELSE matched_user END,
            CASE WHEN NEW.role = 'listener' THEN NEW.user_id ELSE matched_user END,
            'active',
            NEW.identity_mode,
            COALESCE(NEW.topic, 'general')
        )
        RETURNING id INTO new_room_id;

        -- Update queue
        UPDATE queue SET status = 'matched', matched_room_id = new_room_id, matched_at = NOW()
        WHERE user_id = matched_user AND status = 'waiting';

        UPDATE queue SET status = 'matched', matched_room_id = new_room_id, matched_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_match_users ON queue;
CREATE TRIGGER trigger_match_users
    AFTER INSERT ON queue
    FOR EACH ROW EXECUTE FUNCTION match_users();

-- ============================================================
-- MIGRATION: เพิ่มคอลัมน์ topic ในตาราง queue (สำหรับ DB ที่สร้างไว้แล้ว)
-- รันใน SQL Editor ถ้าเข้าคิวแล้ว error เรื่อง column "topic" does not exist
-- ============================================================
-- ALTER TABLE queue ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT 'general';
-- จากนั้นรันฟังก์ชัน match_users() ด้านบนใหม่ (CREATE OR REPLACE FUNCTION ...)

-- ============================================================
-- คำสั่งเพิ่ม Admin คนแรก (รันหลังจากสร้าง account ใน Auth)
-- ============================================================
-- UPDATE profiles SET status = 'admin' WHERE id = 'admin-uuid-here';

-- ============================================================
-- get_partner_identity (เปิดเผยชื่อจริง+โรงเรียน อย่างปลอดภัย)
-- ============================================================
-- ใช้แทนการ SELECT real_name/school จากตาราง profiles ตรงๆ
-- ฟังก์ชันนี้จะคืนค่าชื่อจริง+โรงเรียนของ partner_id ก็ต่อเมื่อ:
--   1. ผู้เรียก (auth.uid()) อยู่ในห้อง room_id จริง (เป็น venter หรือ listener)
--   2. partner_id เป็นอีกฝ่ายในห้องเดียวกันจริง (ไม่ใช่คนนอก)
--   3. ห้องนั้น identity_mode = 'revealed' เท่านั้น
-- ถ้าเงื่อนไขไม่ผ่านข้อใดข้อหนึ่ง จะคืนค่า NULL (ไม่เปิดเผยข้อมูล)
CREATE OR REPLACE FUNCTION get_partner_identity(room_id UUID, partner_id UUID)
RETURNS TABLE(real_name TEXT, school TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.real_name, p.school
    FROM profiles p
    JOIN rooms r ON r.id = room_id
    WHERE p.id = partner_id
      AND r.identity_mode = 'revealed'
      AND (r.venter_id = auth.uid() OR r.listener_id = auth.uid())
      AND (partner_id = r.venter_id OR partner_id = r.listener_id)
      AND partner_id != auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_partner_identity(UUID, UUID) TO authenticated;

-- ============================================================
-- SITE_SETTINGS (ธีมเว็บไซต์ - แก้ไขได้จากหลังบ้านแอดมิน)
-- เก็บค่าเดียวสำหรับทั้งระบบ (singleton row, id คงที่)
-- theme_key: ต้องตรงกับ key ใน THEME_PRESETS ของฝั่ง frontend (เช่น 'sage', 'dusty_blue')
-- font_key: ต้องตรงกับ key ในชุดฟอนต์ที่กำหนดไว้ฝั่ง frontend (เช่น 'kanit', 'mitr')
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    theme_key TEXT NOT NULL DEFAULT 'sage',
    font_key TEXT NOT NULL DEFAULT 'kanit',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO site_settings (id, theme_key, font_key)
VALUES (1, 'sage', 'kanit')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- ทุกคน (รวมคนที่ยังไม่ login) ต้องอ่านค่านี้ได้ เพราะทุกหน้าต้องโหลด
-- ธีมก่อนแสดงผล แม้แต่หน้า login/signup ที่ยังไม่มี session
CREATE POLICY "Site settings are publicly readable"
    ON site_settings FOR SELECT USING (true);

-- เฉพาะแอดมินเท่านั้นที่แก้ไขธีมได้
CREATE POLICY "Only admins can update site settings"
    ON site_settings FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

GRANT SELECT ON site_settings TO anon, authenticated;
GRANT UPDATE ON site_settings TO authenticated;

-- ============================================================
-- STORAGE: รูปโปรไฟล์ (avatars bucket)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar files"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar files"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars');

-- ============================================================
-- room_kudos — บันทึกว่าใครให้แต้มในห้องไหนแล้ว (ครั้งเดียวต่อห้อง)
-- ============================================================
CREATE TABLE IF NOT EXISTS room_kudos (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    giver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, giver_id)
);

ALTER TABLE room_kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own room kudos"
    ON room_kudos FOR SELECT USING (giver_id = auth.uid());

CREATE POLICY "Admins can view all room kudos"
    ON room_kudos FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin')
    );

-- ============================================================
-- give_kudos — ให้แต้มใจดีคู่สนทนาในห้องที่กำลังแชทอยู่
-- ============================================================
CREATE OR REPLACE FUNCTION give_kudos(target_user_id UUID, room_id_param UUID)
RETURNS void AS $$
BEGIN
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'ไม่สามารถให้แต้มกับตัวเองได้';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM rooms
        WHERE id = room_id_param AND status = 'active'
        AND (
            (venter_id = auth.uid() AND listener_id = target_user_id)
            OR (listener_id = auth.uid() AND venter_id = target_user_id)
        )
    ) THEN
        RAISE EXCEPTION 'ไม่พบคู่สนทนาในห้องนี้';
    END IF;
    IF EXISTS (SELECT 1 FROM room_kudos WHERE room_id = room_id_param AND giver_id = auth.uid()) THEN
        RAISE EXCEPTION 'ให้แต้มในห้องนี้แล้ว';
    END IF;
    INSERT INTO room_kudos (room_id, giver_id) VALUES (room_id_param, auth.uid());
    UPDATE profiles SET kudos_count = kudos_count + 1 WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION give_kudos(UUID, UUID) TO authenticated;

-- ============================================================
-- MIGRATION สำหรับฐานข้อมูลที่สร้างไว้แล้ว (รันใน SQL Editor)
-- ============================================================
-- ALTER TABLE queue ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT 'general';
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ig_username TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kudos_count INT NOT NULL DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';
-- ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_check;
-- ALTER TABLE messages ADD CONSTRAINT messages_content_check CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 4000);
-- ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
-- ALTER TABLE messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'meme', 'emoji'));
-- จากนั้นรัน CREATE OR REPLACE VIEW public_profiles ... และ match_users(), give_kudos() ด้านบนใหม่
-- CREATE TABLE IF NOT EXISTS room_kudos (...);  -- ดูในไฟล์หลัก
-- DROP POLICY IF EXISTS "Users can delete own messages in their rooms" ON messages;
-- CREATE POLICY "Users can delete own messages in their rooms" ON messages FOR DELETE USING (...);
