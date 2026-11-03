import type { Locale } from '../types'

/** Common European Framework levels, plus mother tongue. */
export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'] as const

export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number]

/** Six steps for A1–C2 (a mother tongue fills them all), coloured like the stack levels. */
export const LANGUAGE_STEPS = 6

const levels: Record<LanguageLevel, { steps: number; color: string; it: string; en: string }> = {
  A1: { steps: 1, color: 'var(--dim)', it: 'base', en: 'beginner' },
  A2: { steps: 2, color: 'var(--dim)', it: 'elementare', en: 'elementary' },
  B1: { steps: 3, color: 'var(--cyan)', it: 'intermedio', en: 'intermediate' },
  B2: { steps: 4, color: 'var(--cyan)', it: 'intermedio superiore', en: 'upper intermediate' },
  C1: { steps: 5, color: 'var(--accent)', it: 'avanzato', en: 'advanced' },
  C2: { steps: 6, color: 'var(--accent)', it: 'padronanza', en: 'proficient' },
  native: { steps: 6, color: 'var(--lime)', it: 'madrelingua', en: 'native' },
}

/** "B1 · intermedio", or just "madrelingua" for a mother tongue. */
export function levelLabel(level: LanguageLevel, locale: Locale): string {
  const info = levels[level] ?? levels.B1
  return level === 'native' ? info[locale] : `${level} · ${info[locale]}`
}

export function levelSteps(level: LanguageLevel): { steps: number; color: string } {
  const info = levels[level] ?? levels.B1
  return { steps: info.steps, color: info.color }
}
