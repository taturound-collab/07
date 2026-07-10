-- ============================================================
-- NomGI — Batch F
--   1) Reconnect (กลับมาคุยกับคนเดิม)  2) กำแพงให้กำลังใจ
--   3) เหรียญ "ผู้ฟังที่ไว้ใจได้"        4) (กันหมดไฟ = ฝั่ง client)
--   5) Auto-flag คำเสี่ยง เข้าคิว admin
-- วิธีใช้: Supabase -> SQL Editor -> New query -> วางทั้งหมด -> Run (รันซ้ำได้)
-- ============================================================

-- ============================================================
-- 1) RECONNECT — บันทึกคู่สนทนา + ชวนกลับมาคุย (ต้องยินยอมทั้งสองฝ่าย)
-- ============================================================

-- คู่สนทนาที่เราบันทึกไว้ (ทิศทางเดียว) — "mutual" = ต่างฝ่ายต่างบันทึกกัน
CREATE TABLE IF NOT EXISTS saved_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    room_id    UUID REFERENCES rooms(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, partner_id),
    CHECK (user_id <> partner_id)
);
ALTER TABLE saved_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved select own" ON saved_partners;
DROP POLICY IF EXISTS "saved insert own" ON saved_partners;
DROP POLICY IF EXISTS "saved delete own" ON saved_partners;
CREATE POLICY "saved select own" ON saved_partners FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "saved insert own" ON saved_partners FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved delete own" ON saved_partners FOR DELETE USING (user_id = auth.uid());

-- คำเชิญกลับมาคุย
CREATE TABLE IF NOT EXISTS reconnect_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    CHECK (from_id <> to_id)
);
ALTER TABLE reconnect_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invites select involved" ON reconnect_invites;
CREATE POLICY "invites select involved" ON reconnect_invites FOR SELECT
    USING (from_id = auth.uid() OR to_id = auth.uid());
-- การเขียน (insert/update) ทำผ่านฟังก์ชัน SECURITY DEFINER ด้านล่างเท่านั้น

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE reconnect_invites;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

