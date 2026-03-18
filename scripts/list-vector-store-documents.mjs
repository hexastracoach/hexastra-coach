import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY
const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID

if (!apiKey) {
  throw new Error('OPENAI_API_KEY missing')
}

if (!vectorStoreId) {
  throw new Error('OPENAI_VECTOR_STORE_ID missing')
}

const client = new OpenAI({ apiKey })

function normalize(value) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function classifyDocument(filename) {
  const name = normalize(filename)

  if (
    !name ||
    name.endsWith('readme.md') ||
    name.endsWith('module.json') ||
    name.endsWith('manifest.json') ||
    name.endsWith('checksum.txt') ||
    name.endsWith('placeholder.txt') ||
    name.endsWith('license_ks_core.txt') ||
    name.endsWith('n8n_blueprint.json')
  ) {
    return { role: 'noise', science: null }
  }

  if (
    name.includes('prompt_maitre') ||
    name.includes('master_prompt') ||
    name.includes('system_prompt_full') ||
    name.includes('prompt instruction') ||
    name.includes('prompt ks fusion') ||
    name.includes('hexastra_engine_v1')
  ) {
    return { role: 'masterPrompt', science: 'global' }
  }

  if (
    name.includes('structure_de_lecture_hexastra') ||
    name.includes('strucutre de lecture hexastra') ||
    name.includes('structure_des_lectures_hexastra') ||
    name.includes('prompt structure lecture') ||
    name.includes('micro-lecture initiale')
  ) {
    return { role: 'readingStructure', science: 'global' }
  }

  if (name.includes('prompt_menu')) {
    return { role: 'menuPrompt', science: 'global' }
  }

  if (name.includes('message_acceuil')) {
    return { role: 'welcomePrompt', science: 'global' }
  }

  if (name.includes('memoire') || name.includes('memory core')) {
    return { role: 'memoryPrompt', science: 'global' }
  }

  if (
    name.includes('cartographie complete du systeme ks') ||
    name.includes('carte complete finale') ||
    name.includes('configuration systemique') ||
    name.includes('orchestrateur') ||
    name.includes('contrat de donnees unique') ||
    name.includes('format standard des schemas ks') ||
    name.includes('module de securite') ||
    name.includes('module supplementaire') ||
    name.includes('modules principaux') ||
    name.includes('prompts officiels') ||
    name.includes('knowledge core') ||
    name.includes('knowledge rag') ||
    name.includes('audit_global_ks_fusion') ||
    name.includes('contre_audit_ks_fusion') ||
    name.includes('ks_core_structure') ||
    name.includes('ks_fusion_v13-stable') ||
    name.includes('integration_map')
  ) {
    return { role: 'ksArchitecture', science: 'global' }
  }

  if (
    name.includes('prompt_astrolex') ||
    name.includes('chiron') ||
    name.includes('charte') ||
    name.includes('origine+et+definition') ||
    name.includes('astrologie')
  ) {
    return { role: 'sciencePrompt', science: 'astrologie' }
  }

  if (
    name.includes('prompt_porteum') ||
    name.includes('design humain') ||
    name.includes('sdh-systeme-du-design-humain') ||
    name.includes('croixdincarnation') ||
    name.includes('vivre de son desgin humain')
  ) {
    return { role: 'sciencePrompt', science: 'human_design' }
  }

  if (
    name.includes('prompt_neurokua') ||
    name.includes('neurokua') ||
    name.includes('prompt_neurosoma') ||
    name.includes('presence_field')
  ) {
    return { role: 'sciencePrompt', science: 'neurokua' }
  }

  if (
    name.includes('numerology') ||
    name.includes('numerologie') ||
    name.includes('divine triangle') ||
    name.includes('moment cle') ||
    name.includes('timing intelligent')
  ) {
    return { role: 'sciencePrompt', science: 'numerologie' }
  }

  if (name.includes('prompt_gps') || name.includes('kua')) {
    return { role: 'sciencePrompt', science: 'kua' }
  }

  if (name.includes('enneagram')) {
    return { role: 'sciencePrompt', science: 'enneagramme' }
  }

  if (name.includes('maslow')) {
    return { role: 'sciencePrompt', science: 'maslow' }
  }

  if (
    name.includes('kybalion') ||
    name.includes('dictionnaire-des-symboles') ||
    name.includes('flow_the_psychology') ||
    name.includes('gestalt')
  ) {
    return { role: 'referenceBook', science: 'transverse' }
  }

  return { role: 'supportingKnowledge', science: 'global' }
}

async function listAllVectorStoreFiles(id) {
  const items = []
  let after

  for (;;) {
    const page = await client.vectorStores.files.list(id, {
      limit: 100,
      ...(after ? { after } : {}),
    })

    items.push(...page.data)

    if (!page.has_more || page.data.length === 0) break

    after = page.data[page.data.length - 1]?.id
    if (!after) break
  }

  return items
}

async function listAllFiles() {
  const items = []
  let after

  for (;;) {
    const page = await client.files.list({
      limit: 100,
      ...(after ? { after } : {}),
    })

    items.push(...page.data)

    if (!page.has_more || page.data.length === 0) break

    after = page.data[page.data.length - 1]?.id
    if (!after) break
  }

  return items
}

async function resolveFilenameFromRetrieve(fileId) {
  if (!fileId) return { filename: null, retrieveError: null }

  try {
    const file = await client.files.retrieve(fileId)
    return { filename: file.filename ?? null, retrieveError: null }
  } catch (error) {
    return {
      filename: null,
      retrieveError: error instanceof Error ? error.message : 'unknown_error',
    }
  }
}

const vectorStoreFiles = await listAllVectorStoreFiles(vectorStoreId)
const allFiles = await listAllFiles()

const fileIndex = new Map(
  allFiles.map((file) => [
    file.id,
    {
      filename: file.filename ?? null,
      purpose: file.purpose ?? null,
    },
  ]),
)

const enriched = []

for (const item of vectorStoreFiles) {
  const lookupFileId = item.file_id ?? item.id ?? null
  const indexed = lookupFileId ? fileIndex.get(lookupFileId) : null
  let filename = item.filename ?? indexed?.filename ?? null
  let retrieveError = null

  if (!filename && lookupFileId) {
    const fallback = await resolveFilenameFromRetrieve(lookupFileId)
    filename = fallback.filename
    retrieveError = fallback.retrieveError
  }

  enriched.push({
    id: item.id,
    lookup_file_id: lookupFileId,
    file_id: item.file_id,
    filename,
    ...classifyDocument(filename),
    status: item.status,
    purpose: indexed?.purpose ?? null,
    last_error: item.last_error ?? null,
    retrieve_error: retrieveError,
  })
}

const byRole = Object.entries(
  enriched.reduce((acc, entry) => {
    const key = entry.role ?? 'unknown'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {}),
)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([role, count]) => ({ role, count }))

const byScience = Object.entries(
  enriched.reduce((acc, entry) => {
    const key = entry.science ?? 'none'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {}),
)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([science, count]) => ({ science, count }))

console.log(
  JSON.stringify(
    {
      vector_store_id: vectorStoreId,
      count: enriched.length,
      unresolved_filenames: enriched.filter((entry) => !entry.filename).length,
      sample_keys: vectorStoreFiles[0] ? Object.keys(vectorStoreFiles[0]).sort() : [],
      by_role: byRole,
      by_science: byScience,
      files: enriched,
    },
    null,
    2,
  ),
)
