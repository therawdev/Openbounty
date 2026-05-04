// Main App with auth
const App = () => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState('dashboard');
  const [viewId, setViewId] = useState(null);
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState(null);

  const notify = (msg) => setToast(msg);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      const parts = hash.split('/');
      setView(parts[0] || 'dashboard');
      setViewId(parts[1] || null);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();

    api.get('/api/settings').then(s => {
      window.platformSettings = s;
      if (s.platform_name) document.title = s.platform_name;
    });

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (page, id) => {
    window.location.hash = `/${page}${id ? `/${id}` : ''}`;
  };

  // Check existing session on mount
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.get('/api/auth/me').then(u => {
        setUser(u);
        setAuthChecked(true);
      }).catch(() => {
        api.setToken(null);
        setAuthChecked(true);
      });
    } else {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (user) api.get('/api/stats').then(setStats);
  }, [view, user]);

  const handleLogin = (u) => {
    setUser(u);
    setView('dashboard');
  };

  const handleLogout = async () => {
    try { await api.post('/api/auth/logout', {}); } catch(e) {}
    api.setToken(null);
    setUser(null);
    window.location.hash = '/dashboard';
    notify('Logged out');
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="logo" style={{ width: 40, height: 40, fontSize: 18, margin: '0 auto 12px' }}>S</div>
          <div className="muted">Loading…</div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const crumbsMap = {
    dashboard: ['Dashboard'],
    submissions: ['Submissions'],
    'submission-detail': ['Submissions', 'Report Detail'],
    programs: ['Programs'],
    'program-detail': ['Programs', 'Program Detail'],
    leaderboard: ['Leaderboard'],
    researchers: ['Researchers'],
    payouts: ['Payouts'],
    certificates: ['Certificates'],
    'submit-report': ['Programs', 'Submit Report'],
    settings: ['Settings'],
  };
  const crumbs = crumbsMap[view] || ['Dashboard'];

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard onNav={navigate} stats={stats} onNotify={notify} user={user} />;
      case 'submissions': return <Submissions onNav={navigate} onNotify={notify} user={user} />;
      case 'submission-detail': return <SubmissionDetail id={viewId} onNav={navigate} onNotify={notify} user={user} />;
      case 'programs': return <Programs onNav={navigate} onNotify={notify} user={user} />;
      case 'program-detail': return <ProgramDetail id={viewId} onNav={navigate} onNotify={notify} user={user} />;
      case 'leaderboard': return <Leaderboard onNav={navigate} onNotify={notify} />;
      case 'researchers': return <Researchers onNav={navigate} onNotify={notify} />;
      case 'payouts': return <Payouts onNav={navigate} onNotify={notify} />;
      case 'certificates': return <Certificates onNav={navigate} onNotify={notify} user={user} />;
      case 'submit-report': return <SubmitReport programId={viewId} onNav={navigate} onNotify={notify} user={user} />;
      case 'settings': return <Settings onNav={navigate} onNotify={notify} user={user} />;
      default: return <Dashboard onNav={navigate} stats={stats} onNotify={notify} user={user} />;
    }
  };

  return (
    <div className="app">
      <Sidebar view={view} onView={(id) => navigate(id)} stats={stats} user={user} onLogout={handleLogout} />
      <main className="main">
        <Topbar crumbs={crumbs} />
        <div className="content">{renderView()}</div>
      </main>
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
