// Dashboard page
const Dashboard = ({ onNav, stats, onNotify, user }) => {
  const [activity, setActivity] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    api.get('/api/activity').then(setActivity);
    api.get('/api/submissions').then(setSubmissions);
  }, []);

  if (!stats) return null;

  const sevData = stats.severityCounts || {};
  const totalFindings = Object.values(sevData).reduce((a, b) => a + b, 0);

  const activityIcons = {
    submission: 'flag', bounty: 'send', status: 'check', comment: 'msg', program: 'shield'
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">{user?.role === 'researcher' ? 'Overview of your responsible disclosure activity.' : 'Overview of the platform responsible disclosure activity.'}</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => onNav('submissions')}><I.flag size={14} /> View Reports</button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Open Reports" value={stats.openSubmissions} accent="accent" hint="awaiting triage" />
        <Stat label="Total Submissions" value={stats.totalSubmissions} hint="all time" />
        <Stat label="Bounties Paid" value={`$${(stats.totalPaid/1000).toFixed(0)}k`} accent="ok" hint={`$${(stats.totalPending/1000).toFixed(0)}k pending`} />
        <Stat label="Avg CVSS" value={stats.avgCvss} hint={`${stats.totalResearchers} researchers`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Severity Breakdown */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Severity Breakdown</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {totalFindings > 0 ? (() => {
                let currentPct = 0;
                const colors = { critical: 'var(--crit)', high: '#ea580c', medium: 'var(--warn)', low: 'var(--info)', info: 'var(--ink-4)' };
                const gradientStops = ['critical', 'high', 'medium', 'low', 'info'].map(sev => {
                  const count = sevData[sev] || 0;
                  if (count === 0) return null;
                  const pct = (count / totalFindings) * 100;
                  const start = currentPct;
                  const end = currentPct + pct;
                  currentPct += pct;
                  return `${colors[sev]} ${start}% ${end}%`;
                }).filter(Boolean).join(', ');

                return (
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: `conic-gradient(${gradientStops})`,
                    display: 'grid', placeItems: 'center'
                  }}>
                    <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>{totalFindings}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Total</div>
                    </div>
                  </div>
                );
              })() : (
                <Donut pct={0} size={100} color="var(--ink-4)" label={0} sub="Total" />
              )}
              <div style={{ flex: 1 }}>
                {['critical', 'high', 'medium', 'low', 'info'].map(sev => {
                  const count = sevData[sev] || 0;
                  const pct = totalFindings > 0 ? (count / totalFindings * 100) : 0;
                  const colors = { critical: 'var(--crit)', high: '#ea580c', medium: 'var(--warn)', low: 'var(--info)', info: 'var(--ink-4)' };
                  return (
                    <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[sev], flexShrink: 0 }}></div>
                      <span className="text-sm" style={{ width: 60, textTransform: 'capitalize' }}>{sev}</span>
                      <div className="progress" style={{ flex: 1, height: 4 }}>
                        <div className="fill" style={{ width: `${pct}%`, background: colors[sev] }}></div>
                      </div>
                      <span className="mono text-sm" style={{ width: 24, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Report Status</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(stats.statusCounts || {}).map(([status, count]) => (
                <div key={status} className="list-row" style={{ cursor: 'default' }}>
                  <StatusBadge status={status} />
                  <span className="spacer"></span>
                  <span className="mono strong">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Recent Activity</div>
          <span className="text-sm muted">{activity.length} events</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {activity.slice(0, 8).map((a, i) => {
            const iconName = activityIcons[a.kind] || 'alert';
            const Icon = I[iconName];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
                <div className={`activity-icon ${a.kind}`}>
                  <Icon size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="strong" style={{ fontSize: 13 }}>{a.actor}</span>
                  <span className="muted" style={{ fontSize: 13 }}> {a.action}</span>
                </div>
                <TimeAgo date={a.created_at} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest Submissions */}
      <div className="card mt-16">
        <div className="card-head">
          <div className="card-title">Latest Submissions</div>
          <button className="btn btn-sm btn-ghost" onClick={() => onNav('submissions')}>View all <I.arrow_right size={12} /></button>
        </div>
        <table className="table">
          <thead><tr>
            <th>Ref</th><th>Title</th><th>Severity</th><th>Status</th><th>Program</th><th>Researcher</th><th>Submitted</th>
          </tr></thead>
          <tbody>
            {submissions.slice(0, 5).map(s => (
              <tr key={s.id} className="clickable" onClick={() => onNav('submission-detail', s.id)}>
                <td><span className="mono text-sm">{s.ref}</span></td>
                <td className="strong">{s.title}</td>
                <td><SeverityBadge severity={s.severity} /></td>
                <td><StatusBadge status={s.status} /></td>
                <td className="muted text-sm">{s.program_name}</td>
                <td>
                  <div className="row gap-4">
                    <Avatar name={s.researcher_handle} color={s.avatar_color} size={20} />
                    <span className="text-sm">{s.researcher_handle}</span>
                  </div>
                </td>
                <td><TimeAgo date={s.created_at} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
