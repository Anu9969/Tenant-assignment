import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create tenants
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme',
      plan: 'FREE'
    }
  })

  const globexTenant = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: {
      name: 'Globex Corporation',
      slug: 'globex',
      plan: 'FREE'
    }
  })

  console.log('✅ Tenants created:', { acmeTenant: acmeTenant.slug, globexTenant: globexTenant.slug })

  // Hash password
  const hashedPassword = await bcrypt.hash('password', 10)

  // Create users for Acme
  const acmeAdmin = await prisma.user.upsert({
    where: { email: 'admin@acme.test' },
    update: {},
    create: {
      email: 'admin@acme.test',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: acmeTenant.id
    }
  })

  const acmeUser = await prisma.user.upsert({
    where: { email: 'user@acme.test' },
    update: {},
    create: {
      email: 'user@acme.test',
      password: hashedPassword,
      role: 'MEMBER',
      tenantId: acmeTenant.id
    }
  })

  // Create users for Globex
  const globexAdmin = await prisma.user.upsert({
    where: { email: 'admin@globex.test' },
    update: {},
    create: {
      email: 'admin@globex.test',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: globexTenant.id
    }
  })

  const globexUser = await prisma.user.upsert({
    where: { email: 'user@globex.test' },
    update: {},
    create: {
      email: 'user@globex.test',
      password: hashedPassword,
      role: 'MEMBER',
      tenantId: globexTenant.id
    }
  })

  console.log('✅ Users created:', {
    acme: { admin: acmeAdmin.email, user: acmeUser.email },
    globex: { admin: globexAdmin.email, user: globexUser.email }
  })

  // Create subscriptions
  await prisma.subscription.upsert({
    where: { tenantId: acmeTenant.id },
    update: {},
    create: {
      tenantId: acmeTenant.id,
      plan: 'FREE',
      status: 'ACTIVE'
    }
  })

  await prisma.subscription.upsert({
    where: { tenantId: globexTenant.id },
    update: {},
    create: {
      tenantId: globexTenant.id,
      plan: 'FREE',
      status: 'ACTIVE'
    }
  })

  console.log('✅ Subscriptions created')

  // Create sample notes for Acme
  await prisma.note.createMany({
    data: [
      {
        title: 'Welcome to Acme Notes',
        content: 'This is your first note in the Acme tenant.',
        tenantId: acmeTenant.id,
        userId: acmeAdmin.id
      },
      {
        title: 'Meeting Notes',
        content: 'Team meeting scheduled for next week.',
        tenantId: acmeTenant.id,
        userId: acmeUser.id
      }
    ],
    skipDuplicates: true
  })

  // Create sample notes for Globex
  await prisma.note.createMany({
    data: [
      {
        title: 'Globex Project Ideas',
        content: 'Brainstorming session for new projects.',
        tenantId: globexTenant.id,
        userId: globexAdmin.id
      },
      {
        title: 'Client Feedback',
        content: 'Positive feedback from our latest client.',
        tenantId: globexTenant.id,
        userId: globexUser.id
      }
    ],
    skipDuplicates: true
  })

  console.log('✅ Sample notes created')

  console.log('🎉 Database seeded successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('• admin@acme.test (Admin, Acme tenant) - password: password')
  console.log('• user@acme.test (Member, Acme tenant) - password: password')
  console.log('• admin@globex.test (Admin, Globex tenant) - password: password')
  console.log('• user@globex.test (Member, Globex tenant) - password: password')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
