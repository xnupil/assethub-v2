// app/admin/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('nama, role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/user/katalog')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role="admin" nama={profile?.nama ?? user.email ?? 'Admin'} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