-- คู่ที่ "บันทึกกันทั้งสองฝ่าย" (mutual) ของฉัน + สถานะออนไลน์
CREATE OR REPLACE FUNCTION my_reconnectable()
RETURNS TABLE (partner_id UUID, display_name TEXT, avatar_color TEXT, avatar_url TEXT,
               last_seen TIMESTAMPTZ, status TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT p.id, p.display_name, p.avatar_color, p.avatar_url, p.last_seen, p.status
    FROM saved_partners me
    JOIN saved_partners them
      ON them.user_id = me.partner_id AND them.partner_id = me.user_id
    JOIN profiles p ON p.id = me.partner_id
    WHERE me.user_id = auth.uid()
      AND p.is_banned = FALSE
    ORDER BY p.last_seen DESC NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION my_reconnectable() TO authenticated;

-- ส่งคำเชิญกลับมาคุย (ต้องเป็น mutual เท่านั้น)
CREATE OR REPLACE FUNCTION request_reconnect(p_partner UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_me UUID := auth.uid();
    v_mutual BOOLEAN;
    v_id UUID;
BEGIN
    IF v_me IS NULL OR p_partner IS NULL OR v_me = p_partner THEN
        RAISE EXCEPTION 'invalid';
    END IF;
    SELECT EXISTS (
        SELECT 1 FROM saved_partners a
        JOIN saved_partners b ON b.user_id = a.partner_id AND b.partner_id = a.user_id
        WHERE a.user_id = v_me AND a.partner_id = p_partner
    ) INTO v_mutual;
    IF NOT v_mutual THEN RAISE EXCEPTION 'not mutual'; END IF;
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_partner AND is_banned) THEN
        RAISE EXCEPTION 'unavailable';
    END IF;

    -- reuse คำเชิญ pending เดิมถ้ามี
    SELECT id INTO v_id FROM reconnect_invites
        WHERE from_id = v_me AND to_id = p_partner AND status = 'pending'
        ORDER BY created_at DESC LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;

    INSERT INTO reconnect_invites (from_id, to_id) VALUES (v_me, p_partner)
        RETURNING id INTO v_id;
    RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION request_reconnect(UUID) TO authenticated;

-- ตอบรับคำเชิญ -> สร้างห้องใหม่ คืน room_id
CREATE OR REPLACE FUNCTION accept_reconnect(p_invite UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_me UUID := auth.uid();
    v_from UUID;
    v_room UUID;
BEGIN
    SELECT from_id INTO v_from FROM reconnect_invites
        WHERE id = p_invite AND to_id = v_me AND status = 'pending' FOR UPDATE;
    IF v_from IS NULL THEN RAISE EXCEPTION 'invite not found'; END IF;

    INSERT INTO rooms (venter_id, listener_id, status, identity_mode, topic)
        VALUES (v_from, v_me, 'active', 'anonymous', 'reconnect')
        RETURNING id INTO v_room;

    UPDATE reconnect_invites
        SET status = 'accepted', room_id = v_room, responded_at = NOW()
        WHERE id = p_invite;
    RETURN v_room;
END; $$;
GRANT EXECUTE ON FUNCTION accept_reconnect(UUID) TO authenticated;

-- ปฏิเสธ / ยกเลิกคำเชิญ
CREATE OR REPLACE FUNCTION respond_reconnect(p_invite UUID, p_action TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_me UUID := auth.uid();
BEGIN
    IF p_action = 'decline' THEN
        UPDATE reconnect_invites SET status='declined', responded_at=NOW()
            WHERE id=p_invite AND to_id=v_me AND status='pending';
    ELSIF p_action = 'cancel' THEN
        UPDATE reconnect_invites SET status='cancelled', responded_at=NOW()
            WHERE id=p_invite AND from_id=v_me AND status='pending';
    END IF;
END; $$;
GRANT EXECUTE ON FUNCTION respond_reconnect(UUID, TEXT) TO authenticated;

-- ============================================================
-- 2) กำแพงให้กำลังใจ (Encouragement Wall)
-- ============================================================
CREATE TABLE IF NOT EXISTS wall_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (LENGTH(text) BETWEEN 1 AND 200),
    hearts_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','pending','hidden')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE wall_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wall select" ON wall_posts;
DROP POLICY IF EXISTS "wall insert own" ON wall_posts;
DROP POLICY IF EXISTS "wall delete own" ON wall_posts;
DROP POLICY IF EXISTS "wall admin all" ON wall_posts;
-- เห็นโพสต์ที่อนุมัติแล้ว หรือโพสต์ของตัวเอง
CREATE POLICY "wall select" ON wall_posts FOR SELECT
    USING (status = 'approved' OR user_id = auth.uid());
CREATE POLICY "wall insert own" ON wall_posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wall delete own" ON wall_posts FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "wall admin all" ON wall_posts FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

-- หัวใจ (กันกดซ้ำด้วย unique)
CREATE TABLE IF NOT EXISTS wall_hearts (
    post_id UUID NOT NULL REFERENCES wall_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);
ALTER TABLE wall_hearts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hearts select" ON wall_hearts;
DROP POLICY IF EXISTS "hearts insert own" ON wall_hearts;
DROP POLICY IF EXISTS "hearts delete own" ON wall_hearts;
CREATE POLICY "hearts select" ON wall_hearts FOR SELECT USING (TRUE);
CREATE POLICY "hearts insert own" ON wall_hearts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "hearts delete own" ON wall_hearts FOR DELETE USING (user_id = auth.uid());

-- ทำให้ hearts_count ตรงกับจำนวนหัวใจเสมอ
CREATE OR REPLACE FUNCTION wall_hearts_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE wall_posts SET hearts_count = hearts_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE wall_posts SET hearts_count = GREATEST(hearts_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_wall_hearts ON wall_hearts;
CREATE TRIGGER trg_wall_hearts AFTER INSERT OR DELETE ON wall_hearts
    FOR EACH ROW EXECUTE FUNCTION wall_hearts_sync();

-- ============================================================
-- 3) เหรียญ "ผู้ฟังที่ไว้ใจได้" — สรุปคะแนนรีวิวลง profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_avg   NUMERIC(3,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION ratings_agg_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_target UUID := COALESCE(NEW.rated_id, OLD.rated_id);
BEGIN
    IF v_target IS NOT NULL THEN
        UPDATE profiles p SET
            rating_count = (SELECT COUNT(*) FROM ratings r WHERE r.rated_id = v_target),
            rating_avg   = (SELECT ROUND(AVG(r.stars)::numeric, 2) FROM ratings r WHERE r.rated_id = v_target)
        WHERE p.id = v_target;
    END IF;
    RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_ratings_agg ON ratings;
CREATE TRIGGER trg_ratings_agg AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW EXECUTE FUNCTION ratings_agg_sync();

-- backfill คะแนนเดิม
UPDATE profiles p SET
    rating_count = COALESCE((SELECT COUNT(*) FROM ratings r WHERE r.rated_id = p.id), 0),
    rating_avg   = (SELECT ROUND(AVG(r.stars)::numeric, 2) FROM ratings r WHERE r.rated_id = p.id);

-- อัปเดต view สาธารณะให้มีคะแนน (ต่อท้ายเท่านั้น กัน error 42P16)
CREATE OR REPLACE VIEW public_profiles AS
SELECT id, display_name, avatar_color, avatar_url, ig_username, kudos_count,
       status, role_preference, created_at, last_seen, specialties,
       rating_avg, rating_count
FROM profiles
WHERE is_banned = FALSE;
GRANT SELECT ON public_profiles TO authenticated;

-- ============================================================
-- 5) Auto-flag คำเสี่ยง -> เข้าคิว admin
-- ============================================================
CREATE TABLE IF NOT EXISTS safety_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    room_id  UUID REFERENCES rooms(id) ON DELETE SET NULL,
    context  TEXT,                       -- 'chat' | 'group'
    category TEXT,                       -- หมวดที่ตรวจพบ
    excerpt  TEXT CHECK (excerpt IS NULL OR LENGTH(excerpt) <= 280),
    status   TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed')),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at  TIMESTAMPTZ,
    reviewed_by  UUID REFERENCES profiles(id)
);
ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flags insert own" ON safety_flags;
DROP POLICY IF EXISTS "flags admin all" ON safety_flags;
-- ผู้ใช้แจ้ง flag ของ "ข้อความตัวเอง" ได้ (client เรียกเมื่อพบคำเสี่ยงในข้อความที่ตัวเองพิมพ์)
CREATE POLICY "flags insert own" ON safety_flags FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "flags admin all" ON safety_flags FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

-- ============================================================
-- เสร็จแล้ว — ฟีเจอร์ "กันผู้ฟังหมดไฟ" (ข้อ 4) ทำฝั่ง client ล้วน ไม่ต้องใช้ SQL
-- ============================================================
