export type Mode = 'daily' | 'weekly'

export type ProposalInsight = {
  statement: string
  practice: string
  cue: string
  evidence_question: string
  confidence: number
}

export type ProposalTask = {
  title: string
  next_action: string
  due_hint: 'today' | 'this week' | 'someday'
}

export type ProposalFriction = {
  text: string
  tag: 'cognitive' | 'emotional' | 'environmental' | 'relational'
}

export type ProposalSprint = {
  goal: string
  outputs: string[]
  experiment: string
  stop: string
  protect: string
  progress: string
  resistance: string
  changes: string
}

export type Proposal = {
  summary: string
  insights: ProposalInsight[]
  tasks: ProposalTask[]
  friction: ProposalFriction[]
  energy: { note: string; pattern: string } | null
  identity_signals: { claim: string; evidence: string }[]
  sprint: ProposalSprint | null
  question: string | null
  /** which model produced this, e.g. "openrouter · deepseek/deepseek-v4-flash" or "mock" */
  provider?: string
}

export type EvidenceEntry = {
  date: string
  note: string
  rating?: number
}

export type SaveInput = {
  text: string
  mode: Mode
  summary: string
  insights: ProposalInsight[]
  tasks: ProposalTask[]
  proposal: Proposal
}

export type InsightRow = {
  id: string
  statement: string
  status: 'seed' | 'active' | 'practicing' | 'embodied' | 'retired'
  practice: string | null
  cue: string | null
  evidence_question: string | null
  evidence: EvidenceEntry[]
  counter_evidence: EvidenceEntry[]
  created_at: string
}

export type TaskRow = {
  id: string
  title: string
  next_action: string | null
  due: string | null
  done: boolean
  insight_id: string | null
  sprint_id: string | null
}

export type SprintRow = {
  id: string
  week_start: string
  goal: string | null
  outputs: string[]
  experiment: string | null
  stop: string | null
  protect: string | null
  progress: string | null
  resistance: string | null
  changes: string | null
}

export type ClaimAction = {
  text: string
  evidence: EvidenceEntry[]
}

export type ClaimRow = {
  id: string
  claim: string
  status: 'active' | 'embodied'
  confidence: number
  actions: ClaimAction[]
  counter_evidence: EvidenceEntry[]
  created_at: string
}
