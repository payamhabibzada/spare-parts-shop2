# Quick Start Guide

Get the Shop Management System running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- pnpm installed (`npm install -g pnpm`)
- PostgreSQL 14+ installed and running

## Step 1: Clone & Install

```bash
# Install dependencies
pnpm install
```

## Step 2: Configure Environment

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/shop_management?schema=public"
JWT_SECRET=<paste-random-secret-here>
JWT_REFRESH_SECRET=<paste-different-random-secret-here>
FRONTEND_URL=http://localhost:5173
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend

```bash
cd ..
cp .env.example .env.local
```

## Step 3: Setup Database

```bash
cd backend

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data (optional but recommended)
pnpm db:seed
```

## Step 4: Build Backend

```bash
pnpm build
```

## Step 5: Run Application

### Terminal 1 - Backend
```bash
cd backend
pnpm dev
```

### Terminal 2 - Frontend
```bash
cd ..
pnpm dev
```

## Step 6: Access Application

Open browser: `http://localhost:5173`

### Demo Credentials

**Shop Owner Login:**
- Email: `demo@shopmanagement.com`
- Password: `Demo123!@#`

**Admin User Login:**
- Username: `admin`
- Password: `Admin123!@#`

**Regular User Login:**
- Username: `user1`
- Password: `User123!@#`

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Create database
createdb shop_management
```

### Port Already in Use

Backend runs on port 4000, frontend on 5173. Change in:
- Backend: `backend/.env` → `PORT=4001`
- Frontend: Vite will auto-increment

### Prisma Client Error

```bash
cd backend
pnpm db:generate
```

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules backend/node_modules
pnpm install
```

## Next Steps

1. Read [README.md](./README.md) for full documentation
2. Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API reference
3. Check [SECURITY.md](./SECURITY.md) for security guidelines
4. See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Production Deployment

Quick production deployment with Docker:

```bash
# 1. Configure environment
cp backend/.env.example backend/.env.production
# Edit backend/.env.production with production values

# 2. Build and start
docker-compose up -d

# 3. Run migrations
docker-compose exec api pnpm db:migrate:prod
```

Access at `http://localhost`

For detailed production setup, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Support

- **Documentation**: See `README.md`, `DEPLOYMENT.md`, `SECURITY.md`
- **API Docs**: See `API_DOCUMENTATION.md`
- **Issues**: Check logs in backend console or `pm2 logs`
- **Database**: Use `pnpm db:studio` to browse data

## Common Commands

```bash
# Development
pnpm dev                    # Start frontend dev server
cd backend && pnpm dev      # Start backend dev server

# Database
cd backend
pnpm db:generate           # Generate Prisma client
pnpm db:migrate            # Run migrations
pnpm db:seed               # Seed demo data
pnpm db:studio             # Open Prisma Studio

# Building
pnpm build                 # Build frontend
pnpm build:backend         # Build backend
pnpm build:all             # Build both

# Testing
cd backend && pnpm test    # Run tests

# Production (PM2)
pm2 start ecosystem.config.js --env production
pm2 monit                  # Monitor
pm2 logs                   # View logs
pm2 restart shop-api       # Restart

# Production (Docker)
docker-compose up -d       # Start services
docker-compose logs -f     # View logs
docker-compose down        # Stop services
```

---

**Ready to go!** 🚀

For questions or issues, refer to the comprehensive documentation in the repository.
