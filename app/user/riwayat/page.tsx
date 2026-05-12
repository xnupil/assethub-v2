'use client'
// app/user/riwayat/page.tsx

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Peminjaman } from '@/lib/types'

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-600',
  late:     'bg-orange-100 text-orange-700',
}
const STATUS_LABEL: Record<string, string> = {
  pending:  'Menunggu Approval',
  approved: 'Sedang Dipinjam',
  rejected: 'Ditolak',
  returned: 'Sudah Dikembalikan',
  late:     'Terlambat',
}

export default function RiwayatPage() {
  const supabase = createClient()
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('peminjaman')
      .select('*, barang(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setData(data ?? []); setLoading(false) })
  }, [])

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm shrink-0">
        <h2 className="text-lg font-bold">Riwayat Peminjaman Saya</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {loading
          ? <div className="text-center py-20 text-gray-400">Memuat riwayat...</div>
          : data.length === 0
            ? <div className="text-center py-20 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-semibold">Belum ada riwayat peminjaman</p>
                <p className="text-sm text-gray-400 mt-1">Yuk pinjam barang dari Katalog!</p>
              </div>
            : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-bold text-gray-600 text-xs">ID REQ</th>
                      <th className="p-4 font-bold text-gray-600 text-xs">Barang</th>
                      <th className="p-4 font-bold text-gray-600 text-xs">Waktu Ambil</th>
                      <th className="p-4 font-bold text-gray-600 text-xs">Waktu Kembali</th>
                      <th className="p-4 font-bold text-gray-600 text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 fade-in">
                        <td className="p-4 font-mono text-xs text-gray-500">{p.req_id}</td>
                        <td className="p-4">
                          <p className="font-semibold">{(p.barang as any)?.nama}</p>
                          <p className="text-xs text-gray-400">{p.jumlah} unit</p>
                        </td>
                        <td className="p-4 text-xs">{fmt(p.waktu_ambil)}</td>
                        <td className="p-4 text-xs">{fmt(p.waktu_kembali)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${STATUS_STYLE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </span>
                          {p.catatan_admin && (
                            <p className="text-[10px] text-red-500 mt-0.5 italic">"{p.catatan_admin}"</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>
    </>
  )
}
