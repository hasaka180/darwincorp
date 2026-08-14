import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getItems, upsertItem, type ContentItem, type ContentType } from '@/lib/cases'

// refresh the server-rendered content pages after a write
function revalidateContent() {
  for (const p of ['/', '/work', '/cases', '/journal']) revalidatePath(p)
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const type = new URL(req.url).searchParams.get('type') as ContentType | null
    const items = await getItems(type ?? undefined)
    return NextResponse.json({ items })
  } catch (e) {
    console.error('GET /api/cases failed:', e)
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<ContentItem>
  if (!body.slug || !body.title) {
    return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })
  }
  try {
    const created = await upsertItem(body as ContentItem)
    revalidateContent()
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('POST /api/cases failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Save failed' }, { status: 500 })
  }
}
