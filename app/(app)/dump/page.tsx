import { createClient } from '@/lib/supabase/server'
import { isAIConfigured } from '@/lib/env'
import DumpComposer from '@/components/DumpComposer'
import type { Mode } from '@/lib/types'

function todayLabel() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Shanghai',
  }).format(new Date())
}

export default async function DumpPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const params = await searchParams
  const initialMode: Mode = params.mode === 'weekly' ? 'weekly' : 'daily'

  const supabase = await createClient()

  const [{ data: dumps }, { count }] = await Promise.all([
    supabase
      .from('dumps')
      .select('id, raw_text, kind, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('insights')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'practicing']),
  ])

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Dump</h1>
          <div className="meta">
            {todayLabel()} · {count ?? 0} active insights
          </div>
        </div>
      </div>

      <DumpComposer aiReady={isAIConfigured()} initialMode={initialMode} />

      <div className="section-label">Recent dumps</div>

      {dumps && dumps.length ? (
        <div className="stack">
          {dumps.map((dump) => (
            <div className="card" key={dump.id}>
              <div className="spread">
                <span className="badge">
                  <i className={dump.kind === 'weekly' ? 'practicing' : 'active'} />
                  {dump.kind}
                </span>
                <span className="dim small">
                  {new Date(dump.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'Asia/Shanghai',
                  })}
                </span>
              </div>
              <p className="kv" style={{ marginBottom: 0, marginTop: 6 }}>
                {dump.raw_text.slice(0, 160)}
                {dump.raw_text.length > 160 ? '…' : ''}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          Nothing yet. Write one dump above and press Analyze.
          <br />
          The first one is allowed to be messy.
        </div>
      )}
    </>
  )
}
