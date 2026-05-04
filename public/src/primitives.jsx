// Reusable primitives for Bug Bounty Platform
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const Avatar = ({ name, color, size = 26 }) => {
  const initials = (name || '??').split(/[\s_]/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color || 'var(--ink-3)', color: 'white',
      fontSize: size * 0.42, fontWeight: 600,
      display: 'grid', placeItems: 'center', flexShrink: 0
    }}>{initials}</div>
  );
};

const Stat = ({ label, value, delta, deltaDir, hint, accent }) => (
  <div className="stat">
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={accent ? { color: `var(--${accent})` } : null}>{value}</div>
    <div className="stat-meta">
      {delta && <span className={`delta ${deltaDir || 'up'}`}>{delta}</span>}
      {hint && <span>{hint}</span>}
    </div>
  </div>
);

const SeverityBadge = ({ severity }) => {
  const map = {
    critical: { label: 'Critical', cls: 'crit' },
    high: { label: 'High', cls: 'high' },
    medium: { label: 'Medium', cls: 'med' },
    low: { label: 'Low', cls: 'low' },
    info: { label: 'Info', cls: 'info' }
  };
  const cfg = map[severity] || map.info;
  return <span className={`badge ${cfg.cls}`}><span className="badge-dot"></span>{cfg.label}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    new: { label: 'New', cls: 'high' },
    triaging: { label: 'Triaging', cls: 'info' },
    accepted: { label: 'Accepted', cls: 'ok' },
    rejected: { label: 'Rejected', cls: '' },
    duplicate: { label: 'Duplicate', cls: '' },
    resolved: { label: 'Resolved', cls: 'ok' },
    informative: { label: 'Informative', cls: '' },
    active: { label: 'Active', cls: 'ok' },
    paused: { label: 'Paused', cls: 'med' },
    archived: { label: 'Archived', cls: '' },
    paid: { label: 'Paid', cls: 'ok' },
    approved: { label: 'Approved', cls: 'ai' },
    pending: { label: 'Pending', cls: 'med' },
    cancelled: { label: 'Cancelled', cls: '' },
  };
  const cfg = map[status] || { label: status, cls: '' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

const CvssBadge = ({ cvss }) => {
  if (!cvss && cvss !== 0) return <span className="muted text-sm">—</span>;
  let cls = 'info';
  if (cvss >= 9.0) cls = 'crit';
  else if (cvss >= 7.0) cls = 'high';
  else if (cvss >= 4.0) cls = 'med';
  else if (cvss > 0) cls = 'low';
  return <span className={`cvss-badge ${cls}`}>{cvss.toFixed(1)}</span>;
};

const Modal = ({ open, onClose, title, sub, children, foot, wide }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 920 } : null} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><I.x /></button>
        </div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  );
};

const Drawer = ({ open, onClose, title, sub, children, foot, width }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="drawer" style={width ? { width } : null}>
        <div className="drawer-head">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="modal-title">{title}</div>
              {sub && <div className="modal-sub">{sub}</div>}
            </div>
            <button className="icon-btn" onClick={onClose}><I.x /></button>
          </div>
        </div>
        <div className="drawer-body">{children}</div>
        {foot && <div className="drawer-foot">{foot}</div>}
      </div>
    </>
  );
};

const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs">
    {tabs.map(t => (
      <button key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
        {t.label}
        {t.count != null && <span className="badge" style={{ marginLeft: 6 }}>{t.count}</span>}
      </button>
    ))}
  </div>
);

const Donut = ({ pct, size = 120, color = 'var(--ink)', label, sub }) => {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg className="donut" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle className="track" cx={size/2} cy={size/2} r={r} />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" fill="none" strokeWidth="10" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: size * 0.22, fontWeight: 600, lineHeight: 1 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [message]);
  if (!message) return null;
  return <div className="toast">{message}</div>;
};

const MoneyFmt = ({ amount, currency = 'USD' }) => {
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  return <span className="mono">{formatted}</span>;
};

const TimeAgo = ({ date }) => {
  if (!date) return <span className="muted">—</span>;
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  let text;
  if (mins < 1) text = 'just now';
  else if (mins < 60) text = `${mins}m ago`;
  else if (hrs < 24) text = `${hrs}h ago`;
  else if (days < 7) text = `${days}d ago`;
  else text = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return <span className="muted text-sm">{text}</span>;
};

Object.assign(window, { Avatar, Stat, SeverityBadge, StatusBadge, CvssBadge, Modal, Drawer, Tabs, Donut, Toast, MoneyFmt, TimeAgo });
