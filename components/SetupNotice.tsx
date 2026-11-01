export default function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="card">
      <div className="badge"><i />setup needed</div>
      <p className="stmt" style={{ marginBottom: 6 }}>Connection details are missing.</p>
      <p className="hint" style={{ marginTop: 0 }}>
        Add these to <code>.env.local</code> in the project root, then restart the dev server:
      </p>
      <ul className="kv" style={{ margin: '8px 0 12px', paddingLeft: 18 }}>
        {missing.map((m) => (
          <li key={m}><code>{m}</code></li>
        ))}
      </ul>
      <div className="note">
        Supabase → <b>Project Settings → API Keys → Publishable key</b>. The project URL is
        <code> https://&lt;project-ref&gt;.supabase.co</code>.
      </div>
    </div>
  )
}
