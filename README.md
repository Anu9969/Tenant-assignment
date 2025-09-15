# Multi-Tenant Notes SaaS Application

A minimal but functional SaaS Notes application built with Next.js App Router, featuring multi-tenancy, JWT authentication, RBAC, subscription gating, and CRUD operations.

## 🏗️ Architecture Overview

### Multi-Tenancy Strategy
This application uses a **shared database schema** approach with tenant isolation via `tenantId` columns. This choice provides:

- ✅ **Simple setup**: Single database, easy to deploy
- ✅ **Cost effective**: No per-tenant infrastructure overhead  
- ✅ **Easy maintenance**: Single schema to manage
- ✅ **Scalable**: Can handle thousands of tenants efficiently

**Trade-offs:**
- ⚠️ Requires careful query isolation (implemented via Prisma filters)
- ⚠️ All tenants share the same database resources

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Authorization**: Role-based (Admin/Member)
- **Deployment**: Vercel-ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or hosted)

### 1. Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd tenant-notes-saas
npm install
```

### 2. Environment Setup

Copy the environment template and configure:

```bash
cp env.example .env.local
```

Update `.env.local` with your values:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tenant_notes"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed
```

### 4. Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 👥 Test Accounts

The seed script creates these test accounts (password: `password`):

| Email | Role | Tenant | Access |
|-------|------|--------|--------|
| `admin@acme.test` | Admin | Acme | Full access + upgrade |
| `user@acme.test` | Member | Acme | Notes CRUD only |
| `admin@globex.test` | Admin | Globex | Full access + upgrade |
| `user@globex.test` | Member | Globex | Notes CRUD only |

## 🔗 API Endpoints

### Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'

# Response: {"token":"...","user":{"id":"...","email":"...","role":"ADMIN","tenantSlug":"acme"}}
```

### Health Check
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok"}
```

### Notes CRUD

