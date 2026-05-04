// Submission Detail page
const SubmissionDetail = ({ id, onNav, onNotify, user }) => {
  const [sub, setSub] = useState(null);
  const [comment, setComment] = useState('');
  const [commentFiles, setCommentFiles] = useState([]);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardNote, setRewardNote] = useState('');
  const [issuingCert, setIssuingCert] = useState(false);
  const [savingReward, setSavingReward] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = () => api.get(`/api/submissions/${id}`).then(setSub);
  useEffect(() => { load(); }, [id]);

  if (!sub) return <div className="center" style={{ padding: 48 }}><div className="muted">Loading…</div></div>;

  const handleComment = () => {
    if (!comment.trim() && commentFiles.length === 0) return;
    const fd = new FormData();
    fd.append('author_type', isAdmin ? 'team' : 'researcher');
    fd.append('author_name', user?.name || 'Team');
    fd.append('body', comment);
    commentFiles.forEach(f => fd.append('files', f));

    api.post(`/api/submissions/${id}/comments`, fd)
      .then(() => {
        setComment('');
        setCommentFiles([]);
        load();
        onNotify('Comment posted');
      })
      .catch(err => onNotify('Error: ' + err.message));
  };

  const updateStatus = (status) => {
    api.put(`/api/submissions/${id}`, { status }).then(() => { load(); onNotify(`Status changed to ${status}`); });
  };

  const handleIssueCert = async () => {
    setIssuingCert(true);
    try {
      await api.post('/api/certificates', { submission_id: parseInt(id) });
      onNotify('Certificate issued!');
      load();
    } catch (e) {
      onNotify('Error: ' + e.message);
    } finally {
      setIssuingCert(false);
    }
  };

  const handleSetReward = async () => {
    if (!rewardAmount || parseInt(rewardAmount) <= 0) return onNotify('Enter a valid amount');
    setSavingReward(true);
    try {
      await api.post('/api/payouts', { submission_id: parseInt(id), amount: parseInt(rewardAmount), note: rewardNote });
      onNotify('Reward assigned!');
      setShowReward(false);
      setRewardAmount('');
      setRewardNote('');
      load();
    } catch (e) {
      onNotify('Error: ' + e.message);
    } finally {
      setSavingReward(false);
    }
  };

  const statusFlow = ['new', 'triaging', 'accepted', 'resolved'];
  const currentIdx = statusFlow.indexOf(sub.status);

  // Conditions for cert/reward
  const canIssueCert = isAdmin && ['accepted', 'resolved'].includes(sub.status) && !sub.certificate;
  const canSetReward = isAdmin && sub.reward_status === 'none' && !['rejected', 'informative'].includes(sub.status);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="row gap-8" style={{ marginBottom: 6 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => onNav('submissions')}>
              <I.chevron_right size={12} style={{ transform: 'rotate(180deg)' }} /> Back
            </button>
            <span className="mono text-sm muted">{sub.ref}</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 20 }}>{sub.title}</h1>
          <div className="row gap-8 mt-4">
            <SeverityBadge severity={sub.severity} />
            <StatusBadge status={sub.status} />
            <CvssBadge cvss={sub.cvss} />
            {sub.cwe && <span className="chip mono" style={{ fontSize: 11 }}>{sub.cwe}</span>}
          </div>
        </div>
        {isAdmin && (
          <div className="page-actions">
            {sub.status === 'new' && <button className="btn" onClick={() => updateStatus('triaging')}><I.eye size={14} /> Start Triage</button>}
            {sub.status === 'triaging' && <button className="btn btn-primary" onClick={() => updateStatus('accepted')}><I.check size={14} /> Accept</button>}
            {sub.status === 'accepted' && <button className="btn btn-primary" onClick={() => updateStatus('resolved')}><I.check size={14} /> Resolve</button>}
            {canIssueCert && (
              <button className="btn" onClick={handleIssueCert} disabled={issuingCert}>
                <I.certificate size={14} /> {issuingCert ? 'Issuing…' : 'Issue Certificate'}
              </button>
            )}
            {canSetReward && (
              <button className="btn btn-accent" onClick={() => setShowReward(true)}>
                <I.send size={14} /> Set Reward
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status flow */}
      <div className="status-flow" style={{ marginBottom: 20 }}>
        {statusFlow.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <div className={`status-step-line`} style={i <= currentIdx ? { background: 'var(--ok)' } : {}}></div>}
            <div className={`status-step ${i < currentIdx ? 'done' : i === currentIdx ? 'active' : ''}`}>
              <div className="status-step-dot"></div>
              <span style={{ textTransform: 'capitalize' }}>{s}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="detail-layout">
        {/* Main content */}
        <div>
          {/* Description */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><div className="card-title">Description</div></div>
            <div className="card-body">
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>{sub.description}</p>
            </div>
          </div>

          {/* Impact */}
          {sub.impact && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><div className="card-title">Impact</div></div>
              <div className="card-body">
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>{sub.impact}</p>
              </div>
            </div>
          )}

          {/* Reproduction Steps */}
          {sub.repro_steps && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><div className="card-title">Steps to Reproduce</div></div>
              <div className="card-body">
                <div className="terminal">
                  {sub.repro_steps.split('\n').map((line, i) => (
                    <div key={i}><span className="ts">{i + 1}.</span> {line.replace(/^\d+\.\s*/, '')}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fix Suggestion */}
          {sub.fix_suggestion && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head">
                <div className="card-title">Suggested Fix</div>
              </div>
              <div className="card-body">
                <div className="ai-panel">
                  <div className="ai-tag" style={{ marginBottom: 8 }}>
                    <I.sparkle size={12} />
                    Researcher Recommendation
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>{sub.fix_suggestion}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {sub.files && sub.files.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><div className="card-title">Attachments / Proof of Concept</div></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {sub.files.map((file, i) => (
                    <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-sunk)' }}>
                      {file.endsWith('.mp4') ? (
                        <video controls style={{ width: '100%', maxHeight: 400, display: 'block', background: '#000' }}>
                          <source src={file} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <a href={file} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                          <img src={file} alt={`Attachment ${i + 1}`} style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comments / Timeline */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Activity & Comments</div>
              <span className="badge">{(sub.comments || []).length}</span>
            </div>
            <div className="card-body">
              <div className="timeline">
                {(sub.comments || []).map((c, i) => (
                  <div key={i} className="timeline-item">
                    <div className={`timeline-dot ${c.author_type}`}></div>
                    <div>
                      <div className="row gap-8" style={{ marginBottom: 4 }}>
                        <span className="strong text-sm">{c.author_name}</span>
                        {c.is_internal ? <span className="badge" style={{ fontSize: 10 }}>Internal</span> : null}
                        <TimeAgo date={c.created_at} />
                      </div>
                      <div className="markdown-body" style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ink)' }}
                           dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(c.body, {
                             renderer: Object.assign(new window.marked.Renderer(), {
                               link: (h, t, text) => text,
                               image: (h, t, text) => text,
                               strong: (text) => text,
                               em: (text) => text,
                               del: (text) => text,
                               html: (html) => html.replace(/</g, '&lt;'),
                               heading: (text, level) => level >= 2 && level <= 4 ? `<h${level}>${text}</h${level}>` : `<p>${text}</p>`
                             })
                           }) : c.body }}></div>

                      {c.files && c.files.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          {c.files.map((file, idx) => (
                            <div key={idx} style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                              {file.endsWith('.mp4') ? (
                                <video controls style={{ height: 100, background: '#000' }}>
                                  <source src={file} type="video/mp4" />
                                </video>
                              ) : (
                                <a href={file} target="_blank" rel="noreferrer">
                                  <img src={file} alt="comment attachment" style={{ height: 100, display: 'block', objectFit: 'cover' }} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider" style={{ margin: '16px 0' }}></div>

              <div className="row gap-8" style={{ alignItems: 'flex-start' }}>
                <Avatar name={user?.name || 'User'} color={user?.avatar_color || '#dc2626'} size={28} />
                <div style={{ flex: 1 }}>
                  <textarea className="textarea" placeholder="Add a comment… (Markdown: ##, ###, -, 1., code)" value={comment}
                    style={{ minHeight: 60, marginBottom: 8 }}
                    onChange={e => setComment(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleComment();
                      }
                    }} />
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="row gap-8">
                      <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                        <I.image size={14} /> Attach File
                        <input type="file" multiple accept=".jpg,.jpeg,.png,.mp4" style={{ display: 'none' }}
                          onChange={e => setCommentFiles([...commentFiles, ...Array.from(e.target.files)])} />
                      </label>
                      {commentFiles.length > 0 && <span className="text-sm muted">{commentFiles.length} file(s) attached</span>}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleComment}>Post Comment</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="card">
            <div className="card-head"><div className="card-title">Details</div></div>
            <div className="card-body">
              <div className="detail-field">
                <div className="detail-label">Researcher</div>
                <div className="row gap-8">
                  <Avatar name={sub.researcher_handle || sub.researcher_name} color={sub.avatar_color} size={22} />
                  <div>
                    <div className="text-sm strong">{sub.researcher_handle}</div>
                    <div className="text-xs muted">{sub.researcher_name}</div>
                  </div>
                </div>
              </div>
              <div className="divider"></div>
              <div className="detail-field">
                <div className="detail-label">Program</div>
                <div className="detail-value">{sub.program_name}</div>
              </div>
              <div className="divider"></div>
              <div className="detail-field">
                <div className="detail-label">Asset</div>
                <div className="detail-value mono text-sm">{sub.asset}</div>
              </div>
              <div className="divider"></div>
              <div className="detail-field">
                <div className="detail-label">CWE</div>
                <div className="detail-value mono">{sub.cwe || '—'}</div>
              </div>
              <div className="divider"></div>
              <div className="detail-field">
                <div className="detail-label">CVSS Score</div>
                <CvssBadge cvss={sub.cvss} />
              </div>
              <div className="divider"></div>
              <div className="detail-field">
                <div className="detail-label">Submitted</div>
                <div className="detail-value text-sm">{new Date(sub.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
          </div>

          {/* Reward card */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Reward</div>
              {canSetReward && (
                <button className="btn btn-sm btn-accent" onClick={() => setShowReward(true)}>
                  <I.send size={12} /> Set
                </button>
              )}
            </div>
            <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
              {sub.reward_amount > 0 ? (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    <MoneyFmt amount={sub.reward_amount} />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <StatusBadge status={sub.reward_status} />
                  </div>
                </div>
              ) : (
                <div className="muted text-sm">No reward assigned</div>
              )}
            </div>
          </div>

          {/* Certificate card */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Certificate</div>
              {canIssueCert && (
                <button className="btn btn-sm" onClick={handleIssueCert} disabled={issuingCert}>
                  <I.certificate size={12} /> {issuingCert ? '…' : 'Issue'}
                </button>
              )}
            </div>
            <div className="card-body" style={{ textAlign: 'center', padding: 20 }}>
              {sub.certificate ? (
                <div>
                  <div className="mono strong" style={{ fontSize: 13 }}>{sub.certificate.cert_ref}</div>
                  <div className="text-xs muted" style={{ marginTop: 4 }}>
                    Issued {new Date(sub.certificate.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <a href={`/api/certificates/${sub.certificate.cert_ref}/pdf`} target="_blank" rel="noreferrer" className="btn btn-sm">
                      <I.download size={12} /> Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="muted text-sm">
                  {['accepted', 'resolved'].includes(sub.status)
                    ? (isAdmin ? 'No certificate issued yet.' : 'Not yet issued.')
                    : 'Available after acceptance.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Set Reward Modal */}
      <Modal open={showReward} onClose={() => setShowReward(false)} title="Set Reward"
        sub={`Assign a bounty for ${sub.ref}`}
        foot={
          <>
            <button className="btn" onClick={() => setShowReward(false)}>Cancel</button>
            <button className="btn btn-accent" onClick={handleSetReward} disabled={savingReward}>
              {savingReward ? 'Saving…' : 'Assign Reward'}
            </button>
          </>
        }>
        <div className="field">
          <label className="label">Reward Amount (USD)</label>
          <input className="input mono" type="number" placeholder="5000" value={rewardAmount}
            onChange={e => setRewardAmount(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Note</label>
          <textarea className="textarea" placeholder="Optional note about this reward…"
            value={rewardNote} onChange={e => setRewardNote(e.target.value)}></textarea>
        </div>
      </Modal>
    </div>
  );
};

window.SubmissionDetail = SubmissionDetail;
