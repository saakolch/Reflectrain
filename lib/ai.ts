import { aiProvider, env } from './env'
import { systemPrompt, userPrompt } from './prompts'
import type { Mode, Proposal, ProposalFriction, ProposalInsight, ProposalSprint, ProposalTask } from './types'

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v.trim() : fallback

const num = (v: unknown, fallback = 0.5): number => {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(1, Math.max(0, n))
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

type ChatTarget = {
  provider: 'openrouter' | 'deepseek'
  url: string
  key: string
  model: string
  headers: Record<string, string>
}

function chatTarget(): ChatTarget | null {
  if (env.openrouterKey) {
    return {
      provider: 'openrouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: env.openrouterKey,
      model: env.openrouterModel,
      headers: {
        Authorization: `Bearer ${env.openrouterKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': env.appName,
      },
    }
  }

  if (env.deepseekKey) {
    return {
      provider: 'deepseek',
      url: 'https://api.deepseek.com/chat/completions',
      key: env.deepseekKey,
      model: env.deepseekModel,
      headers: { Authorization: `Bearer ${env.deepseekKey}` },
    }
  }

  return null
}

/** Models sometimes wrap JSON in fences or add a sentence; recover the object. */
function extractJson(content: string): unknown {
  const cleaned = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
    throw new Error('Response contained no JSON object')
  }
}

async function callModel(target: ChatTarget, text: string, mode: Mode): Promise<string> {
  const base = {
    model: target.model,
    messages: [
      { role: 'system', content: systemPrompt() },
      { role: 'user', content: userPrompt(text, mode) },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  }

  async function post(withJsonMode: boolean) {
    return fetch(target.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...target.headers },
      body: JSON.stringify(withJsonMode ? { ...base, response_format: { type: 'json_object' } } : base),
      signal: AbortSignal.timeout(60_000),
    })
  }

  let res = await post(true)

  // Some providers/models reject response_format; retry once without it.
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    const body = await res.text().catch(() => '')
    if (/response_format|json_object|not supported/i.test(body)) {
      res = await post(false)
    } else {
      throw new Error(`${target.provider} ${res.status}: ${body.slice(0, 200)}`)
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${target.provider} ${res.status}: ${body.slice(0, 200)}`)
  }

  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error(`${target.provider} returned no content`)
  return content
}

function normalize(raw: unknown, mode: Mode): Proposal {
  const o = (raw ?? {}) as Record<string, unknown>

  const insights: ProposalInsight[] = arr(o.insights)
    .map((i) => {
      const r = (i ?? {}) as Record<string, unknown>
      return {
        statement: str(r.statement),
        practice: str(r.practice),
        cue: str(r.cue),
        evidence_question: str(r.evidence_question),
        confidence: num(r.confidence),
      }
    })
    .filter((i) => i.statement.length > 0)
    .slice(0, 3)

  const tasks: ProposalTask[] = arr(o.tasks)
    .map((t) => {
      const r = (t ?? {}) as Record<string, unknown>
      const hint = str(r.due_hint).toLowerCase()
      const due_hint: ProposalTask['due_hint'] =
        hint === 'today' ? 'today' : hint === 'someday' ? 'someday' : 'this week'
      return { title: str(r.title), next_action: str(r.next_action), due_hint }
    })
    .filter((t) => t.title.length > 0)
    .slice(0, 6)

  const tags = ['cognitive', 'emotional', 'environmental', 'relational']
  const friction: ProposalFriction[] = arr(o.friction)
    .map((f) => {
      const r = (f ?? {}) as Record<string, unknown>
      const tag = str(r.tag).toLowerCase()
      return {
        text: str(r.text),
        tag: (tags.includes(tag) ? tag : 'cognitive') as ProposalFriction['tag'],
      }
    })
    .filter((f) => f.text.length > 0)
    .slice(0, 6)

  const energyRaw = (o.energy ?? null) as Record<string, unknown> | null
  const energy = energyRaw ? { note: str(energyRaw.note), pattern: str(energyRaw.pattern) } : null

  const identity_signals = arr(o.identity_signals)
    .map((s) => {
      const r = (s ?? {}) as Record<string, unknown>
      return { claim: str(r.claim), evidence: str(r.evidence) }
    })
    .filter((s) => s.claim.length > 0)
    .slice(0, 1)

  let sprint: ProposalSprint | null = null
  if (mode === 'weekly' && o.sprint) {
    const s = o.sprint as Record<string, unknown>
    const outputs = arr(s.outputs)
      .map((x) => str(x))
      .filter(Boolean)
      .slice(0, 3)
    sprint = {
      goal: str(s.goal),
      outputs,
      experiment: str(s.experiment),
      stop: str(s.stop),
      protect: str(s.protect),
      progress: str(s.progress),
      resistance: str(s.resistance),
      changes: str(s.changes),
    }
  }

  return {
    summary: str(o.summary, 'Structured dump'),
    insights,
    tasks,
    friction,
    energy,
    identity_signals,
    sprint,
    question: str(o.question) || null,
  }
}

/** Deterministic fallback so the loop stays testable without any API key. */
export function mockProposal(text: string, mode: Mode): Proposal {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)

  const first = sentences[0] || text.slice(0, 120).trim() || 'Empty dump'
  const second = sentences[1] || ''

  const insights: ProposalInsight[] = [
    {
      statement: `"${first.slice(0, 140)}"`,
      practice: 'Write the next physical action, then do only that for 10 minutes.',
      cue: 'Before starting any drive task',
      evidence_question: 'Did I do the 10 minutes? What got in the way?',
      confidence: 0.4,
    },
  ]
  if (second) {
    insights.push({
      statement: `"${second.slice(0, 140)}"`,
      practice: 'Name the friction out loud before switching tasks.',
      cue: 'When focus breaks',
      evidence_question: 'Which friction did I name, and what changed?',
      confidence: 0.3,
    })
  }

  return {
    summary: 'MOCK structure (no AI key): 2 insights and 1 task derived from the first lines.',
    insights,
    tasks: [
      {
        title: first.slice(0, 80),
        next_action: 'Open the document and write one sentence.',
        due_hint: 'this week',
      },
    ],
    friction: [],
    energy: null,
    identity_signals: [],
    sprint:
      mode === 'weekly'
        ? {
            goal: 'One concrete result this week',
            outputs: ['Output 1', 'Output 2', 'Output 3'],
            experiment: '2-minute action card before each drive task',
            stop: 'Scrolling after 23:00',
            protect: 'Two meditation blocks',
            progress: first.slice(0, 300),
            resistance: second.slice(0, 300),
            changes: 'Make the next step physical before starting.',
          }
        : null,
    question: null,
  }
}

export async function analyze(text: string, mode: Mode): Promise<Proposal> {
  const target = chatTarget()
  if (!target) return { ...mockProposal(text, mode), provider: 'mock' }

  try {
    const content = await callModel(target, text, mode)
    const proposal = normalize(extractJson(content), mode)
    return { ...proposal, provider: `${target.provider} · ${target.model}` }
  } catch (error) {
    console.error('[analyze] model call failed, using mock:', error)
    const fallback = mockProposal(text, mode)
    fallback.summary = `AI call failed (${error instanceof Error ? error.message : 'unknown'}), mock structure used. ${fallback.summary}`
    return { ...fallback, provider: 'mock' }
  }
}

export { aiProvider }
