// App shell: sidebar + topbar — with auth-aware navigation
const ADMIN_NAV = [
  { section: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  ]},
  { section: 'Vulnerability Disclosure', items: [
    { id: 'submissions', label: 'Submissions', icon: 'flag' },
    { id: 'programs', label: 'Programs', icon: 'shield' },
  ]},
  { section: 'Community', items: [
    { id: 'leaderboard', label: 'Leaderboard', icon: 'beam' },
    { id: 'researchers', label: 'Researchers', icon: 'users' },
  ]},
  { section: 'Finance', items: [
    { id: 'payouts', label: 'Payouts', icon: 'send' },
  ]},
  { section: 'Recognition', items: [
    { id: 'certificates', label: 'Certificates', icon: 'award' },
  ]},
  { section: 'Platform', items: [
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]},
];

const RESEARCHER_NAV = [
  { section: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  ]},
  { section: 'Vulnerability Disclosure', items: [
    { id: 'programs', label: 'Programs', icon: 'shield' },
    { id: 'submissions', label: 'My Reports', icon: 'flag' },
  ]},
  { section: 'Community', items: [
    { id: 'leaderboard', label: 'Leaderboard', icon: 'beam' },
  ]},
  { section: 'Recognition', items: [
    { id: 'certificates', label: 'My Certificates', icon: 'award' },
  ]},
  { section: 'Platform', items: [
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]},
];

const Sidebar = ({ view, onView, stats, user, onLogout }) => {
  const isAdmin = user?.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : RESEARCHER_NAV;

  const badgeMap = {
    submissions: stats?.openSubmissions,
    programs: stats?.activePrograms,
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        {window.platformSettings?.logo_url ? (
          <img src={window.platformSettings.logo_url} alt="Logo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
        ) : (
          <>
            <div className="logo">{window.platformSettings?.platform_name?.[0] || 'O'}</div>
            <div>
              <div className="logo-text">{window.platformSettings?.platform_name || 'OpenBounty'}</div>
              <div className="logo-sub">{window.platformSettings?.platform_subtitle || 'Bug Bounty Platform'}</div>
            </div>
          </>
        )}
      </div>
      <div className="org-switcher">
        <div className="org-pill">
          <div className="org-avatar" style={{
            background: isAdmin ? 'var(--accent-soft)' : 'var(--ai-soft)',
            color: isAdmin ? 'var(--accent-deep)' : 'var(--ai-deep)'
          }}>
            {isAdmin ? 'SS' : (user?.handle || '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="org-info">
            <div className="org-name">{isAdmin ? 'Sentinel Security' : user?.handle || 'Researcher'}</div>
            <div className="org-role">{isAdmin ? 'Platform Admin' : 'Researcher'}</div>
          </div>
          <I.chevron_right size={14} />
        </div>
      </div>
      <nav className="nav">
        {nav.map((sec, si) => (
          <div className="nav-section" key={si}>
            <div className="nav-label">{sec.section}</div>
            {sec.items.map(item => {
              const Icon = I[item.icon];
              const badge = badgeMap[item.id];
              return (
                <button
                  key={item.id}
                  className={`nav-item ${view === item.id || (item.id === 'programs' && view === 'program-detail') ? 'active' : ''}`}
                  onClick={() => onView(item.id)}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                  {badge != null && <span className="badge">{badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot" style={{ flexDirection: 'column', gap: 8 }}>
        <div className="row" style={{ width: '100%', gap: 10 }}>
          <Avatar name={user?.name || user?.handle || '?'} color={user?.avatar_color || '#dc2626'} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{user?.name || user?.handle}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{isAdmin ? 'Lead Auditor' : user?.email}</div>
          </div>
          <button className="icon-btn" title="Logout" onClick={onLogout} style={{ color: 'var(--ink-3)' }}>
            <I.logout size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ crumbs, onView }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Load notifications + poll every 30s
    const loadNotifs = () => api.get('/api/notifications').then(setNotifications).catch(() => {});
    loadNotifs();
    const poll = setInterval(loadNotifs, 30000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) return setSearchResults([]);
    const delay = setTimeout(() => {
      api.get(`/api/search?q=${encodeURIComponent(searchQuery)}`).then(setSearchResults);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const markRead = (id) => {
    api.put(`/api/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <header className="topbar">
        <div className="crumbs">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="search-bar" onClick={() => setSearchOpen(true)} style={{ cursor: 'pointer' }}>
          <I.search size={14} />
          <span style={{ color: 'var(--ink-3)', fontSize: 13, flex: 1 }}>Search reports, programs, researchers…</span>
          <span className="kbd">⌘K</span>
        </div>
        <div className="topbar-actions" style={{ position: 'relative' }}>
          <button className="icon-btn" title="Notifications" onClick={() => setNotifsOpen(!notifsOpen)}
            style={{ position: 'relative' }}>
            <I.bell size={15} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--crit)', color: '#fff',
                borderRadius: 99, fontSize: 9, fontWeight: 700,
                minWidth: 16, height: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
                boxShadow: '0 0 0 2px var(--bg)'
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          
          {notifsOpen && (
            <div className="card" style={{ position: 'absolute', top: 32, right: 0, width: 320, zIndex: 100, boxShadow: 'var(--shadow-lg)' }}>
              <div className="card-head"><div className="card-title">Notifications</div></div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="muted center" style={{ padding: 24, fontSize: 13 }}>No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id}
                         style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', background: n.is_read ? 'transparent' : 'var(--bg-elev)', cursor: n.link ? 'pointer' : 'default' }}
                         onClick={() => {
                           if (!n.is_read) markRead(n.id);
                           if (n.link) {
                             // Strip leading /# so we don't get double-hash
                             const hash = n.link.replace(/^\/?(#\/)?/, '');
                             window.location.hash = '/' + hash;
                           }
                           setNotifsOpen(false);
                         }}>
                      <div className="strong text-sm" style={{ marginBottom: 4 }}>{n.title}</div>
                      <div className="muted text-sm">{n.message}</div>
                      <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <Drawer open={searchOpen} onClose={() => { setSearchOpen(false); setSearchQuery(''); }} title="Search" width={500}>
        <div className="field">
          <input 
            autoFocus 
            className="input" 
            placeholder="Search..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        <div style={{ marginTop: 16 }}>
          {searchResults.map((r, i) => (
            <div key={i} className="card-body clickable row gap-8" style={{ borderBottom: '1px solid var(--line)' }}
                 onClick={() => {
                   window.location.hash = r.link;
                   setSearchOpen(false);
                 }}>
              <I.search size={14} className="muted" />
              <div>
                <div className="strong">{r.title}</div>
                <div className="muted text-sm" style={{ textTransform: 'capitalize' }}>{r.type} {r.sub ? `• ${r.sub}` : ''}</div>
              </div>
            </div>
          ))}
          {searchQuery && searchResults.length === 0 && (
            <div className="muted center" style={{ padding: 24 }}>No results found</div>
          )}
        </div>
      </Drawer>
    </>
  );
};

Object.assign(window, { Sidebar, Topbar, ADMIN_NAV, RESEARCHER_NAV });
