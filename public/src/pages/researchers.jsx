// Researchers page
const Researchers = ({ onNav, onNotify }) => {
  const [researchers, setResearchers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [settingPw, setSettingPw] = useState(false);

  const load = () => api.get('/api/researchers').then(setResearchers);
  useEffect(() => { load(); }, []);

  const filtered = researchers.filter(r => {
    if (!search) return true;
    return r.handle.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleToggleStatus = async () => {
    const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`${newStatus === 'active' ? 'Activate' : 'Deactivate'} @${selectedUser.handle}?`)) return;
    await api.put(`/api/researchers/${selectedUser.id}`, { status: newStatus });
    onNotify(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    setSelectedUser(null);
    load();
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete @${selectedUser.handle}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/researchers/${selectedUser.id}`);
      onNotify('User deleted');
      setSelectedUser(null);
      load();
    } catch (e) {
      onNotify('Error: ' + e.message);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return onNotify('Password must be at least 6 characters');
    setSettingPw(true);
    try {
      await api.put(`/api/researchers/${selectedUser.id}/password`, { password: newPassword });
      onNotify('Password updated');
      setShowSetPassword(false);
      setNewPassword('');
    } catch (e) {
      onNotify('Error: ' + e.message);
    } finally {
      setSettingPw(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Researchers</h1>
          <div className="page-sub">Security researchers participating in your programs.</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ maxWidth: 300, marginLeft: 0 }}>
          <I.search size={14} />
          <input placeholder="Search researchers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="spacer"></span>
        <span className="muted text-sm">{filtered.length} researcher{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr>
            <th>Researcher</th>
            <th>Email</th>
            <th>Reputation</th>
            <th>Valid / Total</th>
            <th>Hit Rate</th>
            <th>Total Earned</th>
            <th>Joined</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(r => {
              const hitRate = r.reports_submitted > 0 ? Math.round(r.reports_valid / r.reports_submitted * 100) : 0;
              return (
                <tr key={r.id} className="clickable" onClick={() => setSelectedUser(r)}>
                  <td>
                    <div className="row gap-8">
                      <Avatar name={r.handle} color={r.avatar_color} size={28} />
                      <div>
                        <div className="strong">@{r.handle}</div>
                        <div className="text-xs muted">{r.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono text-sm muted">{r.email}</td>
                  <td><span className="mono strong">{r.reputation.toLocaleString()}</span></td>
                  <td><span className="mono">{r.reports_valid} / {r.reports_submitted}</span></td>
                  <td>
                    <div className="row gap-8">
                      <div className="progress" style={{ width: 60, height: 4 }}>
                        <div className="fill" style={{ width: `${hitRate}%`, background: hitRate >= 70 ? 'var(--ok)' : 'var(--warn)' }}></div>
                      </div>
                      <span className="mono text-sm">{hitRate}%</span>
                    </div>
                  </td>
                  <td className="mono strong"><MoneyFmt amount={r.total_earned} /></td>
                  <td className="text-sm muted">{new Date(r.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer open={!!selectedUser} onClose={() => { setSelectedUser(null); setShowSetPassword(false); setNewPassword(''); }} title="User Details" width={500}>
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="row gap-16" style={{ alignItems: 'flex-start' }}>
              <Avatar name={selectedUser.handle} color={selectedUser.avatar_color} size={64} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{selectedUser.name}</div>
                <div className="muted" style={{ fontSize: 14 }}>@{selectedUser.handle} • {selectedUser.email}</div>
                <div style={{ marginTop: 8 }}><StatusBadge status={selectedUser.status} /></div>
              </div>
            </div>

            <div className="divider"></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div className="muted text-sm" style={{ marginBottom: 4 }}>Reputation</div>
                <div className="strong mono">{selectedUser.reputation.toLocaleString()}</div>
              </div>
              <div>
                <div className="muted text-sm" style={{ marginBottom: 4 }}>Total Earned</div>
                <div className="strong mono"><MoneyFmt amount={selectedUser.total_earned} /></div>
              </div>
              <div>
                <div className="muted text-sm" style={{ marginBottom: 4 }}>Reports (Valid/Total)</div>
                <div className="strong mono">{selectedUser.reports_valid} / {selectedUser.reports_submitted}</div>
              </div>
              <div>
                <div className="muted text-sm" style={{ marginBottom: 4 }}>Joined</div>
                <div className="strong mono">{new Date(selectedUser.joined_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="divider"></div>

            <div>
              <div className="muted text-sm" style={{ marginBottom: 4 }}>Bio</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>{selectedUser.bio || 'No bio provided.'}</p>
            </div>

            {selectedUser.website && (
              <div>
                <div className="muted text-sm" style={{ marginBottom: 4 }}>Website</div>
                <a href={selectedUser.website} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'var(--accent)' }}>{selectedUser.website}</a>
              </div>
            )}

            <div className="divider"></div>

            {/* Set Password */}
            {showSetPassword ? (
              <div>
                <div className="muted text-sm" style={{ marginBottom: 8 }}>Set New Password</div>
                <div className="row gap-8">
                  <input
                    className="input"
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleSetPassword} disabled={settingPw}>
                    {settingPw ? '…' : 'Save'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowSetPassword(false); setNewPassword(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            <div className="row gap-8" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {!showSetPassword && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSetPassword(true)}>
                  <I.lock size={14} /> Set Password
                </button>
              )}
              <button
                className={`btn btn-sm ${selectedUser.status === 'active' ? 'btn-danger' : 'btn-ok'}`}
                onClick={handleToggleStatus}>
                {selectedUser.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <I.trash size={14} /> Delete User
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

window.Researchers = Researchers;
