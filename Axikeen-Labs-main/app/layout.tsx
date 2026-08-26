import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'SaneSpace — The space that is there for you',
  description:
    'A personal AI companion for school, work, relationships, and everyday life — culturally aware, memory-aware, and built to listen without pressure.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <body>{content}</body>
    </html>
  )
}
