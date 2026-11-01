import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { addCounterEvidence, logEvidence, makePractice, setInsightStatus } from '@/app/actions'
import type { InsightRow } from '@/lib/types'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(60)

  const insights = (data ?? []) as unknown as InsightRow[]
  const live = insights.filter((i) => i.status === 'active' || i.status === 'practicing')
  const archived = insights.filter((i) => i.status !== 'active' && i.status !== 'practicing')

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Insights</h1>
          <div className="meta">
            the ledger · {live.length} live · {insights.length} total
          </div>
        </div>
        <Link href="/dump" className="btn sm ghost">
          + dump
        </Link>
      </div>

      {live.length === 0 ? (
        <div className="empty">
          No insights yet. They come from dumps — the AI proposes, you tick.
          <br />
          <Link href="/dump" style={{ color: 'var(--accent)' }}>
            Write a dump
          </Link>
        </div>
      ) : null}

      {live.map((insight) => {
        const evidence = Array.isArray(insight.evidence) ? insight.evidence : []
        const counter = Array.isArray(insight.counter_evidence) ? insight.counter_evidence : []

        return (
          <div className="card" key={insight.id}>
            <div className="spread">
              <span className="badge">
                <i className={insight.status} />
                {insight.status}
              </span>
              <span className="dim small">{evidence.length} evidence</span>
            </div>

            <div className="stmt">{insight.statement}</div>

            <div className="kv">
              {insight.practice ? (
                <div>
                  <b>practice</b> {insight.practice}
                </div>
              ) : null}
              {insight.cue ? (
                <div>
                  <b>cue</b> {insight.cue}
                </div>
              ) : null}
              {insight.evidence_question ? (
                <div>
                  <b>evidence question</b> {insight.evidence_question}
                </div>
              ) : null}
            </div>

            {evidence.length ? (
              <div className="kv" style={{ marginTop: 8 }}>
                {evidence.slice(-3).map((e, idx) => (
                  <div key={`${insight.id}-e${idx}`}>
                    · <span className="dim">{e.date}</span> {e.note}
                  </div>
                ))}
              </div>
            ) : null}

            <form action={logEvidence} className="line" style={{ marginTop: 10 }}>
              <input type="hidden" name="id" value={insight.id} />
              <input type="text" name="note" placeholder="what actually happened" />
              <button className="btn xs">log</button>
            </form>

            <div className="line" style={{ marginTop: 8 }}>
              {insight.practice ? (
                <form action={makePractice}>
                  <input type="hidden" name="id" value={insight.id} />
                  <button className="btn xs ghost">to plan</button>
                </form>
              ) : null}
              <form action={setInsightStatus}>
                <input type="hidden" name="id" value={insight.id} />
                <input type="hidden" name="status" value={insight.status === 'active' ? 'practicing' : 'active'} />
                <button className="btn xs ghost">
                  {insight.status === 'active' ? 'mark practicing' : 'mark active'}
                </button>
              </form>
              <form action={setInsightStatus}>
                <input type="hidden" name="id" value={insight.id} />
                <input type="hidden" name="status" value="retired" />
                <button className="btn xs ghost">archive</button>
              </form>
            </div>

            <details style={{ marginTop: 10 }}>
              <summary className="dim small" style={{ cursor: 'pointer' }}>
                counter-evidence ({counter.length})
              </summary>
              {counter.length ? (
                <div className="kv" style={{ marginTop: 6 }}>
                  {counter.map((c, idx) => (
                    <div key={`${insight.id}-c${idx}`}>
                      · <span className="dim">{c.date}</span> {c.note}
                    </div>
                  ))}
                </div>
              ) : null}
              <form action={addCounterEvidence} className="line" style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={insight.id} />
                <input type="text" name="note" placeholder="what contradicted it" />
                <button className="btn xs ghost">add</button>
              </form>
            </details>
          </div>
        )
      })}

      {archived.length ? (
        <details style={{ marginTop: 18 }}>
          <summary className="section-label" style={{ cursor: 'pointer' }}>
            archived ({archived.length})
          </summary>
          {archived.map((insight) => (
            <div className="card" key={insight.id} style={{ opacity: 0.6 }}>
              <span className="badge">
                <i />
                {insight.status}
              </span>
              <div className="stmt" style={{ fontSize: 14 }}>
                {insight.statement}
              </div>
              <form action={setInsightStatus}>
                <input type="hidden" name="id" value={insight.id} />
                <input type="hidden" name="status" value="active" />
                <button className="btn xs ghost">restore</button>
              </form>
            </div>
          ))}
        </details>
      ) : null}
    </>
  )
}
