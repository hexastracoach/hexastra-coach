type SynonymEntry = readonly [from: string, to: string]

const PLURAL_EXCEPTIONS = new Set([
  'asc',
  'bg5',
  'chiron',
  'dsc',
  'hd',
  'ic',
  'ks',
  'kua',
  'lilith',
  'mars',
  'mc',
  'so',
  'sp',
  'sx',
  'uranus',
  'venus',
])

function normalizeSimplePluralToken(token: string): string {
  if (!token || PLURAL_EXCEPTIONS.has(token) || token.length <= 4 || /\d/.test(token)) {
    return token
  }

  if (token.endsWith('ss') || token.endsWith('us') || token.endsWith('is') || token.endsWith('aux')) {
    return token
  }

  if (token.endsWith('es') && token.length > 5) {
    return token.slice(0, -1)
  }

  if (token.endsWith('s')) {
    return token.slice(0, -1)
  }

  return token
}

export function normalizeText(text: string): string {
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`´]/g, "'")
    .replace(/[-–—/]/g, ' ')
    .replace(/&/g, ' et ')
    .replace(/'/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) {
    return ''
  }

  return cleaned
    .split(' ')
    .map(normalizeSimplePluralToken)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const RAW_SYNONYM_ENTRIES: SynonymEntry[] = [
  ['theme astral', 'theme natal'],
  ['carte astrale', 'theme natal'],
  ['charte astrale', 'theme natal'],
  ['transits du moment', 'transits actuels'],
  ['transit du moment', 'transit actuel'],
  ['energie du moment astro', 'transits actuels'],
  ['ce que je traverse astro', 'transits actuels'],
  ['asc', 'ascendant'],
  ['mc', 'milieu du ciel'],
  ['ic', 'fond du ciel'],
  ['dsc', 'descendant'],
  ['big3', 'big 3'],
  ['big three', 'big 3'],
  ['retour saturne', 'retour de saturne'],
  ['saturn return', 'retour de saturne'],
  ['saturne return', 'retour de saturne'],
  ['solar return', 'retour solaire'],
  ['lunar return', 'retour lunaire'],
  ['astrocarto', 'astrocartographie'],
  ['t square', 't carre'],
  ['grand trigone', 'grand trine'],
  ['annee perso', 'annee personnelle'],
  ['annee perso 2026', 'annee personnelle 2026'],
  ['mois perso', 'mois personnel'],
  ['jour perso', 'jour personnel'],
  ['vibration prenom', 'vibration du prenom'],
  ['numero maison', 'numero de maison'],
  ['maison numero', 'numero de maison'],
  ['dette karma', 'dette karmique'],
  ['num entreprise', 'nom d entreprise'],
  ['heures miroir', 'heure miroir'],
  ['nombres miroir', 'heure miroir'],
  ['chiffres qui reviennent', 'heure miroir'],
  ['je vois souvent', 'heure miroir'],
  ['design humain', 'human design'],
  ['humain design', 'human design'],
  ['human desing', 'human design'],
  ['hd', 'human design'],
  ['mon hd', 'mon human design'],
  ['chart hd', 'bodygraph'],
  ['gates', 'portes'],
  ['channels', 'canaux'],
  ['centers', 'centres'],
  ['open center', 'centre ouvert'],
  ['open centers', 'centres ouverts'],
  ['undefined center', 'centre non defini'],
  ['undefined centers', 'centres non definis'],
  ['incarnation cross', 'croix d incarnation'],
  ['cross', 'croix d incarnation'],
  ['not self', 'non soi'],
  ['not self theme', 'theme du non soi'],
  ['not self', 'theme du non soi'],
  ['phs', 'variables hd'],
  ['primary health system', 'variables hd'],
  ['ennea', 'enneagramme'],
  ['enneagram', 'enneagramme'],
  ['enneagrame', 'enneagramme'],
  ['wing', 'aile'],
  ['wings', 'ailes'],
  ['sp', 'instinct de conservation'],
  ['so', 'instinct social'],
  ['sx', 'instinct sexuel'],
  ['auto conservation', 'instinct de conservation'],
  ['autoconservation', 'instinct de conservation'],
  ['sous type', 'instinct'],
  ['counter phobic', 'contre phobique'],
  ['disintegration', 'desintegration'],
  ['integration', 'integration'],
  ['feng shui perso', 'kua'],
  ['feng shui personnel', 'kua'],
  ['numero kua', 'nombre kua'],
  ['ou dormir', 'orientation du lit'],
  ['ou placer mon lit', 'orientation du lit'],
  ['ou placer mon bureau', 'orientation du bureau'],
  ['quelle direction pour travailler', 'orientation du bureau'],
  ['pourquoi ca bloque', 'je bloque'],
  ['je stagne', 'je bloque'],
  ['rien ne change', 'je bloque'],
  ['rien n avance', 'je bloque'],
  ['que faire', 'que dois je faire'],
  ['que faire maintenant', 'que dois je faire maintenant'],
  ['bon moment', 'quel est le bon moment'],
  ['bonne periode', 'quel est le bon moment'],
  ['periode de transition', 'phase de transition'],
  ['numerlogie', 'numerologie'],
]

export const SYNONYM_MAP = RAW_SYNONYM_ENTRIES
  .map(([from, to]) => [normalizeText(from), normalizeText(to)] as const)
  .filter(([from, to]) => Boolean(from) && Boolean(to))
  .sort((a, b) => b[0].length - a[0].length)

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceWholeTerm(text: string, from: string, to: string): string {
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(from)}(?=\\s|$)`, 'g')
  return text.replace(pattern, (_match, prefix: string) => `${prefix}${to}`)
}

export function applySynonyms(normalizedText: string): string {
  let result = normalizedText

  for (const [from, to] of SYNONYM_MAP) {
    if (!from || from === to || !result.includes(from)) {
      continue
    }

    result = replaceWholeTerm(result, from, to)
      .replace(/\s+/g, ' ')
      .trim()
  }

  return result
}

export function prepareQuery(raw: string): string {
  if (!raw) {
    return ''
  }

  return normalizeText(applySynonyms(normalizeText(raw)))
}
