'use client'

import { useCallback, useState } from 'react'
import { ApplyModal } from './CareersBoard'
import ShareButtons from './ShareButtons'
import type { Role } from '@/lib/careers'
import styles from './Careers.module.css'

/**
 * A single opening on its own page: everything the listing card shows when
 * expanded, plus the share row and an apply button that opens the same modal
 * the listing uses, so there is only one application form to maintain.
 */
export default function RoleDetail({ role, shareUrl }: { role: Role; shareUrl: string }) {
  const [applying, setApplying] = useState(false)
  const close = useCallback(() => setApplying(false), [])

  return (
    <article className={`${styles.rolePage} reveal-up`}>
      <span className={styles.roleTeam}>{role.team}</span>
      <h1 className={styles.rolePageTitle}>
        {role.title}
        {role.titleLabel && <span className={styles.roleLabel}>{role.titleLabel}</span>}
      </h1>
      <p className={styles.roleBlurb}>{role.blurb}</p>

      <ul className={styles.roleMeta}>
        <li>{role.location}</li>
        <li>{role.types.join(' / ')}</li>
        <li>{role.modes.join(' / ')}</li>
      </ul>

      <div className={styles.roleActions}>
        <button type="button" className={styles.apply} onClick={() => setApplying(true)}>
          Apply
        </button>
      </div>

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

      <footer className={styles.roleFooter}>
        <ShareButtons url={shareUrl} title={`${role.title} at Darwin Corp`} />
      </footer>

      {applying && <ApplyModal role={role} onClose={close} />}
    </article>
  )
}
