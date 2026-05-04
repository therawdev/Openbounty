const Database = require('better-sqlite3');
const path = require('path');

function initDB(dbPath) {
  const db = new Database(dbPath || path.join(__dirname, '..', 'sechub.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      scope_in TEXT,
      scope_out TEXT,
      reward_low INTEGER DEFAULT 0,
      reward_high INTEGER DEFAULT 0,
      reward_crit INTEGER DEFAULT 0,
      reward_info INTEGER DEFAULT 0,
      reward_med INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      policy TEXT,
      safe_harbor INTEGER DEFAULT 1,
      offers_bounty INTEGER DEFAULT 1,
      offers_certificate INTEGER DEFAULT 0,
      response_sla_hours INTEGER DEFAULT 48,
      logo_color TEXT DEFAULT '#dc2626',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS researchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handle TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      avatar_color TEXT DEFAULT '#7c3aed',
      bio TEXT,
      website TEXT,
      reputation INTEGER DEFAULT 0,
      total_earned INTEGER DEFAULT 0,
      reports_submitted INTEGER DEFAULT 0,
      reports_valid INTEGER DEFAULT 0,
      joined_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'active'
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT DEFAULT 'medium',
      cvss REAL,
      cwe TEXT,
      status TEXT DEFAULT 'new',
      program_id INTEGER REFERENCES programs(id),
      researcher_id INTEGER REFERENCES researchers(id),
      asset TEXT,
      impact TEXT,
      repro_steps TEXT,
      fix_suggestion TEXT,
      reward_amount INTEGER DEFAULT 0,
      reward_status TEXT DEFAULT 'none',
      is_disclosed INTEGER DEFAULT 0,
      disclosed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER REFERENCES submissions(id),
      author_type TEXT,
      author_name TEXT NOT NULL,
      body TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER REFERENCES submissions(id),
      researcher_id INTEGER REFERENCES researchers(id),
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'pending',
      method TEXT DEFAULT 'bank_transfer',
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      paid_at TEXT
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_ref TEXT UNIQUE NOT NULL,
      submission_id INTEGER REFERENCES submissions(id),
      researcher_id INTEGER REFERENCES researchers(id),
      program_id INTEGER REFERENCES programs(id),
      researcher_name TEXT NOT NULL,
      researcher_handle TEXT NOT NULL,
      program_name TEXT NOT NULL,
      vulnerability_title TEXT NOT NULL,
      severity TEXT NOT NULL,
      issued_at TEXT DEFAULT (datetime('now')),
      verified INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      researcher_id INTEGER REFERENCES researchers(id),
      role TEXT DEFAULT 'researcher',
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      platform_name TEXT DEFAULT 'OpenBounty',
      platform_subtitle TEXT DEFAULT 'Bug Bounty Platform',
      logo_url TEXT DEFAULT '',
      max_upload_mb INTEGER DEFAULT 10,
      cert_template INTEGER DEFAULT 1,
      cert_signer_left_name TEXT DEFAULT 'Maya Rivera',
      cert_signer_left_title TEXT DEFAULT 'Platform Security Director',
      cert_signer_right_name TEXT DEFAULT 'OpenBounty Platform',
      cert_signer_right_title TEXT DEFAULT 'Chief Security Officer',
      cert_footer_text TEXT DEFAULT ''
    );
  `);

  return db;
}

module.exports = { initDB };
