import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Community Connect Admin',
  description: 'Admin dashboard for Community Connect app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-6 py-12 max-w-7xl">
            <div className="text-base">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}

