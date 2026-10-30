'use client'

import { useMemo, useState } from 'react'
import { COUNTRIES } from '@/lib/countries'
import {
  DEFAULT_ANSWERS, PRICES, SITE_TYPES, estimate, formatRange, summary,
  type Answers, type Booking, type Branding, type SiteType,
} from '@/lib/tools/website-cost'
import styles from './WebsiteCostCalculator.module.css'

// Typical page counts, so switching type doesn't leave a starter site at 12 pages.
const DEFAULT_PAGES: Record<SiteType, number> = { starter: 5, business: 12, ecommerce: 15 }

function Choice<T extends string>({ name, value, current, onPick, title, detail, price }: {
  name: string; value: T; current: T; onPick: (v: T) => void; title: string; detail?: string; price?: string
}) {
  const on = value === current
  return (
    <label className={`${styles.choice} ${on ? styles.on : ''}`}>
      <input type="radio" name={name} value={value} checked={on} onChange={() => onPick(value)} />
      <span className={styles.choiceTitle}>{title}</span>
      {detail && <span className={styles.choiceDetail}>{detail}</span>}
      {price && <span className={styles.choicePrice}>{price}</span>}
    </label>
  )
}

function Toggle({ checked, onChange, title, detail, price, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; title: string; detail?: string; price: string; disabled?: boolean
}) {
  return (
    <label className={`${styles.toggle} ${checked ? styles.on : ''} ${disabled ? styles.disabled : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      <span className={styles.toggleText}><strong>{title}</strong>{detail && <span>{detail}</span>}</span>
      <span className={styles.choicePrice}>{price}</span>
    </label>
  )
}

export default function WebsiteCostCalculator() {
  const [a, setA] = useState<Answers>(DEFAULT_ANSWERS)
  const set = (patch: Partial<Answers>) => setA(prev => ({ ...prev, ...patch }))
  const e = useMemo(() => estimate(a), [a])
  const site = SITE_TYPES[a.type]

  const [asking, setAsking] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', cc: '+971', phone: '', note: '', website: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, cc: form.cc, phone: form.phone,
          website: form.website, // honeypot
          service: 'Website cost calculator',
          source: 'tool:website-cost-calculator',
          message: summary(a, e) + (form.note.trim() ? `\n\nNotes: ${form.note.trim()}` : ''),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className={styles.calc}>
      <div className={styles.questions}>
        <fieldset>
          <legend><span>01</span>What do you need?</legend>
          <div className={styles.row2}>
            <Choice name="project" value="new" current={a.project} onPick={v => set({ project: v })} title="A new website" />
            <Choice name="project" value="redesign" current={a.project} onPick={v => set({ project: v })} title="A redesign" detail="Of an existing site" />
          </div>
        </fieldset>

        <fieldset>
          <legend><span>02</span>Type of website</legend>
          <div className={styles.row3}>
            {(Object.keys(SITE_TYPES) as SiteType[]).map(t => (
              <Choice key={t} name="type" value={t} current={a.type} onPick={v => set({ type: v, pages: DEFAULT_PAGES[v] })}
                title={SITE_TYPES[t].label} detail={SITE_TYPES[t].detail} price={formatRange(SITE_TYPES[t].price)} />
            ))}
          </div>
          {a.type === 'ecommerce' && (
            <Toggle checked={a.largeCatalogue} onChange={v => set({ largeCatalogue: v })} title="More than 100 products" detail="Large catalogues are scoped separately" price="Quoted" />
          )}
        </fieldset>

        <fieldset>
          <legend><span>03</span>How many pages?</legend>
          <div className={styles.pages}>
            <input type="range" min={1} max={40} value={a.pages} aria-label="Number of pages" onChange={ev => set({ pages: Number(ev.target.value) })} />
            <output>{a.pages}</output>
          </div>
          <p className={styles.hint}>
            {site.pagesIncluded} pages included, then {formatRange({ low: PRICES.extraPage, high: PRICES.extraPage })} per extra page.
          </p>
        </fieldset>

        <fieldset>
          <legend><span>04</span>Features</legend>
          <div className={styles.stack}>
            <Toggle checked={site.cmsIncluded || a.cms} disabled={site.cmsIncluded} onChange={v => set({ cms: v })}
              title="CMS" detail="Edit your own pages and posts" price={site.cmsIncluded ? 'Included' : `+${formatRange({ low: PRICES.cms, high: PRICES.cms })}`} />
            <Toggle checked={a.language} onChange={v => set({ language: v })}
              title="Second language" detail="Arabic or another language, with right-to-left layout where needed"
              price={`+${Math.round(PRICES.languageShare * 100)}%`} />
            <Toggle checked={a.copy} onChange={v => set({ copy: v })}
              title="Copywriting" detail="We write the words for every page"
              price={`${formatRange({ low: PRICES.copyPerPage, high: PRICES.copyPerPage })} / page`} />
            <Toggle checked={a.motion} onChange={v => set({ motion: v })}
              title="3D and motion" detail="Signature animation, 3D scenes or interactive moments"
              price={`from ${formatRange({ low: PRICES.motion.price, high: PRICES.motion.price })}`} />
          </div>
        </fieldset>

        <fieldset>
          <legend><span>05</span>Booking</legend>
          <div className={styles.row3}>
            {(Object.keys(PRICES.booking) as Booking[]).map(b => {
              const opt = PRICES.booking[b]
              return <Choice key={b} name="booking" value={b} current={a.booking} onPick={v => set({ booking: v })}
                title={opt.label} detail={'detail' in opt ? opt.detail : undefined}
                price={opt.price ? `${opt.from ? 'from ' : '+'}${formatRange({ low: opt.price, high: opt.price })}` : undefined} />
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend><span>06</span>Branding</legend>
          <div className={styles.row3}>
            {(Object.keys(PRICES.branding) as Branding[]).map(b => {
              const opt = PRICES.branding[b]
              return <Choice key={b} name="branding" value={b} current={a.branding} onPick={v => set({ branding: v })}
                title={opt.label} detail={'detail' in opt ? opt.detail : undefined}
                price={opt.price.high ? `+${formatRange(opt.price)}` : undefined} />
            })}
          </div>
        </fieldset>
      </div>

      <aside className={styles.result} aria-live="polite">
        <span className={styles.resultLabel}>Your estimate</span>
        <p className={styles.total}>{formatRange(e.total)}{e.hasFrom && <sup>+</sup>}</p>
        <ul className={styles.lines}>
          {e.lines.map(l => <li key={l.label}><span>{l.label}</span><span>{l.from ? 'from ' : ''}{formatRange(l)}</span></li>)}
          {e.quoteOnly.map(q => <li key={q}><span>{q}</span><span>Quoted</span></li>)}
        </ul>
        <p className={styles.note}>
          Indicative estimate{e.hasFrom ? ', including starting prices' : ''}. Your proposal is quoted against the agreed scope.
          Hosting, domains and licences are listed separately.
        </p>

        {status === 'sent' ? (
          <p className={styles.sent}>Thank you. We have your estimate and will be in touch with a proposal shortly.</p>
        ) : !asking ? (
          <button type="button" className={styles.cta} onClick={() => setAsking(true)}>Get an exact proposal <span aria-hidden="true">↗</span></button>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <p className={styles.formIntro}>We&apos;ll send your selections with the request, so there&apos;s nothing to repeat.</p>
            <input required placeholder="Name" autoComplete="name" value={form.name} onChange={ev => setForm({ ...form, name: ev.target.value })} />
            <input required type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={ev => setForm({ ...form, email: ev.target.value })} />
            <div className={styles.phone}>
              <select aria-label="Country code" value={form.cc} onChange={ev => setForm({ ...form, cc: ev.target.value })}>
                {COUNTRIES.map(c => <option key={c.name} value={c.dial}>{c.flag} {c.dial}</option>)}
              </select>
              <input required type="tel" placeholder="Phone" autoComplete="tel-national" value={form.phone} onChange={ev => setForm({ ...form, phone: ev.target.value })} />
            </div>
            <textarea rows={3} placeholder="Anything else? (optional)" value={form.note} onChange={ev => setForm({ ...form, note: ev.target.value })} />
            <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={ev => setForm({ ...form, website: ev.target.value })} />
            {status === 'error' && <p className={styles.error} role="alert">{error}</p>}
            <button type="submit" className={styles.cta} disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send my estimate'} <span aria-hidden="true">↗</span>
            </button>
          </form>
        )}
      </aside>
    </div>
  )
}
