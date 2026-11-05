# AgriInsight — React + Node.js + Supabase

Starter project full-stack untuk platform analisis bisnis dan data pertanian.

## Teknologi
- Frontend: React 18, Vite, Recharts, Lucide, Supabase JS.
- Backend: Node.js, Express, Zod, Helmet, CORS.
- Database/Auth: Supabase PostgreSQL + Supabase Auth + Row Level Security.

## Prasyarat
Node.js 20 LTS atau lebih baru, npm, dan akun/proyek Supabase.

## 1. Siapkan Supabase
1. Buat proyek baru di https://supabase.com/dashboard.
2. Buka SQL Editor, lalu jalankan isi `supabase/schema.sql`.
3. Dari Project Settings → API, salin Project URL dan anon/publishable key.
4. Aktifkan metode Email pada Authentication → Providers. Atur email confirmation sesuai kebutuhan.

## 2. Konfigurasi environment
Salin `client/.env.example` menjadi `client/.env` dan isi URL serta anon key.
Salin `server/.env.example` menjadi `server/.env` dan isi URL serta service role key.

**Penting:** `SUPABASE_SERVICE_ROLE_KEY` hanya boleh berada di backend `server/.env`. Jangan pernah menaruhnya pada variabel `VITE_`, frontend, Git, atau membagikannya ke publik. RLS tetap aktif pada tabel.

## 3. Instal dan jalankan
Dari direktori utama proyek:

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:4000/api/health

## Fitur yang sudah disiapkan
- Dashboard ringkasan dengan grafik harga ilustrasi.
- Registrasi dan login email/password melalui Supabase Auth.
- Form tambah rencana tanam.
- Penyimpanan dan pembacaan rencana tanam dari PostgreSQL Supabase.
- API backend dengan pemeriksaan bearer token, validasi input, dan ringkasan estimasi omzet/margin.
- RLS agar pengguna hanya dapat melihat dan mengelola rencana tanam miliknya.

## Batasan saat ini
- Grafik harga masih data ilustrasi, bukan feed harga pasar aktual.
- Belum ada integrasi cuaca, sensor tanah, harga resmi, atau model prediksi.
- Belum ada role admin dan manajemen kelompok tani.
- Registrasi dapat memerlukan konfirmasi email sesuai pengaturan Supabase.
- Pastikan pengujian RLS, auth, dan API dilakukan di proyek Supabase milik Anda sebelum produksi.
