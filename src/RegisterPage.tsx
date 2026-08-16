import { FormEvent, useState } from 'react';
import { registerPlayer } from './lib/registrations';
import { sendConfirmationEmail } from './lib/email';
import { useTheme } from './lib/useTheme';
import SiteHeader from './components/SiteHeader';
import type { RegistrationInput } from './types';

const initialForm: RegistrationInput = {
  name: '', email: '', employee_id: '', squad: '', player_type: 'Batter', batting_style: 'Right-hand batter',
  bowling_style: 'Do not bowl', bowling_arm: 'Not applicable', cricket_experience: 'Casual player',
  jersey_size: 'M', availability: 'Available for all matches',
};

const STEPS = ['ABOUT YOU', 'YOUR GAME', 'YOUR FACE', 'CONFIRM'] as const;

export default function RegisterPage() {
  const { dark, toggleTheme } = useTheme();
  const [form, setForm] = useState<RegistrationInput>(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  function selectPhoto(file: File | null) {
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
  }

  function stepValid() {
    if (step === 0) return Boolean(form.name.trim() && form.email.trim() && form.employee_id.trim() && form.squad.trim());
    if (step === 1) return Boolean(form.player_type && form.batting_style && form.bowling_style && form.availability);
    return true;
  }

  function next() {
    if (!stepValid()) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
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

  const initials = form.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'YOU';
  const playerNo = form.employee_id.trim() || '###';

  return (
    <div className={dark ? 'app dark register-page' : 'app register-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="register-main shell">
        <section className="register-intro">
          <div className="register-preview">
            <div className="register-preview-head">D2P 2026 <b>PLAYER CARD</b></div>
            <div className="register-preview-photo">{photoPreview ? <img alt="Your photo" src={photoPreview} /> : <i>{initials}</i>}</div>
            <strong className="register-preview-name">{form.name.trim() || 'YOUR NAME'}</strong>
            <em>{form.player_type}</em>
            <div className="register-preview-divider" />
            <span>PLAYER #{playerNo}</span>
            <small>TEAM · TO BE AUCTIONED</small>
          </div>
        </section>
        <form className="registration-form registration-card" onSubmit={submit}>
          <div className="form-card-heading">
            <span>{String(step + 1).padStart(2, '0')}</span>
            <div><h2>JOIN D2P 2026.</h2><p>Build your player profile.</p></div>
            <em>~ 2 MIN</em>
          </div>
          <div className="steps-dots">
            {STEPS.map((label, index) => (
              <div className={index === step ? 'on' : index < step ? 'done' : ''} key={label}>
                <i>{index < step ? '✓' : index + 1}</i><span>{label}</span>
              </div>
            ))}
          </div>
          {step === 0 ? (
            <fieldset>
              <legend>ABOUT YOU</legend>
              <label>Full name<input autoComplete="name" required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Work email<input autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Employee ID<small>Your unique Digitate employee ID (7–8 digit number)</small><input autoComplete="off" required inputMode="numeric" pattern="[0-9]{7,8}" title="Enter your 7–8 digit employee ID" maxLength={8} placeholder="e.g. 12345678" value={form.employee_id} onChange={(event) => setForm({ ...form, employee_id: event.target.value.replace(/[^0-9]/g, '') })} /></label>
              <label>Squad<small>Your functional group within the project</small><input autoComplete="organization" required minLength={2} placeholder="e.g. Engineering, Design, Sales" value={form.squad} onChange={(event) => setForm({ ...form, squad: event.target.value })} /></label>
            </fieldset>
          ) : null}
          {step === 1 ? (
            <fieldset>
              <legend>YOUR GAME</legend>
              <div className="form-grid">
                <label>Player type<select required value={form.player_type} onChange={(event) => setForm({ ...form, player_type: event.target.value as RegistrationInput['player_type'] })}><option>Batter</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper-batter</option></select></label>
                <label>Batting style<select required value={form.batting_style} onChange={(event) => setForm({ ...form, batting_style: event.target.value as RegistrationInput['batting_style'] })}><option>Right-hand batter</option><option>Left-hand batter</option></select></label>
                <label>Bowling style<select required value={form.bowling_style} onChange={(event) => setForm({ ...form, bowling_style: event.target.value as RegistrationInput['bowling_style'] })}><option>Do not bowl</option><option>Right-arm pace</option><option>Left-arm pace</option><option>Right-arm spin</option><option>Left-arm spin</option></select></label>
                <label>Bowling arm<select required value={form.bowling_arm} onChange={(event) => setForm({ ...form, bowling_arm: event.target.value as RegistrationInput['bowling_arm'] })}><option>Not applicable</option><option>Right arm</option><option>Left arm</option></select></label>
                <label>Experience<select required value={form.cricket_experience} onChange={(event) => setForm({ ...form, cricket_experience: event.target.value as RegistrationInput['cricket_experience'] })}><option>New to cricket</option><option>Casual player</option><option>Club / college player</option><option>Experienced league player</option></select></label>
                <label>Jersey size<select required value={form.jersey_size} onChange={(event) => setForm({ ...form, jersey_size: event.target.value as RegistrationInput['jersey_size'] })}><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select></label>
                <label>Match availability<select required value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value as RegistrationInput['availability'] })}><option>Available for all matches</option><option>Available for most matches</option><option>Need schedule confirmation</option></select></label>
              </div>
            </fieldset>
          ) : null}
          {step === 2 ? (
            <fieldset>
              <legend>YOUR FACE</legend>
              <label className="photo-field selfie-field">
                <small>Take your shot. We&apos;ll do the rest.</small>
                <span className="selfie-upload">
                  <span className="selfie-preview">{photoPreview ? <img alt="Preview" src={photoPreview} /> : <i>📷</i>}</span>
                  <input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />
                </span>
                <span className="selfie-note">jpg / png / webp · max 4 MB{photoPreview ? <button className="photo-clear" type="button" onClick={() => selectPhoto(null)}>Remove</button> : null}</span>
              </label>
            </fieldset>
          ) : null}
          {step === 3 ? (
            <fieldset>
              <legend>CONFIRM</legend>
              <div className="confirm-card">
                <div className="confirm-photo">{photoPreview ? <img alt="Your photo" src={photoPreview} /> : <i>{initials}</i>}</div>
                <strong>{form.name.trim() || 'YOUR NAME'}</strong>
                <em>{form.player_type} · {form.batting_style} · {form.bowling_style}</em>
                <div className="confirm-lines">
                  <span><b>SQUAD</b>{form.squad.trim() || '—'}</span>
                  <span><b>EMPLOYEE ID</b>{form.employee_id.trim() || '—'}</span>
                  <span><b>EXPERIENCE</b>{form.cricket_experience}</span>
                  <span><b>JERSEY</b>{form.jersey_size}</span>
                  <span><b>AVAILABILITY</b>{form.availability}</span>
                </div>
                <small className="confirm-cta">Looks good? Lock it in.</small>
              </div>
            </fieldset>
          ) : null}
          {message && <p className="form-message" role="status">{message}</p>}
          <div className="form-nav">
            {step > 0 ? <button type="button" className="btn btn-ghost" onClick={back}>← BACK</button> : <span />}
            {step < STEPS.length - 1
              ? <button type="button" className="btn btn-primary" disabled={!stepValid()} onClick={next}>NEXT →</button>
              : <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'SAVING…' : '🏏 CREATE MY PLAYER PROFILE'}</button>}
          </div>
          <small className="privacy-note">Your details are used for DPL registration and team selection only.</small>
        </form>
      </main>
      <footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer>
    </div>
  );
}