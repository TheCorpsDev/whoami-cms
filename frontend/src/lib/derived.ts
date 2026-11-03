import type { Experience, Portfolio } from '../types'

/** The job without an end date, or the most recent one. */
export function currentJob(data: Portfolio): Experience | null {
  return data.experiences.find((e) => !e.end_date) ?? data.experiences[0] ?? null
}

/** Whole months between a "YYYY-MM" start and today. */
function monthsSince(start: string): number {
  const [year, month] = start.split('-').map(Number)
  const now = new Date()
  return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
}

/** Experience counted from the earliest job, e.g. { value: "2+", unit: "years" }. */
export function experienceLength(data: Portfolio): { value: string; years: boolean } | null {
  const starts = data.experiences.map((e) => e.start_date).filter(Boolean).sort()
  if (starts.length === 0) return null
  const months = monthsSince(starts[0])
  if (months < 12) return { value: String(Math.max(1, months)), years: false }
  const years = Math.floor(months / 12)
  return { value: months % 12 ? `${years}+` : String(years), years: true }
}

/** Every distinct technology listed in the stack groups. */
export function stackSize(data: Portfolio): number {
  return new Set(data.skill_groups.flatMap((g) => g.items.map((i) => i.name))).size
}

/** Splits "text *highlighted* text" into plain and highlighted parts. */
export function highlightParts(text: string): { text: string; strong: boolean }[] {
  return text.split('*').map((part, i) => ({ text: part, strong: i % 2 === 1 })).filter((p) => p.text)
}
