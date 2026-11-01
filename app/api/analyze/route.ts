import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isConfigured } from '@/lib/env'
import { analyze } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { text?: string; mode?: string } | null
  const text = (body?.text ?? '').trim()

  if (text.length < 5) {
    return NextResponse.json({ error: 'The dump is too short to structure.' }, { status: 400 })
  }

  const mode = body?.mode === 'weekly' ? 'weekly' : 'daily'
  const proposal = await analyze(text.slice(0, 20_000), mode)

  return NextResponse.json(proposal)
}
