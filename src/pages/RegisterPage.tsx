import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerPlayer, checkEmployeeExists } from '@/lib/registrations';
import { fetchSiteSettings } from '@/lib/site';
import { useTheme } from '@/lib/useTheme';
import SiteHeader from '@/components/SiteHeader';
import Stepper from '@/components/Stepper';
import BorderGlow from '@/components/BorderGlow';
import type { RegistrationInput } from '@/types';

const initialForm: RegistrationInput = {
  name: '', email: '', employee_id: '', gender: 'Male', location: 'CZ', dpl_played: false, self_rating: 3,
  player_type: 'Batter', batting_style: 'Right-hand batter',
  bowling_style: 'Do not bowl', bowling_arm: 'Not applicable', availability: 'Available for all matches',
};

type EmpStatus = 'idle' | 'checking' | 'free' | 'taken';
type PhotoField = 'photo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMP_ID_RE = /^\d{5,9}$/;
const NAME_RE = /^[a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F\s.'-]*$/;
const PHOTO_MAX_MB = 4;
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const STEP_FIELDS: Record<number, FormKey[]> = {
  0: ['employee_id', 'email', 'name'],
  1: ['player_type', 'batting_style', 'bowling_style', 'bowling_arm', 'availability'],
  2: [],
  3: [],
};

type FormKey = 'employee_id' | 'email' | 'name' | 'gender' | 'location' | 'player_type' | 'batting_style' | 'bowling_style' | 'bowling_arm' | 'availability' | 'dpl_played' | 'self_rating';

const photoSchema = z
  .instanceof(File)
  .refine((file) => PHOTO_TYPES.includes(file.type), 'Only JPG, PNG or WEBP images are allowed.')
  .refine((file) => file.size <= PHOTO_MAX_MB * 1024 * 1024, `Photo must be under ${PHOTO_MAX_MB} MB.`);

export default function RegisterPage() {
  const { dark, toggleTheme } = useTheme();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [empStatus, setEmpStatus] = useState<EmpStatus>('idle');

  const rules = useMemo(
    () => ({
      employee_id: z
        .string()
        .min(1, 'Employee ID is required.')
        .regex(EMP_ID_RE, 'Employee ID must be a 5–9 digit number.')
        .refine((id) => empStatus !== 'checking' || !EMP_ID_RE.test(id), 'Checking employee ID…')
        .refine((id) => empStatus !== 'taken' || !EMP_ID_RE.test(id), 'This employee ID is already registered.'),
      email: z
        .string()
        .min(1, 'Work email is required.')
        .regex(EMAIL_RE, 'Enter a valid email address (e.g. you@company.com).'),
      name: z
        .string()
        .min(1, 'Full name is required.')
        .min(2, 'Name must be at least 2 characters.')
        .regex(NAME_RE, 'Name can only contain letters, spaces, dots and hyphens.'),
      gender: z.enum(['Male', 'Female'], { error: 'Select an option.' }),
      location: z.string().min(1, 'Select an option.'),
      player_type: z.string().min(1, 'Select an option.'),
      batting_style: z.string().min(1, 'Select an option.'),
      bowling_style: z.string().min(1, 'Select an option.'),
      bowling_arm: z.string().min(1, 'Select an option.'),
      availability: z.string().min(1, 'Select an option.'),
      dpl_played: z.boolean(),
      self_rating: z.number().min(1, 'Select an option.').max(5),
    }),
    [empStatus]
  );

  const formSchema = z.object(rules);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: initialForm,
  });
  const { errors, touchedFields } = form.formState;

  useEffect(() => {
    let cancelled = false;
    const id = form.watch('employee_id');
    if (!EMP_ID_RE.test(id.trim())) {
      setEmpStatus('idle');
      return;
    }
    setEmpStatus('checking');
    const timer = window.setTimeout(() => {
      checkEmployeeExists(id.trim())
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
  }, [form]);

  useEffect(() => {
    form.trigger('employee_id');
  }, [empStatus, form]);

  function isStepAllowed(stepIndex: number): boolean {
    if (stepIndex === 2 && !photo) return false;
    const fields = STEP_FIELDS[stepIndex];
    if (!fields.length) return true;
    const values = form.getValues();
    const partial = Object.fromEntries(fields.map((field) => [field, values[field]]));
    return z.object(Object.fromEntries(fields.map((field) => [field, rules[field]]))).safeParse(partial).success;
  }

  function selectPhoto(file: File | null) {
    if (!file) {
      setPhoto(null);
      setPhotoPreview('');
      setPhotoError('Profile photo is required.');
      return;
    }
    const result = photoSchema.safeParse(file);
    if (!result.success) {
      setPhotoError(result.error.issues[0]?.message ?? 'Invalid photo.');
      setPhoto(null);
      setPhotoPreview('');
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoError('');
  }

  async function submit(values: z.infer<typeof formSchema>) {
    if (!photo) {
      setPhotoError('Profile photo is required.');
      setMessage({ kind: 'error', text: 'Please fix the highlighted fields before submitting.' });
      return;
    }
    if (photoError) {
      setMessage({ kind: 'error', text: 'Please fix the highlighted fields before submitting.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const trimmed = { ...values, name: values.name.trim(), email: values.email.trim().toLowerCase(), employee_id: values.employee_id.trim() } as RegistrationInput;
      const result = await registerPlayer(trimmed, photo ?? undefined);
      if (result.demo) {
        setMessage({ kind: 'success', text: 'Demo registration saved locally. Connect Supabase to go live.' });
        setSubmitting(false);
      } else {
        window.location.href = `/D2P/confirmation?name=${encodeURIComponent(trimmed.name)}&email=${encodeURIComponent(trimmed.email)}`;
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      if (/duplicate|unique constraint|already exists/i.test(raw)) {
        setMessage({ kind: 'error', text: "Looks like you've already registered with this employee ID. You're all set — see you on the pitch!" });
      } else if (/check constraint|location/i.test(raw)) {
        setMessage({ kind: 'error', text: 'Something looks off in a couple of fields. Please double-check your location and try again.' });
      } else {
        setMessage({ kind: 'error', text: 'We could not save your profile right now. Please try again in a moment.' });
      }
      setSubmitting(false);
    }
  }

  const initials = form.watch('name').trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'YOU';

  const empHint = empStatus === 'checking' ? <em className="reg-hint checking">Checking…</em>
    : empStatus === 'free' && EMP_ID_RE.test(form.watch('employee_id').trim()) ? <em className="reg-hint ok">✓ Available</em>
    : empStatus === 'taken' ? <em className="reg-hint warn">✓ Already registered</em>
    : null;

  const fieldError = (field: FormKey | PhotoField): string => {
    if (field === 'photo') return photoError;
    const err = errors[field as FormKey]?.message ?? '';
    return err === 'Checking employee ID…' ? '' : err;
  };

  const fieldProps = (field: FormKey | PhotoField) => ({
    className: `reg-field${fieldError(field) ? ' has-error' : ''}${touchedFields[field as FormKey] && !fieldError(field) ? ' is-valid' : ''}`,
    'data-error': fieldError(field),
  });

  const reg = form.register;

  const [gate, setGate] = useState<'checking' | 'open' | 'not-yet' | 'closed'>('checking');

  useEffect(() => {
    let alive = true;
    fetchSiteSettings()
      .then((settings) => {
        if (!alive) return;
        if (!settings?.registration_deadline) {
          setGate('open');
          return;
        }
        const now = Date.now();
        const deadline = new Date(settings.registration_deadline).getTime();
        const open = settings.registration_open ? new Date(settings.registration_open).getTime() : null;
        if (open && now < open) setGate('not-yet');
        else if (now > deadline) setGate('closed');
        else setGate('open');
      })
      .catch(() => {
        if (alive) setGate('open');
      });
    return () => { alive = false; };
  }, []);

  if (gate === 'checking') {
    return (
      <div className={dark ? 'app dark register-page' : 'app register-page'}>
        <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
        <main className="register-main shell">
          <div className="registration-card registration-form py-16 text-center text-sm font-semibold text-muted-foreground">CHECKING REGISTRATION WINDOW…</div>
        </main>
      </div>
    );
  }

  if (gate !== 'open') {
    const closedAt = gate === 'closed';
    return (
      <div className={dark ? 'app dark register-page' : 'app register-page'}>
        <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
        <main className="register-main shell">
          <div className="registration-card registration-form py-14 text-center">
            <div className="text-4xl">{closedAt ? '🏏' : '⏳'}</div>
            <h2 className="reg-title mt-3 font-display text-2xl font-black italic tracking-wide">
              {closedAt ? 'REGISTRATIONS ARE CLOSED' : 'REGISTRATIONS OPEN SOON'}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {closedAt
                ? 'The registration window has ended. If you missed it, reach out to your league admin.'
                : 'The registration window hasn\u2019t opened yet — check back shortly.'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={dark ? 'app dark register-page' : 'app register-page'}>
      <SiteHeader dark={dark} onToggleTheme={toggleTheme} relative />
      <main className="register-main shell">
        <BorderGlow
          className="registration-glow"
          backgroundColor="#071426"
          colors={['#09c9d8', '#873cff', '#2f7dff']}
          glowColor="196 100 48"
          glowIntensity={1.15}
          glowRadius={30}
          edgeSensitivity={22}
          borderRadius={24}
          animated
        >
          <form className="registration-form registration-card" onSubmit={form.handleSubmit(submit)} noValidate>
          <div className="reg-top">
            <div className="reg-title">
              <span className="reg-eyebrow">DPL 2026 · PLAYER REGISTRATION</span>
              <h2>JOIN THE LEAGUE.</h2>
              <p>Register once — get picked in the auction, play for the trophy.</p>
            </div>
            <span className="reg-time">~ 2 MIN</span>
          </div>

          <Stepper
            steps={['PERSONAL', 'CRICKET', 'PHOTO', 'CONFIRM']}
            onFinalStepCompleted={() => form.handleSubmit(submit)()}
            backButtonText="Back"
            nextButtonText="Continue"
            completeButtonText="🏏 CREATE MY PLAYER PROFILE"
            isStepAllowed={isStepAllowed}
            nextButtonProps={{ children: submitting ? 'SAVING…' : undefined, disabled: submitting }}
          >
            <div className="stepper-step-body">
              <div className="reg-fields">
                <div {...fieldProps('employee_id')}>
                  <label htmlFor="employee_id">Employee ID <em className="req-star">*</em></label>
                  <div className="reg-input-wrap">
                    <input
                      id="employee_id"
                      autoComplete="off"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{5,9}"
                      title="Enter your 5–9 digit employee ID"
                      maxLength={9}
                      placeholder="123456789"
                      aria-invalid={Boolean(fieldError('employee_id'))}
                      {...reg('employee_id', {
                        onChange: (event) => {
                          event.target.value = event.target.value.replace(/[^0-9]/g, '');
                        },
                      })}
                    />
                    {empHint}
                  </div>
                  {fieldError('employee_id') ? <small className="reg-error">{fieldError('employee_id')}</small> : null}
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
                      aria-invalid={Boolean(fieldError('email'))}
                      {...reg('email')}
                    />
                  </div>
                  {fieldError('email') ? <small className="reg-error">{fieldError('email')}</small> : null}
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
                      aria-invalid={Boolean(fieldError('name'))}
                      {...reg('name')}
                    />
                  </div>
                  {fieldError('name') ? <small className="reg-error">{fieldError('name')}</small> : null}
                </div>

                <div {...fieldProps('location')}>
                  <label htmlFor="location">Location <em className="req-star">*</em></label>
                  <div className="reg-select-wrap">
                    <select id="location" required aria-invalid={Boolean(fieldError('location'))} {...reg('location')}>
                      <option value="CZ">CZ</option>
                      <option value="SP">SP</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {fieldError('location') ? <small className="reg-error">{fieldError('location')}</small> : null}
                </div>

                <div className="reg-field reg-gender">
                  <span className="reg-label">Gender <em className="req-star">*</em></span>
                  <div className="reg-gender-picker" role="group" aria-label="Gender">
                    {(['Male', 'Female'] as const).map((option) => (
                      <button
                        type="button"
                        className={form.watch('gender') === option ? 'on' : ''}
                        key={option}
                        onClick={() => form.setValue('gender', option, { shouldValidate: true })}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="stepper-step-body">
              <div className="reg-fields reg-fields-3">
                <div {...fieldProps('player_type')}>
                  <label htmlFor="player_type">Player type</label>
                  <div className="reg-select-wrap">
                    <select id="player_type" required aria-invalid={Boolean(fieldError('player_type'))} {...reg('player_type')}><option>Batter</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper-batter</option></select>
                  </div>
                </div>
                <div {...fieldProps('batting_style')}>
                  <label htmlFor="batting_style">Batting style</label>
                  <div className="reg-select-wrap">
                    <select id="batting_style" required aria-invalid={Boolean(fieldError('batting_style'))} {...reg('batting_style')}><option>Right-hand batter</option><option>Left-hand batter</option></select>
                  </div>
                </div>
                <div {...fieldProps('bowling_style')}>
                  <label htmlFor="bowling_style">Bowling style</label>
                  <div className="reg-select-wrap">
                    <select id="bowling_style" required aria-invalid={Boolean(fieldError('bowling_style'))} {...reg('bowling_style')}><option>Do not bowl</option><option>Right-arm pace</option><option>Left-arm pace</option><option>Right-arm spin</option><option>Left-arm spin</option></select>
                  </div>
                </div>
                <div {...fieldProps('bowling_arm')}>
                  <label htmlFor="bowling_arm">Bowling arm</label>
                  <div className="reg-select-wrap">
                    <select id="bowling_arm" required aria-invalid={Boolean(fieldError('bowling_arm'))} {...reg('bowling_arm')}><option>Not applicable</option><option>Right arm</option><option>Left arm</option></select>
                  </div>
                </div>
                <div className="reg-field reg-gender">
                  <span className="reg-label">Played DPL before?</span>
                  <div className="reg-gender-picker" role="group" aria-label="Played DPL before">
                    {([['Yes', true], ['No', false]] as const).map(([label, value]) => (
                      <button
                        type="button"
                        className={form.watch('dpl_played') === value ? 'on' : ''}
                        key={label}
                        onClick={() => form.setValue('dpl_played', value, { shouldValidate: true })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="reg-field reg-rating">
                  <span className="reg-label">Rate your game <em className="reg-opt">(1–5)</em></span>
                  <div className="reg-rating-stars" role="radiogroup" aria-label="Self rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={form.watch('self_rating') === star}
                        className={star <= form.watch('self_rating') ? 'on' : ''}
                        key={star}
                        onClick={() => form.setValue('self_rating', star, { shouldValidate: true })}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.6 7 .6-5.3 4.6 1.6 6.9L12 17.3l-5.9 3.4 1.6-6.9L2.4 9.2l7-.6z"/></svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div {...fieldProps('availability')}>
                  <label htmlFor="availability">Match availability</label>
                  <div className="reg-select-wrap">
                    <select id="availability" required aria-invalid={Boolean(fieldError('availability'))} {...reg('availability')}><option>Available for all matches</option><option>Available for most matches</option><option>Need schedule confirmation</option></select>
                  </div>
                </div>
              </div>
            </div>

            <div className="stepper-step-body">
              <label className={['reg-photo reg-player-card', fieldError('photo') ? 'has-error' : '', !fieldError('photo') && photo ? 'is-valid' : ''].filter(Boolean).join(' ')}>
                <div className="reg-pc-side">
                  <div className="reg-pc-photo">
                    {photoPreview ? <img alt="Preview" src={photoPreview} /> : <span className="reg-pc-fallback"><i>{initials}</i></span>}
                    <span className="reg-pc-grad" />
                    {!photoPreview ? <span className="reg-pc-hint">📷 ADD PHOTO <em className="req-star">*</em></span> : null}
                    <span className="reg-pc-role">{form.watch('player_type')}</span>
                  </div>
                  <div className="reg-pc-body">
                    <div className="reg-pc-top">
                      <span className="reg-pc-league">DPL <b>2026</b></span>
                      <span className="reg-pc-no">#{form.watch('employee_id').trim() || '—'}</span>
                    </div>
                    <strong className="reg-pc-name">{form.watch('name').trim() || 'Your player card'}</strong>
                    <span className="reg-pc-squad">{form.watch('location')} · {form.watch('gender')}</span>
                    <div className="reg-pc-tags">
                      <span className={form.watch('dpl_played') ? 'reg-pc-tag-dpl on' : 'reg-pc-tag-dpl'}>{form.watch('dpl_played') ? 'DPL VET' : 'DPL ROOKIE'}</span>
                    </div>
                    <div className="reg-pc-styles">
                      <span>{form.watch('batting_style')}</span>
                      <span>{form.watch('bowling_style')}</span>
                    </div>
                  </div>
                </div>
                <input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />
              </label>
              {photoPreview ? <button type="button" className="reg-photo-clear" onClick={() => selectPhoto(null)}>Remove photo</button> : null}
              {fieldError('photo') ? <small className="reg-error">{fieldError('photo')}</small> : null}
            </div>

            <div className="stepper-step-body">
              <div className="reg-confirm">
                <p className="reg-confirm-title">YOUR PLAYER CARD</p>
                <div className="reg-pc reg-pc-static">
                  <div className="reg-pc-side">
                    <div className="reg-pc-photo">
                      {photoPreview ? <img alt="Preview" src={photoPreview} /> : <span className="reg-pc-fallback"><i>{initials}</i></span>}
                      <span className="reg-pc-grad" />
                      <span className="reg-pc-role">{form.watch('player_type')}</span>
                    </div>
                    <div className="reg-pc-body">
                      <div className="reg-pc-top">
                        <span className="reg-pc-league">DPL <b>2026</b></span>
                        <span className="reg-pc-no">#{form.watch('employee_id').trim() || '—'}</span>
                      </div>
                      <strong className="reg-pc-name">{form.watch('name').trim() || 'Your player card'}</strong>
                      <span className="reg-pc-squad">{form.watch('location')} · {form.watch('gender')}</span>
                      <div className="reg-pc-tags">
                        <span className={form.watch('dpl_played') ? 'reg-pc-tag-dpl on' : 'reg-pc-tag-dpl'}>{form.watch('dpl_played') ? 'DPL VET' : 'DPL ROOKIE'}</span>
                      </div>
                      <div className="reg-pc-styles">
                        <span>{form.watch('batting_style')}</span>
                        <span>{form.watch('bowling_style')}</span>
                      </div>
                      <div className="reg-confirm-extra">
                        <div className="reg-confirm-extra-row"><span>EMAIL</span><b>{form.watch('email').trim() || '—'}</b></div>
                        <div className="reg-confirm-extra-row"><span>SELF RATING</span><b>{'★'.repeat(form.watch('self_rating'))}{'☆'.repeat(5 - form.watch('self_rating'))}</b></div>
                        <div className="reg-confirm-extra-row"><span>AVAILABILITY</span><b>{form.watch('availability')}</b></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Stepper>

          {message ? <p className={`reg-message ${message.kind}`} role="status">{message.text}</p> : null}
          <small className="reg-note">Your details are used for DPL 2026 registration and team selection only.</small>
          </form>
        </BorderGlow>
      </main>
      <footer>DPL 2026 · DIGITATE PREMIER LEAGUE · OFFICE CRICKET</footer>
    </div>
  );
}