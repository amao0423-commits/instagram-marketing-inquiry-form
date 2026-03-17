'use client'

import { AdminLocaleProvider } from './context/AdminLocaleContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLocaleProvider>{children}</AdminLocaleProvider>
}
