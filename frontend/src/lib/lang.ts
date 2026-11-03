import { createContext, useContext } from 'react'
import type { Locale, Translated } from '../types'
import type { Ui } from './i18n'

export type LangContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  ui: Ui
  t: (value: Translated | null | undefined) => string
  month: (value: string | null) => string
}

export const LangContext = createContext<LangContextValue | null>(null)

export function useLang(): LangContextValue {
  const context = useContext(LangContext)
  if (!context) throw new Error('useLang must be used inside LangProvider')
  return context
}
