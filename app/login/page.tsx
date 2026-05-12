'use client'
// app/login/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', nama: '', organisasi: '', no_wa: '', role: 'user'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password
    })

    if (error) { setError(error.message); setLoading(false); return }

    // Ambil role untuk redirect
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    router.push(profile?.role === 'admin' ? '/admin/approval' : '/user/katalog')
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nama: form.nama, role: form.role }
      }
    })

    if (error) { setError(error.message); setLoading(false); return }

    // Update organisasi & no_wa setelah trigger buat profile
    // (dilakukan via API route karena profile baru saja dibuat)
    setError('')
    alert('✅ Registrasi berhasil! Silakan login.')
    setMode('login')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 text-white text-center">
          <h1 className="text-2xl font-bold tracking-tight">📦 AssetHub <span className="text-indigo-200">V2</span></h1>
          <p className="text-indigo-200 text-xs mt-1">Sistem Manajemen Inventaris Terintegrasi</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-gray-200">
          {(['login', 'register'] as const).map(tab => (
            <button key={tab} onClick={() => { setMode(tab); setError('') }}
              className={`flex-1 py-3 text-sm font-bold transition ${
                mode === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab === 'login' ? 'Masuk' : 'Daftar Akun'}
            </button>
          ))}
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}
          className="p-8 flex flex-col gap-4">

          {/* Register-only fields */}
          {mode === 'register' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                <input name="nama" value={form.nama} onChange={handleChange} required
                  placeholder="Sesuai KTM" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Organisasi / UKM</label>
                  <input name="organisasi" value={form.organisasi} onChange={handleChange}
                    placeholder="BEM, UKM, dll" className="input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Daftar Sebagai</label>
                  <select name="role" value={form.role} onChange={handleChange} className="input">
                    <option value="user">Peminjam (Mahasiswa)</option>
                    <option value="admin">Admin Logistik</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Common fields */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required
              placeholder="email@mahasiswa.ac.id" className="input" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required
              placeholder="Min. 6 karakter" className="input" />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
                       text-white font-bold rounded-xl transition shadow-md text-sm">
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk →' : 'Buat Akun →'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .input {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          background: #f9fafb;
          outline: none;
          width: 100%;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: #4f46e5; }
      `}</style>
    </div>
  )
}
