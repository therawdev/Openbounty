const crypto = require('crypto');

function hashPw(pw) {
  return crypto.createHash('sha256').update(pw + 'sechub_salt_2026').digest('hex');
}

function seedDB(db) {
  const progCount = db.prepare('SELECT COUNT(*) as c FROM programs').get().c;
  if (progCount > 0) return;

  const insertProgram = db.prepare('INSERT INTO programs (name,slug,description,scope_in,scope_out,reward_low,reward_high,reward_crit,reward_info,reward_med,status,policy,safe_harbor,offers_bounty,offers_certificate,response_sla_hours,logo_color) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  const programs = [
    {
      name: 'Northwind Health Platform', slug: 'northwind-health',
      desc: 'Bug bounty for all Northwind Health web and mobile apps including Patient Portal, Provider App, and Claims API.',
      in: ['*.northwind-health.com','Patient Portal (Web)','Provider iOS App', 'Claims API (api.northwind-health.com/claims)'],
      out: ['marketing.northwind-health.com', 'Third-party integrations (Stripe, Twilio)'],
      rLow: 100, rHigh: 2500, rCrit: 10000, rInfo: 50, rMed: 500,
      status: 'active',
      policy: 'We take security seriously at Northwind Health. Please do not test on production systems. Any testing that degrades service for our users is strictly prohibited.\n\n### Rewards\nRewards are based on severity. Critical vulnerabilities that lead to patient data exposure will receive maximum payout.\n\n### Rules\n- No social engineering\n- No physical security testing\n- Do not exfiltrate more data than necessary to prove the vulnerability',
      safeHarbor: 1, offersBounty: 1, offersCert: 1, sla: 24, logo: '#0369a1'
    },
    {
      name: 'Lumen Capital Trading', slug: 'lumen-capital',
      desc: 'Security research program for the Lumen Capital trading platform, settlement network, and mobile trading application.',
      in: ['trade.lumen.fin', 'Settlement Network API', 'Mobile Trading App'],
      out: ['Corporate blog', 'Support portal'],
      rLow: 200, rHigh: 5000, rCrit: 15000, rInfo: 0, rMed: 1000,
      status: 'active',
      policy: 'Lumen Capital welcomes security researchers. We are particularly interested in financial logic flaws and transaction manipulation.\n\n### Safe Harbor\nWe will not pursue legal action as long as you follow these rules.\n\n### Eligibility\n- You must not be a resident of a sanctioned country.\n- You must not be a current or former employee.',
      safeHarbor: 1, offersBounty: 1, offersCert: 0, sla: 12, logo: '#16a34a'
    },
    {
      name: 'Vertex AI Labs', slug: 'vertex-ai',
      desc: 'Responsible disclosure for Vertex AI inference APIs, model registry, and training infrastructure. AI safety vulnerabilities especially welcome.',
      in: ['api.vertex.ai/*', 'registry.vertex.ai', 'Training cluster dashboards'],
      out: ['Public documentation'],
      rLow: 150, rHigh: 3000, rCrit: 12000, rInfo: 100, rMed: 800,
      status: 'active',
      policy: 'We are looking for both traditional security vulnerabilities and AI safety flaws (e.g., prompt injection, model inversion).',
      safeHarbor: 1, offersBounty: 1, offersCert: 1, sla: 36, logo: '#7c3aed'
    },
    {
      name: 'Orbit Logistics Portal', slug: 'orbit-logistics',
      desc: 'Bug bounty for Orbit Logistics supply chain management platform and tracking systems.',
      in: ['corp.orbit.com', 'tracking.orbit.com', 'Logistics API'],
      out: ['Driver mobile app (currently out of scope)'],
      rLow: 75, rHigh: 1500, rCrit: 7500, rInfo: 0, rMed: 300,
      status: 'paused',
      policy: 'Program is currently paused as we migrate to a new infrastructure.',
      safeHarbor: 0, offersBounty: 1, offersCert: 0, sla: 48, logo: '#d97706'
    },
    {
      name: 'Harbor Manufacturing SCADA', slug: 'harbor-manufacturing',
      desc: 'Coordinated disclosure program for Harbor Manufacturing industrial control and SCADA systems. Critical infrastructure — premium rewards.',
      in: ['hr.harbor-mfg.com', 'SCADA HMI dashboards', 'Factory IoT devices'],
      out: ['Physical access panels'],
      rLow: 500, rHigh: 8000, rCrit: 25000, rInfo: 0, rMed: 2000,
      status: 'active',
      policy: 'Do NOT attempt to disrupt manufacturing processes. Passive testing only.',
      safeHarbor: 1, offersBounty: 0, offersCert: 1, sla: 8, logo: '#dc2626'
    }
  ];

  programs.forEach(p => {
    insertProgram.run(p.name, p.slug, p.desc, JSON.stringify(p.in), JSON.stringify(p.out), p.rLow, p.rHigh, p.rCrit, p.rInfo, p.rMed, p.status, p.policy, p.safeHarbor, p.offersBounty, p.offersCert, p.sla, p.logo);
  });

  const ir = db.prepare(`INSERT INTO researchers (handle,name,email,password,avatar_color,bio,website,reputation,total_earned,reports_submitted,reports_valid) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  ir.run('z3r0day','Kai Nomura','kai@z3r0day.sec',hashPw('demo123'),'#dc2626','Full-stack security researcher specializing in web application security, IDOR, and access control vulnerabilities.','https://z3r0day.sec',4850,87500,42,31);
  ir.run('ghostbyte','Elena Voss','elena@ghostbyte.io',hashPw('demo123'),'#7c3aed','Offensive security consultant focused on XSS, CSRF, and client-side attacks.','https://ghostbyte.io',3920,62000,35,24);
  ir.run('n1ghtf0x','Marcus Chen','marcus@n1ghtf0x.dev',hashPw('demo123'),'#0369a1','Cryptography researcher and JWT/OAuth specialist.','https://n1ghtf0x.dev',3100,43500,28,19);
  ir.run('shellkode','Amira Patel','amira@shellkode.xyz',hashPw('demo123'),'#16a34a','SSRF and SSJI hunter. AI security enthusiast.','https://shellkode.xyz',2780,38200,24,17);
  ir.run('ph4ntom','Lukas Schmidt','lukas@ph4ntom.net',hashPw('demo123'),'#d97706','Bug bounty hunter specializing in rate limiting and business logic vulnerabilities.',null,2340,29800,21,14);
  ir.run('binary_witch','Yuki Tanaka','yuki@binarywitch.jp',hashPw('demo123'),'#0891b2','Reverse engineer and privilege escalation expert.','https://binarywitch.jp',1950,22100,18,12);
  ir.run('cr4ck3r','Diego Rivera','diego@cr4ck3r.co',hashPw('demo123'),'#ea580c','Information disclosure and verbose error specialist.',null,1620,16500,15,9);
  ir.run('h4xn00b','Sophie Laurent','sophie@h4xn00b.fr',hashPw('demo123'),'#8b5cf6','CSRF and browser security researcher.',null,890,8200,10,5);
  ir.run('vulnseeker','Raj Krishnan','raj@vulnseeker.in',hashPw('demo123'),'#059669','Path traversal and file upload vulnerability hunter.',null,650,4500,7,3);
  ir.run('0xdeadbeef','Alex Kim','alex@0xdead.codes',hashPw('demo123'),'#be123c','Mobile app security researcher. Reversing iOS/Android apps.',null,420,2200,5,2);

  const is = db.prepare(`INSERT INTO submissions (ref,title,description,severity,cvss,cwe,status,program_id,researcher_id,asset,impact,repro_steps,fix_suggestion,reward_amount,reward_status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  is.run('VD-2026-001','IDOR allows access to other tenants\' invoices','Invoice endpoint authorizes by session but not by tenant.','critical',9.1,'CWE-639','resolved',1,1,'/api/v2/invoices/{id}','Exposes PII and payment data across tenants.','1. Auth as tenant A\n2. GET /api/v2/invoices/4831\n3. Returns tenant B data','Add tenant scope check in controller.',10000,'paid','2026-04-15 09:22:00');
  is.run('VD-2026-002','JWT signature not verified when alg=none','Tokens with none algorithm accepted as valid.','critical',9.6,'CWE-347','resolved',1,3,'/oauth/token','Full auth bypass — impersonate any user.','1. Forge JWT with alg=none\n2. Send as Bearer\n3. Get target data','Reject alg≠RS256. Pin algorithm.',10000,'paid','2026-04-12 14:05:00');
  is.run('VD-2026-003','Stored XSS in comment renderer','Markdown renderer permits raw HTML — executes JS.','high',7.4,'CWE-79','accepted',1,2,'/threads/:id/comments','Account takeover via XSS.','1. POST <img onerror=alert(1)>\n2. Visit as other user\n3. JS executes','Sanitize with DOMPurify.',2500,'approved','2026-04-18 11:30:00');
  is.run('VD-2026-004','SSRF in webhook URL validator','Webhook URL allowlist doesn\'t block RFC1918.','high',8.2,'CWE-918','triaging',1,4,'/integrations/webhooks','Read AWS instance metadata + IAM creds.','1. Set URL to 169.254.169.254\n2. Trigger webhook\n3. Get metadata','Reject private/loopback addresses.',0,'none','2026-04-22 16:45:00');
  is.run('VD-2026-005','Missing rate limit on password reset','No throttling on reset endpoint.','medium',5.3,'CWE-307','accepted',1,5,'/auth/password/reset','User enumeration + SMS abuse.','1. Script 1000 requests\n2. No throttle','Add exponential backoff + CAPTCHA.',500,'pending','2026-04-20 08:15:00');
  is.run('VD-2026-006','Verbose error reveals stack trace','Unhandled exceptions return full stack trace.','low',3.1,'CWE-209','informative',1,7,'Multiple endpoints','Info disclosure.','1. POST malformed JSON\n2. Get stack trace','Set consider_all_requests_local=false.',0,'none','2026-04-25 13:00:00');
  is.run('VD-2026-007','SQL Injection in trading pair search','Search param concatenated into SQL query.','critical',9.8,'CWE-89','resolved',2,1,'/api/v1/pairs?search=','Full DB compromise.','1. Enter UNION SELECT...\n2. Get credentials','Use parameterized queries.',15000,'paid','2026-04-10 07:30:00');
  is.run('VD-2026-008','Privilege escalation via modified role claim','Role stored in client cookie without integrity check.','critical',9.4,'CWE-269','accepted',2,6,'/dashboard/admin','Any user gets admin access.','1. Edit cookie role→admin\n2. Access admin dashboard','Server-side role validation.',12000,'approved','2026-04-19 10:20:00');
  is.run('VD-2026-009','Model poisoning via training data injection','Training pipeline accepts unvalidated datasets.','high',7.8,'CWE-1321','triaging',3,2,'Training Pipeline API','Biased model outputs.','1. Upload crafted dataset\n2. Trigger retrain\n3. Observe bias','Add data provenance + anomaly detection.',0,'none','2026-04-26 15:45:00');
  is.run('VD-2026-010','Prompt injection in inference API','No input sanitization on user context.','high',7.5,'CWE-74','accepted',3,4,'api.vertex.ai/v2/inference','Override safety filters, leak system prompts.','1. Send "Ignore previous instructions"\n2. Model complies','Input sanitization + prompt boundaries.',3000,'pending','2026-04-21 09:10:00');
  is.run('VD-2026-011','CSRF on shipment rerouting endpoint','No CSRF token validation on reroute API.','medium',6.5,'CWE-352','new',4,8,'/api/shipments/:id/reroute','Redirect physical shipments.','1. Auto-submit form\n2. Trick admin\n3. Shipment rerouted','Add anti-CSRF tokens.',0,'none','2026-04-28 14:20:00');
  is.run('VD-2026-012','Unauthenticated SCADA HMI access','SCADA dashboard has no auth.','critical',10.0,'CWE-306','accepted',5,1,'SCADA HMI Dashboard','Full ICS control access.','1. Navigate to HMI URL\n2. No login\n3. Full access','MFA + network segmentation.',25000,'approved','2026-04-08 06:00:00');
  is.run('VD-2026-013','Path traversal in file upload','Avatar upload allows path traversal.','high',8.8,'CWE-22','duplicate',1,9,'/api/users/avatar','RCE via webshell.','1. Upload ../shell.php\n2. Access via URL','Sanitize filenames. Use UUIDs.',0,'none','2026-04-27 11:30:00');
  is.run('VD-2026-014','Insecure API key storage in mobile app','Production keys embedded in binary.','medium',5.5,'CWE-798','new',1,10,'Provider iOS App','API keys extractable from app.','1. Decompile app\n2. Search strings\n3. Keys found','Server-side keys + app attestation.',0,'none','2026-04-30 10:00:00');

  const ic = db.prepare(`INSERT INTO comments (submission_id,author_type,author_name,body,is_internal,created_at) VALUES (?,?,?,?,?,?)`);
  ic.run(1,'system','System','Report submitted and assigned to triage queue.',0,'2026-04-15 09:22:00');
  ic.run(1,'team','Maya Rivera','Confirmed — valid IDOR. Escalating to Critical. Great find!',0,'2026-04-15 14:30:00');
  ic.run(1,'researcher','z3r0day','Verified fix — tenant scope check in place. Quick turnaround!',0,'2026-04-16 11:00:00');
  ic.run(1,'system','System','Bounty of $10,000 approved and paid.',0,'2026-04-17 08:00:00');
  ic.run(4,'system','System','Report submitted and assigned to triage queue.',0,'2026-04-22 16:45:00');
  ic.run(4,'team','Aria Bauer','Investigating — verifying metadata endpoint reachability.',0,'2026-04-23 10:00:00');
  ic.run(9,'system','System','Report submitted and assigned to triage queue.',0,'2026-04-26 15:45:00');
  ic.run(9,'team','Owen Kessler','Novel attack vector. Looping in AI safety team.',1,'2026-04-27 09:00:00');

  const iy = db.prepare(`INSERT INTO payouts (submission_id,researcher_id,amount,currency,status,method,note,paid_at) VALUES (?,?,?,?,?,?,?,?)`);
  iy.run(1,1,10000,'USD','paid','bank_transfer','Critical IDOR','2026-04-17');
  iy.run(2,3,10000,'USD','paid','bank_transfer','Critical JWT bypass','2026-04-14');
  iy.run(7,1,15000,'USD','paid','bank_transfer','Critical SQLi','2026-04-12');
  iy.run(3,2,2500,'USD','approved','bank_transfer','High XSS',null);
  iy.run(8,6,12000,'USD','approved','bank_transfer','Critical privesc',null);
  iy.run(12,1,25000,'USD','approved','bank_transfer','Critical SCADA',null);
  iy.run(5,5,500,'USD','pending','bank_transfer','Medium rate limit',null);
  iy.run(10,4,3000,'USD','pending','bank_transfer','High prompt injection',null);

  const ia = db.prepare(`INSERT INTO activity_log (kind,actor,action,target_type,target_id,meta,created_at) VALUES (?,?,?,?,?,?,?)`);
  ia.run('submission','0xdeadbeef','submitted VD-2026-014','submission',14,null,'2026-04-30 10:00:00');
  ia.run('bounty','System','paid $10,000 to z3r0day','payout',1,'{"amount":10000}','2026-04-29 08:00:00');
  ia.run('status','Maya Rivera','accepted VD-2026-012','submission',12,null,'2026-04-28 16:00:00');
  ia.run('submission','h4xn00b','submitted VD-2026-011','submission',11,null,'2026-04-28 14:20:00');
  ia.run('comment','Owen Kessler','commented on VD-2026-009','submission',9,null,'2026-04-27 09:00:00');
  ia.run('status','Aria Bauer','began triaging VD-2026-009','submission',9,null,'2026-04-26 16:00:00');
  ia.run('bounty','System','approved $12,000 for VD-2026-008','payout',5,'{"amount":12000}','2026-04-25 14:00:00');
  ia.run('submission','ghostbyte','submitted VD-2026-009','submission',9,null,'2026-04-26 15:45:00');
  ia.run('program','Maya Rivera','paused Orbit Logistics','program',4,null,'2026-04-24 12:00:00');
  ia.run('status','Maya Rivera','resolved VD-2026-002','submission',2,null,'2026-04-20 09:00:00');

  // Certificates for resolved/accepted submissions
  const iCert = db.prepare(`INSERT INTO certificates (cert_ref,submission_id,researcher_id,program_id,researcher_name,researcher_handle,program_name,vulnerability_title,severity,issued_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  iCert.run('CERT-2026-001',1,1,1,'Kai Nomura','z3r0day','Northwind Health Platform','IDOR allows access to other tenants\' invoices','critical','2026-04-17 08:00:00');
  iCert.run('CERT-2026-002',2,3,1,'Marcus Chen','n1ghtf0x','Northwind Health Platform','JWT signature not verified when alg=none','critical','2026-04-14 12:00:00');
  iCert.run('CERT-2026-003',7,1,2,'Kai Nomura','z3r0day','Lumen Capital Trading','SQL Injection in trading pair search','critical','2026-04-12 10:00:00');
  iCert.run('CERT-2026-004',3,2,1,'Elena Voss','ghostbyte','Northwind Health Platform','Stored XSS in comment renderer','high','2026-04-20 09:00:00');
  iCert.run('CERT-2026-005',12,1,5,'Kai Nomura','z3r0day','Harbor Manufacturing SCADA','Unauthenticated SCADA HMI access','critical','2026-04-28 16:00:00');

  // Create admin session (for the default admin user)
  const adminToken = crypto.randomBytes(32).toString('hex');
  db.prepare(`INSERT INTO sessions (token,researcher_id,role) VALUES (?,?,?)`).run(adminToken, null, 'admin');
}

module.exports = { seedDB, hashPw: (pw) => require('crypto').createHash('sha256').update(pw + 'sechub_salt_2026').digest('hex') };
