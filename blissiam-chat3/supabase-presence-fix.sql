-- ============================================================
-- NomGI — แก้ปัญหา "จับคู่แล้วเจอห้องว่าง" (ghost แบบที่ 2)
-- ------------------------------------------------------------
-- ปัญหา: คนที่กดเข้าคิวแล้วปิดแท็บหนี คิวยังค้างเป็น 'waiting'
--        ระบบเลยจับคุณเข้าคู่กับผีตัวนั้น -> ได้ห้องแต่ไม่มีคน
--
-- วิธีแก้: ให้ match_users() จับคู่เฉพาะคนที่ last_seen สดใหม่
--          (ภายใน 60 วิ) + ล้างคิวผีที่ค้างเกิน 90 วิ อัตโนมัติ
--
-- วิธีใช้: เปิด Supabase -> SQL Editor -> New query
--          วางทั้งหมดนี้ -> กด Run  (รันซ้ำได้ ปลอดภัย)
--
-- หมายเหตุ: ต้องใช้คู่กับหน้าเว็บเวอร์ชันล่าสุด (queue.html ที่มี
--           heartbeat) ไม่งั้นคนที่รอเกิน 60 วิ จะกลายเป็นผีเอง
-- ============================================================

CREATE OR REPLACE FUNCTION match_users()
RETURNS TRIGGER AS $$
DECLARE
    matched_user UUID;
    new_room_id UUID;
    fresh_cutoff TIMESTAMPTZ := NOW() - INTERVAL '60 seconds';
BEGIN
    -- ล้างคิวผี: คนที่เข้าคิวแล้วปิดแท็บหนี (last_seen เก่ากว่า 90 วิ) -> ยกเลิก
    UPDATE queue SET status = 'cancelled'
    WHERE status = 'waiting'
      AND user_id <> NEW.user_id
      AND user_id IN (SELECT id FROM profiles WHERE last_seen < NOW() - INTERVAL '90 seconds');

    -- จับคู่เฉพาะคนที่ยัง "อยู่จริง" — last_seen สดใหม่ภายใน 60 วินาที
    IF NEW.role = 'venter' THEN
        SELECT q.user_id INTO matched_user
        FROM queue q
        JOIN profiles p ON p.id = q.user_id
        WHERE q.role = 'listener' AND q.status = 'waiting'
          AND q.identity_mode = NEW.identity_mode
          AND COALESCE(q.topic, 'general') = COALESCE(NEW.topic, 'general')
          AND q.user_id <> NEW.user_id
          AND p.last_seen > fresh_cutoff
        ORDER BY q.created_at ASC LIMIT 1;
    ELSE
        SELECT q.user_id INTO matched_user
        FROM queue q
        JOIN profiles p ON p.id = q.user_id
        WHERE q.role = 'venter' AND q.status = 'waiting'
          AND q.identity_mode = NEW.identity_mode
          AND COALESCE(q.topic, 'general') = COALESCE(NEW.topic, 'general')
          AND q.user_id <> NEW.user_id
          AND p.last_seen > fresh_cutoff
        ORDER BY q.created_at ASC LIMIT 1;
    END IF;

    IF matched_user IS NOT NULL THEN
        INSERT INTO rooms (venter_id, listener_id, status, identity_mode, topic)
        VALUES (
            CASE WHEN NEW.role = 'venter' THEN NEW.user_id ELSE matched_user END,
            CASE WHEN NEW.role = 'listener' THEN NEW.user_id ELSE matched_user END,
            'active',
            NEW.identity_mode,
            COALESCE(NEW.topic, 'general')
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

-- Trigger เดิมชี้มาที่ฟังก์ชันนี้อยู่แล้ว ไม่ต้องสร้างใหม่
-- (ถ้ายังไม่มี trigger ให้รันบรรทัดล่างนี้)
-- DROP TRIGGER IF EXISTS trigger_match_users ON queue;
-- CREATE TRIGGER trigger_match_users AFTER INSERT ON queue
--     FOR EACH ROW EXECUTE FUNCTION match_users();
