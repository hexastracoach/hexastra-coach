import { getModeForPlan } from '@/lib/hexastra/config/planModeMap'
import { getKsSelectionExecutionContract } from '@/lib/hexastra/ks/ksRegistry'
import { findMenuItem, getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'
import type { DomainRoute } from '@/lib/hexastra/types'
import type { PlanKey } from '@/types/subscription'
import type { DepthRequested, MenuContract, MenuDataRequirement } from './types'

function inferRole(key: string): string {
  if (key === 'science' || key.startsWith('science_')) return 'science'
  if (key.startsWith('pract_')) return 'practitioner'
  return 'theme'
}

function inferDataRequirement(route: DomainRoute, key: string): MenuDataRequirement {
  if (/theme|natal|astral|astrolex|porteum|human|numerologie|triangle|neurokua|kua|timing/i.test(key)) {
    return 'birth_basic'
  }
  if (route === 'fusion' || route === 'science' || route === 'timing' || route === 'neurokua' || route === 'gps_kua') {
    return 'birth_basic'
  }
  return 'none'
}

function inferMaxDepth(key: string): DepthRequested {
  if (key.startsWith('science_') || key.startsWith('pract_')) return 'deep'
  return 'guided'
}

export function resolveMenuContract(params: {
  plan: PlanKey
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
}): MenuContract | null {
  const mode = getModeForPlan(params.plan)
  const menuItems = getMenuForMode(mode)
  const selectedMenu = findMenuItem(menuItems, params.selectedMenuKey)
  const selectedSubmenu =
    selectedMenu && params.selectedSubmenuKey
      ? findMenuItem(selectedMenu.submenu ?? [], params.selectedSubmenuKey)
      : null

  const active = selectedSubmenu ?? selectedMenu
  if (!active) return null

  const executionContract =
    getKsSelectionExecutionContract(selectedSubmenu?.key ?? selectedMenu?.key ?? null)

  const route = active.domainRoute ?? selectedMenu?.domainRoute ?? 'general'
  const key = active.key
  const planCompatibility: PlanKey[] =
    key.startsWith('pract_') ? ['practitioner'] : ['free', 'essential', 'premium', 'practitioner']

  return {
    id: key,
    parentId: selectedSubmenu ? selectedMenu?.key ?? null : null,
    role: inferRole(key),
    contextType: active.contextType,
    route,
    maxDepth: inferMaxDepth(key),
    dataRequirement: inferDataRequirement(route, key),
    outputStructure: executionContract?.outputStructure ?? null,
    contextFrame: executionContract?.contextFrame ?? active.label ?? null,
    clarificationQuestion: executionContract?.clarificationQuestion ?? null,
    promptHint: executionContract?.promptHint ?? active.promptHint ?? null,
    planCompatibility,
    fallbackBehavior: ['soft_text', 'menu_redirect'],
  }
}
