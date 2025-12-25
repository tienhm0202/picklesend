import type { Metadata } from 'next'
import './globals.css'
import { getClubName, getClubSlogan } from '@/lib/utils'

const clubName = getClubName();
const clubSlogan = getClubSlogan();

export const metadata: Metadata = {
  title: `${clubName} - ${clubSlogan}`,
  description: clubSlogan,
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

