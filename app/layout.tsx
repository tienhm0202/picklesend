import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CLB 55 - Hừng hừng khí thế',
  description: 'Hừng hừng khí thế',
  icons: {
    icon: '/icon.png',
  },
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

