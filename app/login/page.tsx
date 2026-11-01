import { isConfigured, missingKeys } from '@/lib/env'
import LoginForm from '@/components/LoginForm'
import SetupNotice from '@/components/SetupNotice'

export default function LoginPage() {
  return (
    <div className="shell narrow" style={{ display: 'grid', placeItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="page-top" style={{ marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 24 }}>sprint_ai</h1>
            <div className="meta">dump → structure → practice → evidence</div>
          </div>
        </div>
        {isConfigured() ? <LoginForm /> : <SetupNotice missing={missingKeys()} />}
      </div>
    </div>
  )
}
