# Shop Management System — Enterprise Architecture

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| State | React Context (current) → React Query (migration target) |
| Validation | Zod (schemas in `src/app/validation/schemas.ts`) |
| API client | `src/app/services/apiClient.ts` (JWT auto-refresh) |
| Backend | Node.js 20, Express, TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (15 min access) + Refresh Token (7 day, DB-stored, rotated) |
| Password hashing | bcrypt (cost 12) |
| Deployment | Docker Compose, Nginx reverse proxy, PM2 |

## Folder structure

```
/
├── src/
│   └── app/
│       ├── components/     # Reusable UI + ErrorBoundary
│       ├── pages/          # Route-level page components
│       ├── services/       # API service layer (apiClient, *.service.ts)
│       ├── store/          # React Context providers
│       ├── validation/     # Zod schemas
│       └── routes.tsx
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Full DB schema (all entities, enums, relations)
│   │   └── seed.ts         # Default shop user creation
│   └── src/
│       ├── index.ts        # Express app bootstrap
│       ├── lib/            # prisma.ts, jwt.ts
│       ├── middleware/     # authenticate, requireRole, errorHandler, notFound
│       └── routes/         # One file per resource
├── docker-compose.yml
├── Dockerfile.frontend
├── nginx.conf
└── .env.example
```

## Auth flow

1. Shop owner → `POST /api/shop-auth/login` → gets `accessToken` (15 min) + `refreshToken` (7 days, stored in DB)
2. Shop employee → `POST /api/auth/login` (requires `shopId`) → same token pair
3. Every API request sends `Authorization: Bearer <accessToken>`
4. On 401, `apiClient.ts` automatically calls `POST /api/auth/refresh` (token rotation), retries original request
5. On refresh failure → tokens cleared, redirect to `/login`

## Security checklist

- [x] `crypto.randomUUID()` for all IDs (no predictable IDs)
- [x] bcrypt cost 12 for all passwords
- [x] No plain-text passwords in code or logs (masked as `***` in audit logs)
- [x] Admin credentials moved to environment variables
- [x] JWT access tokens expire in 15 minutes
- [x] Refresh tokens rotated on every use and stored in DB (revocable)
- [x] Helmet.js security headers
- [x] CORS restricted to `FRONTEND_URL`
- [x] Rate limiting on auth routes (20 req / 15 min)
- [x] Zod validation on all API inputs
- [x] ErrorBoundary wrapping entire React tree
- [x] `.env` files in `.gitignore`

## Running locally

```bash
# 1. Start PostgreSQL
docker-compose up db -d

# 2. Backend
cd backend
cp .env.example .env          # edit DATABASE_URL + JWT secrets
pnpm install
pnpm run db:migrate
npx tsx prisma/seed.ts
pnpm run dev

# 3. Frontend
cd ..
cp .env.example .env          # edit VITE_API_URL if needed
pnpm install
pnpm run dev
```

## Production deployment

```bash
# Generate strong secrets
openssl rand -base64 64   # for JWT_ACCESS_SECRET
openssl rand -base64 64   # for JWT_REFRESH_SECRET

# Edit docker-compose.yml environment section or use .env
docker-compose up -d --build
```

## Migration from localStorage

The current app stores all data in localStorage (multi-tenant via `shop_{id}_*` prefix).
To migrate:

1. Export data: use the existing export utilities in `src/app/utils/exportUtils.ts`
2. Run `prisma migrate deploy` on production DB
3. Run `prisma/seed.ts` to create initial shop user
4. Import exported JSON via a one-time migration script (to be written)
5. Update frontend to use service layer (`src/app/services/`) instead of Context
