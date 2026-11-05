# AgriInsight — React + Node.js + Supabase (PostgreSQL)

Platform analisis bisnis dan data pertanian: dashboard React, API Express, dan database PostgreSQL di Supabase.

## Teknologi
- Frontend: React 18, Vite, Recharts, Lucide.
- Backend: Node.js, Express, Zod, Helmet, CORS, `pg`.
- Database: Supabase PostgreSQL.
- Autentikasi: email + password, hash `scrypt`, token JWT (ditangani backend).
- Deploy: Vercel (frontend statis + API serverless).

## Struktur proyek
```
client/          Frontend React (Vite)
server/          API Express
api/             Entry point Vercel untuk /api/*
supabase/        Skema database
vercel.json      Konfigurasi deploy Vercel
```

## 1. Konfigurasi environment
Salin contoh environment:

```bash
cp server/.env.example server/.env
```

Isi `server/.env`:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

`DATABASE_URL` boleh memakai connection string **langsung** dari Supabase. Backend otomatis
mengubahnya ke **Supabase Pooler** (`aws-0-ap-northeast-1.pooler.supabase.com`) karena host
`db.<ref>.supabase.co` hanya memiliki alamat IPv6 dan tidak dapat dijangkau dari Vercel.

Jika proyek Supabase Anda berada di region lain, tambahkan:

```env
SUPABASE_POOLER_REGION=ap-southeast-1
```

Alternatifnya, isi langsung connection string pooler (IPv4):

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

`JWT_SECRET` bersifat opsional. Bila kosong, secret diturunkan otomatis dari `DATABASE_URL`
sehingga deployment tetap berjalan tanpa konfigurasi tambahan.

> **Jangan commit file `.env`.** File tersebut sudah masuk `.gitignore`. Repository ini publik,
> jadi kredensial database tidak boleh ditulis di source code atau README.

## 2. Siapkan database
Skema sudah diterapkan ke database proyek. Untuk proyek baru atau setelah reset database:

```bash
npm run db:setup
```

Atau jalankan isi `supabase/schema.sql` melalui Supabase Dashboard → SQL Editor.

Skema membuat:
- `public.app_users` — akun pengguna (email, password hash).
- `public.farm_plans` — rencana tanam milik pengguna.
- RLS aktif tanpa policy, sehingga tabel tidak bisa diakses langsung memakai anon key.

## 3. Jalankan lokal
```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api/health

Vite mem-proxy `/api` ke backend, jadi frontend memakai path relatif `/api` secara default.

## 4. Deploy ke Vercel
1. Import repository ini di Vercel (framework: **Vite** atau **Other**).
2. Build command: `npm run build`; output directory: `client/dist` (sudah diatur di `vercel.json`).
3. Tambahkan Environment Variable untuk **Production**, **Preview**, dan **Development**:

   ```env
   DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
   ```

   Nilai tersebut boleh persis seperti connection string dari Supabase; backend akan
   mengarahkannya ke pooler IPv4 secara otomatis.

   Opsional:

   ```env
   SUPABASE_POOLER_REGION=ap-northeast-1
   JWT_SECRET=string-acak-panjang
   ```

4. Redeploy. Frontend dan API berada di domain yang sama, sehingga tidak perlu mengatur CORS.

Lewat Vercel CLI:

```bash
npx vercel env add DATABASE_URL production
npx vercel --prod
```

## Endpoint API
| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/health` | Status API + koneksi database |
| POST | `/api/auth/register` | Daftar akun |
| POST | `/api/auth/login` | Masuk, mengembalikan token JWT |
| GET | `/api/auth/me` | Data akun aktif |
| GET | `/api/plans` | Daftar rencana tanam pengguna |
| POST | `/api/plans` | Simpan rencana tanam |
| GET | `/api/summary` | Ringkasan estimasi omzet/margin |

Endpoint rencana tanam memerlukan header `Authorization: Bearer <token>`.

## Fitur
- Dashboard ringkasan dengan grafik harga ilustrasi.
- Registrasi dan login email/password.
- Form tambah rencana tanam.
- Penyimpanan dan pembacaan rencana tanam dari PostgreSQL Supabase.
- API dengan validasi input, JWT, dan perhitungan estimasi omzet/margin.
- Setiap pengguna hanya dapat mengakses data miliknya (difilter di backend).
- Siap deploy sebagai satu proyek Vercel.

## Batasan
- Grafik harga masih data ilustrasi, bukan feed harga pasar aktual.
- Belum ada integrasi cuaca, sensor tanah, harga resmi, atau model prediksi.
- Belum ada role admin dan manajemen kelompok tani.
- Konfirmasi email tidak digunakan; akun langsung aktif setelah registrasi.
