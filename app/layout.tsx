// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AssetHub V2 — Sistem Manajemen Inventaris',
  description: 'Platform peminjaman dan manajemen aset organisasi kampus',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-100 text-gray-800 antialiased">{children}</body>
    </html>
  )
}
