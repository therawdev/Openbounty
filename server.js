const express = require('express');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const { initDB } = require('./db/init');
const { seedDB, hashPw } = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || `http://localhost:${process.env.PORT || 3000}`,
  credentials: true,
}));
app.use(express.json());
app.use('/landing', express.static(path.join(__dirname, 'landing')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

const db = initDB();
seedDB(db);

// ─── Column migrations (safe: ignore if column already exists) ───
const migrations = [
  `ALTER TABLE settings ADD COLUMN cert_template INTEGER DEFAULT 1`,
  `ALTER TABLE settings ADD COLUMN cert_signer_left_name TEXT DEFAULT 'Maya Rivera'`,
  `ALTER TABLE settings ADD COLUMN cert_signer_left_title TEXT DEFAULT 'Platform Security Director'`,
  `ALTER TABLE settings ADD COLUMN cert_signer_right_name TEXT DEFAULT 'OpenBounty'`,
  `ALTER TABLE settings ADD COLUMN cert_signer_right_title TEXT DEFAULT 'Chief Security Officer'`,
  `ALTER TABLE settings ADD COLUMN cert_footer_text TEXT DEFAULT ''`,
  `ALTER TABLE settings ADD COLUMN cert_bg_color TEXT DEFAULT '#ffffff'`,
  `ALTER TABLE settings ADD COLUMN cert_bg_pattern TEXT DEFAULT 'none'`,
  `ALTER TABLE settings ADD COLUMN cert_border_color TEXT DEFAULT '#1a1a2e'`,
  `ALTER TABLE settings ADD COLUMN cert_border_style TEXT DEFAULT 'classic'`,
  `ALTER TABLE comments ADD COLUMN files TEXT DEFAULT '[]'`,
  `ALTER TABLE submissions ADD COLUMN files TEXT DEFAULT '[]'`,
  `ALTER TABLE submissions ADD COLUMN reward_amount INTEGER DEFAULT 0`,
  `ALTER TABLE submissions ADD COLUMN reward_status TEXT DEFAULT 'none'`,
];
for (const sql of migrations) {
  try { db.prepare(sql).run(); } catch(e) { /* column already exists */ }
}
// Ensure settings row 1 exists
db.prepare(`INSERT OR IGNORE INTO settings (id) VALUES (1)`).run();


const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.mp4'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and MP4 files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// ─── Auth helpers ────────────────────────────────
function getSession(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return null;
  const session = db.prepare(`SELECT s.*, r.handle, r.name as researcher_name, r.avatar_color, r.id as rid
    FROM sessions s LEFT JOIN researchers r ON s.researcher_id=r.id WHERE s.token=?`).get(token);
  return session || null;
}

// ─── Auth Routes ─────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  if (email === 'admin@openbounty.io' && password === 'admin2026') {
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare(`INSERT INTO sessions (token, role) VALUES (?, 'admin')`).run(token);
    return res.json({ token, user: { id: null, handle: 'admin', name: 'Maya Rivera', email: 'admin@openbounty.io', avatar_color: '#dc2626', role: 'admin' }});
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(email);
  if (admin && admin.password === hashPw(password)) {
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare(`INSERT INTO sessions (token,researcher_id,role) VALUES (?,?,?)`).run(token, null, 'admin');
    return res.json({ token, user: { id: null, handle: 'admin', name: admin.name, email: admin.email, avatar_color: '#dc2626', role: 'admin' }});
  }

  const researcher = db.prepare('SELECT * FROM researchers WHERE email=?').get(email);
  if (!researcher || researcher.password !== hashPw(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare(`INSERT INTO sessions (token,researcher_id,role) VALUES (?,?,?)`).run(token, researcher.id, 'researcher');
  res.json({ token, user: { id: researcher.id, handle: researcher.handle, name: researcher.name, email: researcher.email, avatar_color: researcher.avatar_color, role: 'researcher' }});
});

app.post('/api/auth/register', (req, res) => {
  const { handle, name, email, password } = req.body;
  if (!handle || !email || !password) return res.status(400).json({ error: 'Handle, email, and password required' });
  
  const existing = db.prepare('SELECT id FROM researchers WHERE email=? OR handle=?').get(email, handle);
  if (existing) return res.status(409).json({ error: 'Email or handle already taken' });
  
  const colors = ['#dc2626','#7c3aed','#0369a1','#16a34a','#d97706','#0891b2','#ea580c','#8b5cf6','#059669','#be123c'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const r = db.prepare('INSERT INTO researchers (handle,name,email,password,avatar_color) VALUES (?,?,?,?,?)').run(handle, name || handle, email, hashPw(password), color);
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare(`INSERT INTO sessions (token,researcher_id,role) VALUES (?,?,?)`).run(token, r.lastInsertRowid, 'researcher');
  res.json({ token, user: { id: r.lastInsertRowid, handle, name: name || handle, email, avatar_color: color, role: 'researcher' }});
});

app.post('/api/auth/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(token);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  if (session.role === 'admin') {
    return res.json({ id: null, handle: 'admin', name: 'Maya Rivera', email: 'maya@sentinel.sec', avatar_color: '#dc2626', role: 'admin' });
  }
  const r = db.prepare('SELECT id,handle,name,email,avatar_color,bio,website,reputation,total_earned,reports_submitted,reports_valid FROM researchers WHERE id=?').get(session.researcher_id);
  if (!r) return res.status(401).json({ error: 'User not found' });
  res.json({ ...r, role: 'researcher' });
});

// ─── Stats ───────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const session = getSession(req);
  const isAdmin = session?.role === 'admin';
  const rid = session?.researcher_id;
  
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  let totalSubs, openSubs, resolvedSubs, totalPaid, totalPending, activePrograms, researchers, sevCounts, statusCounts, avgCvss;

  if (isAdmin) {
    totalSubs = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;
    openSubs = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status IN ('new','triaging')").get().c;
    resolvedSubs = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status IN ('resolved','accepted')").get().c;
    totalPaid = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM payouts WHERE status='paid'").get().s;
    totalPending = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM payouts WHERE status IN ('pending','approved')").get().s;
    activePrograms = db.prepare("SELECT COUNT(*) as c FROM programs WHERE status='active'").get().c;
    researchers = db.prepare('SELECT COUNT(*) as c FROM researchers').get().c;
    sevCounts = db.prepare("SELECT severity, COUNT(*) as c FROM submissions GROUP BY severity").all();
    statusCounts = db.prepare("SELECT status, COUNT(*) as c FROM submissions GROUP BY status").all();
    avgCvss = db.prepare("SELECT ROUND(AVG(cvss),1) as a FROM submissions WHERE cvss IS NOT NULL").get().a;
  } else {
    totalSubs = db.prepare('SELECT COUNT(*) as c FROM submissions WHERE researcher_id=?').get(rid).c;
    openSubs = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE researcher_id=? AND status IN ('new','triaging')").get(rid).c;
    resolvedSubs = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE researcher_id=? AND status IN ('resolved','accepted')").get(rid).c;
    totalPaid = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM payouts WHERE researcher_id=? AND status='paid'").get(rid).s;
    totalPending = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM payouts WHERE researcher_id=? AND status IN ('pending','approved')").get(rid).s;
    activePrograms = db.prepare("SELECT COUNT(*) as c FROM programs WHERE status='active'").get().c;
    researchers = db.prepare('SELECT COUNT(*) as c FROM researchers').get().c;
    sevCounts = db.prepare("SELECT severity, COUNT(*) as c FROM submissions WHERE researcher_id=? GROUP BY severity").all(rid);
    statusCounts = db.prepare("SELECT status, COUNT(*) as c FROM submissions WHERE researcher_id=? GROUP BY status").all(rid);
    avgCvss = db.prepare("SELECT ROUND(AVG(cvss),1) as a FROM submissions WHERE researcher_id=? AND cvss IS NOT NULL").get(rid).a;
  }

  res.json({
    totalSubmissions: totalSubs, openSubmissions: openSubs, resolvedSubmissions: resolvedSubs,
    totalPaid, totalPending, activePrograms, totalResearchers: researchers,
    severityCounts: Object.fromEntries(sevCounts.map(r => [r.severity, r.c])),
    statusCounts: Object.fromEntries(statusCounts.map(r => [r.status, r.c])),
    avgCvss: avgCvss || 0
  });
});

