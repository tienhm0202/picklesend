import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PickleSpend - Quản lý chi tiêu Pickleball',
  description: 'Ứng dụng quản lý chi tiêu và thanh toán cho nhóm chơi Pickleball',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}

