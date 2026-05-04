// Submissions page
const Submissions = ({ onNav, onNotify }) => {
  const [subs, setSubs] = useState([]);
  const [sevFilter, setSevFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/submissions').then(setSubs);
  }, []);

  const filtered = subs.filter(s => {
    if (sevFilter !== 'all' && s.severity !== sevFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.ref.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Submissions</h1>
          <div className="page-sub">All vulnerability reports submitted through your programs.</div>
        </div>
        <div className="page-actions">
          <button className="btn"><I.download size={14} /> Export</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ maxWidth: 260, marginLeft: 0 }}>
          <I.search size={14} />
          <input placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="select" style={{ width: 130 }} value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>

        <select className="select" style={{ width: 130 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="triaging">Triaging</option>
          <option value="accepted">Accepted</option>
          <option value="resolved">Resolved</option>
          <option value="duplicate">Duplicate</option>
          <option value="rejected">Rejected</option>
          <option value="informative">Informative</option>
        </select>

        <span className="spacer"></span>
        <span className="muted text-sm">{filtered.length} of {subs.length} reports</span>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr>
            <th>Ref</th>
            <th>Title</th>
            <th>Severity</th>
            <th>CVSS</th>
            <th>Status</th>
            <th>Program</th>
            <th>Researcher</th>
            <th>Reward</th>
            <th>Submitted</th>
          </tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="clickable" onClick={() => onNav('submission-detail', s.id)}>
                <td><span className="mono text-sm">{s.ref}</span></td>
                <td>
                  <div style={{ maxWidth: 280 }}>
                    <div className="strong" style={{ fontSize: 13 }}>{s.title}</div>
                    {s.asset && <div className="mono text-xs muted" style={{ marginTop: 2 }}>{s.asset}</div>}
                  </div>
                </td>
                <td><SeverityBadge severity={s.severity} /></td>
                <td><CvssBadge cvss={s.cvss} /></td>
                <td><StatusBadge status={s.status} /></td>
                <td className="muted text-sm">{s.program_name}</td>
                <td>
                  <div className="row gap-4">
                    <Avatar name={s.researcher_handle} color={s.avatar_color} size={20} />
                    <span className="mono text-sm">{s.researcher_handle}</span>
                  </div>
                </td>
                <td>
                  {s.reward_amount > 0
                    ? <span className="mono text-sm strong"><MoneyFmt amount={s.reward_amount} /></span>
                    : <span className="muted text-sm">—</span>
                  }
                </td>
                <td><TimeAgo date={s.created_at} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <I.flag size={32} />
            <div className="strong">No matching reports</div>
            <div className="text-sm">Try adjusting your filters.</div>
          </div>
        )}
      </div>
    </div>
  );
};

window.Submissions = Submissions;