// ─── Programs ────────────────────────────────────
app.get('/api/programs', (req, res) => {
  const programs = db.prepare(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM submissions s WHERE s.program_id=p.id) as submission_count,
      (SELECT COALESCE(SUM(amount),0) FROM payouts py JOIN submissions s2 ON py.submission_id=s2.id WHERE s2.program_id=p.id AND py.status='paid') as total_paid
    FROM programs p ORDER BY p.created_at DESC
  `).all();
  programs.forEach(p => {
    p.scope_in = JSON.parse(p.scope_in || '[]');
    p.scope_out = JSON.parse(p.scope_out || '[]');
  });
  res.json(programs);
});

app.get('/api/programs/:id', (req, res) => {
  const session = getSession(req);
  const isAdmin = session?.role === 'admin';
  const p = db.prepare(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM submissions s WHERE s.program_id=p.id) as submission_count,
      (SELECT COALESCE(SUM(amount),0) FROM payouts py JOIN submissions s2 ON py.submission_id=s2.id WHERE s2.program_id=p.id AND py.status='paid') as total_paid,
      (SELECT COUNT(DISTINCT researcher_id) FROM submissions WHERE program_id=p.id) as researcher_count
    FROM programs p WHERE p.id=?
  `).get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  p.scope_in = JSON.parse(p.scope_in || '[]');
  p.scope_out = JSON.parse(p.scope_out || '[]');
  // Researchers only see their own submissions in program detail
  if (isAdmin) {
    p.submissions = db.prepare(`SELECT s.*, r.handle as researcher_handle, r.avatar_color FROM submissions s LEFT JOIN researchers r ON s.researcher_id=r.id WHERE s.program_id=? ORDER BY s.created_at DESC`).all(req.params.id);
    const sevCounts = db.prepare(`SELECT severity, COUNT(*) as c FROM submissions WHERE program_id=? GROUP BY severity`).all(req.params.id);
    p.severityCounts = Object.fromEntries(sevCounts.map(r => [r.severity, r.c]));
  } else {
    const rid = session?.researcher_id;
    p.submissions = rid ? db.prepare(`SELECT s.*, r.handle as researcher_handle, r.avatar_color FROM submissions s LEFT JOIN researchers r ON s.researcher_id=r.id WHERE s.program_id=? AND s.researcher_id=? ORDER BY s.created_at DESC`).all(req.params.id, rid) : [];
    p.severityCounts = null; // Private for researchers
    p.submission_count = p.submissions.length;
  }
  // Hall of Fame
  p.hall_of_fame = db.prepare(`
    SELECT r.id, r.handle, r.avatar_color, r.name, COUNT(s.id) as valid_bugs, SUM(s.reward_amount) as total_bounty
    FROM submissions s 
    JOIN researchers r ON s.researcher_id = r.id 
    WHERE s.program_id = ? AND s.status IN ('resolved', 'accepted')
    GROUP BY r.id
    ORDER BY valid_bugs DESC, total_bounty DESC
  `).all(req.params.id);

  res.json(p);
});

