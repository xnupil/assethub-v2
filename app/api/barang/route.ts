// app/api/barang/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/barang — list semua barang
export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('barang').select('*').order('kode')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/barang — tambah barang baru (admin only)
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { kode, nama, kategori, stok_total, deskripsi } = body

  if (!kode || !nama || !stok_total) {
    return NextResponse.json({ error: 'kode, nama, dan stok_total wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabase.from('barang').insert({
    kode, nama, kategori: kategori ?? 'Umum',
    stok_total: Number(stok_total),
    stok_tersedia: Number(stok_total),  // stok awal = stok total
    deskripsi: deskripsi ?? null
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
