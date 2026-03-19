import type { Lang } from '@/lib/i18n/config'
import type { PlanKey } from '@/lib/plans'

export type { Lang, PlanKey }

export type PractitionerUsage = 'personal' | 'client' | null

/** Keys track whether each micro-reading is current and valid */
export type MicroReadings = {
  profileKey: string | null  // hash of birth data — regenerate if changes
  yearKey: string | null     // "YYYY" — regenerate each year
  monthKey: string | null    // "YYYY-MM" — regenerate each month
}

export type BootstrapStep =
  | 'loading'                     // waiting for plan from Supabase
  | 'practitioner_usage_needed'   // ask personal vs client (practitioner plan only)
  | 'analysis_mode_selection'     // ask science-by-science vs fusion (essentiel/premium/praticien)
  | 'render_mode_selection'       // ask simple/approfondie/synthèse praticien (praticien only)
  | 'birthdata_missing'           // show inline birth form
  | 'micro_profile_pending'       // auto-generate micro-profil
  | 'micro_year_pending'          // auto-generate micro-année
  | 'micro_month_pending'         // auto-generate micro-mois
  | 'conversation_ready'          // normal chat

export const MICRO_READINGS_STORAGE_KEY = 'hexastra.micro.v1'
export const PRACTITIONER_USAGE_KEY = 'hexastra.practitioner.usage'
export const ANALYSIS_MODE_KEY = 'hexastra.analysis.mode'
export const RENDER_MODE_KEY = 'hexastra.render.mode'
export const BIRTH_AUTO_INTRO_STORAGE_KEY = 'hexastra.birthIntro.completed.v1'
