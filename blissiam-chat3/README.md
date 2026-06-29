# Blissiam Chat - เว็บแชทรับฟัง/ระบาย (เลือกได้ทั้งระบุตัวตน และไม่ระบุตัวตน)

## 📁 ไฟล์ในโปรเจกต์

| ไฟล์ | หน้าที่ |
|------|---------|
| `index.html` | Landing Page - เลือกบทบาท "อยากระบาย" / "อยากรับฟัง" + เลือกโหมดระบุตัวตน/ไม่ระบุตัวตน |
| `signup.html` | สร้างบัญชี - กรอกชื่อจริง, โรงเรียน/มหาวิทยาลัย (บังคับ) และชื่อที่ใช้แสดงตอนไม่ระบุตัวตน |
| `profile.html` | โปรไฟล์ของฉัน - ดู/แก้ไขชื่อจริง โรงเรียน และชื่อที่ใช้แสดง |
| `queue.html` | หน้ารอจับคู่ - แสดงสถานะรอ + real-time matching (จับคู่เฉพาะคนที่เลือกโหมดเดียวกัน) |
| `chat.html` | ห้องแชท - ส่ง-รับข้อความ real-time, แสดงชื่อจริง+โรงเรียนถ้าห้องเป็นโหมดระบุตัวตน |
| `admin-login.html` | หน้าเข้าสู่ระบบสำหรับแอดมิน |
| `admin.html` | Admin Dashboard - จัดการคิว, ห้องแชท, รายงาน, ผู้ใช้, **และตั้งค่าธีมเว็บไซต์ (สี+ฟอนต์)** |
| `theme.js` | ระบบธีมกลาง - เก็บ 6 ชุดสีสำเร็จรูป + 4 ฟอนต์ และฉีดเป็น CSS variables ให้ทุกหน้า |
| `supabase-schema.sql` | Schema ฐานข้อมูล + RLS policies + triggers + ฟังก์ชันเปิดเผยตัวตนอย่างปลอดภัย + ตารางธีม |
| `config.js` | ตั้งค่า Supabase URL และ Anon Key (ใช้ร่วมทุกหน้า) |
| `config.example.js` | ตัวอย่าง config สำหรับคัดลอก |
| `setup-check.html` | ตรวจสอบว่า Supabase ตั้งค่าถูกต้องหรือยัง |

## 🎨 ระบบธีมเว็บไซต์ (ปรับได้จากหลังบ้าน)

แอดมินเข้า `admin.html` → แท็บ **"ธีมเว็บไซต์"** เพื่อ:
- เลือกชุดสีจาก 6 ชุดสำเร็จรูป (ผ่านมาตรฐาน WCAG AA contrast แล้ว ไม่ต้องกังวลเรื่องอ่านยาก)
- เลือกฟอนต์จาก 4 แบบ (Kanit, Mitr, Sarabun, Bai Jamjuree)
- ดู preview ก่อนกดบันทึก
- กดบันทึกแล้วมีผลกับทุกหน้าทั้งเว็บทันที (เก็บค่าไว้ในตาราง `site_settings`)

ไม่ต้องแก้โค้ดทีละไฟล์ — ทุกหน้าจะดึงค่าธีมจาก Supabase มาใช้เองตอนโหลดหน้าผ่าน `theme.js`

## 🚀 ขั้นตอนการติดตั้ง

