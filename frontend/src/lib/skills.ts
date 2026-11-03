import type { Locale } from '../types'

/** How well a technology is known: shown as 1 to 4 filled steps. */
export const SKILL_LEVELS = ['basic', 'intermediate', 'advanced', 'expert'] as const

export type SkillLevel = (typeof SKILL_LEVELS)[number]

const levels: Record<SkillLevel, { steps: number; color: string; it: string; en: string }> = {
  basic: { steps: 1, color: 'var(--dim)', it: 'Base', en: 'Basic' },
  intermediate: { steps: 2, color: 'var(--cyan)', it: 'Intermedio', en: 'Intermediate' },
  advanced: { steps: 3, color: 'var(--accent)', it: 'Avanzato', en: 'Advanced' },
  expert: { steps: 4, color: 'var(--lime)', it: 'Esperto', en: 'Expert' },
}

export function skillLevel(level: SkillLevel, locale: Locale) {
  const info = levels[level] ?? levels.intermediate
  return { steps: info.steps, color: info.color, label: info[locale] }
}
