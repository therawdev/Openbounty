// Admin / Researcher Settings Page — Full-width, configurable certificate designer
const Settings = ({ user, onNotify }) => {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('platform');

  useEffect(() => {
    if (user?.role === 'admin') api.get('/api/settings').then(setSettings);
    else if (user?.role === 'researcher') api.get('/api/auth/me').then(setSettings);
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?.role === 'admin') {
        await api.put('/api/settings', settings);
        window.platformSettings = { ...window.platformSettings, ...settings };
        if (settings.platform_name) document.title = settings.platform_name;
      } else {
        await api.put(`/api/researchers/${user.id}`, { name: settings.name, handle: settings.handle, bio: settings.bio, website: settings.website });
      }
      onNotify('Settings saved');
    } catch (e) { onNotify('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  if (!settings) return <div className="center" style={{ padding: 48 }}><div className="muted">Loading...</div></div>;

  const isAdmin = user?.role === 'admin';
  const set = (k, v) => setSettings({ ...settings, [k]: v });

  // ── Helpers ──
  const isDark = (hex) => {
    if (!hex || hex.length < 7) return false;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  const getPatternCSS = (pattern, bg) => {
    const pc = isDark(bg) ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    switch (pattern) {
      case 'dots': return { backgroundImage: `radial-gradient(circle, ${pc} 1px, transparent 1px)`, backgroundSize: '12px 12px' };
      case 'grid': return { backgroundImage: `linear-gradient(${pc} 0.5px, transparent 0.5px), linear-gradient(90deg, ${pc} 0.5px, transparent 0.5px)`, backgroundSize: '14px 14px' };
      case 'lines': return { backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, ${pc} 6px, ${pc} 6.5px)` };
      case 'crosshatch': return { backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, ${pc} 6px, ${pc} 6.5px), repeating-linear-gradient(-45deg, transparent, transparent 6px, ${pc} 6px, ${pc} 6.5px)` };
      case 'diamonds': return { backgroundImage: `linear-gradient(45deg, ${pc} 12.5%, transparent 12.5%, transparent 37.5%, ${pc} 37.5%, ${pc} 62.5%, transparent 62.5%, transparent 87.5%, ${pc} 87.5%)`, backgroundSize: '12px 12px' };
      case 'checkerboard': return { backgroundImage: `linear-gradient(45deg, ${pc} 25%, transparent 25%, transparent 75%, ${pc} 75%), linear-gradient(45deg, ${pc} 25%, transparent 25%, transparent 75%, ${pc} 75%)`, backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px' };
      case 'zigzag': return { backgroundImage: `linear-gradient(135deg, ${pc} 25%, transparent 25%) -8px 0, linear-gradient(225deg, ${pc} 25%, transparent 25%) -8px 0, linear-gradient(315deg, ${pc} 25%, transparent 25%), linear-gradient(45deg, ${pc} 25%, transparent 25%)`, backgroundSize: '16px 8px' };
      case 'waves': return { backgroundImage: `repeating-radial-gradient(circle at 0 50%, transparent 0, ${pc} 12px, transparent 12px, transparent 20px)`, backgroundSize: '20px 20px' };
      case 'hexgrid': return { backgroundImage: `linear-gradient(30deg, ${pc} 12%, transparent 12.5%, transparent 87%, ${pc} 87.5%, ${pc}), linear-gradient(150deg, ${pc} 12%, transparent 12.5%, transparent 87%, ${pc} 87.5%, ${pc}), linear-gradient(30deg, ${pc} 12%, transparent 12.5%, transparent 87%, ${pc} 87.5%, ${pc}), linear-gradient(150deg, ${pc} 12%, transparent 12.5%, transparent 87%, ${pc} 87.5%, ${pc}), linear-gradient(60deg, ${pc}77 25%, transparent 25.5%, transparent 75%, ${pc}77 75%), linear-gradient(60deg, ${pc}77 25%, transparent 25.5%, transparent 75%, ${pc}77 75%)`, backgroundSize: '20px 35px', backgroundPosition: '0 0, 0 0, 10px 18px, 10px 18px, 0 0, 10px 18px' };
      case 'plus': return { backgroundImage: `linear-gradient(${pc} 2px, transparent 2px), linear-gradient(90deg, ${pc} 2px, transparent 2px)`, backgroundSize: '16px 16px', backgroundPosition: '7px 7px' };
      case 'circles': return { backgroundImage: `radial-gradient(circle, transparent 7px, ${pc} 7px, ${pc} 8px, transparent 8px)`, backgroundSize: '20px 20px' };
      default: return {};
    }
  };

  // ── Preset colors ──
  const BG_PRESETS = [
    { label: 'White', value: '#ffffff' }, { label: 'Ivory', value: '#fdf8ec' },
    { label: 'Light Gray', value: '#f0f2f5' }, { label: 'Cool Slate', value: '#e8ecf2' },
    { label: 'Warm Cream', value: '#f5f0e8' }, { label: 'Dark Navy', value: '#0f172a' },
  ];
  const BORDER_PRESETS = [
    { label: 'Navy', value: '#1a1a2e' }, { label: 'Gold', value: '#b8860b' },
    { label: 'Black', value: '#111111' }, { label: 'Charcoal', value: '#3a3a4a' },
    { label: 'Teal', value: '#0d6e6e' }, { label: 'Burgundy', value: '#6e1a2e' },
  ];
  const PATTERNS = ['none', 'dots', 'grid', 'lines', 'crosshatch', 'diamonds', 'checkerboard', 'zigzag', 'waves', 'hexgrid', 'plus', 'circles'];
  const BORDER_STYLES = ['classic', 'ornate', 'simple', 'minimal'];

  const bgColor = settings.cert_bg_color || '#ffffff';
  const bgPattern = settings.cert_bg_pattern || 'none';
  const borderColor = settings.cert_border_color || '#1a1a2e';
  const borderSt = settings.cert_border_style || 'classic';
  const dk = isDark(bgColor);
  const tp = dk ? '#f0f0f5' : '#1a1a2e';
  const tm = dk ? '#707088' : '#888899';
  const ts = dk ? '#a0a0bb' : '#666677';

  // ── Swatch component ──
  const ColorSwatch = ({ color, selected, onClick, label }) => (
    <div onClick={onClick} title={label} style={{
      width: 32, height: 32, borderRadius: 6, background: color, cursor: 'pointer',
      border: selected ? '2.5px solid var(--accent)' : '2px solid var(--line)',
      boxShadow: selected ? '0 0 0 2px var(--accent-soft)' : 'none', transition: 'all 0.15s',
    }} />
  );

  // ── Pattern swatch ──
  const PatternSwatch = ({ pattern, selected, onClick }) => (
    <button onClick={onClick} className={`tab ${selected ? 'active' : ''}`} style={{
      padding: '6px 10px', fontSize: 12, textTransform: 'capitalize', borderRadius: 'var(--radius)',
      border: selected ? '2px solid var(--accent)' : '1px solid var(--line)',
      background: selected ? 'var(--accent-soft)' : 'var(--bg)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 3, background: '#f0f2f5', ...getPatternCSS(pattern, '#f0f2f5'), border: '1px solid #ddd' }} />
      <span>{pattern === 'none' ? 'None' : pattern.charAt(0).toUpperCase() + pattern.slice(1)}</span>
    </button>
  );

  // ── Live Preview ──
  const Preview = () => {
    const borderCSS = borderSt === 'classic'
      ? { border: `3px solid ${borderColor}`, outline: `1px solid ${borderColor}44`, outlineOffset: '4px' }
      : borderSt === 'ornate'
      ? { border: `2.5px solid ${borderColor}`, outline: `0.5px solid ${borderColor}66`, outlineOffset: '4px', boxShadow: `inset 0 0 0 3px transparent, inset 0 0 0 5px ${borderColor}22` }
      : borderSt === 'simple'
      ? { border: `1.5px solid ${borderColor}` }
      : {};

    return (
      <div style={{
        width: '100%', aspectRatio: '842 / 595', borderRadius: 6, overflow: 'hidden',
        background: bgColor, ...getPatternCSS(bgPattern, bgColor), ...borderCSS,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px', position: 'relative', fontFamily: 'Helvetica, Arial, sans-serif',
      }}>
        <div style={{ fontSize: 7, color: tm, letterSpacing: 2, marginBottom: 6 }}>
          {(settings.platform_name || 'PLATFORM').toUpperCase()} · BUG BOUNTY PLATFORM
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: tp, marginBottom: 2 }}>Certificate of Recognition</div>
        <div style={{ fontSize: 8, color: ts, marginBottom: 12 }}>Responsible Vulnerability Disclosure</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 60, height: '0.5px', background: tm + '44' }} />
          <div style={{ width: 6, height: 6, background: '#b91c1c', transform: 'rotate(45deg)' }} />
          <div style={{ width: 60, height: '0.5px', background: tm + '44' }} />
        </div>

        <div style={{ fontSize: 6, color: tm, letterSpacing: 1 }}>AWARDED TO</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: tp, marginBottom: 1 }}>Researcher Name</div>
        <div style={{ fontSize: 8, color: '#b91c1c', marginBottom: 8 }}>@handle</div>

        <div style={{ fontSize: 6, color: tm, letterSpacing: 0.5 }}>FOR THE RESPONSIBLE DISCOVERY AND DISCLOSURE OF</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: tp, marginBottom: 6 }}>SQL Injection in Authentication</div>

        <div style={{ background: '#b91c1c', color: '#fff', fontSize: 7, fontWeight: 700, borderRadius: 3, padding: '2px 10px', marginBottom: 10 }}>Critical</div>

        <div style={{ fontSize: 6, color: tm }}>PROGRAM</div>
        <div style={{ fontSize: 9, color: tp, marginBottom: 10 }}>Web Application Security</div>

        <div style={{ width: '70%', height: '0.5px', background: tm + '33', marginBottom: 8 }} />

        <div style={{ display: 'flex', gap: 32 }}>
          {[['CERT ID', 'CERT-2026-001'], ['DATE', 'Jan 1, 2026'], ['STATUS', '✓ Verified']].map(([l, v], i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 5, color: tm, letterSpacing: 0.5 }}>{l}</div>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: i === 2 ? '#16a34a' : tp }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 60, marginTop: 12 }}>
          {[[settings.cert_signer_left_name || 'Maya Rivera', settings.cert_signer_left_title || 'Platform Security Director'],
            [settings.cert_signer_right_name || 'Platform', settings.cert_signer_right_title || 'Chief Security Officer']].map(([n, t], i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: tp }}>{n}</div>
              <div style={{ width: 100, height: '0.5px', background: tm + '44', margin: '3px auto 2px' }} />
              <div style={{ fontSize: 5.5, color: tm }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ADMIN_TABS = [
    { id: 'platform', label: 'Platform' },
    { id: 'certificate', label: 'Certificates' },
    { id: 'uploads', label: 'Uploads' },
  ];

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{isAdmin ? 'Platform Settings' : 'Profile Settings'}</h1>
          <div className="page-sub">{isAdmin ? 'Configure global platform behavior, certificate design, and upload limits' : 'Update your personal profile information'}</div>
        </div>
      </div>

      {isAdmin ? (
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
            {ADMIN_TABS.map(t => (
              <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`}
                style={{ padding: '10px 20px' }} onClick={() => setActiveTab(t.id)}>{t.label}</button>
            ))}
          </div>

          {/* ── Platform Tab ── */}
          {activeTab === 'platform' && (
            <div className="card" style={{ maxWidth: 640 }}>
              <div className="card-head"><div className="card-title">Branding & Identity</div></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="field">
                  <label className="label">Platform Name</label>
                  <input type="text" className="input" value={settings.platform_name || ''} onChange={e => set('platform_name', e.target.value)} />
                  <div className="muted text-sm mt-4">Shown in the sidebar and browser tab title.</div>
                </div>
                <div className="field">
                  <label className="label">Platform Subtitle</label>
                  <input type="text" className="input" value={settings.platform_subtitle || ''} onChange={e => set('platform_subtitle', e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Logo URL</label>
                  <input type="text" className="input" placeholder="https://example.com/logo.png" value={settings.logo_url || ''} onChange={e => set('logo_url', e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Certificate Tab ── */}
          {activeTab === 'certificate' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              {/* Left: Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Background Color */}
                <div className="card">
                  <div className="card-head"><div className="card-title">Background Color</div></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      {BG_PRESETS.map(p => (
                        <div key={p.value} onClick={() => set('cert_bg_color', p.value)}
                          style={{ textAlign: 'center', cursor: 'pointer' }}>
                          <ColorSwatch color={p.value} selected={bgColor === p.value} onClick={() => {}} label={p.label} />
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{p.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={bgColor} onChange={e => set('cert_bg_color', e.target.value)}
                        style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                      <input type="text" className="input mono" value={bgColor}
                        onChange={e => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) set('cert_bg_color', e.target.value); }}
                        style={{ width: 100, fontSize: 13 }} placeholder="#ffffff" />
                      <span className="muted text-sm">Custom</span>
                    </div>
                  </div>
                </div>

                {/* Background Pattern */}
                <div className="card">
                  <div className="card-head"><div className="card-title">Background Pattern</div></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {PATTERNS.map(p => (
                        <PatternSwatch key={p} pattern={p} selected={bgPattern === p} onClick={() => set('cert_bg_pattern', p)} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Border Color */}
                <div className="card">
                  <div className="card-head"><div className="card-title">Border Color</div></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      {BORDER_PRESETS.map(p => (
                        <div key={p.value} onClick={() => set('cert_border_color', p.value)}
                          style={{ textAlign: 'center', cursor: 'pointer' }}>
                          <ColorSwatch color={p.value} selected={borderColor === p.value} onClick={() => {}} label={p.label} />
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{p.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={borderColor} onChange={e => set('cert_border_color', e.target.value)}
                        style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                      <input type="text" className="input mono" value={borderColor}
                        onChange={e => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) set('cert_border_color', e.target.value); }}
                        style={{ width: 100, fontSize: 13 }} placeholder="#1a1a2e" />
                      <span className="muted text-sm">Custom</span>
                    </div>
                  </div>
                </div>

                {/* Border Style */}
                <div className="card">
                  <div className="card-head"><div className="card-title">Border Style</div></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {BORDER_STYLES.map(s => (
                        <button key={s} onClick={() => set('cert_border_style', s)}
                          className={`tab ${borderSt === s ? 'active' : ''}`}
                          style={{
                            padding: '8px 14px', fontSize: 12, textTransform: 'capitalize', borderRadius: 'var(--radius)',
                            border: borderSt === s ? '2px solid var(--accent)' : '1px solid var(--line)',
                            background: borderSt === s ? 'var(--accent-soft)' : 'var(--bg)', cursor: 'pointer',
                          }}>
                          {s === 'classic' ? 'Classic (Double Rule)' : s === 'ornate' ? 'Ornate (Triple + Diamonds)' : s === 'simple' ? 'Simple (Single Rule)' : 'Minimal (No Border)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Signatories */}
                <div className="card">
                  <div className="card-head"><div className="card-title">Certificate Signatories</div></div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                      <div className="strong text-sm" style={{ marginBottom: 10 }}>Left Signatory</div>
                      <div className="field"><label className="label">Name</label>
                        <input className="input" value={settings.cert_signer_left_name || ''} onChange={e => set('cert_signer_left_name', e.target.value)} placeholder="Maya Rivera" /></div>
                      <div className="field"><label className="label">Title</label>
                        <input className="input" value={settings.cert_signer_left_title || ''} onChange={e => set('cert_signer_left_title', e.target.value)} placeholder="Platform Security Director" /></div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                      <div className="strong text-sm" style={{ marginBottom: 10 }}>Right Signatory</div>
                      <div className="field"><label className="label">Name</label>
                        <input className="input" value={settings.cert_signer_right_name || ''} onChange={e => set('cert_signer_right_name', e.target.value)} placeholder="Platform" /></div>
                      <div className="field"><label className="label">Title</label>
                        <input className="input" value={settings.cert_signer_right_title || ''} onChange={e => set('cert_signer_right_title', e.target.value)} placeholder="Chief Security Officer" /></div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="card">
                  <div className="card-head"><div className="card-title">Certificate Footer</div></div>
                  <div className="card-body">
                    <textarea className="textarea" rows={3} placeholder="Leave blank for default verification text…"
                      value={settings.cert_footer_text || ''} onChange={e => set('cert_footer_text', e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Certificate Settings'}</button>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div style={{ position: 'sticky', top: 24 }}>
                <div className="card">
                  <div className="card-head"><div className="card-title">Live Preview</div></div>
                  <div className="card-body" style={{ padding: 16 }}>
                    <Preview />
                    <div className="muted text-sm" style={{ marginTop: 10, textAlign: 'center' }}>
                      This preview shows how the PDF certificate will look with your current settings. Changes are applied in real-time.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Uploads Tab ── */}
          {activeTab === 'uploads' && (
            <div className="card" style={{ maxWidth: 640 }}>
              <div className="card-head"><div className="card-title">Upload Limits</div></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="field">
                  <label className="label">Max Upload Size (MB)</label>
                  <input type="number" className="input mono" value={settings.max_upload_mb || 10} onChange={e => set('max_upload_mb', Number(e.target.value))} />
                  <div className="muted text-sm mt-4">Maximum file size for researcher proof of concept uploads. Default: 10 MB.</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Researcher settings */
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-head"><div className="card-title">Profile Details</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="field"><label className="label">Full Name</label>
              <input className="input" value={settings.name || ''} onChange={e => set('name', e.target.value)} /></div>
            <div className="field"><label className="label">Handle</label>
              <input className="input mono" value={settings.handle || ''} onChange={e => set('handle', e.target.value)} /></div>
            <div className="field"><label className="label">Bio</label>
              <textarea className="textarea" value={settings.bio || ''} onChange={e => set('bio', e.target.value)} style={{ minHeight: 80 }} /></div>
            <div className="field"><label className="label">Website</label>
              <input className="input" placeholder="https://" value={settings.website || ''} onChange={e => set('website', e.target.value)} /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.Settings = Settings;
