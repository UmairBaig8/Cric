import { FormEvent, useEffect, useState } from 'react';
import { hasSupabaseConfig } from './env';
import { registerPlayer } from './lib/registrations';

const steps = [
  ['✎', 'REGISTER', 'Sign up and create your player profile.'],
  ['⚒', 'AUCTION', 'Get picked by your favourite team.'],
  ['👕', 'JERSEY DAY', 'Wear your team colours. Wear your pride.'],
  ['🏏', 'MATCH DAY', 'Compete. Perform. Make memories.'],
  ['🏆', 'BECOME LEGEND', 'Top the leaderboard. Be the legend.'],
];

const benefits = [
  ['02', 'THE AUCTION.', "Bring your confidence. Bring your game. Find out who thinks you're worth the bid.", 'auction'],
  ['03', 'YOUR PLAYER CARD.', 'Your name, photo, role and stats become part of the DPL universe.', ''],
  ['04', 'BRAGGING RIGHTS.', 'Runs. Wickets. Wins. Rankings. Let the office leaderboard do the talking.', 'leaderboard'],
  ['05', 'THE MEMORIES.', "Because six months from now, nobody remembers the Tuesday status call. They'll remember that six.", 'gallery'],
];

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('dpl-theme') === 'dark');
  const [form, setForm] = useState({ name: '', email: '', department: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 86400 + 8 * 3600 + 42 * 60 + 33);

  useEffect(() => {
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function toggleTheme(nextDark: boolean) {
    setDark(nextDark);
    localStorage.setItem('dpl-theme', nextDark ? 'dark' : 'light');
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

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  const time = (value: number) => String(value).padStart(2, '0');

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header className="topbar shell">
        <a className="brand" href="#top" aria-label="DPL home"><span className="brand-mark">DPL</span><span className="brand-text">DPL <b>2026</b><small>DIGITATE PREMIER LEAGUE</small></span></a>
        <nav className="nav"><a href="#tournament">TOURNAMENT</a><a href="#teams">TEAMS</a><a href="#how">FIXTURES</a><a href="#auction">AUCTION</a><a href="#leaderboard">LEADERBOARD</a><a href="#gallery">GALLERY</a><a href="#about">ABOUT</a></nav>
        <div className="theme-switch"><button className={!dark ? 'active' : ''} type="button" onClick={() => toggleTheme(false)}>☼ LIGHT</button><button className={dark ? 'active' : ''} type="button" onClick={() => toggleTheme(true)}>☾ DARK</button></div>
      </header>

      <main id="top">
        <section className="hero" id="tournament">
          <div className="hero-art" aria-hidden="true" />
          <div className="shell hero-content">
            <div className="kicker"><i /> REGISTRATION LIVE</div>
            <div className="social-proof"><div className="avatars">{[1, 2, 3, 4, 5].map((avatar) => <i className="avatar" key={avatar} />)}</div><strong>87+</strong> players already joined</div>
            <h1>FROM DESKS<br /><span>TO GLORY.</span></h1>
            <div className="hero-copy">Same office. Different game.<br />This time, let&apos;s <strong>play for keeps.</strong></div>
            <div className="actions"><a className="btn btn-primary" href="#register">🏏 I&apos;M IN. REGISTER NOW →</a><a className="btn btn-secondary" href="#how">▶ WATCH HOW IT WORKS</a></div>
            <div className="hero-stats"><div className="stat"><b>16</b><small>TEAMS</small></div><div className="stat"><b>128</b><small>PLAYERS</small></div><div className="stat"><b>24</b><small>MATCHES</small></div><div className="stat"><b>1</b><small>CHAMPION</small></div></div>
          </div>
          <aside className="hero-panel"><div className="panel-label">DPL 2026 / REGISTRATION WINDOW</div><div className="panel-title">Your spot is waiting.</div><div className="countdown"><div className="time"><b>{time(days)}</b><span>DAYS</span></div><div className="time"><b>{time(hours)}</b><span>HRS</span></div><div className="time"><b>{time(mins)}</b><span>MINS</span></div><div className="time"><b>{time(secs)}</b><span>SECS</span></div></div><div className="capacity"><div className="capacity-head"><span>PLAYER CAPACITY</span><strong><span>87</span> / 128</strong></div><div className="meter"><i /></div><div className="spots">Only <strong>41 spots</strong> left. Don&apos;t sit this one out.</div></div><a className="btn btn-primary panel-cta" href="#register">YES, COUNT ME IN →</a></aside>
        </section>

        <section className="ribbon"><div className="shell ribbon-grid">{[['🪑', 'BREAK THE ROUTINE', 'Step out of the chair. Into the game.'], ['🤝', 'TEAM UP', 'Bond beyond projects. Build real teamwork.'], ['🎯', 'COMPETE', 'Challenge rivals. Bring your A-game.'], ['🏆', 'WIN GLORY', 'Lift the trophy. Earn the bragging rights.']].map(([icon, title, copy]) => <div className="ribbon-item" key={title}><div className="ribbon-icon">{icon}</div><div><b>{title}</b><p>{copy}</p></div></div>)}</div></section>

        <section className="section" id="how"><div className="shell"><div className="section-head"><div className="eyebrow">FROM SIGN-UP TO TROPHY</div><h2>HOW DPL WORKS</h2><p>One simple journey from your desk to match day. Your player profile follows you all the way to the final.</p></div><div className="steps">{steps.map(([icon, title, copy]) => <article className="step" key={title}><div className="step-dot">{icon}</div><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

        <section className="benefits" id="teams"><div className="shell"><div className="section-head"><div className="eyebrow cyan">THE OFFICE. THE TEAMS. THE STORY.</div><h2>DPL IS MORE THAN CRICKET.</h2><p>It&apos;s the part of the year where the person sitting two desks away suddenly becomes your biggest rival.</p></div><div className="benefit-grid"><article className="benefit"><div className="num">01</div><h3>MEET YOUR OTHER TEAM.</h3><p>Forget the org chart for a day. Developers, designers, sales, HR, managers — everyone starts on the same pitch.</p><div className="team-cloud">{['THUNDER ⚡', 'TITANS ◈', 'WARRIORS ✦', 'STRIKERS ◉', 'ROYALS ♛', 'MAVERICKS ◆'].map((team) => <span className="team" key={team}>{team}</span>)}</div></article>{benefits.map(([number, title, copy, id]) => <article className="benefit" id={id} key={number}><div className="num">{number}</div><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

        <section className="cta" id="register"><div className="shell"><div className="eyebrow">YOUR NEXT OFFICE STORY</div><h2>DON&apos;T JUST WORK<br /><span>PLAY TOGETHER.</span></h2><p>Registration takes a minute. The memories last much longer.</p><form className="registration-form" onSubmit={submit}><div className="form-grid"><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Work email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Department<input required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label></div><button className="btn btn-primary" disabled={submitting}>{submitting ? 'SAVING…' : '🏏 YES, COUNT ME IN →'}</button>{message && <p className="form-message" role="status">{message}</p>}</form></div></section>
      </main>
      <footer id="about">DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET · BUILT FOR THE PEOPLE WHO TURN COFFEE BREAKS INTO CRICKET DEBATES. {hasSupabaseConfig ? '· CONNECTED' : '· DEMO MODE'}</footer>
    </div>
  );
}
