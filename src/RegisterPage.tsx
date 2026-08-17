import { FormEvent, useEffect, useState } from 'react';
import { registerPlayer, checkEmployeeExists } from './lib/registrations';
import { sendConfirmationEmail } from './lib/email';
import { useTheme } from './lib/useTheme';
import SiteHeader from './components/SiteHeader';
import Stepper, { Step } from './components/Stepper';
import type { RegistrationInput } from './types';

const initialForm: RegistrationInput = {
  name: '', email: '', employee_id: '', squad: '', gender: 'Male', player_type: 'Batter', batting_style: 'Right-hand batter',
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
  const [step, setStep] = useState(0);
  const [empIdStatus, setEmpIdStatus] = useState<'idle' | 'checking' | 'free' | 'taken'>('idle');

  useEffect(() => {
    let cancelled = false;
    const id = form.employee_id.trim();
    if (id.length < 7) {
      setEmpIdStatus('idle');
      return;
    }
    setEmpIdStatus('checking');
    const timer = window.setTimeout(() => {
      checkEmployeeExists(id)
        .then((exists) => {
          if (!cancelled) setEmpIdStatus(exists ? 'taken' : 'free');
        })
        .catch(() => {
          if (!cancelled) setEmpIdStatus('idle');
        });
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.employee_id]);

  function selectPhoto(file: File | null) {
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
  }

  function stepValid() {
    if (step === 0) return Boolean(form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && form.employee_id.trim() && empIdStatus === 'free');
    if (step === 1) return Boolean(form.player_type && form.batting_style && form.bowling_style && form.availability);
    return true;
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (!stepValid()) return;
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
      const raw = error instanceof Error ? error.message : String(error);
      if (raw.toLowerCase().includes('duplicate') || raw.toLowerCase().includes('unique constraint')) {
        setMessage("Looks like you've already registered with this employee ID. You're all set — see you on the pitch!");
      } else {
        setMessage(error instanceof Error ? error.message : 'Registration failed. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const initials = form.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'YOU';

  return (
    <div className={dark ? 'app dark register-page' : 'app register-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="register-main shell">
        <form className="registration-form registration-card" onSubmit={submit}>
          <div className="form-card-heading">
            <span>{String(step + 1).padStart(2, '0')}</span>
            <div><h2>JOIN D2P 2026.</h2><p>Build your player profile.</p></div>
            <em>~ 2 MIN</em>
          </div>
          <Stepper
            initialStep={1}
            onStepChange={(value) => setStep(value - 1)}
            onFinalStepCompleted={() => submit()}
            backButtonText="← BACK"
            nextButtonText="NEXT →"
            completeButtonText={submitting ? 'SAVING…' : '🏏 CREATE MY PLAYER PROFILE'}
            backButtonProps={{ className: 'btn btn-ghost' }}
            nextButtonProps={{ className: 'btn btn-primary', disabled: !stepValid() || submitting }}
          >
            <Step>
              <fieldset>
                <legend>ABOUT YOU</legend>
                <div className="form-grid form-grid-2">
                  <label>Employee ID <em className="req-star">*</em><input autoComplete="off" required inputMode="numeric" pattern="[0-9]{7,8}" title="Enter your 7–8 digit employee ID" maxLength={8} placeholder="e.g. 12345678" value={form.employee_id} onChange={(event) => setForm({ ...form, employee_id: event.target.value.replace(/[^0-9]/g, '') })} />{empIdStatus === 'checking' ? <em className="emp-hint checking">Checking…</em> : empIdStatus === 'free' ? <em className="emp-hint free">✓ Great — this ID is ready to go.</em> : empIdStatus === 'taken' ? <em className="emp-hint taken">✓ Already done — this employee ID is already registered. You&apos;re all set!</em> : null}</label>
                  <label>Squad<input autoComplete="organization" minLength={2} placeholder="e.g. Engineering, Design, Sales" value={form.squad} onChange={(event) => setForm({ ...form, squad: event.target.value })} /></label>
                </div>
                <label>Full name <em className="req-star">*</em><input autoComplete="name" required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                <label>Work email <em className="req-star">*</em><input autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                <div className="gender-picker" role="group" aria-label="Gender">
                  {(['Male', 'Female'] as const).map((option) => (
                    <button type="button" className={form.gender === option ? 'on' : ''} key={option} onClick={() => setForm({ ...form, gender: option })}>{option}</button>
                  ))}
                </div>
              </fieldset>
            </Step>
            <Step>
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
            </Step>
            <Step>
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
            </Step>
            <Step>
              <fieldset>
                <legend>CONFIRM</legend>
                <div className="confirm-card">
                  <div className="confirm-card-head"><span>D2P 2026 · PLAYER CARD</span><span># {form.employee_id.trim() || '—'}</span></div>
                  <div className="confirm-photo">{photoPreview ? <img alt="Your photo" src={photoPreview} /> : <i>{initials}</i>}</div>
                  <strong>{form.name.trim() || 'YOUR NAME'}</strong>
                  <em>{form.player_type} · {form.batting_style} · {form.bowling_style}</em>
                  <div className="confirm-lines">
                    <span><b>SQUAD</b>{form.squad.trim() || '—'}</span>
                    <span><b>EXPERIENCE</b>{form.cricket_experience}</span>
                    <span><b>JERSEY</b>{form.jersey_size}</span>
                    <span><b>AVAILABILITY</b>{form.availability}</span>
                  </div>
                  <small className="confirm-cta">Looks good? Lock it in. 🏏</small>
                </div>
              </fieldset>
            </Step>
          </Stepper>
          {message && <p className="form-message" role="status">{message}</p>}
          <small className="privacy-note">Your details are used for DPL registration and team selection only.</small>
        </form>
      </main>
      <footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer>
    </div>
  );
}