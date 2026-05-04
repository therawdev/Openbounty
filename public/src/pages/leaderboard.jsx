// Leaderboard page
const Leaderboard = ({ onNav, onNotify }) => {
  const [researchers, setResearchers] = useState([]);

  useEffect(() => {
    api.get('/api/leaderboard').then(setResearchers);
  }, []);

  const getRankClass = (i) => {
    if (i === 0) return 'rank-1';
    if (i === 1) return 'rank-2';
    if (i === 2) return 'rank-3';
    return 'rank-other';
  };

  const maxRep = researchers.length > 0 ? researchers[0].reputation : 1;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <div className="page-sub">Top security researchers ranked by reputation and contributions.</div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {researchers.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
          {researchers.slice(0, 3).map((r, i) => (
            <div key={r.id} className="card" style={{
              textAlign: 'center', padding: 24,
              borderColor: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : '#d97706',
              borderWidth: i === 0 ? 2 : 1,
            }}>
              <div className={`rank-num ${getRankClass(i)}`} style={{ margin: '0 auto 12px', width: 40, height: 40, fontSize: 18 }}>
                {i + 1}
              </div>
              <Avatar name={r.handle} color={r.avatar_color} size={48} />
              <div className="strong mt-8" style={{ fontSize: 16 }}>@{r.handle}</div>
              <div className="muted text-sm">{r.name}</div>
              <div className="divider"></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div className="detail-label">Reputation</div>
                  <div className="strong mono" style={{ fontSize: 18, color: 'var(--ai-deep)' }}>{r.reputation.toLocaleString()}</div>
                </div>
                <div>
                  <div className="detail-label">Earned</div>
                  <div className="strong mono" style={{ fontSize: 18, color: 'var(--ok)' }}><MoneyFmt amount={r.total_earned} /></div>
                </div>
              </div>
              <div className="mt-8">
                <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
                  <span className="text-sm"><span className="strong">{r.reports_valid}</span> <span className="muted">valid</span></span>
                  <span className="text-sm muted">/</span>
                  <span className="text-sm"><span className="strong">{r.reports_submitted}</span> <span className="muted">total</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rest of rankings */}
      <div className="card">
        <table className="table">
          <thead><tr>
            <th style={{ width: 50 }}>Rank</th>
            <th>Researcher</th>
            <th>Reputation</th>
            <th></th>
            <th>Valid Reports</th>
            <th>Total Reports</th>
            <th>Hit Rate</th>
            <th>Total Earned</th>
          </tr></thead>
          <tbody>
            {researchers.map((r, i) => {
              const hitRate = r.reports_submitted > 0 ? Math.round(r.reports_valid / r.reports_submitted * 100) : 0;
              return (
                <tr key={r.id}>
                  <td>
                    <div className={`rank-num ${getRankClass(i)}`}>{i + 1}</div>
                  </td>
                  <td>
                    <div className="row gap-8">
                      <Avatar name={r.handle} color={r.avatar_color} size={28} />
                      <div>
                        <div className="strong">@{r.handle}</div>
                        <div className="text-xs muted">{r.name}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="mono strong" style={{ color: 'var(--ai-deep)' }}>{r.reputation.toLocaleString()}</span></td>
                  <td style={{ width: 120 }}>
                    <div className="progress" style={{ height: 4 }}>
                      <div className="fill" style={{ width: `${(r.reputation / maxRep * 100)}%`, background: 'var(--ai)' }}></div>
                    </div>
                  </td>
                  <td className="mono">{r.reports_valid}</td>
                  <td className="mono">{r.reports_submitted}</td>
                  <td>
                    <span className={`mono strong ${hitRate >= 70 ? '' : 'muted'}`} style={hitRate >= 70 ? { color: 'var(--ok)' } : {}}>{hitRate}%</span>
                  </td>
                  <td className="mono strong"><MoneyFmt amount={r.total_earned} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

window.Leaderboard = Leaderboard;
