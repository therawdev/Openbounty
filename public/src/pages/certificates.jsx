// Certificates page — with PDF download
const Certificates = ({ onNav, onNotify, user }) => {
  const [certificates, setCertificates] = useState([]);
  const [viewCert, setViewCert] = useState(null);

  useEffect(() => {
    if (user?.role === 'researcher' && user.id) {
      api.get(`/api/researchers/${user.id}/certificates`).then(setCertificates);
    } else {
      api.get('/api/certificates').then(setCertificates);
    }
  }, [user]);

  const downloadPdf = (certRef) => {
    window.open(`/api/certificates/${certRef}/pdf`, '_blank');
  };

  const sevColors = { critical: '#b91c1c', high: '#ea580c', medium: '#d97706', low: '#0369a1', info: '#6b7280' };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Certificates</h1>
          <div className="page-sub">{user?.role === 'researcher' ? 'Your earned vulnerability disclosure certificates.' : 'All issued certificates for valid vulnerability reports.'}</div>
        </div>
      </div>

      {certificates.length === 0 && (
        <div className="card"><div className="empty-state"><I.award size={40} /><div className="strong mt-8">No certificates yet</div><div className="text-sm muted">Certificates are issued for accepted and resolved vulnerability reports.</div></div></div>
      )}

      <div className="program-grid">
        {certificates.map(c => (
          <div key={c.id} className="program-card" onClick={() => setViewCert(c)} style={{ cursor: 'pointer' }}>
            <div className="row gap-12" style={{ marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${sevColors[c.severity] || '#7c3aed'}, ${sevColors[c.severity] || '#7c3aed'}88)`,
                display: 'grid', placeItems: 'center', flexShrink: 0
              }}>
                <I.award size={20} stroke="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="mono text-sm strong">{c.cert_ref}</div>
                <div className="text-xs muted">{new Date(c.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <SeverityBadge severity={c.severity} />
            </div>
            <div className="strong" style={{ fontSize: 14, marginBottom: 4 }}>{c.vulnerability_title}</div>
            <div className="muted text-sm">{c.program_name}</div>
            <div className="divider"></div>
            <div className="row gap-8">
              <Avatar name={c.researcher_handle} color={sevColors[c.severity]} size={20} />
              <span className="text-sm">@{c.researcher_handle}</span>
              <span className="muted text-sm">({c.researcher_name})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Certificate Preview Modal */}
      <Modal open={!!viewCert} onClose={() => setViewCert(null)} title="Vulnerability Disclosure Certificate" wide
        foot={<><button className="btn" onClick={() => setViewCert(null)}>Close</button><button className="btn btn-primary" onClick={() => downloadPdf(viewCert.cert_ref)}><I.download size={14} /> Download PDF</button></>}>
        {viewCert && (
          <div style={{
            border: '3px solid var(--ink)', borderRadius: 16, padding: 40, textAlign: 'center',
            background: 'var(--bg-elev)', position: 'relative', overflow: 'hidden'
          }}>
            {/* Corner decorations */}
            <div style={{ position: 'absolute', top: 12, left: 12, width: 40, height: 40, borderTop: '2px solid var(--ink-4)', borderLeft: '2px solid var(--ink-4)' }}></div>
            <div style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderTop: '2px solid var(--ink-4)', borderRight: '2px solid var(--ink-4)' }}></div>
            <div style={{ position: 'absolute', bottom: 12, left: 12, width: 40, height: 40, borderBottom: '2px solid var(--ink-4)', borderLeft: '2px solid var(--ink-4)' }}></div>
            <div style={{ position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderBottom: '2px solid var(--ink-4)', borderRight: '2px solid var(--ink-4)' }}></div>

            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--ink-3)', marginBottom: 6 }}>{(window.platformSettings?.platform_name || 'OpenBounty')} · Bug Bounty Platform</div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `linear-gradient(135deg, ${sevColors[viewCert.severity]}, ${sevColors[viewCert.severity]}88)`,
                display: 'grid', placeItems: 'center'
              }}>
                <I.award size={24} stroke="white" />
              </div>
            </div>

            <div className="serif" style={{ fontSize: 28, marginBottom: 4 }}>Certificate of Recognition</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 24 }}>Responsible Vulnerability Disclosure</div>

            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4 }}>Awarded To</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{viewCert.researcher_name}</div>
            <div className="mono" style={{ fontSize: 14, color: sevColors[viewCert.severity], marginBottom: 20 }}>@{viewCert.researcher_handle}</div>

            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4 }}>For The Responsible Discovery And Disclosure Of</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{viewCert.vulnerability_title}</div>
            <SeverityBadge severity={viewCert.severity} />

            <div className="divider" style={{ margin: '20px auto', maxWidth: 200 }}></div>

            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4 }}>Program</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>{viewCert.program_name}</div>

            <div className="row" style={{ justifyContent: 'center', gap: 32 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Certificate ID</div>
                <div className="mono text-sm strong">{viewCert.cert_ref}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Issued</div>
                <div className="text-sm strong">{new Date(viewCert.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Verified</div>
                <div className="text-sm strong" style={{ color: 'var(--ok)' }}>✓ Verified</div>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <div className="row" style={{ justifyContent: 'center', gap: 48 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Maya Rivera</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>Platform Security Director</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{window.platformSettings?.platform_name || 'OpenBounty'} Platform</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>Chief Security Officer</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, fontSize: 10, color: 'var(--ink-4)' }}>
              Click "Download PDF" for the official printable certificate document.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

window.Certificates = Certificates;
