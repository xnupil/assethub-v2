// app/api/barang/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}

// PATCH /api/barang/:id — edit barang
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await verifyAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { nama, kategori, stok_total, deskripsi } = body

  const { data, error } = await supabase.from('barang')
    .update({ nama, kategori, stok_total, deskripsi, updated_at: new Date().toISOString() })
    .eq('id', Number(params.id))
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/barang/:id — hapus barang
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await verifyAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('barang').delete().eq('id', Number(params.id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
