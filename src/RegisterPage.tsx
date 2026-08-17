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

type EmpStatus = 'idle' | 'checking' | 'free' | 'taken';
type Errors = Partial<Record<keyof RegistrationInput | 'photo', string>>;
type Touched = Partial<Record<keyof RegistrationInput | 'photo', boolean>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMP_ID_RE = /^\d{7,8}$/;
const PHOTO_MAX_MB = 4;
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function validateField(field: keyof RegistrationInput | 'photo', value: string | File | null, empStatus: EmpStatus): string {
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
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
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

  function fieldValue(field: keyof RegistrationInput | 'photo'): string | File | null {
    if (field === 'photo') return photo;
    const value = form[field as keyof RegistrationInput];
    return typeof value === 'string' ? value : String(value ?? '');
  }

  function fieldError(field: keyof RegistrationInput | 'photo'): string {
    if (!touched[field]) return '';
    if (field === 'employee_id' && errors.employee_id && errors.employee_id === 'Checking employee ID…') return '';
    return errors[field] ?? '';
  }

  function setField(field: keyof RegistrationInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    const err = validateField(field, value, empStatus);
    setErrors((prev) => ({ ...prev, [field]: err }));
  }

  function blurField(field: keyof RegistrationInput | 'photo') {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, fieldValue(field), empStatus);
    setErrors((prev) => ({ ...prev, [field]: err }));
  }

  function validateStep(stepIndex: number): Errors {
    const map: Array<Array<keyof RegistrationInput | 'photo'>> = [
      ['employee_id', 'squad', 'name', 'email', 'gender'],
      ['player_type', 'batting_style', 'bowling_style', 'bowling_arm', 'cricket_experience', 'jersey_size', 'availability'],
      ['photo'],
      [],
    ];
    const fields = map[stepIndex] ?? [];
    const next: Errors = {};
    for (const field of fields) {
      next[field] = validateField(field, fieldValue(field), empStatus);
    }
    return next;
  }

  function isStepValid(stepIndex: number): boolean {
    const next = validateStep(stepIndex);
    return Object.values(next).every((err) => !err);
  }

  function stepValid() {
    return isStepValid(step);
  }

  function handleStepChange(nextStep: number) {
    setStep(nextStep);
    setMessage('');
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

  function canNavigateTo(target: number): boolean {
    if (target <= step) return true;
    if (target === step + 1) return isStepValid(step);
    for (let i = step; i < target; i++) {
      if (!isStepValid(i)) return false;
    }
    return true;
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    setTouched({ employee_id: true, name: true, email: true });
    const allErrors: Errors = {};
    const allFields: Array<keyof RegistrationInput | 'photo'> = ['employee_id', 'squad', 'name', 'email', 'gender', 'player_type', 'batting_style', 'bowling_style', 'bowling_arm', 'cricket_experience', 'jersey_size', 'availability', 'photo'];
    for (const field of allFields) {
      allErrors[field] = validateField(field, fieldValue(field), empStatus);
    }
    setErrors(allErrors);
    if (Object.values(allErrors).some((err) => err)) {
      setMessage('Please fix the highlighted fields below before submitting.');
      return;
    }
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
      setPhoto(null);
      setPhotoPreview('');
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
        <form className="registration-form registration-card" onSubmit={submit} noValidate>
          <div className="form-card-heading">
            <span>{String(step + 1).padStart(2, '0')}</span>
            <div><h2>JOIN D2P 2026.</h2><p>Build your player profile.</p></div>
            <em>~ 2 MIN</em>
          </div>
          <Stepper
            initialStep={1}
            onStepChange={(value) => handleStepChange(value - 1)}
            onFinalStepCompleted={() => submit()}
            backButtonText="← BACK"
            nextButtonText="NEXT →"
            completeButtonText={submitting ? 'SAVING…' : '🏏 CREATE MY PLAYER PROFILE'}
            backButtonProps={{ className: 'btn btn-ghost' }}
            nextButtonProps={{ className: 'btn btn-primary', disabled: !stepValid() || submitting }}
            isStepAllowed={(target) => canNavigateTo(target)}
          >
            <Step>
              <fieldset>
                <legend>ABOUT YOU</legend>
                <div className="form-grid form-grid-2">
                  <label className={fieldError('employee_id') ? 'has-error' : ''}>
                    <span className="field-label">Employee ID <em className="req-star">*</em></span>
                    <input
                      autoComplete="off"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{7,8}"
                      title="Enter your 7–8 digit employee ID"
                      maxLength={8}
                      placeholder="e.g. 12345678"
                      value={form.employee_id}
                      aria-invalid={Boolean(fieldError('employee_id'))}
                      onChange={(event) => setField('employee_id', event.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => blurField('employee_id')}
                    />
                    {empStatus === 'checking' && !touched.employee_id ? <em className="emp-hint checking">Checking…</em> : null}
                    {empStatus === 'free' && EMP_ID_RE.test(form.employee_id.trim()) ? <em className="emp-hint free">✓ This ID is available.</em> : null}
                    {empStatus === 'taken' ? <em className="emp-hint taken">✓ Already done — this ID is registered.</em> : null}
                    {fieldError('employee_id') ? <em className="field-error">{fieldError('employee_id')}</em> : null}
                  </label>
                  <label className={fieldError('squad') ? 'has-error' : ''}>
                    <span className="field-label">Squad</span>
                    <input
                      autoComplete="organization"
                      minLength={2}
                      placeholder="e.g. Engineering, Design"
                      value={form.squad}
                      aria-invalid={Boolean(fieldError('squad'))}
                      onChange={(event) => setField('squad', event.target.value)}
                      onBlur={() => blurField('squad')}
                    />
                    {fieldError('squad') ? <em className="field-error">{fieldError('squad')}</em> : null}
                  </label>
                </div>
                <label className={fieldError('name') ? 'has-error' : ''}>
                  <span className="field-label">Full name <em className="req-star">*</em></span>
                  <input
                    autoComplete="name"
                    required
                    minLength={2}
                    placeholder="e.g. Virat Kohli"
                    value={form.name}
                    aria-invalid={Boolean(fieldError('name'))}
                    onChange={(event) => setField('name', event.target.value)}
                    onBlur={() => blurField('name')}
                  />
                  {fieldError('name') ? <em className="field-error">{fieldError('name')}</em> : null}
                </label>
                <label className={fieldError('email') ? 'has-error' : ''}>
                  <span className="field-label">Work email <em className="req-star">*</em></span>
                  <input
                    autoComplete="email"
                    required
                    type="email"
                    placeholder="e.g. you@company.com"
                    value={form.email}
                    aria-invalid={Boolean(fieldError('email'))}
                    onChange={(event) => setField('email', event.target.value)}
                    onBlur={() => blurField('email')}
                  />
                  {fieldError('email') ? <em className="field-error">{fieldError('email')}</em> : null}
                </label>
                <div className="gender-field">
                  <span className="field-label">Gender <em className="req-star">*</em></span>
                  <div className="gender-picker" role="group" aria-label="Gender">
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
              </fieldset>
            </Step>
            <Step>
              <fieldset>
                <legend>YOUR GAME</legend>
                <div className="form-grid">
                  <label className={fieldError('player_type') ? 'has-error' : ''}>
                    <span className="field-label">Player type</span>
                    <select required value={form.player_type} aria-invalid={Boolean(fieldError('player_type'))} onChange={(event) => setField('player_type', event.target.value)} onBlur={() => blurField('player_type')}><option>Batter</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper-batter</option></select>
                  </label>
                  <label className={fieldError('batting_style') ? 'has-error' : ''}>
                    <span className="field-label">Batting style</span>
                    <select required value={form.batting_style} aria-invalid={Boolean(fieldError('batting_style'))} onChange={(event) => setField('batting_style', event.target.value)} onBlur={() => blurField('batting_style')}><option>Right-hand batter</option><option>Left-hand batter</option></select>
                  </label>
                  <label className={fieldError('bowling_style') ? 'has-error' : ''}>
                    <span className="field-label">Bowling style</span>
                    <select required value={form.bowling_style} aria-invalid={Boolean(fieldError('bowling_style'))} onChange={(event) => setField('bowling_style', event.target.value)} onBlur={() => blurField('bowling_style')}><option>Do not bowl</option><option>Right-arm pace</option><option>Left-arm pace</option><option>Right-arm spin</option><option>Left-arm spin</option></select>
                  </label>
                  <label className={fieldError('bowling_arm') ? 'has-error' : ''}>
                    <span className="field-label">Bowling arm</span>
                    <select required value={form.bowling_arm} aria-invalid={Boolean(fieldError('bowling_arm'))} onChange={(event) => setField('bowling_arm', event.target.value)} onBlur={() => blurField('bowling_arm')}><option>Not applicable</option><option>Right arm</option><option>Left arm</option></select>
                  </label>
                  <label className={fieldError('cricket_experience') ? 'has-error' : ''}>
                    <span className="field-label">Experience</span>
                    <select required value={form.cricket_experience} aria-invalid={Boolean(fieldError('cricket_experience'))} onChange={(event) => setField('cricket_experience', event.target.value)} onBlur={() => blurField('cricket_experience')}><option>New to cricket</option><option>Casual player</option><option>Club / college player</option><option>Experienced league player</option></select>
                  </label>
                  <label className={fieldError('jersey_size') ? 'has-error' : ''}>
                    <span className="field-label">Jersey size</span>
                    <select required value={form.jersey_size} aria-invalid={Boolean(fieldError('jersey_size'))} onChange={(event) => setField('jersey_size', event.target.value)} onBlur={() => blurField('jersey_size')}><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                  </label>
                  <label className={fieldError('availability') ? 'has-error' : ''}>
                    <span className="field-label">Match availability</span>
                    <select required value={form.availability} aria-invalid={Boolean(fieldError('availability'))} onChange={(event) => setField('availability', event.target.value)} onBlur={() => blurField('availability')}><option>Available for all matches</option><option>Available for most matches</option><option>Need schedule confirmation</option></select>
                  </label>
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
                  {fieldError('photo') ? <em className="field-error photo-error">{fieldError('photo')}</em> : null}
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
          {message && <p className={`form-message${message.toLowerCase().includes('fix') ? ' error' : ''}`} role="status">{message}</p>}
          <small className="privacy-note">Your details are used for DPL registration and team selection only.</small>
        </form>
      </main>
      <footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer>
    </div>
  );
}
