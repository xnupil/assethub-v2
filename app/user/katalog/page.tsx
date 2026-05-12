'use client'
// app/user/katalog/page.tsx

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Barang } from '@/lib/types'

const KATEGORI_EMOJI: Record<string, string> = {
  Elektronik: '🔌', Outdoor: '🏕️', Furnitur: '🪑', Umum: '📦'
}

export default function KatalogPage() {
  const supabase = createClient()
  const [barang, setBarang] = useState<Barang[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Barang | null>(null)
  const [form, setForm] = useState({
    jumlah: 1, waktu_ambil: '', waktu_kembali: '', catatan: ''
  })
  const [ktmFile, setKtmFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('barang').select('*').order('kode')
      .then(({ data }) => { setBarang(data ?? []); setLoading(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!modal || !ktmFile) { alert('⚠️ Harap upload foto KTM.'); return }
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Sesi habis, silakan login kembali.'); return }

    // 1. Upload KTM ke Storage
    const ext = ktmFile.name.split('.').pop()
    const ktmPath = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('ktm-files').upload(ktmPath, ktmFile)

    if (uploadError) { alert('Gagal upload KTM: ' + uploadError.message); setSubmitting(false); return }

    const { data: { publicUrl } } = supabase.storage.from('ktm-files').getPublicUrl(ktmPath)

    // 2. Insert peminjaman
    const res = await fetch('/api/peminjaman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barang_id: modal.id,
        jumlah: form.jumlah,
        waktu_ambil: form.waktu_ambil,
        waktu_kembali: form.waktu_kembali,
        ktm_url: publicUrl,
      })
    })

    const result = await res.json()
    if (!res.ok) { alert('Gagal: ' + result.error); setSubmitting(false); return }

    alert(`🚀 Pengajuan terkirim!\nID: ${result.req_id}\nAdmin akan segera meninjau permohonan Anda.`)
    setModal(null)
    setSubmitting(false)
    setKtmFile(null)
    setForm({ jumlah: 1, waktu_ambil: '', waktu_kembali: '', catatan: '' })
  }

  if (loading) return <PageShell title="Katalog Barang"><div className="text-center py-20 text-gray-400">Memuat data...</div></PageShell>

  return (
    <PageShell title="Katalog Barang">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {barang.map(b => (
          <div key={b.id} className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden hover:shadow-md transition fade-in">
            {/* Foto */}
            <div className="h-36 bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center text-4xl">
              {b.foto_url
                ? <img src={b.foto_url} alt={b.nama} className="h-full w-full object-cover" />
                : KATEGORI_EMOJI[b.kategori] ?? '📦'}
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <div>
                <p className="text-[9px] font-mono text-gray-400">{b.kode}</p>
                <h3 className="font-bold text-gray-800 text-sm leading-snug">{b.nama}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{b.kategori}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-auto">
                <span className={`w-2 h-2 rounded-full ${b.stok_tersedia > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-600">
                  {b.stok_tersedia > 0 ? `${b.stok_tersedia} tersedia` : 'Stok habis'}
                </span>
              </div>
              <button
                disabled={b.stok_tersedia === 0}
                onClick={() => setModal(b)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300
                           disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition">
                {b.stok_tersedia > 0 ? 'Ajukan Pinjam' : 'Tidak Tersedia'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in flex flex-col overflow-hidden max-h-[90vh]">
            <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold">Form Pengajuan Peminjaman</h2>
              <button onClick={() => setModal(null)} className="text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Item info */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
                <p className="text-xs text-indigo-500 font-mono">{modal.kode}</p>
                <p className="font-bold text-indigo-800">{modal.nama}</p>
                <p className="text-xs text-indigo-600">{modal.stok_tersedia} unit tersedia</p>
              </div>

              {/* Jumlah */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Jumlah</label>
                <input type="number" min="1" max={modal.stok_tersedia} required
                  value={form.jumlah}
                  onChange={e => setForm(p => ({ ...p, jumlah: Number(e.target.value) }))}
                  className="input" />
              </div>

              {/* Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Waktu Ambil</label>
                  <input type="datetime-local" required
                    value={form.waktu_ambil}
                    onChange={e => setForm(p => ({ ...p, waktu_ambil: e.target.value }))}
                    className="input text-xs" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Waktu Kembali</label>
                  <input type="datetime-local" required
                    value={form.waktu_kembali}
                    onChange={e => setForm(p => ({ ...p, waktu_kembali: e.target.value }))}
                    className="input text-xs" />
                </div>
              </div>

              {/* Upload KTM */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Upload Foto KTM *</label>
                <label className="border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-lg p-4
                                  flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-100 transition">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => setKtmFile(e.target.files?.[0] ?? null)} required />
                  <span className="text-2xl">📎</span>
                  <span className="text-xs text-indigo-600 font-semibold mt-1 text-center">
                    {ktmFile ? `✅ ${ktmFile.name}` : 'Klik untuk upload KTM (.jpg / .png)'}
                  </span>
                </label>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-600">
                Saya bertanggung jawab atas kerusakan aset selama masa pinjam.
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
                             text-white text-sm font-bold rounded-xl transition">
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .input { border:1px solid #d1d5db; padding:8px 12px; border-radius:8px; font-size:0.875rem; background:#f9fafb; outline:none; width:100%; }
        .input:focus { border-color:#4f46e5; }
      `}</style>
    </PageShell>
  )
}

function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm shrink-0">
        <h2 className="text-lg font-bold">{title}</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
    </>
  )
}
