import { FormEvent, useState } from 'react';
import { hasSupabaseConfig } from './env';
import { registerPlayer } from './lib/registrations';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', department: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const result = await registerPlayer({ name: form.name.trim(), email: form.email.trim().toLowerCase(), department: form.department.trim() });
      setMessage(result.demo ? 'Demo registration saved locally. Connect Supabase to go live.' : 'Registration received. See you on match day.');
      setForm({ name: '', email: '', department: '' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="app register-page"><header className="topbar shell register-topbar"><a className="brand" href="/Cric/" aria-label="DPL home"><span className="brand-mark">DPL</span><span className="brand-text">DPL <b>2026</b><small>DIGITATE PREMIER LEAGUE</small></span></a><a className="back-link" href="/Cric/">← BACK TO DPL</a></header><main className="register-main shell"><section className="register-intro"><div className="kicker"><i /> REGISTRATION LIVE</div><p className="eyebrow">DPL 2026 / PLAYER REGISTRATION</p><h1>YOUR NEXT<br /><span>OFFICE STORY.</span></h1><p>Sign up, create your player profile, and get ready for auction day. Your spot is waiting.</p><div className="register-status"><i /> {hasSupabaseConfig ? 'LIVE REGISTRATION CONNECTED' : 'DEMO MODE — DATABASE NOT CONNECTED'}</div></section><form className="registration-form registration-card" onSubmit={submit}><div className="form-card-heading"><span>01</span><div><h2>COUNT ME IN.</h2><p>Tell us who you are.</p></div></div><label>Full name<input autoComplete="name" required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Work email<input autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Department<input autoComplete="organization" required minLength={2} value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label><button className="btn btn-primary" disabled={submitting}>{submitting ? 'SAVING…' : '🏏 SUBMIT REGISTRATION →'}</button>{message && <p className="form-message" role="status">{message}</p>}<small className="privacy-note">Your details are used for DPL registration only.</small></form></main><footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer></div>;
}
