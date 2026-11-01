import { missingKeys } from '@/lib/env'
import SetupNotice from '@/components/SetupNotice'

export default function SetupPage() {
  return (
    <div className="shell narrow" style={{ display: 'grid', placeItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="page-top" style={{ marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24 }}>sprint_ai</h1>
            <div className="meta">first run</div>
          </div>
        </div>
        <SetupNotice missing={missingKeys()} />
      </div>
    </div>
  )
}
