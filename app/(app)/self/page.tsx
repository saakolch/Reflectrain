import { createClient } from '@/lib/supabase/server'
import { addClaim, addClaimEvidence, promoteClaim, signOut } from '@/app/actions'
import type { ClaimRow } from '@/lib/types'

export default async function SelfPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('identity').select('*').order('created_at', { ascending: false })
  const claims = (data ?? []) as unknown as ClaimRow[]

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Self</h1>
          <div className="meta">identity evidence · {claims.length} claims</div>
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="empty" style={{ marginBottom: 14 }}>
          A claim is an identity you are testing — “I am someone who acts before feeling ready”.
          <br />
          Add it below, break it into three observable actions, then log what you actually did.
        </div>
      ) : null}

      {claims.map((claim) => {
        const actions = Array.isArray(claim.actions) ? claim.actions : []
        const total = actions.reduce((n, a) => n + (a.evidence?.length ?? 0), 0)
        const counter = Array.isArray(claim.counter_evidence) ? claim.counter_evidence : []

        return (
          <div className="card" key={claim.id}>
            <div className="spread">
              <span className="badge">
                <i className={claim.status === 'embodied' ? 'embodied' : 'practicing'} />
                {claim.status}
              </span>
              <span className="dim small">{total} evidence</span>
            </div>

            <div className="stmt">“{claim.claim}”</div>

            <div className="bar">
              <i style={{ width: `${Math.max(3, claim.confidence)}%` }} />
            </div>
            <div className="barcap">
              <span>confidence {claim.confidence}%</span>
              <span>moves only on evidence</span>
            </div>

            {actions.map((action, idx) => {
              const evidence = Array.isArray(action.evidence) ? action.evidence : []
              return (
                <div key={`${claim.id}-a${idx}`} style={{ borderTop: '1px solid #1f2431', marginTop: 10 }}>
                  <div className="row" style={{ paddingBottom: 4 }}>
                    <span className={evidence.length ? 'box on' : 'box'}>{evidence.length ? '✓' : ''}</span>
                    <div>
                      {action.text}
                      <span className="tag">
                        {evidence.length ? `${evidence.length} evidence` : 'no evidence yet'}
                      </span>
                    </div>
                  </div>

                  {evidence.length ? (
                    <div className="kv" style={{ marginTop: 2 }}>
                      {evidence.map((e, i) => (
                        <div key={`${claim.id}-a${idx}-e${i}`}>
                          · <span className="dim">{e.date}</span> {e.note}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <form action={addClaimEvidence} className="line" style={{ marginTop: 7 }}>
                    <input type="hidden" name="id" value={claim.id} />
                    <input type="hidden" name="index" value={idx} />
                    <input type="text" name="note" placeholder="what you actually did" />
                    <button className="btn xs">add</button>
                  </form>
                </div>
              )
            })}

            <details style={{ marginTop: 12 }}>
              <summary className="dim small" style={{ cursor: 'pointer' }}>
                counter-evidence ({counter.length})
              </summary>
              <div className="kv" style={{ marginTop: 6 }}>
                {counter.length ? (
                  counter.map((c, i) => (
                    <div key={`${claim.id}-c${i}`}>
                      · <span className="dim">{c.date}</span> {c.note}
                    </div>
                  ))
                ) : (
                  <div className="dim">Nothing yet. Keep it that way only if it is true.</div>
                )}
              </div>
            </details>

            {total >= 3 && claim.status !== 'embodied' ? (
              <form action={promoteClaim} style={{ marginTop: 12 }}>
                <input type="hidden" name="id" value={claim.id} />
                <button className="btn sm ghost">mark embodied</button>
              </form>
            ) : null}
          </div>
        )
      })}

      <div className="section-label">New claim</div>
      <form action={addClaim} className="card">
        <div className="stack">
          <input type="text" name="claim" placeholder="I am someone who…" required />
          <input type="text" name="a1" placeholder="observable action 1" />
          <input type="text" name="a2" placeholder="observable action 2" />
          <input type="text" name="a3" placeholder="observable action 3" />
        </div>
        <button className="btn" style={{ marginTop: 12 }}>
          Add claim
        </button>
        <p className="hint" style={{ marginBottom: 0 }}>
          Behaviour, not feelings. “Send the email before polishing it” can be evidenced; “be confident” cannot.
        </p>
      </form>

      <form action={signOut} style={{ marginTop: 22 }}>
        <button className="btn ghost">Sign out</button>
      </form>
    </>
  )
}
