// Program Detail page — Bugcrowd-style engagement page
const ProgramDetail = ({ id, onNav, onNotify, user }) => {
  const [program, setProgram] = useState(null);
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [scopeInText, setScopeInText] = useState('');
  const [scopeOutText, setScopeOutText] = useState('');

  const load = () => api.get(`/api/programs/${id}`).then(p => { 
    setProgram(p); 
    setEditData(p); 
    setScopeInText((p.scope_in || []).join('\n'));
    setScopeOutText((p.scope_out || []).join('\n'));
  });
  useEffect(() => { load(); }, [id]);

  if (!program) return <div className="center" style={{ padding: 48 }}><div className="muted">Loading…</div></div>;

  const isAdmin = user?.role === 'admin';
  const isResearcher = user?.role === 'researcher';

  const saveEdits = async () => {
    const payload = {
      ...editData,
      scope_in: scopeInText.split('\n').map(s=>s.trim()).filter(Boolean),
      scope_out: scopeOutText.split('\n').map(s=>s.trim()).filter(Boolean)
    };
    await api.put(`/api/programs/${id}`, payload);
    setEditing(false);
    load();
    onNotify('Program updated');
  };

  const tabs = [
    { id: 'overview', label: 'Program Details' },
    program.offers_bounty && { id: 'rewards', label: 'Rewards' },
    { id: 'submissions', label: 'Submissions', count: program.submission_count },
    { id: 'hall_of_fame', label: 'Hall of Fame', count: program.hall_of_fame?.length || 0 },
  ].filter(Boolean);

  return (
    <div>
      {/* Program header — Bugcrowd-style banner */}
      <div style={{ marginBottom: 20 }}>
        <div className="row gap-8" style={{ marginBottom: 10 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => onNav('programs')}>
            <I.chevron_right size={12} style={{ transform: 'rotate(180deg)' }} /> Programs
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Banner gradient */}
          <div style={{
            height: 80,
            background: `linear-gradient(135deg, ${program.logo_color || 'var(--accent)'}22, ${program.logo_color || 'var(--accent)'}08)`,
            borderBottom: '1px solid var(--line)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', bottom: -24, left: 24,
              width: 48, height: 48, borderRadius: 12,
              background: program.logo_color || 'var(--accent)',
              color: 'white', display: 'grid', placeItems: 'center',
              fontSize: 20, fontWeight: 700,
              border: '3px solid var(--bg-elev)',
              boxShadow: 'var(--shadow)'
            }}>
              {program.name.charAt(0)}
            </div>
          </div>

          <div style={{ padding: '32px 24px 20px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 className="page-title" style={{ fontSize: 22, marginBottom: 4 }}>{program.name}</h1>
                <div className="muted text-sm">{program.description}</div>
              </div>
              <div className="row gap-8">
                <StatusBadge status={program.status} />
                {program.safe_harbor ? <span className="badge ok"><I.shield size={10} /> Safe Harbor</span> : null}
                {isAdmin && !editing && <button className="btn btn-sm" onClick={() => setEditing(true)}><I.edit size={12} /> Edit</button>}
                {isResearcher && program.status === 'active' && (
                  <button className="btn btn-sm btn-accent" onClick={() => onNav('submit-report', id)}><I.flag size={12} /> Submit Report</button>
                )}
              </div>
            </div>

            {/* Program Badges */}
            <div className="row gap-8 mt-8">
              {program.offers_bounty ? (
                <span className="chip" style={{ color: 'var(--ok)' }}><I.dollar_sign size={12} style={{ marginRight: 4 }} /> Bounty Eligible</span>
              ) : null}
              {program.offers_certificate ? (
                <span className="chip" style={{ color: 'var(--ai)' }}><I.award size={12} style={{ marginRight: 4 }} /> Certificates</span>
              ) : null}
            </div>

            {/* Quick stats row */}
            <div className="row gap-24 mt-16">
              <div><span className="detail-label">Submissions</span><div className="strong">{program.submission_count}</div></div>
              <div><span className="detail-label">Researchers</span><div className="strong">{program.researcher_count}</div></div>
              {program.offers_bounty ? <div><span className="detail-label">Total Paid</span><div className="strong"><MoneyFmt amount={program.total_paid} /></div></div> : null}
              <div><span className="detail-label">Response SLA</span><div className="strong">{program.response_sla_hours}h</div></div>
              {program.offers_bounty ? (
                <div>
                  <span className="detail-label">Reward Range</span>
                  <div className="reward-range"><span style={{ color: 'var(--ok)' }}>${program.reward_low}</span><span className="sep">—</span><span style={{ color: 'var(--crit)' }}>${program.reward_crit?.toLocaleString()}</span></div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Program Details (Overview) tab */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 300px' : '1fr 300px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <div className="card-head"><div className="card-title">Program Rules & Policy</div></div>
              <div className="card-body">
                {editing ? (
                  <textarea className="textarea" rows={12} value={editData.policy || ''} onChange={e => setEditData({...editData, policy: e.target.value})} />
                ) : (
                  <div className="markdown-body" style={{ fontSize: 14, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: window.marked.parse(program.policy || 'No policy defined.') }}></div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title" style={{ color: 'var(--ok)' }}>✓ In Scope</div></div>
              <div className="card-body">
                {editing ? (
                  <textarea className="textarea mono" rows={6} value={scopeInText} onChange={e => setScopeInText(e.target.value)} />
                ) : (
                  <ul className="scope-list">
                    {(program.scope_in || []).map((s, i) => <li key={i} className="scope-in"><span className="mono text-sm">{s}</span></li>)}
                  </ul>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title" style={{ color: 'var(--crit)' }}>✗ Out of Scope</div></div>
              <div className="card-body">
                {editing ? (
                  <textarea className="textarea mono" rows={6} value={scopeOutText} onChange={e => setScopeOutText(e.target.value)} />
                ) : (
                  <ul className="scope-list">
                    {(program.scope_out || []).map((s, i) => <li key={i} className="scope-out"><span className="mono text-sm">{s}</span></li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Severity distribution — admin only */}
            {isAdmin && program.severityCounts && (
              <div className="card">
                <div className="card-head"><div className="card-title">Severity Distribution</div></div>
                <div className="card-body">
                  {['critical','high','medium','low','info'].map(sev => {
                    const count = program.severityCounts?.[sev] || 0;
                    const total = program.submission_count || 1;
                    const colors = { critical: 'var(--crit)', high: '#ea580c', medium: 'var(--warn)', low: 'var(--info)', info: 'var(--ink-4)' };
                    return (
                      <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[sev] }}></div>
                        <span className="text-sm" style={{ width: 60, textTransform: 'capitalize' }}>{sev}</span>
                        <div className="progress" style={{ flex: 1, height: 4 }}><div className="fill" style={{ width: `${count/total*100}%`, background: colors[sev] }}></div></div>
                        <span className="mono text-sm" style={{ width: 24, textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="card">
              <div className="card-head"><div className="card-title">Program Info</div></div>
              <div className="card-body">
                <div className="detail-field"><div className="detail-label">Slug</div><div className="mono text-sm">{program.slug}</div></div>
                <div className="divider"></div>
                <div className="detail-field"><div className="detail-label">Created</div><div className="text-sm">{new Date(program.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div></div>
                <div className="divider"></div>
                <div className="detail-field"><div className="detail-label">Last Updated</div><div className="text-sm">{new Date(program.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div></div>
                <div className="divider"></div>
                <div className="detail-field"><div className="detail-label">Safe Harbor</div><div className="text-sm">{editing ? <input type="checkbox" checked={!!editData.safe_harbor} onChange={e=>setEditData({...editData, safe_harbor: e.target.checked?1:0})} /> : (program.safe_harbor ? '✓ Yes' : '✗ No')}</div></div>
                {editing && (
                  <>
                    <div className="divider"></div>
                    <div className="detail-field"><div className="detail-label">Offers Bounty</div><div className="text-sm"><input type="checkbox" checked={!!editData.offers_bounty} onChange={e=>setEditData({...editData, offers_bounty: e.target.checked?1:0})} /></div></div>
                    <div className="divider"></div>
                    <div className="detail-field"><div className="detail-label">Offers Certificate</div><div className="text-sm"><input type="checkbox" checked={!!editData.offers_certificate} onChange={e=>setEditData({...editData, offers_certificate: e.target.checked?1:0})} /></div></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards tab */}
      {tab === 'rewards' && (
        <div className="card">
          <div className="card-head"><div className="card-title">Reward Table</div></div>
          <div className="card-body">
            <table className="table">
              <thead><tr><th>Severity</th><th>Reward</th></tr></thead>
              <tbody>
                {[
                  { sev: 'Critical', val: editing ? <input className="input mono" type="number" value={editData.reward_crit||0} onChange={e=>setEditData({...editData,reward_crit:+e.target.value})} style={{width:120}}/> : <MoneyFmt amount={program.reward_crit} />, cls: 'crit' },
                  { sev: 'High', val: editing ? <input className="input mono" type="number" value={editData.reward_high||0} onChange={e=>setEditData({...editData,reward_high:+e.target.value})} style={{width:120}}/> : <MoneyFmt amount={program.reward_high} />, cls: 'high' },
                  { sev: 'Medium', val: editing ? <input className="input mono" type="number" value={editData.reward_med||0} onChange={e=>setEditData({...editData,reward_med:+e.target.value})} style={{width:120}}/> : <MoneyFmt amount={program.reward_med} />, cls: 'med' },
                  { sev: 'Low', val: editing ? <input className="input mono" type="number" value={editData.reward_low||0} onChange={e=>setEditData({...editData,reward_low:+e.target.value})} style={{width:120}}/> : <MoneyFmt amount={program.reward_low} />, cls: 'low' },
                  { sev: 'Informational', val: editing ? <input className="input mono" type="number" value={editData.reward_info||0} onChange={e=>setEditData({...editData,reward_info:+e.target.value})} style={{width:120}}/> : <MoneyFmt amount={program.reward_info||0} />, cls: 'info' },
                ].map(r => (
                  <tr key={r.sev}><td><SeverityBadge severity={r.sev.toLowerCase()} /></td><td className="mono strong" style={{fontSize:16}}>{r.val}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submissions tab */}
      {tab === 'submissions' && (
        <div className="card">
          <table className="table">
            <thead><tr><th>Ref</th><th>Title</th><th>Severity</th><th>CVSS</th><th>Status</th><th>Researcher</th><th>Reward</th></tr></thead>
            <tbody>
              {(program.submissions || []).map(s => (
                <tr key={s.id} className="clickable" onClick={() => onNav('submission-detail', s.id)}>
                  <td><span className="mono text-sm">{s.ref}</span></td>
                  <td className="strong">{s.title}</td>
                  <td><SeverityBadge severity={s.severity} /></td>
                  <td><CvssBadge cvss={s.cvss} /></td>
                  <td><StatusBadge status={s.status} /></td>
                  <td><div className="row gap-4"><Avatar name={s.researcher_handle} color={s.avatar_color} size={20} /><span className="text-sm">@{s.researcher_handle}</span></div></td>
                  <td>{s.reward_amount > 0 ? <span className="mono text-sm"><MoneyFmt amount={s.reward_amount} /></span> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!program.submissions || program.submissions.length === 0) && (
            <div className="empty-state"><I.flag size={32} /><div className="strong">No submissions yet</div></div>
          )}
        </div>
      )}

      {/* Hall of Fame tab */}
      {tab === 'hall_of_fame' && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Hall of Fame</div>
            <div className="text-sm muted">Researchers who have successfully reported vulnerabilities to this program.</div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Rank</th>
                <th>Researcher</th>
                <th>Valid Bugs</th>
                <th>Total Bounty</th>
              </tr>
            </thead>
            <tbody>
              {(program.hall_of_fame || []).map((r, i) => (
                <tr key={r.id}>
                  <td>
                    <div className={`rank-num rank-${i + 1 > 3 ? 'other' : i + 1}`}>
                      {i + 1}
                    </div>
                  </td>
                  <td>
                    <div className="row gap-12">
                      <Avatar name={r.handle} color={r.avatar_color} size={32} />
                      <div>
                        <div className="strong">{r.name}</div>
                        <div className="text-sm muted">@{r.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="strong">{r.valid_bugs}</span></td>
                  <td>{r.total_bounty > 0 ? <MoneyFmt amount={r.total_bounty} /> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!program.hall_of_fame || program.hall_of_fame.length === 0) && (
            <div className="empty-state"><I.award size={32} /><div className="strong mt-8">No researchers yet</div></div>
          )}
        </div>
      )}

      {/* Edit save bar */}
      {editing && (
        <div style={{ position: 'fixed', bottom: 0, left: 240, right: 0, background: 'var(--bg-elev)', borderTop: '1px solid var(--line)', padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 8, zIndex: 50 }}>
          <button className="btn" onClick={() => { setEditing(false); setEditData(program); setScopeInText((program.scope_in||[]).join('\n')); setScopeOutText((program.scope_out||[]).join('\n')); }}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEdits}>Save Changes</button>
        </div>
      )}
    </div>
  );
};

window.ProgramDetail = ProgramDetail;
