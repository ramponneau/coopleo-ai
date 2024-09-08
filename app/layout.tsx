import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coopleo AI',
  description: 'AI-powered application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