### 1. สร้างโปรเจกต์ Supabase
- ไปที่ [supabase.com](https://supabase.com) → New Project
- จด `Project URL` และ `anon public key`

### 2. ตั้งค่า Database
- ไปที่ SQL Editor → New query
- คัดลอกเนื้อหาจาก `supabase-schema.sql` ทั้งหมด → Run

### 3. เปิดใช้งาน Realtime
- Database → Replication → Realtime
- เปิดใช้งานสำหรับ tables: `messages`, `queue`, `rooms`

### 4. เปิด Anonymous Sign-Ins
- Authentication → Settings → Anonymous Sign-Ins → ✅ Enable

### 5. สร้าง Admin Account
- Authentication → Users → Invite user (ใส่อีเมล/รหัสผ่านแอดมิน)
- SQL Editor → รันคำสั่ง:
```sql
UPDATE profiles SET status = 'admin' WHERE id = 'admin-uuid-here';
```
(แทน 'admin-uuid-here' ด้วย UUID ของแอดมินที่สร้าง)

### 6. ตั้งค่าเชื่อมต่อ
แก้ไขไฟล์ `config.js` (คัดลอกจาก `config.example.js` ถ้ายังไม่มี):
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```
ค่านี้ใช้ร่วมกันทุกหน้า — ไม่ต้องแก้ในไฟล์ `.html` แยก

### 7. ตรวจสอบการตั้งค่า
เปิด `setup-check.html` ในเบราว์เซอร์เพื่อตรวจว่า config และ database พร้อมหรือยัง

### 8. Deploy
อัปโหลดไฟล์ทั้งหมดขึ้น hosting เช่น:
- Vercel
- Netlify
- GitHub Pages
- หรือใช้ Supabase Storage

## 🏗️ โครงสร้างระบบ

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  index.html │────▶│  queue.html │────▶│  chat.html  │
│  (Landing)  │     │  (Matching) │     │  (Chat Room)│
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  Supabase   │
                                       │  Realtime   │
                                       └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  admin.html │
                                       │ (Dashboard) │
                                       └─────────────┘
```

## 📊 Database Schema

### Tables
- **profiles** - ข้อมูลผู้ใช้ (display_name สำหรับโหมดไม่ระบุตัวตน, real_name + school บังคับกรอกตอนสมัคร)
- **rooms** - ห้องแชท (มี identity_mode: 'anonymous' หรือ 'revealed')
- **messages** - ข้อความ
- **queue** - คิวรอจับคู่ (มี identity_mode เลือกตอนเข้าคิว จับคู่ได้เฉพาะคนเลือกโหมดเดียวกัน)
- **reports** - รายงานปัญหา

### Views & Functions
- **public_profiles** (VIEW) - มุมมองโปรไฟล์ที่ไม่มี real_name/school ใช้แทน profiles ในทุกที่ที่ไม่ใช่เจ้าของข้อมูล
- `handle_new_user()` - สร้าง profile อัตโนมัติเมื่อมี user ใหม่ (รับ real_name, school จาก signup metadata)
- `match_users()` - จับคู่อัตโนมัติเมื่อมีคนเข้าคิว เฉพาะคนที่ role ตรงข้ามและ identity_mode เดียวกัน
- `get_partner_identity(room_id, partner_id)` - เปิดเผยชื่อจริง+โรงเรียนของคู่สนทนา **เฉพาะ**เมื่อผู้เรียกอยู่ในห้องนั้นจริง และห้องเป็นโหมด revealed เท่านั้น (ป้องกันการรั่วไหลข้อมูล)

## 🔒 ความปลอดภัย

- **RLS (Row Level Security)** - ผู้ใช้เห็นเฉพาะข้อมูลของตัวเอง
- **real_name/school ไม่เปิดเผยผ่านการ query ตรงๆ** - ต้องผ่านฟังก์ชัน `get_partner_identity()` ที่ตรวจสอบสิทธิ์จริงทุกครั้ง
- **เลือกโหมดได้ครั้งเดียวต่อรอบแชท** - เลือกก่อนเข้าคิว และคงที่ตลอดห้องนั้น ไม่สลับกลางทาง
- **Anonymous-friendly** - โหมด "ไม่ระบุตัวตน" ยังใช้ชื่อสุ่ม/ชื่อที่ตั้งเองได้ตามปกติ
- **ไม่เก็บประวัติข้อความ** - ข้อความไม่ถูกเก็บหลังจบการสนทนา

## 🛠️ Tech Stack

| ส่วน | เทคโนโลยี |
|------|----------|
| Frontend | React 18 + Tailwind CSS (CDN) |
| Backend | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Anonymous Auth |
| Realtime | Supabase Realtime (Broadcast + Postgres Changes) |

## 📝 หมายเหตุ

- ใช้ React ผ่าน CDN (Babel standalone) เพื่อง่ายต่อการ deploy โดยไม่ต้อง build
- สำหรับ production แนะนำให้ build เป็น static files หรือใช้ Next.js
- สามารถเพิ่มฟีเจอร์เสียง/วิดีโอได้ในอนาคตด้วย WebRTC
