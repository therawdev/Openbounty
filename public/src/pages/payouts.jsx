// Payouts page
const Payouts = ({ onNav, onNotify }) => {
  const [payouts, setPayouts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/api/payouts').then(setPayouts);
  }, []);

  const filtered = filter === 'all' ? payouts : payouts.filter(p => p.status === filter);

  const totals = {
    paid: payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    approved: payouts.filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0),
    pending: payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Payouts</h1>
          <div className="page-sub">Track bounty rewards and payment status.</div>
        </div>
        <div className="page-actions">
          <button className="btn"><I.download size={14} /> Export CSV</button>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Stat label="Total Paid" value={`$${(totals.paid / 1000).toFixed(0)}k`} accent="ok" hint={`${payouts.filter(p => p.status === 'paid').length} payouts`} />
        <Stat label="Approved" value={`$${(totals.approved / 1000).toFixed(1)}k`} accent="ai" hint="awaiting disbursement" />
        <Stat label="Pending Review" value={`$${(totals.pending / 1000).toFixed(1)}k`} accent="warn" hint="needs approval" />
      </div>

      <div className="filter-bar">
        {['all', 'paid', 'approved', 'pending', 'cancelled'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
        <span className="spacer"></span>
        <span className="muted text-sm">{filtered.length} payout{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr>
            <th>Report</th>
            <th>Researcher</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Method</th>
            <th>Note</th>
            <th>Created</th>
            <th>Paid</th>
          </tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="clickable" onClick={() => onNav('submission-detail', p.submission_id)}>
                <td>
                  <div>
                    <span className="mono text-sm strong">{p.submission_ref}</span>
                    <div className="text-xs muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.submission_title}</div>
                  </div>
                </td>
                <td>
                  <div className="row gap-4">
                    <Avatar name={p.researcher_handle} color={p.avatar_color} size={20} />
                    <span className="mono text-sm">@{p.researcher_handle}</span>
                  </div>
                </td>
                <td>
                  <span className={`mono strong payout-${p.status}`} style={{ fontSize: 14 }}>
                    <MoneyFmt amount={p.amount} />
                  </span>
                </td>
                <td><StatusBadge status={p.status} /></td>
                <td className="text-sm muted" style={{ textTransform: 'capitalize' }}>{(p.method || '').replace(/_/g, ' ')}</td>
                <td className="text-sm muted">{p.note || '—'}</td>
                <td><TimeAgo date={p.created_at} /></td>
                <td>{p.paid_at ? <span className="text-sm muted">{new Date(p.paid_at).toLocaleDateString()}</span> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <I.send size={32} />
            <div className="strong">No payouts found</div>
            <div className="text-sm">Try adjusting your filters.</div>
          </div>
        )}
      </div>
    </div>
  );
};

window.Payouts = Payouts;
