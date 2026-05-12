-- ============================================================
--  AssetHub V2 — Supabase Database Schema
--  Jalankan seluruh file ini di Supabase SQL Editor
--  (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- ─── 1. PROFILES (extends auth.users) ──────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  organisasi  TEXT,
  no_wa       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile saat user baru mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', 'Pengguna Baru'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. BARANG (master aset) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.barang (
  id              SERIAL PRIMARY KEY,
  kode            TEXT UNIQUE NOT NULL,        -- e.g. BRG-001
  nama            TEXT NOT NULL,
  kategori        TEXT DEFAULT 'Umum',
  stok_total      INT NOT NULL DEFAULT 0,
  stok_tersedia   INT NOT NULL DEFAULT 0,
  foto_url        TEXT,                        -- Supabase Storage URL
  deskripsi       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT stok_valid CHECK (stok_tersedia <= stok_total AND stok_tersedia >= 0)
);

-- Seed data awal
INSERT INTO public.barang (kode, nama, kategori, stok_total, stok_tersedia) VALUES
  ('BRG-001', 'Proyektor Epson', 'Elektronik', 2, 2),
  ('BRG-002', 'Tenda Dome 4 Person', 'Outdoor', 3, 3),
  ('BRG-003', 'Sound System Portable', 'Elektronik', 1, 1),
  ('BRG-004', 'Layar Proyektor 100"', 'Elektronik', 2, 2),
  ('BRG-005', 'Meja Lipat', 'Furnitur', 10, 10),
  ('BRG-006', 'Kursi Lipat', 'Furnitur', 30, 30)
ON CONFLICT (kode) DO NOTHING;

-- ─── 3. PEMINJAMAN ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.peminjaman (
  id            SERIAL PRIMARY KEY,
  req_id        TEXT UNIQUE NOT NULL,          -- e.g. REQ-2024-001
  peminjam_id   UUID NOT NULL REFERENCES public.profiles(id),
  barang_id     INT NOT NULL REFERENCES public.barang(id),
  jumlah        INT NOT NULL DEFAULT 1,
  waktu_ambil   TIMESTAMPTZ NOT NULL,
  waktu_kembali TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','returned','late')),
  ktm_url       TEXT,                          -- Supabase Storage URL
  catatan_admin TEXT,
  approved_at   TIMESTAMPTZ,
  returned_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate REQ ID
CREATE OR REPLACE FUNCTION public.generate_req_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.req_id := 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Trigger req_id diset setelah insert (butuh 2-step: insert dulu dapat id, lalu update)
-- Solusi: gunakan sequence terpisah
CREATE SEQUENCE IF NOT EXISTS req_sequence START 1;

CREATE OR REPLACE FUNCTION public.set_req_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.req_id IS NULL OR NEW.req_id = '' THEN
    NEW.req_id := 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('req_sequence')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_req_id_trigger ON public.peminjaman;
CREATE TRIGGER set_req_id_trigger
  BEFORE INSERT ON public.peminjaman
  FOR EACH ROW EXECUTE FUNCTION public.set_req_id();

-- Kurangi stok saat approved
CREATE OR REPLACE FUNCTION public.update_stok_on_approval()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Approved: kurangi stok
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.barang
    SET stok_tersedia = stok_tersedia - NEW.jumlah,
        updated_at = NOW()
    WHERE id = NEW.barang_id;
  END IF;
  -- Returned: tambah kembali stok
  IF NEW.status = 'returned' AND OLD.status = 'approved' THEN
    UPDATE public.barang
    SET stok_tersedia = stok_tersedia + NEW.jumlah,
        updated_at = NOW()
    WHERE id = NEW.barang_id;
    NEW.returned_at := NOW();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stok_trigger ON public.peminjaman;
CREATE TRIGGER stok_trigger
  BEFORE UPDATE ON public.peminjaman
  FOR EACH ROW EXECUTE FUNCTION public.update_stok_on_approval();

-- ─── 4. ROW LEVEL SECURITY (RLS) ───────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barang      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peminjaman  ENABLE ROW LEVEL SECURITY;

-- profiles: user hanya bisa lihat & edit profil sendiri; admin bisa semua
CREATE POLICY "user_own_profile"   ON public.profiles FOR ALL
  USING (auth.uid() = id);
CREATE POLICY "admin_all_profiles" ON public.profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- barang: semua authenticated user bisa READ; hanya admin yang bisa tulis
CREATE POLICY "all_read_barang"    ON public.barang FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "admin_write_barang" ON public.barang FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- peminjaman: user hanya lihat miliknya; admin lihat semua
CREATE POLICY "user_own_peminjaman" ON public.peminjaman FOR ALL
  USING (peminjam_id = auth.uid());
CREATE POLICY "admin_all_peminjaman" ON public.peminjaman FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 5. STORAGE BUCKETS ────────────────────────────────────
-- Buat di Dashboard: Storage → New Bucket
-- Bucket 1: "ktm-files"     (private, max 5MB)
-- Bucket 2: "barang-photos" (public,  max 10MB)

-- Policy untuk ktm-files (user upload KTM sendiri; admin bisa baca)
-- Buat manual di Storage → Policies karena syntax-nya berbeda per versi Supabase
