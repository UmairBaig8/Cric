import { FormEvent, useState } from 'react';
import { hasSupabaseConfig } from './env';
import { registerPlayer } from './lib/registrations';
import type { RegistrationInput } from './types';

const initialForm: RegistrationInput = {
  name: '', email: '', department: '', player_type: 'Batter', batting_style: 'Right-hand batter',
  bowling_style: 'Do not bowl', bowling_arm: 'Not applicable', cricket_experience: 'Casual player',
  jersey_size: 'M', availability: 'Available for all matches',
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegistrationInput>(initialForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const result = await registerPlayer({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), department: form.department.trim() });
      setMessage(result.demo ? 'Demo registration saved locally. Connect Supabase to go live.' : 'Registration received. See you on match day.');
      setForm(initialForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="app register-page"><header className="topbar shell register-topbar"><a className="brand" href="/Cric/" aria-label="DPL home"><span className="brand-mark">DPL</span><span className="brand-text">DPL <b>2026</b><small>DIGITATE PREMIER LEAGUE</small></span></a><a className="back-link" href="/Cric/">← BACK TO DPL</a></header><main className="register-main shell"><section className="register-intro"><div className="kicker"><i /> REGISTRATION LIVE</div><p className="eyebrow">DPL 2026 / PLAYER REGISTRATION</p><h1>YOUR NEXT<br /><span>OFFICE STORY.</span></h1><p>Sign up, create your player profile, and get ready for auction day. Your spot is waiting.</p><div className="register-status"><i /> {hasSupabaseConfig ? 'LIVE REGISTRATION CONNECTED' : 'DEMO MODE — DATABASE NOT CONNECTED'}</div><div className="registration-perks"><div><b>01</b><strong>PLAYER PROFILE</strong><span>Your name, role and stats enter the DPL universe.</span></div><div><b>02</b><strong>AUCTION DAY</strong><span>Find out who thinks you&apos;re worth the bid.</span></div><div><b>03</b><strong>MATCH DAY</strong><span>Compete, perform, make memories.</span></div></div></section><form className="registration-form registration-card" onSubmit={submit}><div className="form-card-heading"><span>01</span><div><h2>COUNT ME IN.</h2><p>Build your player card.</p></div><em>~ 2 MIN</em></div><fieldset><legend>ABOUT YOU</legend><label>Full name<input autoComplete="name" required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Work email<input autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Department<input autoComplete="organization" required minLength={2} value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label></fieldset><fieldset><legend>YOUR CRICKET PROFILE</legend><div className="form-grid"><label>Player type<select required value={form.player_type} onChange={(event) => setForm({ ...form, player_type: event.target.value as RegistrationInput['player_type'] })}><option>Batter</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper-batter</option></select></label><label>Batting style<select required value={form.batting_style} onChange={(event) => setForm({ ...form, batting_style: event.target.value as RegistrationInput['batting_style'] })}><option>Right-hand batter</option><option>Left-hand batter</option></select></label><label>Bowling style<select required value={form.bowling_style} onChange={(event) => setForm({ ...form, bowling_style: event.target.value as RegistrationInput['bowling_style'] })}><option>Do not bowl</option><option>Right-arm pace</option><option>Left-arm pace</option><option>Right-arm spin</option><option>Left-arm spin</option></select></label><label>Bowling arm<select required value={form.bowling_arm} onChange={(event) => setForm({ ...form, bowling_arm: event.target.value as RegistrationInput['bowling_arm'] })}><option>Not applicable</option><option>Right arm</option><option>Left arm</option></select></label><label>Experience<select required value={form.cricket_experience} onChange={(event) => setForm({ ...form, cricket_experience: event.target.value as RegistrationInput['cricket_experience'] })}><option>New to cricket</option><option>Casual player</option><option>Club / college player</option><option>Experienced league player</option></select></label><label>Jersey size<select required value={form.jersey_size} onChange={(event) => setForm({ ...form, jersey_size: event.target.value as RegistrationInput['jersey_size'] })}><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select></label></div></fieldset><fieldset><legend>AVAILABILITY</legend><label>Match availability<select required value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value as RegistrationInput['availability'] })}><option>Available for all matches</option><option>Available for most matches</option><option>Need schedule confirmation</option></select></label></fieldset><button className="btn btn-primary" disabled={submitting}>{submitting ? 'SAVING…' : '🏏 SUBMIT PLAYER REGISTRATION →'}</button>{message && <p className="form-message" role="status">{message}</p>}<small className="privacy-note">Your details are used for DPL registration and team selection only.</small></form></main><footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer></div>;
}
