import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const payload = await authenticateUser(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (payload.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { slug } = params

    // Verify tenant exists and user belongs to it
    const tenant = await db.tenant.findUnique({
      where: { slug }
    })

    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (tenant.id !== payload.tenantId) {
      return Response.json({ error: 'Forbidden - Access denied' }, { status: 403 })
    }

    // Upgrade to PRO
    const updatedTenant = await db.tenant.update({
      where: { slug },
      data: { plan: 'PRO' }
    })

    // Create or update subscription
    await db.subscription.upsert({
      where: { tenantId: tenant.id },
      update: { plan: 'PRO', status: 'ACTIVE' },
      create: {
        tenantId: tenant.id,
        plan: 'PRO',
        status: 'ACTIVE'
      }
    })

    return Response.json({
      message: 'Tenant upgraded to Pro successfully',
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        plan: updatedTenant.plan
      }
    })
  } catch (error) {
    console.error('Upgrade tenant error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