app.put('/api/programs/:id', (req, res) => {
  const session = getSession(req);
  if (session?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { name, description, scope_in, scope_out, reward_low, reward_high, reward_crit, reward_med, reward_info, status, policy, response_sla_hours, offers_bounty, offers_certificate } = req.body;
  const sets = []; const vals = [];
  if (name !== undefined) { sets.push('name=?'); vals.push(name); }
  if (description !== undefined) { sets.push('description=?'); vals.push(description); }
  if (scope_in !== undefined) { sets.push('scope_in=?'); vals.push(JSON.stringify(scope_in)); }
  if (scope_out !== undefined) { sets.push('scope_out=?'); vals.push(JSON.stringify(scope_out)); }
  if (reward_low !== undefined) { sets.push('reward_low=?'); vals.push(reward_low); }
  if (reward_high !== undefined) { sets.push('reward_high=?'); vals.push(reward_high); }
  if (reward_crit !== undefined) { sets.push('reward_crit=?'); vals.push(reward_crit); }
  if (reward_med !== undefined) { sets.push('reward_med=?'); vals.push(reward_med); }
  if (reward_info !== undefined) { sets.push('reward_info=?'); vals.push(reward_info); }
  if (status !== undefined) { sets.push('status=?'); vals.push(status); }
  if (policy !== undefined) { sets.push('policy=?'); vals.push(policy); }
  if (response_sla_hours !== undefined) { sets.push('response_sla_hours=?'); vals.push(response_sla_hours); }
  if (offers_bounty !== undefined) { sets.push('offers_bounty=?'); vals.push(offers_bounty ? 1 : 0); }
  if (offers_certificate !== undefined) { sets.push('offers_certificate=?'); vals.push(offers_certificate ? 1 : 0); }
  sets.push("updated_at=datetime('now')");
  vals.push(req.params.id);
  if (sets.length > 1) db.prepare(`UPDATE programs SET ${sets.join(',')} WHERE id=?`).run(...vals);
  res.json({ ok: true });
});

app.post('/api/programs', (req, res) => {
  const session = getSession(req);
  if (session?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { name, slug, description, scope_in, scope_out, reward_low, reward_high, reward_crit, policy, offers_bounty, offers_certificate } = req.body;
  const r = db.prepare('INSERT INTO programs (name,slug,description,scope_in,scope_out,reward_low,reward_high,reward_crit,policy,offers_bounty,offers_certificate) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
    name, slug, description, JSON.stringify(scope_in||[]), JSON.stringify(scope_out||[]), reward_low||0, reward_high||0, reward_crit||0, policy||'', offers_bounty?1:0, offers_certificate?1:0
  );
  res.json({ id: r.lastInsertRowid });
});

// ─── Submissions (access-controlled) ─────────────
app.get('/api/submissions', (req, res) => {
  const session = getSession(req);
  const isAdmin = session?.role === 'admin';
  if (isAdmin) {
    const subs = db.prepare(`
      SELECT s.*, p.name as program_name, r.handle as researcher_handle, r.avatar_color 
      FROM submissions s 
      LEFT JOIN programs p ON s.program_id=p.id 
      LEFT JOIN researchers r ON s.researcher_id=r.id 
      ORDER BY s.created_at DESC
    `).all();
    return res.json(subs);
  }
  // Researchers only see their own submissions
  const rid = session?.researcher_id;
  if (!rid) return res.json([]);
  const subs = db.prepare(`
    SELECT s.*, p.name as program_name, r.handle as researcher_handle, r.avatar_color 
    FROM submissions s 
    LEFT JOIN programs p ON s.program_id=p.id 
    LEFT JOIN researchers r ON s.researcher_id=r.id 
    WHERE s.researcher_id=?
    ORDER BY s.created_at DESC
  `).all(rid);
  res.json(subs);
});

app.get('/api/submissions/:id', (req, res) => {
  const session = getSession(req);
  const isAdmin = session?.role === 'admin';
  const sub = db.prepare(`
    SELECT s.*, p.name as program_name, r.handle as researcher_handle, r.name as researcher_name, r.avatar_color
    FROM submissions s 
    LEFT JOIN programs p ON s.program_id=p.id 
    LEFT JOIN researchers r ON s.researcher_id=r.id 
    WHERE s.id=?
  `).get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  // Researchers can only view their own submissions
  if (!isAdmin && session?.researcher_id !== sub.researcher_id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  // Researchers don't see internal comments
  const comments = isAdmin
    ? db.prepare('SELECT * FROM comments WHERE submission_id=? ORDER BY created_at ASC').all(req.params.id)
    : db.prepare('SELECT * FROM comments WHERE submission_id=? AND is_internal=0 ORDER BY created_at ASC').all(req.params.id);
  const cert = db.prepare('SELECT * FROM certificates WHERE submission_id=?').get(req.params.id);
  try { sub.files = JSON.parse(sub.files || '[]'); } catch(e) { sub.files = []; }
  comments.forEach(c => {
    try { c.files = JSON.parse(c.files || '[]'); } catch(e) { c.files = []; }
  });
  res.json({ ...sub, comments, certificate: cert || null });
});

app.put('/api/submissions/:id', (req, res) => {
  // Only admins can update submission status/rewards
  const session = getSession(req);
  if (session?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { status, reward_amount, reward_status } = req.body;
  const sets = []; const vals = [];
  if (status) { sets.push('status=?'); vals.push(status); }
  if (reward_amount !== undefined) { sets.push('reward_amount=?'); vals.push(reward_amount); }
  if (reward_status) { sets.push('reward_status=?'); vals.push(reward_status); }
  sets.push("updated_at=datetime('now')");
  vals.push(req.params.id);
  db.prepare(`UPDATE submissions SET ${sets.join(',')} WHERE id=?`).run(...vals);
  res.json({ ok: true });
});

app.post('/api/submissions', (req, res) => {
  const session = getSession(req);
  if (!session || session.role !== 'researcher' || !session.researcher_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  upload.array('files', 5)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { title, description, severity, cvss, cwe, program_id, asset, impact, repro_steps, fix_suggestion } = req.body;
    const researcher_id = session.researcher_id;
    const count = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;
    const ref = `VD-2026-${String(count + 1).padStart(3, '0')}`;
    const filePaths = (req.files || []).map(f => `/uploads/${f.filename}`);
    const r = db.prepare('INSERT INTO submissions (ref,title,description,severity,cvss,cwe,program_id,researcher_id,asset,impact,repro_steps,fix_suggestion,files) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
      ref, title, description, severity || 'medium', cvss || null, cwe || null, program_id, researcher_id, asset || '', impact || '', repro_steps || '', fix_suggestion || '', JSON.stringify(filePaths)
    );
    db.prepare('UPDATE researchers SET reports_submitted=reports_submitted+1 WHERE id=?').run(researcher_id);
    res.json({ id: r.lastInsertRowid, ref });
  });
});

app.get('/api/settings', (req, res) => {
  // Ensure a default row exists
  const existing = db.prepare('SELECT * FROM settings WHERE id=1').get();
  if (!existing) {
    db.prepare(`INSERT OR IGNORE INTO settings (id) VALUES (1)`).run();
  }
  const settings = db.prepare('SELECT * FROM settings WHERE id=1').get();
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const session = getSession(req);
  if (session?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  
  // Ensure row exists
  db.prepare(`INSERT OR IGNORE INTO settings (id) VALUES (1)`).run();

  const allowed = ['max_upload_mb','platform_name','platform_subtitle','logo_url',
    'cert_template','cert_signer_left_name','cert_signer_left_title',
    'cert_signer_right_name','cert_signer_right_title','cert_footer_text',
    'cert_bg_color','cert_bg_pattern','cert_border_color','cert_border_style'];
  const sets = []; const vals = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) { sets.push(`${key}=?`); vals.push(req.body[key]); }
  }
  if (sets.length > 0) {
    db.prepare(`UPDATE settings SET ${sets.join(',')} WHERE id=1`).run(...vals);
  }
  res.json({ ok: true });
});

app.post('/api/submissions/:id/comments', (req, res) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { author_type, author_name, body, is_internal } = req.body;
    const filePaths = (req.files || []).map(f => `/uploads/${f.filename}`);
    const isInt = is_internal === 'true' || is_internal === true ? 1 : 0;
    const r = db.prepare('INSERT INTO comments (submission_id,author_type,author_name,body,is_internal,files) VALUES (?,?,?,?,?,?)').run(
      req.params.id, author_type, author_name, body, isInt, JSON.stringify(filePaths)
    );
    res.json({ id: r.lastInsertRowid });
  });
});

