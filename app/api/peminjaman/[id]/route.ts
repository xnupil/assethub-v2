// app/api/peminjaman/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/peminjaman/:id — update status (approve, reject, returned)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { status, catatan_admin } = body

  const VALID = ['approved', 'rejected', 'returned', 'late']
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = { status }
  if (catatan_admin !== undefined) updatePayload.catatan_admin = catatan_admin
  if (status === 'approved') updatePayload.approved_at = new Date().toISOString()
  // returned_at diset oleh trigger database

  const { data, error } = await supabase.from('peminjaman')
    .update(updatePayload)
    .eq('id', Number(params.id))
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
