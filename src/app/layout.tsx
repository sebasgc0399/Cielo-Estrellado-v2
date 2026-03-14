import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cielo Estrellado',
  description: 'Tu cielo personal de recuerdos y estrellas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
