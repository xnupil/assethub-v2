'use client'
// app/admin/return/page.tsx

import { useEffect, useState, useCallback } from 'react'
import type { Peminjaman } from '@/lib/types'

export default function ReturnPage() {
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/peminjaman?status=approved')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function confirmReturn(id: number) {
    if (!confirm('Konfirmasi pengembalian barang ini? Stok akan otomatis bertambah.')) return
    setProcessing(id)
    await fetch(`/api/peminjaman/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'returned' })
    })
    await fetchData()
    setProcessing(null)
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  function isLate(deadline: string) {
    return new Date(deadline) < new Date()
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0">
        <h2 className="text-lg font-bold">Manajemen Pengembalian</h2>
        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
          {data.length} barang keluar
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {loading
          ? <div className="text-center py-20 text-gray-400">Memuat data...</div>
          : data.length === 0
            ? <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-400 shadow-sm">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-semibold">Tidak ada barang yang sedang dipinjam</p>
              </div>
            : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-amber-50 border-b border-amber-100">
                    <tr>
                      <th className="p-4 text-xs font-bold text-amber-900">Peminjam</th>
                      <th className="p-4 text-xs font-bold text-amber-900">Barang</th>
                      <th className="p-4 text-xs font-bold text-amber-900">Deadline Kembali</th>
                      <th className="p-4 text-xs font-bold text-amber-900 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.map(p => (
                      <tr key={p.id} className={`hover:bg-gray-50 fade-in ${isLate(p.waktu_kembali) ? 'bg-red-50' : ''}`}>
                        <td className="p-4">
                          <p className="font-bold">{(p.profiles as any)?.nama}</p>
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                            {(p.profiles as any)?.organisasi ?? '-'}
                          </span>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                            WA: {(p.profiles as any)?.no_wa ?? '-'}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">{(p.barang as any)?.nama}</p>
                          <p className="text-xs text-gray-500">{p.jumlah} unit · {p.req_id}</p>
                        </td>
                        <td className="p-4">
                          <p className={`text-xs font-bold ${isLate(p.waktu_kembali) ? 'text-red-600' : 'text-gray-700'}`}>
                            {isLate(p.waktu_kembali) && '⚠️ '}{fmt(p.waktu_kembali)}
                          </p>
                          {isLate(p.waktu_kembali) && (
                            <span className="text-[10px] text-red-500 font-bold">TERLAMBAT</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            disabled={processing === p.id}
                            onClick={() => confirmReturn(p.id)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50
                                       text-white font-bold rounded-lg text-xs shadow-sm transition">
                            {processing === p.id ? 'Memproses...' : '↩️ Konfirmasi Kembali'}
                          </button>
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
