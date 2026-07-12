-- ============================================================
-- NomGI — #2 เลือก "แบบที่อยากให้ช่วย" (support_type)
-- ------------------------------------------------------------
-- ให้ผู้ใช้เลือกก่อนจับคู่ว่าต้องการแบบไหน:
--   listen  = แค่อยากให้ฟัง
--   advice  = อยากได้คำแนะนำ
--   company = อยากมีคนอยู่เป็นเพื่อน (โหมดเงียบ)
-- ระบบจะ "พยายาม" จับคู่คนที่ต้องการแบบเดียวกันก่อน ถ้าไม่มีค่อยจับใครก็ได้
-- (soft preference — ยังหาคู่ได้เสมอ ไม่ทำให้รอนานขึ้น)
--
-- วิธีใช้: Supabase -> SQL Editor -> New query -> วางทั้งหมด -> Run (รันซ้ำได้)
-- ============================================================

ALTER TABLE queue ADD COLUMN IF NOT EXISTS support_type TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS support_type TEXT;

CREATE OR REPLACE FUNCTION match_users()
RETURNS TRIGGER AS $$
DECLARE
    matched_user UUID;
    matched_support TEXT;
    new_room_id UUID;
    fresh_cutoff TIMESTAMPTZ := NOW() - INTERVAL '60 seconds';
    want_role TEXT := CASE WHEN NEW.role = 'venter' THEN 'listener' ELSE 'venter' END;
BEGIN
    -- ล้างคิวผี (last_seen เก่ากว่า 90 วิ)
    UPDATE queue SET status = 'cancelled'
    WHERE status = 'waiting'
      AND user_id <> NEW.user_id
      AND user_id IN (SELECT id FROM profiles WHERE last_seen < NOW() - INTERVAL '90 seconds');

    -- (1) พยายามจับคู่คนที่ support_type ตรงกันก่อน (ถ้า NEW ระบุมา)
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
        ORDER BY q.created_at ASC LIMIT 1;
    END IF;

    -- (2) ถ้ายังไม่เจอ — จับใครก็ได้ที่ role/topic/mode ตรง และยังอยู่จริง
    IF matched_user IS NULL THEN
        SELECT q.user_id, q.support_type INTO matched_user, matched_support
        FROM queue q
        JOIN profiles p ON p.id = q.user_id
        WHERE q.role = want_role AND q.status = 'waiting'
          AND q.identity_mode = NEW.identity_mode
          AND COALESCE(q.topic, 'general') = COALESCE(NEW.topic, 'general')
          AND q.user_id <> NEW.user_id
          AND p.last_seen > fresh_cutoff
        ORDER BY q.created_at ASC LIMIT 1;
    END IF;

    IF matched_user IS NOT NULL THEN
        INSERT INTO rooms (venter_id, listener_id, status, identity_mode, topic, support_type)
        VALUES (
            CASE WHEN NEW.role = 'venter' THEN NEW.user_id ELSE matched_user END,
            CASE WHEN NEW.role = 'listener' THEN NEW.user_id ELSE matched_user END,
            'active',
            NEW.identity_mode,
            COALESCE(NEW.topic, 'general'),
            COALESCE(NEW.support_type, matched_support)  -- เก็บความต้องการไว้ที่ห้อง
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
