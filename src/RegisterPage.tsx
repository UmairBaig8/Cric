import { FormEvent, useEffect, useState } from 'react';
import { registerPlayer, checkEmployeeExists } from './lib/registrations';
import { sendConfirmationEmail } from './lib/email';
import { useTheme } from './lib/useTheme';
import SiteHeader from './components/SiteHeader';
import type { RegistrationInput } from './types';

const initialForm: RegistrationInput = {
  name: '', email: '', employee_id: '', squad: '', gender: 'Male', player_type: 'Batter', batting_style: 'Right-hand batter',
  bowling_style: 'Do not bowl', bowling_arm: 'Not applicable', cricket_experience: 'Casual player',
  jersey_size: 'M', availability: 'Available for all matches',
};

type EmpStatus = 'idle' | 'checking' | 'free' | 'taken';
type FieldName = keyof RegistrationInput | 'photo';
type Errors = Partial<Record<FieldName, string>>;
type Touched = Partial<Record<FieldName, boolean>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMP_ID_RE = /^\d{7,8}$/;
const PHOTO_MAX_MB = 4;
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function validateField(field: FieldName, value: string | File | null, empStatus: EmpStatus): string {
  switch (field) {
    case 'name': {
      const name = String(value ?? '').trim();
      if (!name) return 'Full name is required.';
      if (name.length < 2) return 'Name must be at least 2 characters.';
      if (!/^[a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F\s.'-]*$/.test(name)) return 'Name can only contain letters, spaces, dots and hyphens.';
      return '';
    }
    case 'email': {
      const email = String(value ?? '').trim();
      if (!email) return 'Work email is required.';
      if (!EMAIL_RE.test(email)) return 'Enter a valid email address (e.g. you@company.com).';
      return '';
    }
    case 'employee_id': {
      const id = String(value ?? '').trim();
      if (!id) return 'Employee ID is required.';
      if (!EMP_ID_RE.test(id)) return 'Employee ID must be a 7–8 digit number.';
      if (empStatus === 'taken') return 'This employee ID is already registered.';
      if (empStatus === 'checking') return 'Checking employee ID…';
      return '';
    }
    case 'squad': {
      const squad = String(value ?? '').trim();
      if (squad && squad.length < 2) return 'Squad must be at least 2 characters.';
      return '';
    }
    case 'gender':
      if (!value) return 'Select your gender.';
      return '';
    case 'player_type':
    case 'batting_style':
    case 'bowling_style':
    case 'bowling_arm':
    case 'cricket_experience':
    case 'jersey_size':
    case 'availability':
      if (!value) return 'Select an option.';
      return '';
    case 'photo': {
      if (!value) return '';
      const file = value as File;
      if (!PHOTO_TYPES.includes(file.type)) return 'Only JPG, PNG or WEBP images are allowed.';
      if (file.size > PHOTO_MAX_MB * 1024 * 1024) return `Photo must be under ${PHOTO_MAX_MB} MB.`;
      return '';
    }
    default:
      return '';
  }
}

export default function RegisterPage() {
  const { dark, toggleTheme } = useTheme();
  const [form, setForm] = useState<RegistrationInput>(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [empStatus, setEmpStatus] = useState<EmpStatus>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});

  useEffect(() => {
    let cancelled = false;
    const id = form.employee_id.trim();
    if (!EMP_ID_RE.test(id)) {
      setEmpStatus('idle');
      return;
    }
    setEmpStatus('checking');
    const timer = window.setTimeout(() => {
      checkEmployeeExists(id)
        .then((exists) => {
          if (!cancelled) setEmpStatus(exists ? 'taken' : 'free');
        })
        .catch(() => {
          if (!cancelled) setEmpStatus('idle');
        });
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.employee_id]);

  function fieldValue(field: FieldName): string | File | null {
    if (field === 'photo') return photo;
    const value = form[field as keyof RegistrationInput];
    return typeof value === 'string' ? value : String(value ?? '');
  }

  function fieldError(field: FieldName): string {
    if (!touched[field]) return '';
    if (field === 'employee_id' && errors.employee_id && errors.employee_id === 'Checking employee ID…') return '';
    return errors[field] ?? '';
  }

  function setField(field: keyof RegistrationInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value, empStatus) }));
  }

  function blurField(field: FieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, fieldValue(field), empStatus) }));
  }

  function allErrors(): Errors {
    const fields: FieldName[] = ['employee_id', 'squad', 'name', 'email', 'gender', 'player_type', 'batting_style', 'bowling_style', 'bowling_arm', 'cricket_experience', 'jersey_size', 'availability', 'photo'];
    const next: Errors = {};
    for (const field of fields) next[field] = validateField(field, fieldValue(field), empStatus);
    return next;
  }

  function selectPhoto(file: File | null) {
    if (file) {
      const err = validateField('photo', file, empStatus);
      if (err) {
        setErrors((prev) => ({ ...prev, photo: err }));
        setTouched((prev) => ({ ...prev, photo: true }));
        return;
      }
    }
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
    setErrors((prev) => ({ ...prev, photo: '' }));
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    setTouched({ employee_id: true, name: true, email: true });
    const nextErrors = allErrors();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some((err) => err)) {
      setMessage({ kind: 'error', text: 'Please fix the highlighted fields below before submitting.' });
      const firstInvalid = document.querySelector<HTMLElement>('.reg-field.has-error input, .reg-field.has-error select');
      firstInvalid?.focus();
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const trimmed = { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), employee_id: form.employee_id.trim(), squad: form.squad.trim() };
      const result = await registerPlayer(trimmed, photo ?? undefined);
      if (result.demo) {
        setMessage({ kind: 'success', text: 'Demo registration saved locally. Connect Supabase to go live.' });
      } else {
        void sendConfirmationEmail(trimmed.name, trimmed.email);
        window.location.href = `/D2P/confirmation?name=${encodeURIComponent(trimmed.name)}&email=${encodeURIComponent(trimmed.email)}`;
      }
      setForm(initialForm);
      setPhoto(null);
      setPhotoPreview('');
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      if (/duplicate|unique constraint|already exists/i.test(raw)) {
        setMessage({ kind: 'error', text: "Looks like you've already registered with this employee ID. You're all set — see you on the pitch!" });
      } else if (/check constraint|department|squad/i.test(raw)) {
        setMessage({ kind: 'error', text: 'Something looks off in a couple of fields. Please double-check your Squad and try again.' });
      } else {
        setMessage({ kind: 'error', text: 'We could not save your profile right now. Please try again in a moment.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const initials = form.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'YOU';

  const empHint = empStatus === 'checking' ? <em className="reg-hint checking">Checking…</em>
    : empStatus === 'free' && EMP_ID_RE.test(form.employee_id.trim()) ? <em className="reg-hint ok">✓ Available</em>
    : empStatus === 'taken' ? <em className="reg-hint warn">✓ Already registered</em>
    : null;

  const fieldProps = (field: FieldName) => ({
    className: `reg-field${fieldError(field) ? ' has-error' : ''}${touched[field] && !fieldError(field) ? ' is-valid' : ''}`,
    'data-error': fieldError(field),
  });

  return (
    <div className={dark ? 'app dark register-page' : 'app register-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="register-main shell">
        <form className="registration-form registration-card" onSubmit={submit} noValidate>
          <div className="reg-top">
            <div className="reg-title">
              <span className="reg-eyebrow">DPL 2026 · PLAYER REGISTRATION</span>
              <h2>JOIN THE LEAGUE.</h2>
              <p>Register once — get picked in the auction, wear your jersey, play for the trophy.</p>
            </div>
            <span className="reg-time">~ 2 MIN</span>
          </div>

          <section className="reg-section">
            <h3 className="reg-section-title"><span>01</span> Personal details</h3>
            <div className="reg-fields">
              <div {...fieldProps('employee_id')}>
                <label htmlFor="employee_id">Employee ID <em className="req-star">*</em></label>
                <div className="reg-input-wrap">
                  <input
                    id="employee_id"
                    autoComplete="off"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{7,8}"
                    title="Enter your 7–8 digit employee ID"
                    maxLength={8}
                    placeholder="12345678"
                    value={form.employee_id}
                    aria-invalid={Boolean(fieldError('employee_id'))}
                    onChange={(event) => setField('employee_id', event.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={() => blurField('employee_id')}
                  />
                  {empHint}
                </div>
                {fieldError('employee_id') ? <small className="reg-error">{fieldError('employee_id')}</small> : null}
              </div>

              <div {...fieldProps('squad')}>
                <label htmlFor="squad">Squad <em className="reg-opt">(optional)</em></label>
                <div className="reg-input-wrap">
                  <input
                    id="squad"
                    autoComplete="organization"
                    minLength={2}
                    placeholder="Engineering, Design, Sales…"
                    value={form.squad}
                    aria-invalid={Boolean(fieldError('squad'))}
                    onChange={(event) => setField('squad', event.target.value)}
                    onBlur={() => blurField('squad')}
                  />
                </div>
                {fieldError('squad') ? <small className="reg-error">{fieldError('squad')}</small> : null}
              </div>

              <div {...fieldProps('name')}>
                <label htmlFor="name">Full name <em className="req-star">*</em></label>
                <div className="reg-input-wrap">
                  <input
                    id="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    placeholder="e.g. Virat Kohli"
                    value={form.name}
                    aria-invalid={Boolean(fieldError('name'))}
                    onChange={(event) => setField('name', event.target.value)}
                    onBlur={() => blurField('name')}
                  />
                </div>
                {fieldError('name') ? <small className="reg-error">{fieldError('name')}</small> : null}
              </div>

              <div {...fieldProps('email')}>
                <label htmlFor="email">Work email <em className="req-star">*</em></label>
                <div className="reg-input-wrap">
                  <input
                    id="email"
                    autoComplete="email"
                    required
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    aria-invalid={Boolean(fieldError('email'))}
                    onChange={(event) => setField('email', event.target.value)}
                    onBlur={() => blurField('email')}
                  />
                </div>
                {fieldError('email') ? <small className="reg-error">{fieldError('email')}</small> : null}
              </div>

              <div className="reg-field reg-gender">
                <span className="reg-label">Gender <em className="req-star">*</em></span>
                <div className="reg-gender-picker" role="group" aria-label="Gender">
                  {(['Male', 'Female'] as const).map((option) => (
                    <button
                      type="button"
                      className={form.gender === option ? 'on' : ''}
                      key={option}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, gender: option }));
                        setErrors((prev) => ({ ...prev, gender: '' }));
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="reg-section">
            <h3 className="reg-section-title"><span>02</span> Cricket profile</h3>
            <div className="reg-fields reg-fields-3">
              <div {...fieldProps('player_type')}>
                <label htmlFor="player_type">Player type</label>
                <select id="player_type" required value={form.player_type} aria-invalid={Boolean(fieldError('player_type'))} onChange={(event) => setField('player_type', event.target.value)} onBlur={() => blurField('player_type')}><option>Batter</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper-batter</option></select>
              </div>
              <div {...fieldProps('batting_style')}>
                <label htmlFor="batting_style">Batting style</label>
                <select id="batting_style" required value={form.batting_style} aria-invalid={Boolean(fieldError('batting_style'))} onChange={(event) => setField('batting_style', event.target.value)} onBlur={() => blurField('batting_style')}><option>Right-hand batter</option><option>Left-hand batter</option></select>
              </div>
              <div {...fieldProps('bowling_style')}>
                <label htmlFor="bowling_style">Bowling style</label>
                <select id="bowling_style" required value={form.bowling_style} aria-invalid={Boolean(fieldError('bowling_style'))} onChange={(event) => setField('bowling_style', event.target.value)} onBlur={() => blurField('bowling_style')}><option>Do not bowl</option><option>Right-arm pace</option><option>Left-arm pace</option><option>Right-arm spin</option><option>Left-arm spin</option></select>
              </div>
              <div {...fieldProps('bowling_arm')}>
                <label htmlFor="bowling_arm">Bowling arm</label>
                <select id="bowling_arm" required value={form.bowling_arm} aria-invalid={Boolean(fieldError('bowling_arm'))} onChange={(event) => setField('bowling_arm', event.target.value)} onBlur={() => blurField('bowling_arm')}><option>Not applicable</option><option>Right arm</option><option>Left arm</option></select>
              </div>
              <div {...fieldProps('cricket_experience')}>
                <label htmlFor="cricket_experience">Experience</label>
                <select id="cricket_experience" required value={form.cricket_experience} aria-invalid={Boolean(fieldError('cricket_experience'))} onChange={(event) => setField('cricket_experience', event.target.value)} onBlur={() => blurField('cricket_experience')}><option>New to cricket</option><option>Casual player</option><option>Club / college player</option><option>Experienced league player</option></select>
              </div>
              <div {...fieldProps('jersey_size')}>
                <label htmlFor="jersey_size">Jersey size</label>
                <select id="jersey_size" required value={form.jersey_size} aria-invalid={Boolean(fieldError('jersey_size'))} onChange={(event) => setField('jersey_size', event.target.value)} onBlur={() => blurField('jersey_size')}><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
              </div>
              <div {...fieldProps('availability')}>
                <label htmlFor="availability">Match availability</label>
                <select id="availability" required value={form.availability} aria-invalid={Boolean(fieldError('availability'))} onChange={(event) => setField('availability', event.target.value)} onBlur={() => blurField('availability')}><option>Available for all matches</option><option>Available for most matches</option><option>Need schedule confirmation</option></select>
              </div>
            </div>
          </section>

          <section className="reg-section">
            <h3 className="reg-section-title"><span>03</span> Your photo <em className="reg-opt">(optional)</em></h3>
            <label className={['reg-photo', fieldError('photo') ? 'has-error' : '', touched.photo && !fieldError('photo') ? 'is-valid' : ''].filter(Boolean).join(' ')}>
              <span className="reg-photo-preview">{photoPreview ? <img alt="Preview" src={photoPreview} /> : <i>{initials}</i>}</span>
              <span className="reg-photo-text">
                <strong>{photoPreview ? 'Looking sharp!' : 'Add a selfie'}</strong>
                <small>jpg / png / webp · up to 4 MB{photoPreview ? <button type="button" className="reg-photo-clear" onClick={() => selectPhoto(null)}>Remove</button> : null}</small>
              </span>
              <input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />
            </label>
            {fieldError('photo') ? <small className="reg-error">{fieldError('photo')}</small> : null}
          </section>

          {message ? <p className={`reg-message ${message.kind}`} role="status">{message.text}</p> : null}

          <button className="reg-submit btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'SAVING…' : '🏏 CREATE MY PLAYER PROFILE'}
          </button>
          <small className="reg-note">Your details are used for DPL 2026 registration and team selection only.</small>
        </form>
      </main>
      <footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer>
    </div>
  );
}