export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  deepseekKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  openrouterKey: process.env.OPENROUTER_API_KEY || '',
  // harness ids look like "openrouter/deepseek/deepseek-v4-flash"; the API wants "deepseek/deepseek-v4-flash"
  openrouterModel: (
    process.env.OPENROUTER_MODEL ||
    process.env.HARNESS_MODEL_ID_OPENROUTER ||
    'deepseek/deepseek-v4-flash'
  ).replace(/^openrouter\//, ''),
  appName: process.env.APP_NAME || 'sprint_ai',
  aiLang: (process.env.AI_LANG || 'en').toLowerCase(),
}

export type AiProvider = 'openrouter' | 'deepseek' | 'mock'

export function aiProvider(): AiProvider {
  if (env.openrouterKey) return 'openrouter'
  if (env.deepseekKey) return 'deepseek'
  return 'mock'
}

export function isAIConfigured(): boolean {
  return aiProvider() !== 'mock'
}

export function isConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnon)
}

export function missingKeys(): string[] {
  const missing: string[] = []
  if (!env.supabaseUrl) missing.push('SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL')
  if (!env.supabaseAnon) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return missing
}
