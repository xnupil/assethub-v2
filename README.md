# 📦 AssetHub V2 — Sistem Manajemen Inventaris

Stack: **Next.js 14** · **Supabase** (PostgreSQL + Auth + Storage) · **Vercel** (hosting gratis)

---

## 🚀 Langkah Deploy (0 → Produksi)

### Step 1 — Setup Supabase (database & auth)

1. Buat akun di [supabase.com](https://supabase.com) (gratis, tidak butuh kartu kredit)
2. Klik **New Project** → isi nama project → simpan password DB
3. Tunggu project siap (~2 menit)
4. Buka **SQL Editor** → **New Query** → paste seluruh isi `database/schema.sql` → klik **Run**
5. Buka **Storage** → buat 2 bucket:
   - `ktm-files` → Private (untuk foto KTM peminjam)
   - `barang-photos` → Public (untuk foto barang)
6. Di `ktm-files`, buka **Policies** → Add Policy → pilih template "Allow authenticated uploads"
7. Buka **Project Settings** → **API**, catat:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (jangan share!)

### Step 2 — Setup Repository GitHub

```bash
# Di terminal lokal:
git clone / buat folder baru
cd assethub-v2
npm install          # install semua dependencies
cp .env.example .env.local    # buat file env lokal
# isi .env.local dengan nilai dari Supabase

npm run dev          # test lokal di http://localhost:3000
```

### Step 3 — Deploy ke Vercel

1. Push kode ke GitHub (repo baru atau existing)
2. Buka [vercel.com](https://vercel.com) → **New Project** → import repo
3. Di **Environment Variables**, tambahkan:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY     = eyJhbGci...
   ```
4. Klik **Deploy** → tunggu ~2 menit
5. ✅ Aplikasi live di `https://assethub-v2-xxx.vercel.app`

### Step 4 — Buat Akun Admin Pertama

Setelah deploy, buka aplikasi → Daftar Akun → pilih **Admin Logistik**.

Atau via Supabase SQL Editor:
```sql
-- Ubah role user yang sudah ada menjadi admin
UPDATE profiles SET role = 'admin' WHERE nama = 'Nama Admin Kamu';
```

---

## 🗂️ Struktur Project

```
assethub-v2/
├── app/
│   ├── login/page.tsx          ← Halaman login & registrasi
│   ├── user/
│   │   ├── layout.tsx          ← Layout sidebar user
│   │   ├── katalog/page.tsx    ← Katalog barang + form pinjam
│   │   └── riwayat/page.tsx   ← Riwayat peminjaman user
│   ├── admin/
│   │   ├── layout.tsx          ← Layout sidebar admin
│   │   ├── approval/page.tsx   ← Dasbor approval request
│   │   ├── return/page.tsx     ← Manajemen pengembalian
│   │   └── master/page.tsx     ← CRUD master barang
│   └── api/
│       ├── barang/route.ts             ← GET all, POST new
│       ├── barang/[id]/route.ts        ← PATCH, DELETE
│       ├── peminjaman/route.ts         ← GET list, POST new
│       └── peminjaman/[id]/route.ts    ← PATCH status
├── components/
│   └── Sidebar.tsx             ← Sidebar navigasi (user & admin)
├── lib/
│   ├── supabase/client.ts      ← Supabase browser client
│   ├── supabase/server.ts      ← Supabase server + admin client
│   └── types.ts                ← TypeScript types
├── database/
│   └── schema.sql              ← Seluruh DDL, triggers, RLS
├── middleware.ts               ← Auth + RBAC route protection
└── .env.example                ← Template environment variables
```

---

## 🔐 Sistem RBAC (Role-Based Access Control)

| Route          | Akses          |
|----------------|----------------|
| `/user/*`      | Role: `user`   |
| `/admin/*`     | Role: `admin`  |
| `/login`       | Public         |

- Middleware Next.js memvalidasi session + role di setiap request
- Supabase Row Level Security (RLS) memastikan keamanan di level database
- Admin tidak bisa akses `/user/*` dan sebaliknya

---

## ⚡ Fitur Utama

- **Auth real** dengan Supabase (email + password)
- **Upload KTM** ke Supabase Storage
- **Stok otomatis** berkurang saat approved, bertambah saat returned (database trigger)
- **RBAC** di middleware + RLS database (double protection)
- **Deteksi keterlambatan** otomatis di halaman pengembalian
- **CRUD barang** lengkap untuk admin

---

## 🆓 Biaya

| Layanan   | Plan          | Biaya  | Batas Gratis               |
|-----------|---------------|--------|----------------------------|
| Vercel    | Hobby (gratis)| Rp 0   | 100GB bandwidth/bulan      |
| Supabase  | Free tier     | Rp 0   | 500MB DB, 1GB Storage, 50K auth users |
| Domain    | vercel.app    | Rp 0   | subdomain gratis selamanya |

Untuk organisasi kecil-menengah, semua limit gratis di atas lebih dari cukup.
