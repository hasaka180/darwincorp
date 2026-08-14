import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Accept a few common env var names so it works with the values copied from
// Cloudflare's R2 "S3 API" token screen.
const ENDPOINT =
  process.env.R2_S3_API_ENDPOINT ||
  process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined)
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET
// Public bucket URL. Falls back to the known r2.dev address if the env var is unset.
const PUBLIC_BASE =
  process.env.R2_PUBLIC_BASE_URL || 'https://pub-4a897165e53a4f299d9edcba9b810de7.r2.dev'

const FOLDERS = new Set(['work', 'cases', 'journal', 'misc'])

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 12)

const keyFor = (folderReq: unknown, filename: unknown) => {
  const folder = FOLDERS.has(String(folderReq)) ? String(folderReq) : 'misc'
  const ext = (String(filename || 'bin').split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${folder}/${uid()}.${ext}`
}

const s3 = () =>
  new S3Client({
    region: 'auto',
    endpoint: ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY!, secretAccessKey: SECRET_KEY! },
  })

const configError = () => {
  const missing = [
    !ENDPOINT && 'R2_S3_API_ENDPOINT (or R2_ACCOUNT_ID)',
    !ACCESS_KEY && 'R2_ACCESS_KEY_ID / ACCESS_KEY_ID',
    !SECRET_KEY && 'R2_SECRET_ACCESS_KEY',
    !BUCKET && 'R2_BUCKET',
    !PUBLIC_BASE && 'R2_PUBLIC_BASE_URL',
  ].filter(Boolean).join(', ')
  return NextResponse.json({ error: `Uploads not configured. Missing: ${missing}` }, { status: 503 })
}

const isConfigured = () => ENDPOINT && ACCESS_KEY && SECRET_KEY && BUCKET && PUBLIC_BASE

/**
 * Presign mode (JSON body): returns a short-lived PUT URL so the browser uploads
 * the file straight to R2, bypassing Vercel's ~4.5 MB function body limit.
 * Used for large files (e.g. video). Requires a CORS policy on the R2 bucket.
 */
async function presign(req: Request) {
  if (!isConfigured()) return configError()
  try {
    const { filename, folder, contentType } = (await req.json()) as {
      filename?: string; folder?: string; contentType?: string
    }
    const key = keyFor(folder, filename)
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    })
    const uploadUrl = await getSignedUrl(s3(), cmd, { expiresIn: 600 })
    const url = `${PUBLIC_BASE!.replace(/\/$/, '')}/${key}`
    return NextResponse.json({ uploadUrl, url, key })
  } catch (e) {
    console.error('R2 presign failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Presign failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // JSON body → presigned-URL flow (large files / video, direct browser→R2)
  if ((req.headers.get('content-type') || '').includes('application/json')) {
    return presign(req)
  }

  if (!isConfigured()) return configError()

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // route into the work / cases / journal folder
    const key = keyFor(form.get('folder'), file.name)
    const buffer = Buffer.from(await file.arrayBuffer())

    await s3().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    }))

    const url = `${PUBLIC_BASE!.replace(/\/$/, '')}/${key}`
    return NextResponse.json({ url, key })
  } catch (e) {
    console.error('R2 upload failed:', e)
    // surfaced for debugging — this route is password-gated
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 })
  }
}
