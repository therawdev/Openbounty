// Login / Register page
const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'register') {
        result = await api.post('/api/auth/register', { handle, name, email, password });
      } else {
        result = await api.post('/api/auth/login', { email, password });
      }
      api.setToken(result.token);
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'var(--ink)', color: 'var(--bg-elev)',
            display: 'inline-grid', placeItems: 'center', fontSize: 22, fontWeight: 700, margin: '0 auto 12px',
            position: 'relative'
          }}>
            {(window.platformSettings?.platform_name || 'OpenBounty').charAt(0)}
            <div style={{
              position: 'absolute', inset: -3, borderRadius: 16,
              background: 'var(--accent)', opacity: 0.15, zIndex: -1
            }}></div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{window.platformSettings?.platform_name || 'OpenBounty'}</div>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Responsible Disclosure & Bug Bounty Platform</div>
        </div>

        <div className="card">
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
            {[
              { id: 'login', label: 'Login' },
              { id: 'register', label: 'Researcher Signup' }
            ].map(t => (
              <button key={t.id}
                className={`tab ${mode === t.id ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center', padding: '12px 8px' }}
                onClick={() => { setMode(t.id); setError(''); }}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 20 }}>
            {mode === 'register' && (
              <>
                <div className="field">
                  <label className="label">Handle</label>
                  <input className="input mono" placeholder="e.g. h4cker_one" value={handle}
                    onChange={e => setHandle(e.target.value)} required />
                </div>
                <div className="field">
                  <label className="label">Full Name</label>
                  <input className="input" placeholder="John Doe" value={name}
                    onChange={e => setName(e.target.value)} required />
                </div>
              </>
            )}

            <div className="field">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="field">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--crit-soft)', color: 'var(--crit)',
                fontSize: 13, marginBottom: 12
              }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary btn-lg" type="submit"
              style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Processing…' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>

            {mode === 'login' && (
              <div className="text-sm muted" style={{ marginTop: 12, textAlign: 'center' }}>
                Admin demo: <code className="mono" style={{ color: 'var(--ai-deep)' }}>admin@openbounty.io</code> / <code className="mono" style={{ color: 'var(--ai-deep)' }}>admin2026</code>
              </div>
            )}
          </form>
        </div>


      </div>
    </div>
  );
};

window.LoginPage = LoginPage;
