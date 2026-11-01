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

async function callModel(target: ChatTarget, text: string, mode: Mode, strict = false): Promise<string> {
  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: systemPrompt() },
    { role: 'user', content: userPrompt(text, mode) },
  ]

  if (strict) {
    messages.push({
      role: 'user',
      content:
        'Return ONLY valid JSON, no prose. Keep every string under 160 characters, at most 3 insights, 4 tasks and 5 friction entries.',
    })
  }

  const base = {
    model: target.model,
    messages,
    temperature: strict ? 0.2 : 0.3,
    max_tokens: strict ? 6000 : 4000,
  }

  async function post(body: unknown) {
    return fetch(target.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...target.headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    })
  }

  async function parse(res: Response): Promise<string> {
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`${target.provider} ${res.status}: ${body.slice(0, 200)}`)
    }
    const payload = (await res.json()) as {
      choices?: { message?: { content?: string | null }; finish_reason?: string }[]
      error?: { message?: string }
    }
    if (payload.error?.message) throw new Error(`${target.provider}: ${payload.error.message}`)

    const choice = payload.choices?.[0]
    // A cut-off answer is invalid JSON; retry in strict mode instead of storing garbage.
    if (choice?.finish_reason === 'length') {
      throw new Error(`${target.provider} truncated the response (finish_reason=length)`)
    }

    return (choice?.message?.content ?? '').trim()
  }

  let res = await post({ ...base, response_format: { type: 'json_object' } })

  // Some providers/models reject response_format; retry once without it.
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    const body = await res.text().catch(() => '')
    if (/response_format|json_object|not supported/i.test(body)) {
      res = await post(base)
    } else {
      throw new Error(`${target.provider} ${res.status}: ${body.slice(0, 200)}`)
    }
  }

  let content = await parse(res)

  // Reasoning models sometimes burn the whole budget thinking and return empty content.
  if (!content) {
    const retry = await post({
      ...base,
      max_tokens: 6000,
      temperature: 0.2,
      messages: [
        ...base.messages,
        { role: 'user', content: 'Return only the JSON object now. No prose, no reasoning.' },
      ],
      response_format: { type: 'json_object' },
    })
    content = await parse(retry)
  }

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
      // models drift: "text" today, "description" or "obstacle" tomorrow
      if (typeof f === 'string') {
        return { text: f.trim(), tag: 'cognitive' as ProposalFriction['tag'] }
      }
      const r = (f ?? {}) as Record<string, unknown>
      const tag = str(r.tag).toLowerCase()
      return {
        text: str(r.text) || str(r.description) || str(r.obstacle) || str(r.note),
        tag: (tags.includes(tag) ? tag : 'cognitive') as ProposalFriction['tag'],
      }
    })
    .filter((f) => f.text.length > 0)
    .slice(0, 6)

  const energyRaw = o.energy
  const energy =
    energyRaw && typeof energyRaw === 'object'
      ? {
          note: str((energyRaw as Record<string, unknown>).note),
          pattern: str((energyRaw as Record<string, unknown>).pattern),
        }
      : typeof energyRaw === 'string' && energyRaw.trim()
        ? { note: energyRaw.trim(), pattern: '' }
        : null

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
    // some models nest the review text under "review"
    const review = (s.review ?? {}) as Record<string, unknown>
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
      progress: str(s.progress) || str(review.progress),
      resistance: str(s.resistance) || str(review.resistance),
      changes: str(s.changes) || str(review.changes),
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

  let lastError: unknown = null

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const content = await callModel(target, text, mode, attempt > 1)
      if (process.env.AI_DEBUG === '1') {
        console.log(`[analyze] attempt ${attempt} raw:`, content.slice(0, 3000))
      }
      const proposal = normalize(extractJson(content), mode)
      return { ...proposal, provider: `${target.provider} · ${target.model}` }
    } catch (error) {
      lastError = error
      console.error(`[analyze] attempt ${attempt} failed:`, error)
    }
  }

  const fallback = mockProposal(text, mode)
  fallback.summary = `AI call failed (${lastError instanceof Error ? lastError.message : 'unknown'}), mock structure used. ${fallback.summary}`
  return { ...fallback, provider: 'mock' }
}

export { aiProvider }