// ─── Researchers ─────────────────────────────────
app.get('/api/researchers', (req, res) => {
  res.json(db.prepare('SELECT id,handle,name,email,avatar_color,bio,website,reputation,total_earned,reports_submitted,reports_valid,joined_at,status FROM researchers ORDER BY reputation DESC').all());
});

app.put('/api/researchers/:id', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const isAdmin = session.role === 'admin';
  const isSelf = session.researcher_id === parseInt(req.params.id);
  
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Forbidden' });

  const { handle, name, bio, website, status } = req.body;
  const sets = [];
  const vals = [];

  if (handle !== undefined) { sets.push('handle=?'); vals.push(handle); }
  if (name !== undefined) { sets.push('name=?'); vals.push(name); }
  if (bio !== undefined) { sets.push('bio=?'); vals.push(bio); }
  if (website !== undefined) { sets.push('website=?'); vals.push(website); }
  
  if (isAdmin && status !== undefined) { sets.push('status=?'); vals.push(status); }

  if (sets.length > 0) {
    vals.push(req.params.id);
    try {
      db.prepare(`UPDATE researchers SET ${sets.join(',')} WHERE id=?`).run(...vals);
    } catch(err) {
      return res.status(400).json({ error: err.message });
    }
  }
  res.json({ ok: true });
});

