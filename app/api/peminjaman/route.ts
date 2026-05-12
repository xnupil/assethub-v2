// app/api/peminjaman/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/peminjaman?status=pending|approved|all
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase.from('peminjaman')
    .select('*, profiles(*), barang(*)')
    .order('created_at', { ascending: false })

  // User hanya bisa lihat miliknya (RLS juga enforce ini, tapi kita filter eksplisit)
  if (profile?.role !== 'admin') {
    query = query.eq('peminjam_id', user.id)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/peminjaman — buat pengajuan baru
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { barang_id, jumlah, waktu_ambil, waktu_kembali, ktm_url } = body

  if (!barang_id || !jumlah || !waktu_ambil || !waktu_kembali) {
    return NextResponse.json({ error: 'Field tidak lengkap' }, { status: 400 })
  }

  // Cek stok
  const { data: barang } = await supabase.from('barang')
    .select('stok_tersedia, nama').eq('id', barang_id).single()

  if (!barang || barang.stok_tersedia < Number(jumlah)) {
    return NextResponse.json({ error: `Stok tidak mencukupi (tersedia: ${barang?.stok_tersedia ?? 0})` }, { status: 409 })
  }

  const { data, error } = await supabase.from('peminjaman').insert({
    peminjam_id: user.id,
    barang_id: Number(barang_id),
    jumlah: Number(jumlah),
    waktu_ambil,
    waktu_kembali,
    ktm_url: ktm_url ?? null,
    status: 'pending',
    req_id: '',  // akan di-set oleh trigger
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, req_id: data.req_id }, { status: 201 })
}
