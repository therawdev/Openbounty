# OpenBounty

Self-hosted bug bounty & responsible disclosure platform.

## Features

- **Program Management** — Create and manage bug bounty programs with scope, rewards, and rules
- **Researcher Portal** — Researchers sign up, submit vulnerability reports with PoC uploads
- **Admin Dashboard** — Triage submissions, manage severity, issue rewards and certificates
- **PDF Certificates** — Fully configurable certificate generator with custom colors, patterns, borders, and signatories
- **Notification System** — Real-time notifications for status changes, rewards, and certificates
- **Leaderboard** — Public researcher rankings by reputation and valid reports
- **Whitelabel** — Fully configurable platform name, branding, and certificate design from admin settings

## Tech Stack

- **Backend** — Node.js + Express
- **Database** — SQLite (via better-sqlite3)
- **Frontend** — React (via HTM/Preact-compatible JSX, no build step)
- **PDF Generation** — PDFKit
- **Auth** — Session tokens with bcrypt-style password hashing

## Quick Start

```bash
git clone https://github.com/therawdev/Openbounty.git
cd Openbounty
npm install
node server.js
```

Open [http://localhost:3000](http://localhost:3000)

**Default admin login:**
- Email: `admin@openbounty.io`
- Password: `admin2026`

## Project Structure

```
├── server.js          # Express API + PDF certificate engine
├── db/
│   ├── init.js        # Database schema
│   └── seed.js        # Seed data (demo programs, researchers)
├── public/
│   ├── index.html     # SPA entry point
│   ├── styles.css     # Global styles
│   └── src/
│       ├── shell.jsx  # App shell (sidebar, routing)
│       ├── app.jsx    # Route definitions
│       ├── api.jsx    # API client
│       └── pages/     # Page components
└── package.json
```

## License

MIT
