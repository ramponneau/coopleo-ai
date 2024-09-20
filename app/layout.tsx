import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import './globals.css'
import { Metadata } from 'next'

const fontHeading = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
})

const fontBody = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Coopleo - Votre conseiller relationnel',
  description: 'Coopleo aide les couples à anticiper et résoudre les problèmes avant qu\'ils ne s\'aggravent.',
  openGraph: {
    title: 'Coopleo - Votre conseiller relationnel',
    description: 'Coopleo aide les couples à anticiper et résoudre les problèmes avant qu\'ils ne s\'aggravent.',
    url: 'https://coopleo-ai.vercel.app',
    siteName: 'Coopleo',
    images: [
      {
        url: 'https://coopleo-ai.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Coopleo Preview Image',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coopleo - Votre conseiller relationnel',
    description: 'Coopleo aide les couples à anticiper et résoudre les problèmes avant qu\'ils ne s\'aggravent.',
    images: ['https://coopleo-ai.vercel.app/twitter-image.jpg'], // Replace with your actual image URL
    creator: '@coopleo',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body 
        className={cn(
          'antialiased',
          fontHeading.variable,
          fontBody.variable
        )}
      >
        {children}
      </body>
    </html>
  )
}