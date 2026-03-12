import type { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}
