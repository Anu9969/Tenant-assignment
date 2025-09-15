import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JWTPayload {
  userId: string
  email: string
  role: string
  tenantId: string
  tenantSlug: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export async function authenticateUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // Verify user still exists and is active
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { tenant: true }
  })

  if (!user || !user.tenant) return null

  return payload
}

export function requireAuth(handler: (request: NextRequest, payload: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const payload = await authenticateUser(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(request, payload)
  }
}

export function requireAdmin(handler: (request: NextRequest, payload: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const payload = await authenticateUser(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (payload.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    return handler(request, payload)
  }
}
