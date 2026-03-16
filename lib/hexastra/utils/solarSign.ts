const SIGN_NAMES = [
  'Capricorne',
  'Verseau',
  'Poissons',
  'Bélier',
  'Taureau',
  'Gémeaux',
  'Cancer',
  'Lion',
  'Vierge',
  'Balance',
  'Scorpion',
  'Sagittaire',
]

const SIGN_BOUNDARIES = [
  { month: 1, day: 20 },
  { month: 2, day: 19 },
  { month: 3, day: 21 },
  { month: 4, day: 20 },
  { month: 5, day: 21 },
  { month: 6, day: 21 },
  { month: 7, day: 23 },
  { month: 8, day: 23 },
  { month: 9, day: 23 },
  { month: 10, day: 23 },
  { month: 11, day: 22 },
  { month: 12, day: 22 },
]

export type SolarSign =
  | 'Bélier'
  | 'Taureau'
  | 'Gémeaux'
  | 'Cancer'
  | 'Lion'
  | 'Vierge'
  | 'Balance'
  | 'Scorpion'
  | 'Sagittaire'
  | 'Capricorne'
  | 'Verseau'
  | 'Poissons'

export function getSolarSignFromDate(dateStr?: string | null): SolarSign | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const month = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  let signIndex = SIGN_BOUNDARIES.findIndex((b) =>
    month === b.month && day >= b.day
  )
  if (signIndex === -1) {
    signIndex = SIGN_BOUNDARIES.findIndex((b, i) => {
      const next = SIGN_BOUNDARIES[i + 1]
      const endMonth = next ? next.month : 1
      const endDay = next ? next.day - 1 : 31
      return month === b.month && day >= b.day && (month < endMonth || day <= endDay)
    })
  }
  if (signIndex === -1) {
    // Before Jan 20 => Capricorne
    return 'Capricorne'
  }
  return SIGN_NAMES[signIndex] as SolarSign
}

export const SOLAR_SIGN_CLOSURES: Record<SolarSign | 'Neutre', string> = {
  Bélier: "Avec gratitude, que cette lecture ravive ton cap intérieur et t'aide à avancer avec courage, cœur ouvert et lumière assumée.",
  Taureau: "Avec gratitude, que cette lecture ravive ta boussole intérieure et t'aide à avancer avec calme, confiance et lumière assumée.",
  Gémeaux: "Avec gratitude, que cette lecture éclaire ta boussole intérieure et t'aide à avancer avec souplesse, clarté et lumière assumée.",
  Cancer: "Avec gratitude, que cette lecture ravive ta boussole intérieure et t'aide à marcher avec douceur, cœur ouvert et lumière assumée.",
  Lion: "Avec gratitude, que cette lecture ravive ton feu intérieur et t'aide à marcher avec fierté, cœur ouvert et lumière assumée.",
  Vierge: "Avec gratitude, que cette lecture affine ta boussole intérieure et t'aide à avancer avec justesse, cœur ouvert et lumière assumée.",
  Balance: "Avec gratitude, que cette lecture réaccorde ta boussole intérieure et t'aide à avancer avec harmonie, cœur ouvert et lumière assumée.",
  Scorpion: "Avec gratitude, que cette lecture ravive ta vérité intérieure et t'aide à marcher avec profondeur, cœur ouvert et lumière assumée.",
  Sagittaire: "Avec gratitude, que cette lecture ravive ton élan intérieur et t'aide à avancer avec confiance, cœur ouvert et lumière assumée.",
  Capricorne: "Avec gratitude, que cette lecture renforce ta boussole intérieure et t'aide à avancer avec solidité, cœur ouvert et lumière assumée.",
  Verseau: "Avec gratitude, que cette lecture éclaire ta voie intérieure et t'aide à marcher avec liberté, cœur ouvert et lumière assumée.",
  Poissons: "Avec gratitude, que cette lecture ravive ton guidage intérieur et t'aide à avancer avec douceur, cœur ouvert et lumière assumée.",
  Neutre: "Avec gratitude, que cette lecture ravive ta boussole intérieure et t'aide à avancer avec justesse, cœur ouvert et lumière assumée.",
}
