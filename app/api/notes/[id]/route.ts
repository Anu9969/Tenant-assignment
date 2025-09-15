import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await authenticateUser(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const note = await db.note.findFirst({
      where: {
        id: params.id,
        tenantId: payload.tenantId
      },
      include: { user: { select: { email: true } } }
    })

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    return Response.json(note)
  } catch (error) {
    console.error('Get note error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await authenticateUser(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content } = await request.json()

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 })
    }

    const note = await db.note.findFirst({
      where: {
        id: params.id,
        tenantId: payload.tenantId
      }
    })

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    const updatedNote = await db.note.update({
      where: { id: params.id },
      data: {
        title,
        content: content || ''
      },
      include: { user: { select: { email: true } } }
    })

    return Response.json(updatedNote)
  } catch (error) {
    console.error('Update note error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await authenticateUser(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const note = await db.note.findFirst({
      where: {
        id: params.id,
        tenantId: payload.tenantId
      }
    })

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    await db.note.delete({
      where: { id: params.id }
    })

    return Response.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Delete note error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
