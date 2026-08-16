import { FormEvent, useState } from 'react';
import { hasSupabaseConfig } from './env';
import { registerPlayer } from './lib/registrations';
import { sendConfirmationEmail } from './lib/email';
import { useTheme } from './lib/useTheme';
import SiteHeader from './components/SiteHeader';
import FireFX from './components/FireFX';
import type { RegistrationInput } from './types';

const initialForm: RegistrationInput = {
  name: '', email: '', employee_id: '', squad: '', player_type: 'Batter', batting_style: 'Right-hand batter',
  bowling_style: 'Do not bowl', bowling_arm: 'Not applicable', cricket_experience: 'Casual player',
  jersey_size: 'M', availability: 'Available for all matches',
};

export default function RegisterPage() {
  const { dark, toggleTheme } = useTheme();
  const [form, setForm] = useState<RegistrationInput>(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function selectPhoto(file: File | null) {
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const trimmed = { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), employee_id: form.employee_id.trim(), squad: form.squad.trim() };
      const result = await registerPlayer(trimmed, photo ?? undefined);
      if (result.demo) {
        setMessage('Demo registration saved locally. Connect Supabase to go live.');
      } else {
        void sendConfirmationEmail(trimmed.name, trimmed.email);
        window.location.href = `/D2P/confirmation?name=${encodeURIComponent(trimmed.name)}&email=${encodeURIComponent(trimmed.email)}`;
      }
      setForm(initialForm);
      selectPhoto(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const filled = [form.name.trim(), form.email.trim(), form.employee_id.trim(), form.squad.trim()].filter(Boolean).length + (photo ? 1 : 0);
  const progress = Math.round((filled / 5) * 100);
  const initials = form.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'YOU';

  return (
    <div className={dark ? 'app dark register-page' : 'app register-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="register-main shell">
        <section className="register-intro">
          <FireFX className="register-fire" />
          <div className="kicker"><i /> REGISTRATION LIVE</div>
          <p className="eyebrow">DPL 2026 / PLAYER REGISTRATION</p>
          <h1>YOUR NEXT<br /><span>OFFICE STORY.</span></h1>
          <p>Sign up, create your player profile, and get ready for auction day. Your spot is waiting.</p>
          <div className="register-status"><i /> {hasSupabaseConfig ? 'LIVE REGISTRATION CONNECTED' : 'DEMO MODE — DATABASE NOT CONNECTED'}</div>
          <div className="register-dates">
            <div><span>REGISTRATION CLOSES</span><strong>FRI · AUG 29</strong></div>
            <div><span>AUCTION DAY</span><strong>FRI · SEP 05</strong></div>
            <div><span>FIRST MATCH</span><strong>WED · SEP 10</strong></div>
          </div>
          <div className="registration-perks">
            <div><b>01</b><strong>PLAYER PROFILE</strong><span>Your name, role and stats enter the DPL universe.</span></div>
            <div><b>02</b><strong>AUCTION DAY</strong><span>Find out who thinks you&apos;re worth the bid.</span></div>
            <div><b>03</b><strong>MATCH DAY</strong><span>Compete, perform, make memories.</span></div>
            <div><b>04</b><strong>PLAYER KIT</strong><span>Your jersey size locks in your matchday kit.</span></div>
          </div>
        </section>
        <form className="registration-form registration-card" onSubmit={submit}>
          <div className="live-card">
            <div className="live-card-avatar">{photoPreview ? <img alt="Your photo" src={photoPreview} /> : <i>{initials}</i>}</div>
            <div className="live-card-info">
              <span>YOUR PLAYER CARD</span>
              <strong>{form.name.trim() || 'YOUR NAME'}</strong>
              <div className="live-card-tags">
                <em>{form.player_type}</em>
                <em>{form.squad.trim() || 'SQUAD'}</em>
                <em>JERSEY {form.jersey_size}</em>
              </div>
            </div>
            <b className="live-card-dpl">DPL 26</b>
          </div>
          <div className="form-progress">
            <div className="form-progress-track"><span style={{ width: `${progress}%` }} /></div>
            <span>{progress}% PROFILE COMPLETE</span>
          </div>
          <fieldset>
            <legend>ABOUT YOU</legend>
            <label>Full name<input autoComplete="name" required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Work email<input autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label>Employee ID<small>Your unique Digitate employee ID (7–8 digit number)</small><input autoComplete="off" required inputMode="numeric" pattern="[0-9]{7,8}" title="Enter your 7–8 digit employee ID" maxLength={8} placeholder="e.g. 12345678" value={form.employee_id} onChange={(event) => setForm({ ...form, employee_id: event.target.value.replace(/[^0-9]/g, '') })} /></label>
            <label>Squad<small>Your functional group within the project</small><input autoComplete="organization" required minLength={2} placeholder="e.g. Engineering, Design, Sales" value={form.squad} onChange={(event) => setForm({ ...form, squad: event.target.value })} /></label>
            <label className="photo-field">Profile photo<small>Optional — jpg / png, max 4 MB</small><span className="photo-picker"><span className="photo-preview">{photoPreview ? <img alt="Preview" src={photoPreview} /> : <i>+</i>}</span><input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />{photoPreview ? <button className="photo-clear" type="button" onClick={() => selectPhoto(null)}>Remove</button> : null}</span></label>
          </fieldset>
          <fieldset>
            <legend>YOUR CRICKET PROFILE</legend>
            <div className="form-grid">
              <label>Player type<select required value={form.player_type} onChange={(event) => setForm({ ...form, player_type: event.target.value as RegistrationInput['player_type'] })}><option>Batter</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper-batter</option></select></label>
              <label>Batting style<select required value={form.batting_style} onChange={(event) => setForm({ ...form, batting_style: event.target.value as RegistrationInput['batting_style'] })}><option>Right-hand batter</option><option>Left-hand batter</option></select></label>
              <label>Bowling style<select required value={form.bowling_style} onChange={(event) => setForm({ ...form, bowling_style: event.target.value as RegistrationInput['bowling_style'] })}><option>Do not bowl</option><option>Right-arm pace</option><option>Left-arm pace</option><option>Right-arm spin</option><option>Left-arm spin</option></select></label>
              <label>Bowling arm<select required value={form.bowling_arm} onChange={(event) => setForm({ ...form, bowling_arm: event.target.value as RegistrationInput['bowling_arm'] })}><option>Not applicable</option><option>Right arm</option><option>Left arm</option></select></label>
              <label>Experience<select required value={form.cricket_experience} onChange={(event) => setForm({ ...form, cricket_experience: event.target.value as RegistrationInput['cricket_experience'] })}><option>New to cricket</option><option>Casual player</option><option>Club / college player</option><option>Experienced league player</option></select></label>
              <label>Jersey size<select required value={form.jersey_size} onChange={(event) => setForm({ ...form, jersey_size: event.target.value as RegistrationInput['jersey_size'] })}><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>AVAILABILITY</legend>
            <label>Match availability<select required value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value as RegistrationInput['availability'] })}><option>Available for all matches</option><option>Available for most matches</option><option>Need schedule confirmation</option></select></label>
          </fieldset>
          <button className="btn btn-primary btn-submit" disabled={submitting}>{submitting ? 'SAVING…' : '🏏 SUBMIT PLAYER REGISTRATION'}</button>
          {message && <p className="form-message" role="status">{message}</p>}
          <small className="privacy-note">Your details are used for DPL registration and team selection only.</small>
        </form>
      </main>
      <footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer>
    </div>
  );
}