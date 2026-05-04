// API helper with auth
const API_BASE = '';

const api = {
  getToken() { return localStorage.getItem('sechub_token'); },
  setToken(t) { if (t) localStorage.setItem('sechub_token', t); else localStorage.removeItem('sechub_token'); },
  headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this.getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },
  async get(path) {
    const res = await fetch(API_BASE + path, { headers: this.headers() });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  async post(path, data) {
    const isFD = data instanceof FormData;
    const h = this.headers();
    if (isFD) delete h['Content-Type'];
    const res = await fetch(API_BASE + path, {
      method: 'POST', headers: h, body: isFD ? data : JSON.stringify(data)
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `API error: ${res.status}`); }
    return res.json();
  },
  async put(path, data) {
    const res = await fetch(API_BASE + path, {
      method: 'PUT', headers: this.headers(), body: JSON.stringify(data)
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `API error: ${res.status}`); }
    return res.json();
  },
  async delete(path) {
    const res = await fetch(API_BASE + path, { method: 'DELETE', headers: this.headers() });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `API error: ${res.status}`); }
    return res.json();
  }
};

window.api = api;
