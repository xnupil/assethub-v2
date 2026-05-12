'use client'
// components/Sidebar.tsx

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/lib/types'

interface NavItem {
  label: string
  href: string
  icon: string
}

const USER_NAV: NavItem[] = [
  { label: 'Katalog Barang',     href: '/user/katalog',  icon: '🏷️' },
  { label: 'Riwayat Saya',       href: '/user/riwayat',  icon: '📋' },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Dasbor Approval',    href: '/admin/approval', icon: '✅' },
  { label: 'Pengembalian',       href: '/admin/return',   icon: '↩️' },
  { label: 'Master Barang',      href: '/admin/master',   icon: '📦' },
]

interface Props {
  role: Role
  nama: string
}

export default function Sidebar({ role, nama }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navItems = role === 'admin' ? ADMIN_NAV : USER_NAV

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20 shrink-0">
      {/* Logo */}
      <div className="h-16 border-b border-gray-200 flex items-center px-6 bg-indigo-600 text-white">
        <span className="text-lg font-bold tracking-wide">📦 AssetHub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-2">
          {role === 'admin' ? 'Back Office Admin' : 'Menu Peminjam'}
        </div>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <button key={item.href}
              onClick={() => router.push(item.href)}
              className={`text-left px-3 py-2.5 text-sm rounded-lg transition flex items-center gap-2.5 ${
                active
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {nama.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{nama}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              role === 'admin'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {role === 'admin' ? 'Admin Logistik' : 'Peminjam'}
            </span>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full py-2 text-xs text-red-600 font-bold border border-red-200 rounded-lg hover:bg-red-50 transition">
          Logout
        </button>
      </div>
    </aside>
  )
}
