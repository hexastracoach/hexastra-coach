import type { DomainRoute } from '@/lib/hexastra/types'
import { getKsDomainConfig } from '@/lib/hexastra/ks/ksRegistry'

export function getModulesForDomain(domain: DomainRoute): string[] {
  return getKsDomainConfig(domain).modules
}
