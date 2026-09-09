import fs from 'fs/promises'
import path from 'path'
import { Client, TablesDB, Query } from 'node-appwrite'

/* ── Content types ── */
export type ContentType = 'work' | 'case' | 'journal'

/* Section-based content model (the case-study "builder" blocks) */
export type Section =
  | { id: string; type: 'text'; eyebrow?: string; heading?: string; body?: string; align?: 'left' | 'center'; note?: boolean }
  | { id: string; type: 'image'; src: string; caption?: string; full?: boolean }
  | { id: string; type: 'video'; src: string; poster?: string; full?: boolean }
  | { id: string; type: 'columns'; items: { heading?: string; body?: string }[] }
  | { id: string; type: 'grid'; columns?: number; items: { src: string; caption?: string }[] }

export interface CaseStudy {
  type?: 'work' | 'case'
  slug: string
  title: string
  client?: string
  category?: string
  tab?: string // Work page filter (e.g. Branding / Web / Content)
  year?: string
  accent?: string
  cover?: string
  icon?: string // small card icon/logo (falls back to first letter on accent)
  intro?: string
  services?: string[]
  bg?: string // detail-view background colour
  fg?: string // detail-view text colour
  featured?: boolean // surfaced in the homepage "Featured Work" grid
  sections: Section[]
  // SEO / AEO overrides — leave blank to fall back to title / intro
  metaTitle?: string
  metaDescription?: string
  // Summary block (renders above the sections)
  summaryTitle?: string
  summaryDescription?: string
  // FAQ accordion (renders below the sections)
  faqs?: { q: string; a: string }[]
  // Custom JSON-LD (injected as an extra <script type="application/ld+json">)
  jsonLd?: string
}

export interface JournalPost {
  type: 'journal'
  slug: string
  title: string
  excerpt?: string
  category?: string
  author?: string
  date?: string
  cover?: string
  size?: 'lg' | 'md' | 'sm'
  featured?: boolean
  body?: string
  bg?: string // reader background colour
  fg?: string // reader text colour
  // SEO overrides — leave blank to fall back to title / excerpt
  metaTitle?: string
  metaDescription?: string
  // Summary block (renders above body)
  summaryTitle?: string
  summaryDescription?: string
  // FAQ accordion
  faqs?: { q: string; a: string }[]
  // Custom JSON-LD (injected as additional <script type="application/ld+json">)
  jsonLd?: string
}

export type ContentItem = CaseStudy | JournalPost

export function itemType(i: ContentItem): ContentType {
  return (i as { type?: ContentType }).type ?? 'case'
}

type Store = { cases: ContentItem[] }

const FILE = path.join(process.cwd(), 'data', 'cases.json')

/* ── Storage: Appwrite TablesDB (rows) when configured, else local JSON file ── */
const AW = {
  endpoint: process.env.APPWRITE_ENDPOINT,
  project: process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  db: process.env.APPWRITE_DATABASE_ID,
  col: process.env.APPWRITE_COLLECTION_ID,
}

const tables =
  AW.endpoint && AW.project && AW.apiKey && AW.db && AW.col
    ? new TablesDB(new Client().setEndpoint(AW.endpoint).setProject(AW.project).setKey(AW.apiKey))
    : null

const parseRow = (row: Record<string, unknown>): ContentItem =>
  JSON.parse((row.data as string) ?? '{}') as ContentItem

const toRow = (item: ContentItem) => ({ slug: item.slug, title: item.title, data: JSON.stringify(item) })

/**
 * Appwrite row id for a slug.
 *
 * Appwrite caps ids at 36 chars and wants them to start alphanumeric, but
 * slugs are written for readers and routinely run longer than that — saving
 * one used to fail outright. A slug that already fits is used unchanged, so
 * every row written before this stays addressable; anything else is truncated
 * and given a hash of the full slug, which keeps two long slugs sharing an
 * opening from colliding.
 */
const VALID_ROW_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/

export function rowIdFor(slug: string): string {
  if (VALID_ROW_ID.test(slug)) return slug
  let hash = 5381
  for (let i = 0; i < slug.length; i++) hash = ((hash * 33) ^ slug.charCodeAt(i)) >>> 0
  const suffix = hash.toString(36).padStart(7, '0')
  const head = slug.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^[^a-zA-Z0-9]+/, '').slice(0, 28)
  return `${head || 'row'}-${suffix}`
}

