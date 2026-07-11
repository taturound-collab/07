-- ============================================================
-- NomGI — Batch G
--   คอร์สปั้นผู้รับฟัง + เหรียญ "ผ่านการอบรม"
--   (Analytics ใช้ query ตารางเดิม ไม่ต้องแก้ schema)
-- วิธีใช้: Supabase -> SQL Editor -> New query -> วางทั้งหมด -> Run (รันซ้ำได้)
-- ============================================================

-- เก็บเวลาที่ผู้ใช้ผ่านคอร์สอบรมผู้รับฟัง (NULL = ยังไม่ผ่าน)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trained_at TIMESTAMPTZ;

-- อัปเดต view สาธารณะให้มี trained_at (ต่อท้ายเท่านั้น กัน error 42P16)
CREATE OR REPLACE VIEW public_profiles AS
SELECT id, display_name, avatar_color, avatar_url, ig_username, kudos_count,
       status, role_preference, created_at, last_seen, specialties,
       rating_avg, rating_count, trained_at
FROM profiles
WHERE is_banned = FALSE;
GRANT SELECT ON public_profiles TO authenticated;

-- ============================================================
-- เสร็จแล้ว — ผู้ใช้ตั้งค่า trained_at ของตัวเองผ่านนโยบาย
-- "Users can update own profile" ที่มีอยู่แล้ว (auth.uid() = id)
-- ============================================================