```bash
# Get all notes (requires auth)
curl http://localhost:3000/api/notes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create note (requires auth)
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"My Note","content":"Note content"}'

# Get specific note
curl http://localhost:3000/api/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update note
curl -X PUT http://localhost:3000/api/notes/NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Updated Title","content":"Updated content"}'

# Delete note
curl -X DELETE http://localhost:3000/api/notes/NOTE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Tenant Management

```bash
# Upgrade tenant to Pro (Admin only)
curl -X POST http://localhost:3000/api/tenants/acme/upgrade \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response: {"message":"Tenant upgraded to Pro successfully","tenant":{...}}
```

## 📊 Database Schema

```sql
-- Tenants table
tenants {
  id        String @id @default(cuid())
  name      String
  slug      String @unique
  plan      Plan   @default(FREE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

-- Users table (tenant-isolated)
users {
  id        String @id @default(cuid())
  email     String @unique
  password  String
  role      Role   @default(MEMBER)
  tenantId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

-- Notes table (tenant-isolated)
notes {
  id        String @id @default(cuid())
  title     String
  content   String?
  tenantId  String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

-- Subscriptions table
subscriptions {
  id          String            @id @default(cuid())
  tenantId    String            @unique
  plan        Plan              @default(FREE)
  status      SubscriptionStatus @default(ACTIVE)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}
```

## 🔐 Security Features

### Multi-Tenant Isolation
- All queries automatically filtered by `tenantId`
- Users can only access their tenant's data
- JWT tokens include tenant information

### Authentication & Authorization
- JWT-based authentication with 7-day expiration
- Role-based access control (Admin/Member)
- Admin-only upgrade endpoint protection

### Subscription Gating
- Free plan: Maximum 3 notes per tenant
- Pro plan: Unlimited notes
- Upgrade endpoint enforces admin role

## 🚀 Deployment to Vercel

### 1. Database Setup
Choose one of these options:

**Option A: Supabase (Recommended)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy the database URL from Settings > Database

**Option B: Railway**
1. Create account at [railway.app](https://railway.app)
2. Create new PostgreSQL database
3. Copy the connection string

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

### 3. Post-Deployment Setup

```bash
# Run migrations on production database
vercel env pull .env.production
npx prisma db push

# Seed production database
npx prisma db seed
```

### 4. Vercel Configuration

The application is optimized for Vercel deployment:

- **Build script**: Includes `prisma generate` before Next.js build
- **`postinstall` script**: Automatically generates Prisma Client after npm install
- **Prisma in dependencies**: Ensures Prisma is available during Vercel build process
- **No custom vercel.json**: Next.js handles build process automatically

### 5. Environment Variables in Vercel Dashboard
Add these in your Vercel project settings:

```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
```

## 🧪 Testing the Application

### 1. Test Multi-Tenancy
1. Login as `admin@acme.test`
2. Create notes
3. Login as `admin@globex.test` 
4. Verify you see different notes (tenant isolation)

### 2. Test Subscription Limits
1. Login as any user
2. Create 3 notes (free plan limit)
3. Try to create a 4th note → should get error
4. Login as admin → should see upgrade button

### 3. Test Role-Based Access
1. Login as `user@acme.test` (Member)
2. Try to upgrade tenant → should get 403 Forbidden
3. Login as `admin@acme.test` (Admin)
4. Upgrade should work

### 4. Test API Endpoints
Use the curl commands above to test all endpoints programmatically.

## 📁 Project Structure

```
/app
├── api/
│   ├── auth/login/route.ts          # JWT login endpoint
│   ├── health/route.ts              # Health check
│   ├── notes/
│   │   ├── route.ts                 # GET/POST notes
│   │   └── [id]/route.ts            # GET/PUT/DELETE specific note
│   └── tenants/[slug]/upgrade/route.ts  # Upgrade endpoint
├── login/page.tsx                   # Login page
├── notes/page.tsx                   # Notes management page
├── layout.tsx                       # Root layout
└── globals.css                      # Global styles

/lib
├── auth.ts                          # JWT utilities & auth helpers
└── db.ts                           # Prisma client

/prisma
├── schema.prisma                    # Database schema
└── seed.ts                         # Database seed script
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database scripts
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with test data
npm run db:reset     # Reset database and seed
```

## 🎯 What's Included

### ✅ Core Features
- **Multi-tenancy**: Shared schema with tenant isolation
- **Authentication**: JWT-based login system
- **Authorization**: Role-based access control
- **Subscription Gating**: Free (3 notes) vs Pro (unlimited)
- **Notes CRUD**: Full create, read, update, delete operations
- **Frontend**: Functional login and notes management pages
- **Database**: Prisma schema with seed script
- **Deployment**: Vercel-ready configuration

### ✅ Security & Best Practices
- Tenant data isolation
- Password hashing with bcrypt
- JWT token expiration
- Input validation
- Error handling

## 🚫 What's Excluded (For Simplicity)

### ❌ Not Included
- **User Registration**: No signup endpoint (seeded users only)
- **Password Reset**: No forgot password functionality
- **Email Verification**: No email sending
- **Advanced UI**: Basic functional interface only
- **Testing**: No automated test suite
- **Docker**: No containerization
- **CI/CD**: No automated deployment pipeline
- **Monitoring**: No logging or analytics
- **Rate Limiting**: No API rate limiting
- **File Uploads**: Text-only notes
- **Search**: No note search functionality
- **Collaboration**: No sharing or permissions
- **Billing**: No payment processing integration

## 🔍 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/dbname
```

**JWT Token Issues**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET
# Should be a secure random string
```

**Prisma Client Errors**
```bash
# Regenerate Prisma client
npm run db:generate
```

**Build Errors on Vercel**
- Ensure all environment variables are set
- Check that `npm run build` works locally
- Verify Prisma client is generated

## 📝 License

MIT License - feel free to use this code for your own projects.

## 🤝 Contributing

This is a minimal implementation for evaluation purposes. For production use, consider adding:

- Comprehensive test suite
- Error monitoring and logging
- Rate limiting and security headers
- Database connection pooling
- Caching layer
- Email notifications
- Payment processing integration
- Advanced UI/UX design

---

**Ready to deploy!** 🚀 This application is fully functional and ready for production deployment on Vercel with a PostgreSQL database.
