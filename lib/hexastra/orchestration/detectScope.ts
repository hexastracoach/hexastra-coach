/**
 * detectScope — deterministic, zero-latency scope classifier.
 *
 * Pipeline:
 *  1. Positive taxonomy check (HEXASTRA_DOMAINS keyword match)
 *  2. Negative check (HEXASTRA_NEGATIVE_PATTERNS — hard exclusion)
 *  3. Intent + domain guard signal (classifyUserIntent + evaluateDomainGuard)
 *  4. Combine into ScopeVerdict + confidence
 *
 * Verdict rules:
 *  - negative_pattern || blocked_intent → out_of_universe
 *  - positive_taxonomy + (allowed || redirect intent) → in_universe
 *  - redirect_intent + no positive signal → ambiguous
 *  - allowed_intent + no positive signal → ambiguous (may be a generic life question)
 */

import { classifyUserIntent } from '@/lib/chat/intentClassifier'
import { evaluateDomainGuard } from '@/lib/chat/domainGuard'
import { HEXASTRA_DOMAINS, HEXASTRA_NEGATIVE_PATTERNS } from './scopeTaxonomy'
import type { ScopeResult, ScopeVerdict } from './types'

const BLOCKED_INTENTS = new Set([
  'technical_question',
  'academic_question',
  'practical_task',
  'medical_question',
  'legal_question',
])

export function detectScope(message: string): ScopeResult {
  const normalized = message.trim()

  // 1. Positive taxonomy check
  const matchedDomains: string[] = []
  const matchedKeywords: string[] = []

  for (const domain of HEXASTRA_DOMAINS) {
    for (const pattern of domain.keywords) {
      const match = normalized.match(pattern)
      if (match) {
        if (!matchedDomains.includes(domain.id)) matchedDomains.push(domain.id)
        matchedKeywords.push(match[0])
      }
    }
  }

  // 2. Negative check (hard exclusion — overrides positive signal)
  const negativeHit = HEXASTRA_NEGATIVE_PATTERNS.some((p) => p.test(normalized))

  // 3. Intent + guard signal
  const intent = classifyUserIntent(normalized)
  const guardDecision = evaluateDomainGuard(intent)
  const isBlocked = BLOCKED_INTENTS.has(intent) || guardDecision === 'blocked'
  const isRedirect = intent === 'general_assistant' || guardDecision === 'redirect'

  const reasonCodes: string[] = []

  // 4. Verdict
  let verdict: ScopeVerdict
  let confidence: number

  if (negativeHit || isBlocked) {
    verdict = 'out_of_universe'
    confidence = negativeHit ? 0.95 : 0.85
    if (negativeHit) reasonCodes.push('negative_keyword_match')
    if (isBlocked) reasonCodes.push(`blocked_intent:${intent}`)
  } else if (matchedDomains.length > 0) {
    // Positive Hexastra signal found
    verdict = 'in_universe'
    confidence = isRedirect
      ? 0.70
      : Math.min(0.95, 0.75 + matchedDomains.length * 0.05)
    reasonCodes.push('positive_taxonomy_match')
    if (isRedirect) reasonCodes.push('redirect_intent_overridden_by_taxonomy')
  } else if (isRedirect) {
    // general_assistant intent, no Hexastra keywords
    verdict = 'ambiguous'
    confidence = 0.40
    reasonCodes.push('redirect_intent_no_hexastra_signal')
  } else {
    // In-scope intent (life, relationship, career…) but no Hexastra signal
    verdict = 'ambiguous'
    confidence = 0.55
    reasonCodes.push('in_scope_intent_no_hexastra_signal')
  }

  return { verdict, confidence, matchedDomains, matchedKeywords, reasonCodes }
}
