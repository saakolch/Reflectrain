import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isConfigured, missingKeys } from '@/lib/env'
import SetupNotice from '@/components/SetupNotice'
import TabBar from '@/components/TabBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) {
    return (
      <div className="shell narrow" style={{ maxWidth: 520 }}>
        <SetupNotice missing={missingKeys()} />
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <>
      <div className="shell">{children}</div>
      <TabBar />
    </>
  )
}
