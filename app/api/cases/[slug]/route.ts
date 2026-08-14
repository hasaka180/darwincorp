import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getItem, upsertItem, deleteItem, type ContentItem } from '@/lib/cases'

function revalidateContent() {
  for (const p of ['/', '/work', '/cases', '/journal']) revalidatePath(p)
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params
  const found = await getItem(slug)
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(found)
}

export async function PUT(req: Request, { params }: Ctx) {
  const { slug } = await params
  const body = (await req.json()) as Partial<ContentItem>
  try {
    const saved = await upsertItem({ ...(body as ContentItem), slug })
    revalidateContent()
    return NextResponse.json(saved)
  } catch (e) {
    console.error('PUT /api/cases failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Save failed' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { slug } = await params
  const ok = await deleteItem(slug)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  revalidateContent()
  return NextResponse.json({ ok: true })
}
