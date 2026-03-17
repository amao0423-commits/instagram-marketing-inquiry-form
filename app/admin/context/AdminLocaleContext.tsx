'use client'

import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'
import ja from '@/locales/admin-ja.json'
import ko from '@/locales/admin-ko.json'

const STORAGE_KEY = 'admin-locale'

export type AdminLocale = 'ja' | 'ko'

const messages: Record<AdminLocale, Record<string, unknown>> = { ja, ko }

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split('.').reduce((acc: unknown, key) => {
    if (acc != null && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
  return typeof value === 'string' ? value : undefined
}

function replacePlaceholders(text: string, params?: Record<string, string>): string {
  if (!params) return text
  return Object.entries(params).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val),
    text
  )
}

type TFunction = (key: string, params?: Record<string, string>) => string

interface AdminLocaleContextValue {
  locale: AdminLocale
  setLocale: (locale: AdminLocale) => void
  t: TFunction
  getStatusLabel: (statusValue: string) => string
}

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null)

export function AdminLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>('ja')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AdminLocale | null
      if (stored === 'ja' || stored === 'ko') setLocaleState(stored)
    } catch {
      // ignore
    }
    setMounted(true)
  }, [])

  const setLocale = useCallback((next: AdminLocale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback<TFunction>(
    (key, params) => {
      if (!mounted) {
        const fallback = getNested(ja as Record<string, unknown>, key)
        return fallback ? replacePlaceholders(fallback, params) : key
      }
      const msg = getNested(messages[locale] as Record<string, unknown>, key)
      const str = msg ?? getNested(ja as Record<string, unknown>, key) ?? key
      return replacePlaceholders(str, params)
    },
    [locale, mounted]
  )

  const getStatusLabel = useCallback(
    (statusValue: string) => {
      const statusLabels = messages[locale].statusLabels as Record<string, string> | undefined
      const jaLabels = ja.statusLabels as Record<string, string>
      if (statusLabels && statusValue in statusLabels) return statusLabels[statusValue]
      if (statusValue in jaLabels) return jaLabels[statusValue]
      return statusValue
    },
    [locale]
  )

  const value = useMemo<AdminLocaleContextValue>(
    () => ({ locale, setLocale, t, getStatusLabel }),
    [locale, setLocale, t, getStatusLabel]
  )

  return (
    <AdminLocaleContext.Provider value={value}>
      {children}
    </AdminLocaleContext.Provider>
  )
}

export function useAdminLocale(): AdminLocaleContextValue {
  const ctx = useContext(AdminLocaleContext)
  if (!ctx) throw new Error('useAdminLocale must be used within AdminLocaleProvider')
  return ctx
}