app.delete('/api/researchers/:id', (req, res) => {
  const session = getSession(req);
  if (session?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM sessions WHERE researcher_id=?').run(id);
  db.prepare('DELETE FROM researchers WHERE id=?').run(id);
  res.json({ ok: true });
});

app.put('/api/researchers/:id/password', (req, res) => {
  const session = getSession(req);
  if (session?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  db.prepare('UPDATE researchers SET password=? WHERE id=?').run(hashPw(password), req.params.id);
  res.json({ ok: true });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(db.prepare(`SELECT id,handle,name,avatar_color,reputation,total_earned,reports_submitted,reports_valid FROM researchers WHERE status='active' ORDER BY reputation DESC LIMIT 20`).all());
});

// ─── Payouts ─────────────────────────────────────
app.get('/api/payouts', (req, res) => {
  const payouts = db.prepare(`
    SELECT py.*, s.ref as submission_ref, s.title as submission_title, r.handle as researcher_handle, r.avatar_color
    FROM payouts py LEFT JOIN submissions s ON py.submission_id=s.id LEFT JOIN researchers r ON py.researcher_id=r.id
    ORDER BY py.created_at DESC
  `).all();
  res.json(payouts);
});

app.post('/api/payouts', (req, res) => {
  const session = getSession(req);
  if (session?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { submission_id, amount, note } = req.body;
  if (!submission_id || !amount) return res.status(400).json({ error: 'submission_id and amount required' });
  const sub = db.prepare('SELECT researcher_id FROM submissions WHERE id=?').get(submission_id);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  const existing = db.prepare("SELECT id FROM payouts WHERE submission_id=?").get(submission_id);
  if (existing) return res.status(409).json({ error: 'Reward already assigned for this submission' });
  const r = db.prepare("INSERT INTO payouts (submission_id,researcher_id,amount,note,status) VALUES (?,?,?,?,'pending')").run(submission_id, sub.researcher_id, amount, note || '');
  db.prepare("UPDATE submissions SET reward_amount=?, reward_status='pending' WHERE id=?").run(amount, submission_id);
  db.prepare('INSERT INTO notifications (user_id,title,message,link) VALUES (?,?,?,?)').run(
    sub.researcher_id, 'Bounty Reward Assigned', `A reward of $${amount} has been assigned to your submission.`, `/#/submission-detail/${submission_id}`
  );
  res.json({ id: r.lastInsertRowid });
});

// ─── Activity (scoped to user) ───────────────────
app.get('/api/activity', (req, res) => {
  const session = getSession(req);
  if (session?.role === 'admin') {
    return res.json(db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20').all());
  }
  // Researcher: only activity related to their submissions
  const rid = session?.researcher_id;
  if (!rid) return res.json([]);
  const subIds = db.prepare('SELECT id FROM submissions WHERE researcher_id=?').all(rid).map(r => r.id);
  if (subIds.length === 0) return res.json([]);
  const placeholders = subIds.map(() => '?').join(',');
  const activity = db.prepare(`SELECT * FROM activity_log WHERE (target_type='submission' AND target_id IN (${placeholders})) OR (target_type='payout' AND target_id IN (SELECT id FROM payouts WHERE researcher_id=?)) ORDER BY created_at DESC LIMIT 20`).all(...subIds, rid);
  res.json(activity);
});

// ─── Certificates ────────────────────────────────
app.get('/api/certificates', (req, res) => {
  res.json(db.prepare('SELECT * FROM certificates ORDER BY issued_at DESC').all());
});

app.get('/api/certificates/:ref', (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE cert_ref=?').get(req.params.ref);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  res.json(cert);
});

app.post('/api/certificates', (req, res) => {
  const { submission_id } = req.body;
  const sub = db.prepare(`SELECT s.*, p.name as program_name, r.name as researcher_name, r.handle as researcher_handle
    FROM submissions s LEFT JOIN programs p ON s.program_id=p.id LEFT JOIN researchers r ON s.researcher_id=r.id WHERE s.id=?`).get(submission_id);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  const existing = db.prepare('SELECT id FROM certificates WHERE submission_id=?').get(submission_id);
  if (existing) return res.status(409).json({ error: 'Certificate already exists' });
  const count = db.prepare('SELECT COUNT(*) as c FROM certificates').get().c;
  const certRef = `CERT-2026-${String(count + 1).padStart(3, '0')}`;
  db.prepare('INSERT INTO certificates (cert_ref,submission_id,researcher_id,program_id,researcher_name,researcher_handle,program_name,vulnerability_title,severity) VALUES (?,?,?,?,?,?,?,?,?)').run(
    certRef, submission_id, sub.researcher_id, sub.program_id, sub.researcher_name, sub.researcher_handle, sub.program_name, sub.title, sub.severity
  );
  
  // Notify researcher
  db.prepare('INSERT INTO notifications (user_id,title,message,link) VALUES (?,?,?,?)').run(
    sub.researcher_id, 'Certificate Issued', `You earned a certificate for ${sub.title}!`, `/#/certificates/${certRef}`
  );
  
  res.json({ cert_ref: certRef });
});

// ─── Search ──────────────────────────────────────
app.get('/api/search', (req, res) => {
  const session = getSession(req);
  if (!session) return res.json([]);
  const q = `%${req.query.q || ''}%`;
  const results = [];
  
  // Search Programs
  const progs = db.prepare('SELECT id,name FROM programs WHERE name LIKE ? OR description LIKE ? LIMIT 5').all(q, q);
  progs.forEach(p => results.push({ type: 'program', id: p.id, title: p.name, link: `/#/program/${p.id}` }));
  
  // Search Submissions
  if (session.role === 'admin') {
    const subs = db.prepare('SELECT id,title,ref FROM submissions WHERE title LIKE ? OR ref LIKE ? LIMIT 5').all(q, q);
    subs.forEach(s => results.push({ type: 'submission', id: s.id, title: s.title, sub: s.ref, link: `/#/submit-report/${s.id}` }));
    
    // Search Researchers
    const resers = db.prepare('SELECT id,handle,name FROM researchers WHERE handle LIKE ? OR name LIKE ? LIMIT 5').all(q, q);
    resers.forEach(r => results.push({ type: 'researcher', id: r.id, title: r.name, sub: '@'+r.handle, link: `/#/researchers` }));
  } else {
    const subs = db.prepare('SELECT id,title,ref FROM submissions WHERE researcher_id=? AND (title LIKE ? OR ref LIKE ?) LIMIT 5').all(session.researcher_id, q, q);
    subs.forEach(s => results.push({ type: 'submission', id: s.id, title: s.title, sub: s.ref, link: `/#/submit-report/${s.id}` }));
  }
  
  res.json(results);
});

// ─── Notifications ───────────────────────────────
app.get('/api/notifications', (req, res) => {
  const session = getSession(req);
  if (!session) return res.json([]);
  const rid = session.researcher_id || 0; // 0 for admin for now
  res.json(db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(rid));
});

app.put('/api/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/researchers/:id/certificates', (req, res) => {
  res.json(db.prepare('SELECT * FROM certificates WHERE researcher_id=? ORDER BY issued_at DESC').all(req.params.id));
});

// ─── PDF Certificate Generation ──────────────────
app.get('/api/certificates/:ref/pdf', (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE cert_ref=?').get(req.params.ref);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });

  // Load platform settings
  db.prepare(`INSERT OR IGNORE INTO settings (id) VALUES (1)`).run();
  const s = db.prepare('SELECT * FROM settings WHERE id=1').get() || {};
  const platformName = s.platform_name || 'OpenBounty';
  const signerLeftName = s.cert_signer_left_name || 'Maya Rivera';
  const signerLeftTitle = s.cert_signer_left_title || 'Platform Security Director';
  const signerRightName = s.cert_signer_right_name || platformName;
  const signerRightTitle = s.cert_signer_right_title || 'Chief Security Officer';
  const footerText = s.cert_footer_text || `This certificate verifies that ${cert.researcher_name} (@${cert.researcher_handle}) responsibly disclosed a security vulnerability to ${cert.program_name} through the ${platformName} Bug Bounty Platform.`;
  const bgColor = s.cert_bg_color || '#ffffff';
  const bgPattern = s.cert_bg_pattern || 'none';
  const borderColor = s.cert_border_color || '#1a1a2e';
  const borderStyle = s.cert_border_style || 'classic';

  // Auto-compute text colors from background luminance
  const hexToLum = (h) => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return(r*299+g*587+b*114)/1000; };
  const dark = hexToLum(bgColor) < 128;
  const textPrimary = dark ? '#f0f0f5' : '#1a1a2e';
  const textSub = dark ? '#a0a0bb' : '#666677';
  const textMuted = dark ? '#707088' : '#888899';
  const lineCol = dark ? '#444466' : '#ccccdd';
  // Lighter version of border color for secondary rules
  const bR=parseInt(borderColor.slice(1,3),16),bG=parseInt(borderColor.slice(3,5),16),bB=parseInt(borderColor.slice(5,7),16);
  const borderLight = `#${Math.min(255,bR+60).toString(16).padStart(2,'0')}${Math.min(255,bG+60).toString(16).padStart(2,'0')}${Math.min(255,bB+60).toString(16).padStart(2,'0')}`;
  const borderMid = `#${Math.min(255,bR+30).toString(16).padStart(2,'0')}${Math.min(255,bG+30).toString(16).padStart(2,'0')}${Math.min(255,bB+30).toString(16).padStart(2,'0')}`;
  // Pattern color
  const patCol = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const patColOpaque = dark ? '#1e1e30' : '#f0f0f0';

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 40, bottom: 40, left: 50, right: 50 } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${cert.cert_ref}.pdf"`);
  doc.pipe(res);

  const W = 842; const H = 595;
  const sevColors = { critical: '#b91c1c', high: '#ea580c', medium: '#d97706', low: '#0369a1', info: '#6b7280' };
  const sevColor = sevColors[cert.severity] || '#7c3aed';
  const sevLabel = cert.severity.charAt(0).toUpperCase() + cert.severity.slice(1);

  // ── Background ──
  doc.rect(0, 0, W, H).fill(bgColor);

  // ── Pattern overlay ──
  if (bgPattern === 'dots') {
    for (let px = 16; px < W; px += 16) for (let py = 16; py < H; py += 16) doc.circle(px, py, 0.7).fill(patColOpaque);
  } else if (bgPattern === 'grid') {
    for (let px = 20; px < W; px += 20) doc.lineWidth(0.3).strokeColor(patColOpaque).moveTo(px,0).lineTo(px,H).stroke();
    for (let py = 20; py < H; py += 20) doc.lineWidth(0.3).strokeColor(patColOpaque).moveTo(0,py).lineTo(W,py).stroke();
  } else if (bgPattern === 'lines') {
    for (let i = -H; i < W+H; i += 14) doc.lineWidth(0.3).strokeColor(patColOpaque).moveTo(i,0).lineTo(i+H,H).stroke();
  } else if (bgPattern === 'crosshatch') {
    for (let i = -H; i < W+H; i += 14) {
      doc.lineWidth(0.3).strokeColor(patColOpaque).moveTo(i,0).lineTo(i+H,H).stroke();
      doc.lineWidth(0.3).strokeColor(patColOpaque).moveTo(i,H).lineTo(i+H,0).stroke();
    }
  } else if (bgPattern === 'diamonds') {
    for (let px = 0; px < W; px += 22) for (let py = 0; py < H; py += 22)
      doc.save().translate(px+11,py+11).rotate(45).rect(-4,-4,8,8).lineWidth(0.3).strokeColor(patColOpaque).stroke().restore();
  } else if (bgPattern === 'checkerboard') {
    const cs = 16;
    for (let px = 0; px < W; px += cs) for (let py = 0; py < H; py += cs)
      if ((Math.floor(px/cs) + Math.floor(py/cs)) % 2 === 0) doc.rect(px, py, cs, cs).fill(patColOpaque);
  } else if (bgPattern === 'zigzag') {
    for (let py = 0; py < H; py += 16) {
      const p = doc.moveTo(0, py);
      for (let px = 0; px < W; px += 12) p.lineTo(px + 6, py + (px % 24 < 12 ? 8 : -8));
      p.lineWidth(0.4).strokeColor(patColOpaque).stroke();
    }
  } else if (bgPattern === 'waves') {
    for (let py = 10; py < H; py += 20) {
      const p = doc.moveTo(0, py);
      for (let px = 0; px < W; px += 20) p.bezierCurveTo(px+5, py-6, px+15, py+6, px+20, py);
      p.lineWidth(0.4).strokeColor(patColOpaque).stroke();
    }
  } else if (bgPattern === 'hexgrid') {
    const hs = 18; const hr = hs * 0.577;
    for (let row = 0; row < H / (hr*1.5) + 1; row++) {
      for (let col = 0; col < W / hs + 1; col++) {
        const cx = col * hs + (row % 2 ? hs/2 : 0);
        const cy = row * hr * 1.5;
        const pts = []; for (let a = 0; a < 6; a++) { const ang = Math.PI/6 + a*Math.PI/3; pts.push([cx+Math.cos(ang)*hr*0.6, cy+Math.sin(ang)*hr*0.6]); }
        doc.moveTo(pts[0][0],pts[0][1]); pts.slice(1).forEach(([x,y])=>doc.lineTo(x,y)); doc.closePath().lineWidth(0.3).strokeColor(patColOpaque).stroke();
      }
    }
  } else if (bgPattern === 'plus') {
    const ps = 16; const pw = 1.5;
    for (let px = ps/2; px < W; px += ps) for (let py = ps/2; py < H; py += ps) {
      doc.rect(px-pw/2, py-3, pw, 6).fill(patColOpaque);
      doc.rect(px-3, py-pw/2, 6, pw).fill(patColOpaque);
    }
  } else if (bgPattern === 'circles') {
    for (let px = 10; px < W; px += 22) for (let py = 10; py < H; py += 22)
      doc.circle(px, py, 5).lineWidth(0.4).strokeColor(patColOpaque).stroke();
  }

  // ── Border ──
  if (borderStyle === 'classic') {
    doc.lineWidth(3).strokeColor(borderColor).rect(20,20,W-40,H-40).stroke();
    doc.lineWidth(1).strokeColor(borderMid).rect(28,28,W-56,H-56).stroke();
    const cL=30,pad=35;
    [[pad,pad,1,1],[W-pad,pad,-1,1],[pad,H-pad,1,-1],[W-pad,H-pad,-1,-1]].forEach(([x,y,dx,dy])=>{
      doc.lineWidth(1.5).strokeColor(borderLight);
      doc.moveTo(x,y).lineTo(x+cL*dx,y).stroke(); doc.moveTo(x,y).lineTo(x,y+cL*dy).stroke();
    });
  } else if (borderStyle === 'ornate') {
    doc.lineWidth(2.5).strokeColor(borderColor).rect(18,18,W-36,H-36).stroke();
    doc.lineWidth(0.5).strokeColor(borderLight).rect(26,26,W-52,H-52).stroke();
    doc.lineWidth(0.5).strokeColor(borderLight).rect(32,32,W-64,H-64).stroke();
    [[22,22],[W-22,22],[22,H-22],[W-22,H-22]].forEach(([cx,cy])=>{
      doc.save().translate(cx,cy).rotate(45).rect(-5,-5,10,10).fillColor(borderColor).fill().restore();
    });
    [[W/2,18],[W/2,H-18],[18,H/2],[W-18,H/2]].forEach(([cx,cy])=>{
      doc.save().translate(cx,cy).rotate(45).rect(-3,-3,6,6).fillColor(borderLight).fill().restore();
    });
  } else if (borderStyle === 'simple') {
    doc.lineWidth(1.5).strokeColor(borderColor).rect(24,24,W-48,H-48).stroke();
  }
  // 'minimal' = no border

  // ── Content (centered Classic layout) ──
  doc.fontSize(9).fillColor(textMuted).font('Helvetica')
    .text(`${platformName.toUpperCase()} \u00b7 BUG BOUNTY PLATFORM`, 0, 55, { align: 'center', width: W });
  doc.fontSize(32).fillColor(textPrimary).font('Helvetica-Bold')
    .text('Certificate of Recognition', 0, 85, { align: 'center', width: W });
  doc.fontSize(11).fillColor(textSub).font('Helvetica')
    .text('Responsible Vulnerability Disclosure', 0, 125, { align: 'center', width: W });

  // Decorative line with diamond
  const lineY = 150;
  doc.lineWidth(0.5).strokeColor(lineCol);
  doc.moveTo(W/2-120,lineY).lineTo(W/2-10,lineY).stroke();
  doc.moveTo(W/2+10,lineY).lineTo(W/2+120,lineY).stroke();
  doc.save().translate(W/2,lineY).rotate(45).rect(-4,-4,8,8).fillColor(sevColor).fill().restore();

  // Awarded to
  doc.fontSize(9).fillColor(textMuted).font('Helvetica').text('AWARDED TO', 0, 170, { align: 'center', width: W });
  doc.fontSize(26).fillColor(textPrimary).font('Helvetica-Bold').text(cert.researcher_name, 0, 188, { align: 'center', width: W });
  doc.fontSize(12).fillColor(sevColor).font('Helvetica').text(`@${cert.researcher_handle}`, 0, 222, { align: 'center', width: W });

  // Vulnerability
  doc.fontSize(9).fillColor(textMuted).font('Helvetica').text('FOR THE RESPONSIBLE DISCOVERY AND DISCLOSURE OF', 0, 255, { align: 'center', width: W });
  doc.fontSize(16).fillColor(textPrimary).font('Helvetica-Bold').text(cert.vulnerability_title, 60, 275, { align: 'center', width: W-120 });

  // Severity badge
  const badgeW = doc.widthOfString(sevLabel, { font: 'Helvetica-Bold', fontSize: 10 }) + 24;
  const badgeX = W/2 - badgeW/2;
  doc.roundedRect(badgeX, 305, badgeW, 22, 4).fillColor(sevColor).fill();
  doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold').text(sevLabel, badgeX, 311, { width: badgeW, align: 'center' });

  // Program
  doc.fontSize(9).fillColor(textMuted).font('Helvetica').text('PROGRAM', 0, 345, { align: 'center', width: W });
  doc.fontSize(14).fillColor(textPrimary).font('Helvetica').text(cert.program_name, 0, 362, { align: 'center', width: W });

  // Divider
  doc.lineWidth(0.5).strokeColor(lineCol).moveTo(150, 395).lineTo(W-150, 395).stroke();

  // Three columns
  const colW = 200; const colStart = W/2 - colW*1.5;
  [[colStart,'CERTIFICATE ID',cert.cert_ref],[colStart+colW,'DATE ISSUED',new Date(cert.issued_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})],[colStart+colW*2,'VERIFICATION','Verified \u2713']].forEach(([x,label,val],i)=>{
    doc.fontSize(8).fillColor(textMuted).font('Helvetica').text(label, x, 410, { width: colW, align: 'center' });
    doc.fontSize(11).fillColor(i===2 ? '#16a34a' : textPrimary).font('Helvetica-Bold').text(val, x, 425, { width: colW, align: 'center' });
  });

  // Signatures
  const sigY = 470;
  doc.lineWidth(0.5).strokeColor(lineCol).moveTo(130, sigY+25).lineTo(330, sigY+25).stroke();
  doc.fontSize(9).fillColor(textMuted).font('Helvetica').text(signerLeftTitle, 130, sigY+30, { width: 200, align: 'center' });
  doc.fontSize(11).fillColor(textPrimary).font('Helvetica-Bold').text(signerLeftName, 130, sigY+10, { width: 200, align: 'center' });
  doc.lineWidth(0.5).strokeColor(lineCol).moveTo(W-330, sigY+25).lineTo(W-130, sigY+25).stroke();
  doc.fontSize(9).fillColor(textMuted).font('Helvetica').text(signerRightTitle, W-330, sigY+30, { width: 200, align: 'center' });
  doc.fontSize(11).fillColor(textPrimary).font('Helvetica-Bold').text(signerRightName, W-330, sigY+10, { width: 200, align: 'center' });

  // Footer
  doc.fontSize(8).fillColor(textMuted).font('Helvetica').text(footerText, 80, H-55, { width: W-160, align: 'center' });

  doc.end();
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🛡️  OpenBounty Bug Bounty Platform`);
  console.log(`  → http://localhost:${PORT}\n`);
});
