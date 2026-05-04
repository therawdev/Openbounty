// Programs page
const Programs = ({ onNav, onNotify, user }) => {
  const [programs, setPrograms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const [newData, setNewData] = useState({ name: '', slug: '', description: '', policy: '', reward_low: 100, reward_high: 5000, reward_crit: 15000, offers_bounty: true, offers_certificate: true });

  const isAdmin = user?.role === 'admin';

  const load = () => api.get('/api/programs').then(setPrograms);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newData.name || !newData.slug) return onNotify('Name and slug required');
    await api.post('/api/programs', newData);
    setShowCreate(false);
    onNotify('Program created');
    load();
  };

  const handleStatusChange = async (e, id, status, confirmMsg) => {
    e.stopPropagation(); // prevent navigating to program
    if (!confirm(`Are you sure you want to ${confirmMsg} this program?`)) return;
    await api.put(`/api/programs/${id}`, { status });
    onNotify(`Program marked as ${status}`);
    load();
  };

  const filtered = filter === 'all' ? programs : programs.filter(p => p.status === filter);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Programs</h1>
          <div className="page-sub">Manage your bug bounty and responsible disclosure programs.</div>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <I.plus size={14} /> New Program
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['all', 'active', 'paused', 'archived'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f === 'all' ? 'All Programs' : f}
            </button>
          ))}
        </div>
        <span className="spacer"></span>
        <div className="seg" style={{ marginRight: 16 }}>
          <button className={`seg-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><I.grid size={14} /></button>
          <button className={`seg-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><I.list size={14} /></button>
        </div>
        <span className="muted text-sm">{filtered.length} program{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {viewMode === 'grid' ? (
        <div className="program-grid">
          {filtered.map(p => (
            <div key={p.id} className="program-card" onClick={() => onNav('program-detail', p.id)}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div className="strong" style={{ fontSize: 15 }}>{p.name}</div>
                  <div className="muted text-sm mt-4">{p.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {isAdmin && (
                    <>
                      {p.status === 'active' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'paused', 'pause')} title="Pause">
                            <I.pause size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'archived', 'archive')} title="Archive">
                            <I.trash size={14} />
                          </button>
                        </>
                      )}
                      {p.status === 'paused' && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'active', 'resume')} title="Resume">
                            <I.play size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'archived', 'archive')} title="Archive">
                            <I.trash size={14} />
                          </button>
                        </>
                      )}
                      {p.status === 'archived' && (
                        <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'active', 'unarchive')} title="Unarchive">
                          <I.archive_restore size={14} />
                        </button>
                      )}
                    </>
                  )}
                  <StatusBadge status={p.status} />
                </div>
              </div>

            <div className="divider"></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
              <div>
                <div className="detail-label">Submissions</div>
                <div className="strong">{p.submission_count}</div>
              </div>
              <div>
                <div className="detail-label">SLA</div>
                <div className="strong">{p.response_sla_hours}h</div>
              </div>
              {p.offers_bounty ? (
                <div>
                  <div className="detail-label">Paid Out</div>
                  <div className="strong"><MoneyFmt amount={p.total_paid} /></div>
                </div>
              ) : <div></div>}
            </div>

            <div className="divider"></div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                {p.offers_bounty ? (
                  <>
                    <div className="detail-label" style={{ marginBottom: 4 }}>Reward Range</div>
                    <div className="reward-range">
                      <span style={{ color: 'var(--ok)' }}>${p.reward_low}</span>
                      <span className="sep">—</span>
                      <span style={{ color: 'var(--crit)' }}>${p.reward_crit?.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-label" style={{ marginBottom: 4 }}>Type</div>
                    <div>
                      {p.offers_certificate && <span className="chip" style={{ color: 'var(--ai)' }}><I.award size={12} style={{ marginRight: 4 }} /> Certificates</span>}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="detail-label" style={{ marginBottom: 4 }}>In Scope</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(p.scope_in || []).slice(0, 3).map((s, i) => (
                  <span key={i} className="chip mono" style={{ fontSize: 11 }}>{s}</span>
                ))}
                {(p.scope_in || []).length > 3 && <span className="chip">+{p.scope_in.length - 3}</span>}
              </div>
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Program Name</th>
                <th>Status</th>
                <th>SLA</th>
                <th>Submissions</th>
                <th>Total Paid</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="clickable" onClick={() => onNav('program-detail', p.id)}>
                  <td className="strong">{p.name}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.response_sla_hours}h</td>
                  <td>{p.submission_count}</td>
                  <td className="mono">{p.offers_bounty ? <MoneyFmt amount={p.total_paid} /> : '—'}</td>
                  {isAdmin && (
                    <td>
                      <div className="row gap-8">
                        {p.status === 'active' && (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'paused', 'pause')} title="Pause">
                              <I.pause size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'archived', 'archive')} title="Archive">
                              <I.trash size={14} />
                            </button>
                          </>
                        )}
                        {p.status === 'paused' && (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'active', 'resume')} title="Resume">
                              <I.play size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'archived', 'archive')} title="Archive">
                              <I.trash size={14} />
                            </button>
                          </>
                        )}
                        {p.status === 'archived' && (
                          <button className="btn btn-ghost btn-sm" onClick={(e) => handleStatusChange(e, p.id, 'active', 'unarchive')} title="Unarchive">
                            <I.archive_restore size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="center muted" style={{ padding: 32 }}>No programs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Program"
        sub="Set up a new bug bounty or disclosure program"
        foot={
          <>
            <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Create Program</button>
          </>
        }>
        <div className="field">
          <label className="label">Program Name</label>
          <input className="input" placeholder="e.g. Acme Corp Web Platform" value={newData.name} onChange={e => setNewData({...newData, name: e.target.value})} />
        </div>
        <div className="field">
          <label className="label">Slug</label>
          <input className="input mono" placeholder="acme-corp" value={newData.slug} onChange={e => setNewData({...newData, slug: e.target.value})} />
        </div>
        <div className="field">
          <label className="label">Description</label>
          <textarea className="textarea" placeholder="Describe the program scope and goals..." value={newData.description} onChange={e => setNewData({...newData, description: e.target.value})}></textarea>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="ob" checked={newData.offers_bounty} onChange={e => setNewData({...newData, offers_bounty: e.target.checked})} />
            <label htmlFor="ob" className="strong">Offers Bounty</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="oc" checked={newData.offers_certificate} onChange={e => setNewData({...newData, offers_certificate: e.target.checked})} />
            <label htmlFor="oc" className="strong">Offers Certificate</label>
          </div>
        </div>

        {newData.offers_bounty && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">Low Reward ($)</label>
              <input className="input mono" type="number" placeholder="100" value={newData.reward_low} onChange={e => setNewData({...newData, reward_low: +e.target.value})} />
            </div>
            <div className="field">
              <label className="label">High Reward ($)</label>
              <input className="input mono" type="number" placeholder="5000" value={newData.reward_high} onChange={e => setNewData({...newData, reward_high: +e.target.value})} />
            </div>
            <div className="field">
              <label className="label">Critical Reward ($)</label>
              <input className="input mono" type="number" placeholder="15000" value={newData.reward_crit} onChange={e => setNewData({...newData, reward_crit: +e.target.value})} />
            </div>
          </div>
        )}
        <div className="field">
          <label className="label">Disclosure Policy</label>
          <textarea className="textarea" rows={4} placeholder="Your responsible disclosure policy..." value={newData.policy} onChange={e => setNewData({...newData, policy: e.target.value})}></textarea>
        </div>
      </Modal>
    </div>
  );
};

window.Programs = Programs;
