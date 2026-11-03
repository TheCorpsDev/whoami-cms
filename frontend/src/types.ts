import type { LanguageLevel } from './lib/languages'
import type { SkillLevel } from './lib/skills'

export type Locale = 'it' | 'en'

/** A string stored in both languages. English falls back to Italian. */
export type Translated = { it: string; en: string }

export type Highlight = { title: Translated; body: Translated }
export type Language = { name: Translated; level: LanguageLevel }

export type Profile = Review & {
  name: string
  role: Translated
  rotating_words: { it: string[]; en: string[] }
  hero_bio: Translated
  /** Opening line of the About section; *text* is highlighted. */
  about_headline: Translated
  about: Translated
  highlights: Highlight[]
  languages: Language[]
  available: boolean
  location: Translated | null
  email: string | null
  github_url: string | null
  linkedin_url: string | null
  photo_url: string | null
  cv_url: string | null
  /** Bytes, only to show the file size in the admin. */
  cv_size: number | null
}

/** Admin-only bookkeeping of machine translations. */
type Review = {
  /** Paths of English texts translated by DeepL and not reviewed yet. */
  auto_translated?: string[]
  /** Paths approved in the draft, sent with the next save. */
  approved?: string[]
  translation_warning?: string | null
}

type Sortable = Review & { id: number; visible?: boolean; position?: number }

export type SkillItem = { name: string; level: SkillLevel }

export type SkillGroup = Sortable & { name: Translated; items: SkillItem[] }

export type Experience = Sortable & {
  role: Translated
  company: string
  employment_type: Translated
  location: string | null
  start_date: string
  end_date: string | null
  hours: number | null
  description: Translated
  /** One entry per line, "Title — description". */
  highlights: Translated
  tech: string[]
}

export type ProjectCategory = 'app' | 'lib' | 'infra'

export type Project = Sortable & {
  slug: string
  name: string
  label: Translated
  category: ProjectCategory
  description: Translated
  /** One feature per line. */
  features: Translated
  tech: string[]
  repo_url: string | null
  demo_url: string | null
  package_url: string | null
  featured: boolean
}

export type Education = Sortable & {
  title: Translated
  institution: Translated
  location: string | null
  start_date: string
  end_date: string | null
  url: string | null
  grade: string | null
}

export type Certification = Sortable & {
  name: Translated
  issuer: string
  issued_at: string | null
  expires_at: string | null
  credential_id: string | null
  url: string | null
  description: Translated
}

export type Portfolio = {
  profile: Profile
  skill_groups: SkillGroup[]
  experiences: Experience[]
  projects: Project[]
  education: Education[]
  certifications: Certification[]
}

export type Message = {
  id: number
  name: string
  email: string
  body: string
  locale: Locale
  read_at: string | null
  created_at: string
}
