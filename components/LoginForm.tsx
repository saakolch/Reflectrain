'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')

    const supabase = createClient()

    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        router.replace('/dump')
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else if (!data.session) setInfo('Account created. Confirm it by email, then sign in.')
      else {
        router.replace('/dump')
        router.refresh()
      }
    }

    setBusy(false)
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="seg">
        <button type="button" className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>
          sign in
        </button>
        <button type="button" className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>
          create account
        </button>
      </div>

      <div className="stack">
        <input
          type="email"
          autoComplete="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>

      {error ? <div className="alert" style={{ marginTop: 10 }}>{error}</div> : null}
      {info ? <div className="note" style={{ marginTop: 10 }}>{info}</div> : null}

      <button className="btn" style={{ marginTop: 14 }} disabled={busy}>
        {busy ? '…' : mode === 'in' ? 'Sign in' : 'Create account'}
      </button>

      <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
        Single-user app. Create your account once, then turn off sign-ups in Supabase
        (Authentication → Providers → Email → Allow new users).
      </p>
    </form>
  )
}
