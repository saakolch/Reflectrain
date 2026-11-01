import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'sprint_ai',
  description: 'Dump thoughts, get structure, practice, collect evidence.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'sprint_ai', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: '#0b0c10',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
