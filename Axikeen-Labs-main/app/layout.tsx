import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { NotificationBootstrap } from '@/components/ui/NotificationBootstrap'
import './globals.css'

export const metadata: Metadata = {
  title: 'SaneSpace — The space that is there for you',
  description:
    'A personal AI companion for school, work, relationships, and everyday life — culturally aware, memory-aware, and built to listen without pressure.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon.ico', rel: 'shortcut icon' },
    ],
    apple: '/favicon_io/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <NotificationBootstrap />
      {children}
    </ThemeProvider>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <body>{content}</body>
    </html>
  )
}
