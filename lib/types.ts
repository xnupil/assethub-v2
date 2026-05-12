// lib/types.ts

export type Role = 'user' | 'admin'

export type StatusPeminjaman = 'pending' | 'approved' | 'rejected' | 'returned' | 'late'

export interface Profile {
  id: string
  nama: string
  role: Role
  organisasi: string | null
  no_wa: string | null
  created_at: string
}

export interface Barang {
  id: number
  kode: string
  nama: string
  kategori: string
  stok_total: number
  stok_tersedia: number
  foto_url: string | null
  deskripsi: string | null
  created_at: string
  updated_at: string
}

export interface Peminjaman {
  id: number
  req_id: string
  peminjam_id: string
  barang_id: number
  jumlah: number
  waktu_ambil: string
  waktu_kembali: string
  status: StatusPeminjaman
  ktm_url: string | null
  catatan_admin: string | null
  approved_at: string | null
  returned_at: string | null
  created_at: string
  updated_at: string
  // Relations (from JOIN)
  profiles?: Profile
  barang?: Barang
}
