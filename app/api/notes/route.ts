import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateUser(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notes = await db.note.findMany({
      where: { tenantId: payload.tenantId },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return Response.json(notes)
  } catch (error) {
    console.error('Get notes error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticateUser(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content } = await request.json()

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 })
    }

    // Check subscription limits for FREE plan
    const tenant = await db.tenant.findUnique({
      where: { id: payload.tenantId }
    })

    if (tenant?.plan === 'FREE') {
      const noteCount = await db.note.count({
        where: { tenantId: payload.tenantId }
      })

      if (noteCount >= 3) {
        return Response.json(
          { error: 'Note limit reached. Upgrade to Pro for unlimited notes.' },
          { status: 403 }
        )
      }
    }

    const note = await db.note.create({
      data: {
        title,
        content: content || '',
        tenantId: payload.tenantId,
        userId: payload.userId
      },
      include: { user: { select: { email: true } } }
    })

    return Response.json(note, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
