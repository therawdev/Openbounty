// Submit Report Page
const SubmitReport = ({ programId, onNav, onNotify, user }) => {
  const [program, setProgram] = useState(null);
  const [submitData, setSubmitData] = useState({ title: '', description: '', severity: 'medium', asset: '', impact: '', repro_steps: '', fix_suggestion: '', cwe: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (programId) api.get(`/api/programs/${programId}`).then(setProgram);
  }, [programId]);

  const handleSubmit = async () => {
    if (!submitData.title || !submitData.description) {
      return onNotify('Title and Description are required');
    }
    setLoading(true);
    
    const formData = new FormData();
    Object.keys(submitData).forEach(k => formData.append(k, submitData[k]));
    formData.append('program_id', programId);
    formData.append('researcher_id', user.id);
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      onNotify('Report submitted successfully');
      onNav('submissions');
    } catch (e) {
      onNotify('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    // Basic frontend validation for allowed types
    const valid = selected.filter(f => ['image/jpeg', 'image/png', 'video/mp4'].includes(f.type));
    if (valid.length < selected.length) {
      onNotify('Only JPG, PNG, and MP4 files are allowed');
    }
    setFiles([...files, ...valid].slice(0, 5)); // max 5 files
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  if (!program) return <div className="center" style={{ padding: 48 }}><div className="muted">Loading program...</div></div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('program-detail', programId)} style={{ marginBottom: 8, padding: 0 }}><I.arrow_left size={14} /> Back to {program.name}</button>
          <h1 className="page-title">Submit Vulnerability Report</h1>
          <div className="page-sub">Report a security issue to {program.name}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="field">
            <label className="label">Vulnerability Title *</label>
            <input className="input" placeholder="Brief description of the vulnerability" value={submitData.title} onChange={e => setSubmitData({...submitData, title: e.target.value})} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="field"><label className="label">Severity</label>
              <select className="select" value={submitData.severity} onChange={e => setSubmitData({...submitData, severity: e.target.value})}>
                <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="info">Informational</option>
              </select>
            </div>
            <div className="field"><label className="label">CWE ID</label><input className="input mono" placeholder="CWE-79" value={submitData.cwe} onChange={e => setSubmitData({...submitData, cwe: e.target.value})} /></div>
            <div className="field"><label className="label">Vulnerable Asset</label><input className="input mono" placeholder="/api/endpoint" value={submitData.asset} onChange={e => setSubmitData({...submitData, asset: e.target.value})} /></div>
          </div>
          
          <div className="field">
            <label className="label">Description *</label>
            <textarea className="textarea" rows={4} placeholder="Detailed description..." value={submitData.description} onChange={e => setSubmitData({...submitData, description: e.target.value})} />
          </div>
          
          <div className="field">
            <label className="label">Security Impact</label>
            <textarea className="textarea" rows={3} placeholder="What is the security impact?" value={submitData.impact} onChange={e => setSubmitData({...submitData, impact: e.target.value})} />
          </div>
          
          <div className="field">
            <label className="label">Steps to Reproduce</label>
            <textarea className="textarea mono" rows={5} placeholder="1. Navigate to...\n2. Enter...\n3. Observe..." value={submitData.repro_steps} onChange={e => setSubmitData({...submitData, repro_steps: e.target.value})} />
          </div>
          
          <div className="field">
            <label className="label">Suggested Fix</label>
            <textarea className="textarea" rows={3} placeholder="How would you fix this?" value={submitData.fix_suggestion} onChange={e => setSubmitData({...submitData, fix_suggestion: e.target.value})} />
          </div>
          
          <div className="divider" style={{ margin: '8px 0' }}></div>
          
          <div className="field">
            <label className="label">Attachments (Proof of Concept)</label>
            <div className="muted text-sm" style={{ marginBottom: 12 }}>Upload screenshots or video recordings. Supported formats: JPG, PNG, MP4. Max 5 files.</div>
            
            <label className="btn btn-sm" style={{ alignSelf: 'flex-start', cursor: 'pointer', display: 'inline-flex' }}>
              <I.upload size={14} /> Browse Files
              <input type="file" multiple accept="image/jpeg, image/png, video/mp4" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            
            {files.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map((file, idx) => (
                  <div key={idx} className="row" style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--line)', justifyContent: 'space-between' }}>
                    <div className="row gap-8">
                      {file.type.startsWith('video') ? <I.video size={16} /> : <I.image size={16} />}
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="muted text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4, height: 24 }} onClick={() => removeFile(idx)}>
                      <I.x size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button className="btn" onClick={() => onNav('program-detail', programId)} disabled={loading}>Cancel</button>
        <button className="btn btn-accent" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : <><I.send size={14} /> Submit Report</>}
        </button>
      </div>
    </div>
  );
};

window.SubmitReport = SubmitReport;
