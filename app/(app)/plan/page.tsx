import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { toggleTask } from '@/app/actions'
import type { SprintRow, TaskRow } from '@/lib/types'

function shortDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Shanghai',
  })
}

export default async function PlanPage() {
  const supabase = await createClient()

  const [{ data: sprintData }, { data: taskData }] = await Promise.all([
    supabase.from('sprints').select('*').order('week_start', { ascending: false }).limit(1),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(80),
  ])

  const sprint = (sprintData?.[0] ?? null) as unknown as SprintRow | null
  const tasks = (taskData ?? []) as unknown as TaskRow[]

  const outputs = sprint ? tasks.filter((t) => t.sprint_id === sprint.id) : []
  const open = tasks.filter((t) => !t.sprint_id && !t.done).slice(0, 8)
  const done = tasks.filter((t) => !t.sprint_id && t.done).slice(0, 4)

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Plan</h1>
          <div className="meta">{sprint ? `week of ${shortDate(sprint.week_start)}` : 'no sprint yet'}</div>
        </div>
        <Link href="/dump?mode=weekly" className="btn sm ghost">
          weekly
        </Link>
      </div>

      {sprint ? (
        <>
          <p className="kv" style={{ marginTop: 0, marginBottom: 4 }}>
            <b>goal</b> {sprint.goal || '—'}
          </p>
        </>
      ) : (
        <div className="note" style={{ marginBottom: 14 }}>
          No sprint yet. Dump in <b>weekly</b> mode and the AI will fill goal, three outputs, experiment,
          stop and protect. Until then, tasks from dumps land here.
        </div>
      )}

      {sprint && outputs.length ? (
        <>
          <div className="section-label">Outputs</div>
          <div className="card">
            {outputs.map((task) => (
              <form action={toggleTask} key={task.id}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="done" value={String(task.done)} />
                <button type="submit" className="row" style={{ background: 'none', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
                  <span className={task.done ? 'box on' : 'box'}>{task.done ? '✓' : ''}</span>
                  <span style={task.done ? { textDecoration: 'line-through', opacity: 0.55 } : undefined}>
                    {task.title}
                  </span>
                </button>
              </form>
            ))}
          </div>
        </>
      ) : null}

      {sprint && (sprint.experiment || sprint.stop || sprint.protect) ? (
        <>
          <div className="section-label">Boundaries</div>
          <div className="card">
            {sprint.experiment ? (
              <div className="kv" style={{ padding: '4px 0' }}>
                <b>experiment</b> {sprint.experiment}
              </div>
            ) : null}
            {sprint.stop ? (
              <div className="kv" style={{ padding: '4px 0' }}>
                <b>stop</b> {sprint.stop}
              </div>
            ) : null}
            {sprint.protect ? (
              <div className="kv" style={{ padding: '4px 0' }}>
                <b>protect</b> {sprint.protect}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="section-label">Open tasks</div>

      {open.length === 0 ? (
        <div className="empty">Nothing open. Tasks appear here when you tick them in a dump.</div>
      ) : (
        <div className="card">
          {open.map((task) => (
            <form action={toggleTask} key={task.id}>
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="done" value="false" />
              <button type="submit" className="row" style={{ background: 'none', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
                <span className="box" />
                <span>
                  {task.title}
                  {task.next_action ? <span className="tag">next: {task.next_action}</span> : null}
                  {task.due ? <span className="tag">due {shortDate(task.due)}</span> : null}
                </span>
              </button>
            </form>
          ))}
        </div>
      )}

      {done.length ? (
        <>
          <div className="section-label">Done recently</div>
          <div className="card">
            {done.map((task) => (
              <form action={toggleTask} key={task.id}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="done" value="true" />
                <button type="submit" className="row" style={{ background: 'none', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
                  <span className="box on">✓</span>
                  <span style={{ textDecoration: 'line-through', opacity: 0.55 }}>{task.title}</span>
                </button>
              </form>
            ))}
          </div>
        </>
      ) : null}

      <Link href="/dump?mode=weekly" className="btn ghost" style={{ marginTop: 18 }}>
        Start weekly review
      </Link>
    </>
  )
}
