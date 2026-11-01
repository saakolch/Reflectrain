'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveProposal } from '@/app/actions'
import type { Mode, Proposal } from '@/lib/types'

const DRAFT_KEY = 'sprint_ai_draft'

export default function DumpComposer({
  aiReady,
  initialMode = 'daily',
}: {
  aiReady: boolean
  initialMode?: Mode
}) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [mode, setMode] = useState<Mode>(initialMode)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [pickedInsights, setPickedInsights] = useState<boolean[]>([])
  const [pickedTasks, setPickedTasks] = useState<boolean[]>([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) setText(draft)
  }, [])

  useEffect(() => {
    if (text) localStorage.setItem(DRAFT_KEY, text)
    else localStorage.removeItem(DRAFT_KEY)
  }, [text])

  async function analyze() {
    setBusy(true)
    setError('')
    setProposal(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Analyze failed')
      } else {
        const p = data as Proposal
        setProposal(p)
        setPickedInsights(p.insights.map(() => true))
        setPickedTasks(p.tasks.map(() => true))
      }
    } catch {
      setError('Network error while analyzing.')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!proposal) return
    setSaving(true)
    setError('')

    const insights = proposal.insights.filter((_, i) => pickedInsights[i])
    const tasks = proposal.tasks.filter((_, i) => pickedTasks[i])
    const kept = insights.length + tasks.length

    if (kept === 0 && !proposal.sprint) {
      setError('Tick at least one item, or dismiss.')
      setSaving(false)
      return
    }

    const res = await saveProposal({ text, mode, summary: proposal.summary, insights, tasks, proposal })

    if (!res.ok) {
      setError(res.error ?? 'Save failed')
    } else {
      setText('')
      localStorage.removeItem(DRAFT_KEY)
      setProposal(null)
      setToast('saved')
      router.refresh()
      setTimeout(() => setToast(''), 2200)
    }
    setSaving(false)
  }

  const kept = pickedInsights.filter(Boolean).length + pickedTasks.filter(Boolean).length

  return (
    <>
      <div className="editor">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dump it. Whatever is in the head — no structure needed."
          autoFocus
        />
      </div>

      <div className="seg">
        <button type="button" className={mode === 'daily' ? 'on' : ''} onClick={() => setMode('daily')}>
          daily
        </button>
        <button type="button" className={mode === 'weekly' ? 'on' : ''} onClick={() => setMode('weekly')}>
          weekly
        </button>
      </div>

      <button className="btn" onClick={analyze} disabled={busy || text.trim().length < 5}>
        {busy ? 'Structuring…' : 'Analyze'}
      </button>

      {!aiReady ? (
        <p className="hint" style={{ marginTop: 9 }}>
          No <code>DEEPSEEK_API_KEY</code> yet — structure comes from the local mock, the loop still works.
        </p>
      ) : null}

      {error ? <div className="alert" style={{ marginTop: 10 }}>{error}</div> : null}

      {proposal ? (
        <div className="proposal">
          <div className="phead">
            <span>
              <b>AI found</b> · {pickedInsights.length} insights · {pickedTasks.length} tasks
            </span>
            <span className="dim" style={{ maxWidth: '55%', textAlign: 'right', lineHeight: 1.35 }}>
              {proposal.provider ?? mode}
            </span>
          </div>
          <div className="kv" style={{ marginBottom: 8 }}>{proposal.summary}</div>

          {proposal.insights.map((insight, i) => (
            <div className="row" key={`i${i}`}>
              <button
                type="button"
                className={pickedInsights[i] ? 'box on' : 'box'}
                onClick={() =>
                  setPickedInsights((prev) => prev.map((v, j) => (j === i ? !v : v)))
                }
              >
                {pickedInsights[i] ? '✓' : ''}
              </button>
              <div>
                {insight.statement}
                {insight.practice ? <span className="tag">practice: {insight.practice}</span> : null}
                {insight.cue ? <span className="tag">cue: {insight.cue}</span> : null}
              </div>
            </div>
          ))}

          {proposal.tasks.map((task, i) => (
            <div className="row" key={`t${i}`}>
              <button
                type="button"
                className={pickedTasks[i] ? 'box on' : 'box'}
                onClick={() => setPickedTasks((prev) => prev.map((v, j) => (j === i ? !v : v)))}
              >
                {pickedTasks[i] ? '✓' : ''}
              </button>
              <div>
                {task.title}
                {task.next_action ? <span className="tag">next: {task.next_action}</span> : null}
              </div>
            </div>
          ))}

          {proposal.friction.length ? (
            <div className="kv" style={{ marginTop: 10 }}>
              <b>friction</b>
              {proposal.friction.map((f, i) => (
                <div key={`f${i}`}>· {f.text} <span className="dim">[{f.tag}]</span></div>
              ))}
            </div>
          ) : null}

          {proposal.sprint ? (
            <div className="kv" style={{ marginTop: 10 }}>
              <b>sprint</b>
              <div>goal: {proposal.sprint.goal || '—'}</div>
              {proposal.sprint.outputs.map((o, i) => (
                <div key={`o${i}`}>output {i + 1}: {o}</div>
              ))}
              <div>experiment: {proposal.sprint.experiment || '—'}</div>
              <div>stop: {proposal.sprint.stop || '—'}</div>
              <div>protect: {proposal.sprint.protect || '—'}</div>
            </div>
          ) : null}

          {proposal.question ? (
            <div className="kv" style={{ marginTop: 10 }}>
              <b>question</b>
              <div>{proposal.question}</div>
            </div>
          ) : null}

          <div className="pfoot">
            <button className="btn sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : `Save ${kept} ${kept === 1 ? 'item' : 'items'}`}
            </button>
            <button className="link" type="button" onClick={() => setProposal(null)}>
              dismiss
            </button>
          </div>
        </div>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  )
}
