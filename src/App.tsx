import { FormEvent, useState } from 'react';
import { hasSupabaseConfig } from './env';
import { registerPlayer } from './lib/registrations';

const steps = [
  ['01', 'REGISTER', 'Create your player profile.'],
  ['02', 'AUCTION', 'Get picked by your favourite team.'],
  ['03', 'MATCH DAY', 'Compete, perform, make memories.'],
  ['04', 'BECOME LEGEND', 'Top the leaderboard.'],
];

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('dpl-theme') === 'dark');
  const [form, setForm] = useState({ name: '', email: '', department: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleTheme() {
    setDark((value) => {
      const next = !value;
      localStorage.setItem('dpl-theme', next ? 'dark' : 'light');
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const result = await registerPlayer(form);
      setMessage(result.demo ? 'Demo registration saved locally. Connect Supabase to go live.' : 'Registration received. See you on match day.');
      setForm({ name: '', email: '', department: '' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="DPL home"><b>DPL</b><span>2026</span></a>
        <nav><a href="#how">HOW IT WORKS</a><a href="#register">REGISTER</a></nav>
        <button className="theme" type="button" onClick={toggleTheme}>{dark ? '☼ LIGHT' : '☾ DARK'}</button>
      </header>

      <main id="top">
        <section className="hero shell">
          <div className="hero-art" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">● REGISTRATION LIVE</p>
            <p className="proof">87+ players already joined</p>
            <h1>FROM DESKS<br /><em>TO GLORY.</em></h1>
            <p className="lead">Same office. Different game.<br />This time, let&apos;s <strong>play for keeps.</strong></p>
            <a className="button primary" href="#register">🏏 I&apos;M IN. REGISTER NOW →</a>
            <div className="stats"><span><b>16</b>TEAMS</span><span><b>128</b>PLAYERS</span><span><b>24</b>MATCHES</span></div>
          </div>
          <aside className="panel"><small>DPL 2026 / REGISTRATION WINDOW</small><h2>Your spot is waiting.</h2><p><b>128</b> player capacity</p><div className="meter"><i /></div><span>Only <strong>41 spots</strong> left.</span></aside>
        </section>

        <section className="section shell" id="how"><p className="eyebrow">FROM SIGN-UP TO TROPHY</p><h2>HOW DPL WORKS</h2><div className="steps">{steps.map(([number, title, copy]) => <article key={number}><b>{number}</b><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

        <section className="register section shell" id="register"><div><p className="eyebrow">YOUR NEXT OFFICE STORY</p><h2>PLAY<br /><em>TOGETHER.</em></h2><p>Registration takes a minute. Memories last much longer.</p></div><form onSubmit={submit}><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Work email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Department<input required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label><button className="button primary" disabled={submitting}>{submitting ? 'SAVING…' : 'COUNT ME IN →'}</button>{message && <p className="form-message" role="status">{message}</p>}</form></section>
      </main>
      <footer className="shell">DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET {hasSupabaseConfig ? '· CONNECTED' : '· DEMO MODE'}</footer>
    </div>
  );
}
