'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Careers.module.css'
import { COUNTRIES, DIAL_CODES } from '@/lib/countries'
import type { EngagementType, Role, WorkMode } from '@/lib/careers'

const MODES: WorkMode[] = ['Onsite', 'Remote', 'Hybrid']
const ENGAGEMENTS: EngagementType[] = ['Full-time', 'Freelance', 'Project-based']
const MAX_RESUME = 4 * 1024 * 1024

/* ───────────────────────── Application form ───────────────────────── */

function ApplyModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [cc, setCc] = useState('+971')
  const [country, setCountry] = useState('United Arab Emirates')
  const [mode, setMode] = useState<WorkMode>(role.modes[0])
  const [engagement, setEngagement] = useState<EngagementType>(role.types[0])
  const [name, setName] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const titleId = useId()

  useEffect(() => setMounted(true), [])

  /* lock body scroll + escape to close while open */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  /* Keep the phone prefix in step with the country the applicant picks. */
  const pickCountry = (value: string) => {
    setCountry(value)
    const match = COUNTRIES.find((c) => c.name === value)
    if (match) setCc(match.dial)
  }

  const pickResume = (file: File | null) => {
    if (file && file.size > MAX_RESUME) {
      setError('That CV is over 4 MB. Please attach a smaller file or share a link instead.')
      return
    }
    setError('')
    setResume(file)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return
    setError('')
    setState('sending')

    const data = new FormData(e.currentTarget)
    data.set('role', role.slug)
    data.set('cc', cc)
    data.set('country', country)
    data.set('mode', mode)
    data.set('engagement', engagement)

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: data })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) {
        setError(json.error || 'Something went wrong. Please try again.')
        setState('idle')
        return
      }
      setState('done')
    } catch {
      setError('Network error. Please check your connection and try again.')
      setState('idle')
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-lenis-prevent
      onClick={onClose}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {state === 'done' ? (
          <div className={styles.done}>
            <div className={styles.doneTick} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h2 id={titleId}>Thanks, {name.split(' ')[0] || 'and welcome'}.</h2>
            <p>
              Your application for <strong>{role.title}</strong> is with us. We read every one and
              reply to the people we&apos;d like to talk to, usually within a week.
            </p>
            <button className={styles.submit} type="button" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
            <header className={styles.formHead}>
              <span className={styles.formEyebrow}>Apply for</span>
              <h2 id={titleId} className={styles.formTitle}>
                {role.title}
              </h2>
              <p className={styles.formSub}>
                Tell us who you are and show us something you&apos;ve made.
              </p>
            </header>

            <label className={styles.field}>
              <span className={styles.label}>Full name *</span>
              <input
                className={styles.input}
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email *</span>
              <input
                className={styles.input}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@email.com"
                required
              />
            </label>

            <div className={styles.field}>
              <span className={styles.label}>Contact number *</span>
              <div className={styles.phone}>
                <select
                  className={styles.select}
                  aria-label="Country dial code"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                >
                  {DIAL_CODES.map((c) => (
                    <option key={c.dial} value={c.dial}>
                      {c.flag} {c.dial}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  type="tel"
                  name="phone"
                  autoComplete="tel-national"
                  inputMode="tel"
                  placeholder="55 535 5897"
                  required
                />
              </div>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Country *</span>
              <select
                className={styles.select}
                value={country}
                onChange={(e) => pickCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>How would you work?</legend>
              <div className={styles.options}>
                {MODES.map((m) => (
                  <label key={m} className={styles.chip} data-on={mode === m}>
                    <input
                      type="radio"
                      name="mode-choice"
                      value={m}
                      checked={mode === m}
                      onChange={() => setMode(m)}
                    />
                    {m}
                  </label>
                ))}
              </div>
              {!role.modes.includes(mode) && (
                <p className={styles.hint}>
                  This role is normally {role.modes.join(' or ').toLowerCase()}, so tell us in
                  your note why {mode.toLowerCase()} would work.
                </p>
              )}
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>Engagement</legend>
              <div className={styles.options}>
                {ENGAGEMENTS.map((t) => (
                  <label key={t} className={styles.chip} data-on={engagement === t}>
                    <input
                      type="radio"
                      name="engagement-choice"
                      value={t}
                      checked={engagement === t}
                      onChange={() => setEngagement(t)}
                    />
                    {t}
                  </label>
                ))}
              </div>
              {!role.types.includes(engagement) && (
                <p className={styles.hint}>
                  We&apos;re hiring this role as {role.types.join(' or ').toLowerCase()}, but make
                  your case.
                </p>
              )}
            </fieldset>

            <label className={styles.field}>
              <span className={styles.label}>Portfolio link</span>
              <input
                className={styles.input}
                type="url"
                name="portfolio"
                inputMode="url"
                placeholder="https://yourwork.com"
              />
            </label>

            <div className={styles.field}>
              <span className={styles.label}>CV / Resume</span>
              <label className={styles.file} data-has={!!resume}>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => pickResume(e.target.files?.[0] ?? null)}
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" strokeLinecap="round" />
                </svg>
                <span>{resume ? resume.name : 'Upload a PDF or Word document (max 4 MB)'}</span>
              </label>
              <p className={styles.hint}>Attach a CV or share a portfolio link, at least one of the two.</p>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Cover letter</span>
              <textarea
                className={styles.textarea}
                name="cover"
                rows={6}
                placeholder="Why this role, and what you'd bring to it."
              />
            </label>

            {/* honeypot — hidden from humans, catches bots */}
            <input
              className={styles.hp}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <button className={styles.submit} type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Send application'}
            </button>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ───────────────────────── Roles list ───────────────────────── */

function RoleCard({ role, onApply }: { role: Role; onApply: () => void }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <article className={`${styles.role} reveal-up`}>
      <div className={styles.roleTop}>
        <div className={styles.roleHead}>
          <span className={styles.roleTeam}>{role.team}</span>
          <h2 className={styles.roleTitle}>{role.title}</h2>
          <p className={styles.roleBlurb}>{role.blurb}</p>
          <ul className={styles.roleMeta}>
            <li>{role.location}</li>
            <li>{role.types.join(' / ')}</li>
            <li>{role.modes.join(' / ')}</li>
          </ul>
        </div>
        <div className={styles.roleActions}>
          <button className={styles.apply} type="button" onClick={onApply}>
            Apply
          </button>
          <button
            className={styles.details}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
          >
            {open ? 'Hide details' : 'View details'}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.rolePanel} id={panelId}>
          <p className={styles.roleAbout}>{role.about}</p>
          <div className={styles.roleLists}>
            <div>
              <h3>What you&apos;ll do</h3>
              <ul>
                {role.responsibilities.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>What we&apos;re looking for</h3>
              <ul>
                {role.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              {role.niceToHave && role.niceToHave.length > 0 && (
                <>
                  <h3 className={styles.roleNice}>Nice to have</h3>
                  <ul>
                    {role.niceToHave.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export default function CareersBoard({ roles }: { roles: Role[] }) {
  const [applying, setApplying] = useState<Role | null>(null)
  const close = useCallback(() => setApplying(null), [])

  return (
    <>
      <div className={styles.list}>
        {roles.map((role) => (
          <RoleCard key={role.slug} role={role} onApply={() => setApplying(role)} />
        ))}
      </div>
      {applying && <ApplyModal role={applying} onClose={close} />}
    </>
  )
}
