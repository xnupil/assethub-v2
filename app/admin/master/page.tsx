'use client'
// app/admin/master/page.tsx

import { useEffect, useState, useCallback } from 'react'
import type { Barang } from '@/lib/types'

const EMPTY_FORM = { kode: '', nama: '', kategori: 'Elektronik', stok_total: 1, deskripsi: '' }

export default function MasterBarangPage() {
  const [data, setData] = useState<Barang[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/barang')
    const json = await res.json()
    setData(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setModal('add') }
  function openEdit(b: Barang) {
    setForm({ kode: b.kode, nama: b.nama, kategori: b.kategori, stok_total: b.stok_total, deskripsi: b.deskripsi ?? '' })
    setEditId(b.id); setModal('edit')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const method = modal === 'add' ? 'POST' : 'PATCH'
    const url = modal === 'add' ? '/api/barang' : `/api/barang/${editId}`
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    await fetchData(); setModal(null); setSaving(false)
  }

  async function handleDelete(id: number, nama: string) {
    if (!confirm(`Hapus "${nama}"? Operasi ini tidak bisa dibatalkan.`)) return
    await fetch(`/api/barang/${id}`, { method: 'DELETE' })
    await fetchData()
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0">
        <h2 className="text-lg font-bold">Master Data Barang</h2>
        <button onClick={openAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-md transition">
          + Tambah Aset
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {loading
          ? <div className="text-center py-20 text-gray-400">Memuat data...</div>
          : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-600">Kode</th>
                    <th className="p-4 text-xs font-bold text-gray-600">Nama Barang</th>
                    <th className="p-4 text-xs font-bold text-gray-600">Kategori</th>
                    <th className="p-4 text-xs font-bold text-gray-600 text-center">Stok Total</th>
                    <th className="p-4 text-xs font-bold text-gray-600 text-center">Tersedia</th>
                    <th className="p-4 text-xs font-bold text-gray-600 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 fade-in">
                      <td className="p-4 font-mono text-xs text-gray-500">{b.kode}</td>
                      <td className="p-4 font-bold">{b.nama}</td>
                      <td className="p-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">{b.kategori}</span></td>
                      <td className="p-4 text-center font-mono">{b.stok_total}</td>
                      <td className="p-4 text-center">
                        <span className={`font-mono font-bold ${b.stok_tersedia === 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {b.stok_tersedia}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => openEdit(b)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded text-xs hover:bg-indigo-100 border border-indigo-200 transition">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(b.id, b.nama)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded text-xs hover:bg-red-100 border border-red-200 transition">
                            Hapus
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

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in overflow-hidden">
            <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold">{modal === 'add' ? 'Tambah Aset Baru' : 'Edit Aset'}</h3>
              <button onClick={() => setModal(null)} className="text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Kode Barang</label>
                  <input required value={form.kode} onChange={e => setForm(p => ({ ...p, kode: e.target.value }))}
                    placeholder="BRG-007" className="input" disabled={modal === 'edit'} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Kategori</label>
                  <select value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value }))} className="input">
                    {['Elektronik', 'Outdoor', 'Furnitur', 'Umum'].map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Barang</label>
                <input required value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
                  placeholder="Proyektor Epson EB-..." className="input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Stok Total</label>
                <input type="number" required min="1" value={form.stok_total}
                  onChange={e => setForm(p => ({ ...p, stok_total: Number(e.target.value) }))}
                  className="input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Deskripsi (Opsional)</label>
                <input value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))}
                  placeholder="Spesifikasi singkat..." className="input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .input { border:1px solid #d1d5db; padding:8px 12px; border-radius:8px; font-size:0.875rem; background:#f9fafb; outline:none; width:100%; }
        .input:focus { border-color:#4f46e5; }
        .input:disabled { background:#f1f5f9; color:#94a3b8; cursor:not-allowed; }
      `}</style>
    </>
  )
}
