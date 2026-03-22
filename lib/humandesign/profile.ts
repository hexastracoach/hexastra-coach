/**
 * Human Design Profile — Hexastra Coach
 *
 * Deterministic calculation of the HD Profile (PersonalityLine/DesignLine).
 *
 * RÈGLE MÉTIER CRITIQUE:
 * Le profil HD doit être calculé UNIQUEMENT à partir des lignes du Personality Sun/Earth
 * et du Design Sun/Earth. Le format attendu est PersonalityLine/DesignLine (ex: "3/5").
 *
 * Rules:
 * - Never invent or guess — only read from raw API data
 * - Lines must be integers in 1–6 range
 * - `calculated` is true only when both lines are present and valid
 * - Never accept a profile from LLM inference
 *
 * Key variants handled (all known /chart/fusion response formats):
 *   human_design.profile            → "3/5"
 *   human_design.personality_line   → 3
 *   human_design.design_line        → 5
 *   human_design.personality_sun.line → 3
 *   human_design.design_sun.line    → 5
 *   humanDesign.profile             → "3/5"
 *   hd.profile / hd.profil         → "3/5"
 *   personality_line / design_line  → root-level
 *   profil_hd                       → "3/5"
 */

export type HumanDesignProfileResult = {
  /** Computed profile string e.g. "3/5". Null if data insufficient. */
  profile: string | null
  personalityLine: number | null
  designLine: number | null
  /** True only when both lines were extracted from raw data and are valid (1–6) */
  calculated: boolean
  /** Source path where data was found */
  source: string | null
  /** Raw value found for traceability */
  rawValue?: unknown
}

// ── Valid line range ─────────────────────────────────────────────────────────
const VALID_LINE = new Set([1, 2, 3, 4, 5, 6])

function isValidLine(v: unknown): v is number {
  if (typeof v === 'number' && Number.isInteger(v)) return VALID_LINE.has(v)
  if (typeof v === 'string') {
    const n = parseInt(v, 10)
    return !isNaN(n) && VALID_LINE.has(n)
  }
  return false
}

function toLine(v: unknown): number | null {
  if (typeof v === 'number' && Number.isInteger(v) && VALID_LINE.has(v)) return v
  if (typeof v === 'string') {
    const n = parseInt(v, 10)
    if (!isNaN(n) && VALID_LINE.has(n)) return n
  }
  return null
}

// ── Profile string parser (e.g. "3/5" → {personalityLine: 3, designLine: 5}) ─
function parseProfileString(raw: unknown): { personalityLine: number; designLine: number } | null {
  if (typeof raw !== 'string') return null
  const match = raw.trim().match(/^(\d)[\s/\\|](\d)$/)
  if (!match) return null
  const p = parseInt(match[1], 10)
  const d = parseInt(match[2], 10)
  if (VALID_LINE.has(p) && VALID_LINE.has(d)) return { personalityLine: p, designLine: d }
  return null
}

