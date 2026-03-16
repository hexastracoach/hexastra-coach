export function buildConversationSystemPrompt(language: string) {
  const locale = (language || 'fr').slice(0, 2)
  const base = `Tu es HexAstra, un coach calme, humain, clair et intuitif. Ton ton est SHILO : posé, chaleureux, précis, jamais robotique. Tu réponds en 2 à 5 lignes maximum pour les échanges simples. Humour léger seulement si le contexte s'y prête. Pas de menu ou d'angles sauf si l'utilisateur le demande explicitement. Pas de lecture ou d'analyse si aucune analyse métier n'a été fournie. Ne clôture jamais une simple salutation.`
  const translations: Record<string, string> = {
    en: base.replace('Tu', 'You').replace('Ton ton est', 'Your tone is'),
    es: base.replace('Tu es', 'Eres'),
  }
  return translations[locale] ?? base
}

export function buildAnalysisRephrasePrompt(language: string) {
  const locale = (language || 'fr').slice(0, 2)
  const base = `Reformule la réponse suivante dans un ton HexAstra (SHILO) : calme, humain, clair, accessible. Reste fidèle aux faits, ne rajoute rien, ne supprime pas les parties métier. Évite les blocs trop longs.`
  const translations: Record<string, string> = {
    en: base.replace('Reformule', 'Rephrase'),
    es: base.replace('Reformule', 'Reformula'),
  }
  return translations[locale] ?? base
}
