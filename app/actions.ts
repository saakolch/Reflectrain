'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { EvidenceEntry, SaveInput } from '@/lib/types'

const today = () => new Date().toISOString().slice(0, 10)

function weekStart(date = new Date()): string {
  const d = new Date(date)
  const shift = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - shift)
  return d.toISOString().slice(0, 10)
}

function dueFor(hint: string): string | null {
  if (hint === 'today') return today()
  if (hint === 'this week') {
    const d = new Date(weekStart())
    d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0, 10)
  }
  return null
}

async function db() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  return supabase
}

function revalidateAll() {
  revalidatePath('/dump')
  revalidatePath('/insights')
  revalidatePath('/plan')
  revalidatePath('/self')
}

export async function saveProposal(input: SaveInput) {
  const supabase = await db()

  const { data: dump, error } = await supabase
    .from('dumps')
    .insert({
      kind: input.mode,
      raw_text: input.text,
      ai: {
        summary: input.summary,
        friction: input.proposal.friction,
        energy: input.proposal.energy,
        identity_signals: input.proposal.identity_signals,
        question: input.proposal.question,
      },
    })
    .select('id')
    .single()

  if (error || !dump) return { ok: false, error: error?.message ?? 'Could not save the dump' }

  if (input.insights.length) {
    const { error: insightsError } = await supabase.from('insights').insert(
      input.insights.map((i) => ({
        statement: i.statement,
        practice: i.practice || null,
        cue: i.cue || null,
        evidence_question: i.evidence_question || null,
        source_dump: dump.id,
        status: 'active',
      }))
    )
    if (insightsError) return { ok: false, error: insightsError.message }
  }

  let sprintId: string | null = null

  if (input.mode === 'weekly' && input.proposal.sprint) {
    const s = input.proposal.sprint
    const { data: sprint, error: sprintError } = await supabase
      .from('sprints')
      .upsert(
        {
          week_start: weekStart(),
          goal: s.goal || null,
          outputs: s.outputs,
          experiment: s.experiment || null,
          stop: s.stop || null,
          protect: s.protect || null,
          progress: s.progress || null,
          resistance: s.resistance || null,
          changes: s.changes || null,
        },
        { onConflict: 'user_id,week_start' }
      )
      .select('id')
      .single()

    if (sprintError) return { ok: false, error: sprintError.message }
    sprintId = sprint?.id ?? null
  }

  const taskRows = [
    ...input.tasks.map((t) => ({
      title: t.title,
      next_action: t.next_action || null,
      due: dueFor(t.due_hint),
      source_dump: dump.id,
      sprint_id: null,
    })),
    ...(sprintId && input.proposal.sprint
      ? input.proposal.sprint.outputs
          .filter((o) => o.trim().length > 0)
          .map((o) => ({
            title: o,
            next_action: null,
            due: null,
            source_dump: dump.id,
            sprint_id: sprintId,
          }))
      : []),
  ]

  if (taskRows.length) {
    const { error: taskError } = await supabase.from('tasks').insert(taskRows)
    if (taskError) return { ok: false, error: taskError.message }
  }

  revalidateAll()
  return { ok: true }
}

export async function logEvidence(formData: FormData) {
  const supabase = await db()
  const id = String(formData.get('id') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  if (!id || !note) return

  const { data: row } = await supabase.from('insights').select('evidence').eq('id', id).single()
  const evidence: EvidenceEntry[] = Array.isArray(row?.evidence) ? (row.evidence as EvidenceEntry[]) : []
  evidence.push({ date: today(), note })

  await supabase.from('insights').update({ evidence }).eq('id', id)
  revalidatePath('/insights')
}

export async function addCounterEvidence(formData: FormData) {
  const supabase = await db()
  const id = String(formData.get('id') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  if (!id || !note) return

  const { data: row } = await supabase.from('insights').select('counter_evidence').eq('id', id).single()
  const counter: EvidenceEntry[] = Array.isArray(row?.counter_evidence)
    ? (row.counter_evidence as EvidenceEntry[])
    : []
  counter.push({ date: today(), note })

  await supabase.from('insights').update({ counter_evidence: counter }).eq('id', id)
  revalidatePath('/insights')
}

export async function makePractice(formData: FormData) {
  const supabase = await db()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { data: insight } = await supabase
    .from('insights')
    .select('practice, cue, statement')
    .eq('id', id)
    .single()

  if (!insight?.practice) return

  await supabase.from('tasks').insert({
    title: insight.practice,
    next_action: insight.cue ? `cue: ${insight.cue}` : null,
    insight_id: id,
    due: dueFor('this week'),
  })
  await supabase.from('insights').update({ status: 'practicing' }).eq('id', id)

  revalidatePath('/insights')
  revalidatePath('/plan')
}

export async function setInsightStatus(formData: FormData) {
  const supabase = await db()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['active', 'practicing', 'embodied', 'retired'].includes(status)) return

  await supabase.from('insights').update({ status }).eq('id', id)
  revalidatePath('/insights')
}

export async function toggleTask(formData: FormData) {
  const supabase = await db()
  const id = String(formData.get('id') ?? '')
  const done = formData.get('done') === 'true'
  if (!id) return

  await supabase.from('tasks').update({ done: !done }).eq('id', id)
  revalidatePath('/plan')
  revalidatePath('/dump')
}

export async function addClaim(formData: FormData) {
  const supabase = await db()
  const claim = String(formData.get('claim') ?? '').trim()
  if (!claim) return

  const actions = ['a1', 'a2', 'a3']
    .map((k) => String(formData.get(k) ?? '').trim())
    .filter(Boolean)
    .map((text) => ({ text, evidence: [] as EvidenceEntry[] }))

  await supabase.from('identity').insert({ claim, actions, confidence: 0 })
  revalidatePath('/self')
}

export async function addClaimEvidence(formData: FormData) {
  const supabase = await db()
  const id = String(formData.get('id') ?? '')
  const index = Number(formData.get('index') ?? -1)
  const note = String(formData.get('note') ?? '').trim()
  if (!id || Number.isNaN(index) || index < 0 || !note) return

  const { data: row } = await supabase.from('identity').select('actions').eq('id', id).single()
  if (!row || !Array.isArray(row.actions)) return

  const actions = row.actions as { text: string; evidence: EvidenceEntry[] }[]
  if (!actions[index]) return

  actions[index].evidence = [
    ...(actions[index].evidence ?? []),
    { date: today(), note },
  ]

  const total = actions.reduce((sum, a) => sum + (a.evidence?.length ?? 0), 0)
  const confidence = Math.min(90, total * 20)

  await supabase.from('identity').update({ actions, confidence }).eq('id', id)
  revalidatePath('/self')
}

export async function promoteClaim(formData: FormData) {
  const supabase = await db()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase.from('identity').update({ status: 'embodied', confidence: 100 }).eq('id', id)
  revalidatePath('/self')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
