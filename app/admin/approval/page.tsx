'use client'
// app/admin/approval/page.tsx

import { useEffect, useState, useCallback } from 'react'
import type { Peminjaman } from '@/lib/types'
import React from 'react'

export default function ApprovalPage() {
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null)
  const [catatan, setCatatan] = useState('')

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/peminjaman?status=pending')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAction(id: number, action: 'approved' | 'rejected', note = '') {
    setProcessing(id)
    await fetch(`/api/peminjaman/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action, catatan_admin: note })
    })
    await fetchData()
    setProcessing(null)
    setRejectModal(null)
    setCatatan('')
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  function duration(ambil: string, kembali: string) {
    const diff = new Date(kembali).getTime() - new Date(ambil).getTime()
    const hours = Math.round(diff / 3600000)
    return hours < 24 ? `${hours} Jam` : `${Math.round(hours / 24)} Hari`
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0">
        <h2 className="text-lg font-bold">Dasbor Approval</h2>
        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
          {data.length} menunggu
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {loading
          ? <div className="text-center py-20 text-gray-400">Memuat antrian...</div>
          : data.length === 0
            ? <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-400 shadow-sm">
                <p className="text-4xl mb-3">🎉</p>
                <p className="font-semibold">Tidak ada permintaan masuk</p>
                <p className="text-sm mt-1">Semua permintaan sudah diproses!</p>
              </div>
            : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-indigo-50 border-b border-indigo-100">
                    <tr>
                      <th className="p-4 text-xs font-bold text-indigo-900">Peminjam</th>
                      <th className="p-4 text-xs font-bold text-indigo-900">Barang</th>
                      <th className="p-4 text-xs font-bold text-indigo-900">Waktu & Durasi</th>
                      <th className="p-4 text-xs font-bold text-indigo-900">KTM</th>
                      <th className="p-4 text-xs font-bold text-indigo-900 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 fade-in">
                        <td className="p-4">
                          <p className="font-bold">{(p.profiles as any)?.nama}</p>
                          <p className="text-xs text-indigo-600 font-semibold italic">
                            {(p.profiles as any)?.organisasi ?? '-'}
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                            {(p.profiles as any)?.no_wa}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">{(p.barang as any)?.nama}</p>
                          <p className="text-xs text-gray-500">{p.jumlah} unit</p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold">{fmt(p.waktu_ambil)}</p>
                          <p className="text-xs text-gray-500">s/d {fmt(p.waktu_kembali)}</p>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                            {duration(p.waktu_ambil, p.waktu_kembali)}
                          </span>
                        </td>
                        <td className="p-4">
                          {p.ktm_url
                            ? <a href={p.ktm_url} target="_blank" rel="noopener"
                                className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-200 inline-block">
                                📄 Lihat KTM
                              </a>
                            : <span className="text-xs text-gray-400 italic">Tidak ada</span>
                          }
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              disabled={processing === p.id}
                              onClick={() => handleAction(p.id, 'approved')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded text-xs transition">
                              {processing === p.id ? '...' : '✅ Approve'}
                            </button>
                            <button
                              disabled={processing === p.id}
                              onClick={() => setRejectModal({ id: p.id })}
                              className="px-3 py-1.5 border border-red-400 text-red-600 hover:bg-red-50 font-bold rounded text-xs transition">
                              ❌ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 fade-in">
            <h3 className="font-bold text-gray-800 mb-4">Alasan Penolakan</h3>
            <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
              rows={3} placeholder="Tulis alasan penolakan (opsional)..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setCatatan('') }}
                className="flex-1 py-2 text-sm font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={() => handleAction(rejectModal.id, 'rejected', catatan)}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700">
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