// ── Safe nested object access ────────────────────────────────────────────────
function safeObj(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

/**
 * Extract HD Profile lines from a /chart/fusion raw response.
 *
 * PRIORITY ORDER (règle métier — ne pas modifier sans validation):
 *   1. personality_line + design_line (lignes brutes plates)
 *   2. personality_sun.line + design_sun.line (lignes soleil imbriquées)
 *   3. profile / profil string (fallback — source la moins fiable)
 *
 * Si les lignes brutes contredisent le champ profile, les lignes gagnent
 * et un warning HD_PROFILE_CONFLICT_DETECTED est émis.
 */
export function extractHDProfileFromRaw(
  raw: Record<string, unknown> | null | undefined,
): HumanDesignProfileResult {
  if (!raw || typeof raw !== 'object') {
    console.warn('[HD_PROFILE] extractHDProfileFromRaw — raw data is null/undefined')
    return { profile: null, personalityLine: null, designLine: null, calculated: false, source: null }
  }

  console.log('[HD_PROFILE_EXTRACT] scanning raw keys', {
    topLevelKeys: Object.keys(raw).slice(0, 20),
  })

  const hdCandidateKeys = ['human_design', 'humanDesign', 'humanDesignFull', 'hd', 'HD']

  // ── Audit: collecter toutes les sources connues avant de décider ──────────
  const hdHumanDesign = safeObj(raw['humanDesign'])
  const hdHumanDesignFull = safeObj(raw['humanDesignFull'])
  const auditFirstHD = (() => {
    for (const k of hdCandidateKeys) {
      const o = safeObj(raw[k])
      if (o) return o
    }
    return null
  })()
  const auditFirstSun = auditFirstHD
    ? safeObj(auditFirstHD.personality_sun ?? auditFirstHD.personalitySun)
    : null
  const auditFirstDesignSun = auditFirstHD
    ? safeObj(auditFirstHD.design_sun ?? auditFirstHD.designSun)
    : null

  const auditLog = {
    'humanDesign.profile': hdHumanDesign?.['profile'] ?? hdHumanDesign?.['profil'],
    'humanDesignFull.profile': hdHumanDesignFull?.['profile'] ?? hdHumanDesignFull?.['profil'],
    personality_line:
      auditFirstHD?.personality_line ??
      auditFirstHD?.personalityLine ??
      raw.personality_line ??
      raw.personalityLine,
    design_line:
      auditFirstHD?.design_line ??
      auditFirstHD?.designLine ??
      raw.design_line ??
      raw.designLine,
    'personality_sun.line': auditFirstSun?.line,
    'design_sun.line': auditFirstDesignSun?.line,
  }

  console.log('[HD_PROFILE_AUDIT]', auditLog)

  // ── Helper: détecter un conflit entre lignes brutes et profile string ─────
  function detectConflict(
    computedProfile: string,
    sourceLines: string,
    profileStringRaw: unknown,
    sourceString: string,
  ): void {
    const parsed = parseProfileString(profileStringRaw)
    if (!parsed) return
    const profileStringValue = `${parsed.personalityLine}/${parsed.designLine}`
    if (profileStringValue !== computedProfile) {
      console.warn('[HD_PROFILE_CONFLICT_DETECTED]', {
        winner: computedProfile,
        source_winner: sourceLines,
        loser: profileStringValue,
        source_loser: sourceString,
        reason: 'Raw lines take priority over profile string — règle métier critique',
        audit: auditLog,
      })
    }
  }

  // ── Stratégie 1 (priorité max): personality_line + design_line plats ──────
  for (const hdKey of hdCandidateKeys) {
    const hdObj = safeObj(raw[hdKey])
    if (!hdObj) continue

    const pLine = toLine(hdObj.personality_line ?? hdObj.personalityLine ?? hdObj.personality_sun_line)
    const dLine = toLine(hdObj.design_line ?? hdObj.designLine ?? hdObj.design_sun_line)
    if (pLine && dLine) {
      const profile = `${pLine}/${dLine}`
      const source = `${hdKey}.personality_line+design_line`
      for (const profileKey of ['profile', 'profil', 'profile_hd', 'profil_hd']) {
        if (hdObj[profileKey] !== undefined) {
          detectConflict(profile, source, hdObj[profileKey], `${hdKey}.${profileKey}`)
        }
      }
      const result = { personalityLine: pLine, designLine: dLine, profile, calculated: true, source }
      console.log('[HD_PROFILE_EXTRACT] found via HD flat lines [priority 1]', result)
      return result
    }
  }

  // Root-level flat lines (priorité 1 aussi, si aucun objet HD trouvé)
  const rootPLine = toLine(raw.personality_line ?? raw.personalityLine)
  const rootDLine = toLine(raw.design_line ?? raw.designLine)
  if (rootPLine && rootDLine) {
    const profile = `${rootPLine}/${rootDLine}`
    const source = 'root.personality_line+design_line'
    const result = { personalityLine: rootPLine, designLine: rootDLine, profile, calculated: true, source }
    console.log('[HD_PROFILE_EXTRACT] found via root flat lines [priority 1]', result)
    return result
  }

  // ── Stratégie 2: personality_sun.line + design_sun.line imbriqués ─────────
  for (const hdKey of hdCandidateKeys) {
    const hdObj = safeObj(raw[hdKey])
    if (!hdObj) continue

    const personalitySun = safeObj(hdObj.personality_sun ?? hdObj.personalitySun)
    const designSun = safeObj(hdObj.design_sun ?? hdObj.designSun)
    if (personalitySun && designSun) {
      const pSunLine = toLine(personalitySun.line)
      const dSunLine = toLine(designSun.line)
      if (pSunLine && dSunLine) {
        const profile = `${pSunLine}/${dSunLine}`
        const source = `${hdKey}.personality_sun.line+design_sun.line`
        for (const profileKey of ['profile', 'profil', 'profile_hd', 'profil_hd']) {
          if (hdObj[profileKey] !== undefined) {
            detectConflict(profile, source, hdObj[profileKey], `${hdKey}.${profileKey}`)
          }
        }
        const result = { personalityLine: pSunLine, designLine: dSunLine, profile, calculated: true, source }
        console.log('[HD_PROFILE_EXTRACT] found via HD sun lines [priority 2]', result)
        return result
      }
    }
  }

  // ── Stratégie 3 (fallback): profile string dans objet HD ─────────────────
  for (const hdKey of hdCandidateKeys) {
    const hdObj = safeObj(raw[hdKey])
    if (!hdObj) continue

    for (const profileKey of ['profile', 'profil', 'profile_hd', 'profil_hd']) {
      const parsed = parseProfileString(hdObj[profileKey])
      if (parsed) {
        const result = {
          ...parsed,
          profile: `${parsed.personalityLine}/${parsed.designLine}`,
          calculated: true,
          source: `${hdKey}.${profileKey}`,
          rawValue: hdObj[profileKey],
        }
        console.log('[HD_PROFILE_EXTRACT] found via HD object profile string [priority 3 — fallback]', result)
        return result
      }
    }
  }

  // ── Stratégie 3 (fallback): profile string au niveau racine ──────────────
  for (const profileKey of ['profil_hd', 'profile_hd', 'hd_profile', 'hd_profil']) {
    const parsed = parseProfileString(raw[profileKey])
    if (parsed) {
      const result = {
        ...parsed,
        profile: `${parsed.personalityLine}/${parsed.designLine}`,
        calculated: true,
        source: profileKey,
        rawValue: raw[profileKey],
      }
      console.log('[HD_PROFILE_EXTRACT] found via root profile string [priority 3 — fallback]', result)
      return result
    }
  }

  // ── Stratégie 4: gates imbriqués — Personality Gate 1 + Design Gate 1 ────
  // Certaines APIs exposent les listes de gates plutôt que les lignes extraites
  const hdRoot = safeObj(raw.human_design)
  const gatesObj = safeObj(raw.gates ?? hdRoot?.gates)
  if (gatesObj) {
    const gate1Personality = safeObj(
      (gatesObj as Record<string, unknown>).personality_1 ??
      (gatesObj as Record<string, unknown>)['1_personality']
    )
    const gate1Design = safeObj(
      (gatesObj as Record<string, unknown>).design_1 ??
      (gatesObj as Record<string, unknown>)['1_design']
    )
    if (gate1Personality && gate1Design) {
      const pGateLine = toLine(gate1Personality.line)
      const dGateLine = toLine(gate1Design.line)
      if (pGateLine && dGateLine) {
        const result = {
          personalityLine: pGateLine,
          designLine: dGateLine,
          profile: `${pGateLine}/${dGateLine}`,
          calculated: true,
          source: 'gates.personality_1.line+design_1.line',
        }
        console.log('[HD_PROFILE_EXTRACT] found via gate lines [priority 4]', result)
        return result
      }
    }
  }

  console.warn('[HD_PROFILE_EXTRACT] could not extract HD profile from raw data', {
    availableKeys: Object.keys(raw).slice(0, 30),
    hint: 'Check /chart/fusion response structure for HD profile fields',
    audit: auditLog,
  })

  return {
    profile: null,
    personalityLine: null,
    designLine: null,
    calculated: false,
    source: null,
  }
}

/**
 * Pure function: compute HD profile from explicit line inputs.
 * Only call when personalityLine and designLine are known from the API.
 *
 * @param input.personalityLine — integer 1–6 from Personality Sun/Earth
 * @param input.designLine      — integer 1–6 from Design Sun/Earth
 */
export function computeHumanDesignProfile(input: {
  personalityLine: unknown
  designLine: unknown
}): HumanDesignProfileResult {
  const pLine = toLine(input.personalityLine)
  const dLine = toLine(input.designLine)

  if (!isValidLine(pLine) || !isValidLine(dLine)) {
    console.warn('[HD_PROFILE_COMPUTE] invalid or missing lines', {
      personalityLine: input.personalityLine,
      designLine: input.designLine,
      pLineResolved: pLine,
      dLineResolved: dLine,
    })
    return {
      profile: null,
      personalityLine: pLine,
      designLine: dLine,
      calculated: false,
      source: 'compute_direct',
    }
  }

  const profile = `${pLine}/${dLine}`
  console.log('[HD_PROFILE_COMPUTE] computed', { personalityLine: pLine, designLine: dLine, profile })

  return {
    profile,
    personalityLine: pLine,
    designLine: dLine,
    calculated: true,
    source: 'compute_direct',
  }
}

/**
 * Whether a HD profile result is reliable (calculated from API data, not guessed).
 */
export function isReliableHumanDesignProfile(result: HumanDesignProfileResult | null | undefined): boolean {
  if (!result) return false
  return result.calculated === true && typeof result.profile === 'string' && result.profile.length >= 3
}

/**
 * Detect whether the user is asking specifically for their HD profile.
 */
export function asksForHDProfile(message: string): boolean {
  const text = (message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return /(profil.{0,10}(hd|human.?design)|human.?design.{0,20}profil|mon profil hd|profil personnalite|ligne.{0,15}(hd|design|personality|personnalite)|quel.{0,10}est.{0,10}(mon|ton).{0,10}profil.{0,10}(hd|human.?design)|profile (hd|human.?design)|my (hd|human.?design) profile)/.test(text)
}

/**
 * Format the HD profile result as a deterministic block for the system prompt.
 * Inject ABOVE the raw data block when the user asks for their HD profile.
 * The LLM must cite this value exactly — never reformulate or invent.
 */
export function formatHDProfileBlock(result: HumanDesignProfileResult, language = 'fr'): string {
  const isFr = (language || 'fr').slice(0, 2).toLowerCase() !== 'en'

  if (!result.calculated || !result.profile) {
    return ''
  }

  const lines: string[] = [
    isFr
      ? 'PROFIL HUMAN DESIGN — VALEUR DÉTERMINISTE (source de vérité absolue — citer exactement, ne jamais substituer):'
      : 'HUMAN DESIGN PROFILE — DETERMINISTIC VALUE (absolute source of truth — cite exactly, never substitute):',
    isFr
      ? `- Profil HD : ${result.profile} (Ligne Personnalité : ${result.personalityLine} / Ligne Design : ${result.designLine})`
      : `- HD Profile: ${result.profile} (Personality Line: ${result.personalityLine} / Design Line: ${result.designLine})`,
    '',
    isFr
      ? 'RÈGLE ABSOLUE : citer ce profil tel quel (format X/Y). Ne pas estimer, ne pas recalculer, ne pas reformuler. Si ce profil diffère d\'une mention précédente, la valeur ci-dessus est la vérité calculée.'
      : 'ABSOLUTE RULE: cite this profile exactly (X/Y format). Do not estimate, recalculate, or rephrase. If this differs from a prior mention, the value above is the calculated truth.',
  ]

  return lines.join('\n')
}