/* ── file fallback (local dev) ── */
async function readFileStore(): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf-8')) as Store
  } catch {
    return { cases: [] }
  }
}
async function writeFileStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), 'utf-8')
}

async function readAll(): Promise<ContentItem[]> {
  if (tables) {
    try {
      const res = await tables.listRows({ databaseId: AW.db!, tableId: AW.col!, queries: [Query.limit(200)] })
      return res.rows.map((r) => parseRow(r as Record<string, unknown>))
    } catch (e) {
      // Appwrite unreachable/misconfigured — don't crash the build or the API;
      // fall back to the bundled seed file so the site stays readable.
      console.error('Appwrite read failed, falling back to data/cases.json:', e)
      return (await readFileStore()).cases
    }
  }
  return (await readFileStore()).cases
}

/* Seed any content TYPE that is missing from the store, from data/cases.json.
   Lets us add Work/Journal dummy data even though Cases are already seeded. */
let seedPromise: Promise<void> | null = null
async function ensureSeeded(): Promise<void> {
  if (!tables) return
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const existing = await readAll()
        const haveTypes = new Set(existing.map(itemType))
        const seed = (await readFileStore()).cases
        const toSeed = seed.filter((s) => !haveTypes.has(itemType(s)))
        for (const it of toSeed) {
          await tables.upsertRow({ databaseId: AW.db!, tableId: AW.col!, rowId: rowIdFor(it.slug), data: toRow(it) })
        }
      } catch {
        seedPromise = null // allow retry next request
      }
    })()
  }
  return seedPromise
}

/* ── public API ── */
export async function getItems(type?: ContentType): Promise<ContentItem[]> {
  await ensureSeeded()
  const all = tables ? await readAll() : (await readFileStore()).cases
  return type ? all.filter((i) => itemType(i) === type) : all
}

export async function getItem(slug: string): Promise<ContentItem | null> {
  if (tables) {
    await ensureSeeded()
    try {
      return parseRow((await tables.getRow({ databaseId: AW.db!, tableId: AW.col!, rowId: rowIdFor(slug) })) as Record<string, unknown>)
    } catch {
      // The id is derived from the slug, so a row written under an older
      // scheme still answers to its slug column.
      try {
        const res = await tables.listRows({
          databaseId: AW.db!,
          tableId: AW.col!,
          queries: [Query.equal('slug', slug), Query.limit(1)],
        })
        if (res.rows.length) return parseRow(res.rows[0] as Record<string, unknown>)
      } catch {
        // fall through to the seed file
      }
      // row missing, or Appwrite down — fall back to the seed file before giving up
      return (await readFileStore()).cases.find((c) => c.slug === slug) ?? null
    }
  }
  return (await readFileStore()).cases.find((c) => c.slug === slug) ?? null
}

export async function upsertItem(item: ContentItem): Promise<ContentItem> {
  if (tables) {
    await tables.upsertRow({ databaseId: AW.db!, tableId: AW.col!, rowId: rowIdFor(item.slug), data: toRow(item) })
    return item
  }
  const store = await readFileStore()
  const idx = store.cases.findIndex((c) => c.slug === item.slug)
  if (idx >= 0) store.cases[idx] = item
  else store.cases.push(item)
  await writeFileStore(store)
  return item
}

/** Lightweight liveness read — used by the keep-alive cron so Appwrite's
    free tier doesn't auto-pause the project for inactivity. */
export async function ping(): Promise<{ ok: boolean; total?: number; error?: string }> {
  if (!tables) return { ok: true, total: (await readFileStore()).cases.length }
  try {
    const res = await tables.listRows({ databaseId: AW.db!, tableId: AW.col!, queries: [Query.limit(1)] })
    return { ok: true, total: res.total }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function deleteItem(slug: string): Promise<boolean> {
  if (tables) {
    try {
      await tables.deleteRow({ databaseId: AW.db!, tableId: AW.col!, rowId: rowIdFor(slug) })
      return true
    } catch {
      return false
    }
  }
  const store = await readFileStore()
  const before = store.cases.length
  store.cases = store.cases.filter((c) => c.slug !== slug)
  if (store.cases.length === before) return false
  await writeFileStore(store)
  return true
}
