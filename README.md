# Shop Management System - Enterprise Edition

A full-stack, production-ready shop management system with multi-tenancy, role-based access control, and comprehensive features for managing products, customers, sales, inventory, suppliers, shareholders, and financial operations.

## 🚀 Features

### Core Features
- ✅ **Multi-Tenancy**: Separate database per shop with complete data isolation
- ✅ **Authentication & Authorization**: JWT-based auth with access/refresh tokens
- ✅ **Role-Based Access Control (RBAC)**: SUPER_ADMIN, ADMIN, USER roles with granular permissions
- ✅ **Multi-Language Support**: Dari (فارسی/دری), Pashto (پښتو), English
- ✅ **Multi-Currency**: Afghan Afghani (AFN) and US Dollar (USD)
- ✅ **Barcode Scanner**: Built-in barcode scanning with camera
- ✅ **Activity Logging**: Comprehensive audit trail with before/after data
- ✅ **Low Stock Alerts**: Automatic notifications for minimum stock levels
- ✅ **Export to Excel**: Full data export capabilities

### Business Features
- 📦 **Product Management**: Categories, barcodes, buy/sell prices, stock tracking
- 👥 **Customer Management**: Credit sales, payment history, customer profiles
- 🛒 **Sales Management**: Invoice generation, partial payments, credit tracking
- 🏭 **Supplier Management**: Purchase tracking, payment history
- 💼 **Shareholder Management**: Investment tracking, profit distribution
- 💰 **Financial Management**: Cash ledger, expenses, withdrawals
- 📊 **Dashboard & Reports**: Real-time analytics and insights

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Security**: 
  - Helmet (security headers)
  - CORS (cross-origin protection)
  - bcrypt (password hashing)
  - CSRF protection
  - Rate limiting
- **Validation**: Zod schemas

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v7
- **UI Library**: Radix UI + Custom Components
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context API
- **Build Tool**: Vite

### DevOps
- **Containerization**: Docker + Docker Compose
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js >= 20.x
- pnpm >= 8.x
- PostgreSQL >= 14
- Docker & Docker Compose (for containerized deployment)

## 🔧 Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd shop-management-system
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 3. Environment Configuration

#### Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shop_management?schema=public"
JWT_SECRET=<generate-strong-random-secret-64-chars>
JWT_REFRESH_SECRET=<generate-different-strong-random-secret-64-chars>
FRONTEND_URL=http://localhost:5173
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Frontend Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_URL=http://localhost:4000
```

### 4. Database Setup

```bash
cd backend

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed demo data (optional)
pnpm db:seed
```

### 5. Build

```bash
# Build backend
cd backend
pnpm build

# Build frontend
cd ..
pnpm build
```

## 🚀 Running the Application

### Development Mode

```bash
# Terminal 1: Start backend
cd backend
pnpm dev

# Terminal 2: Start frontend
pnpm dev
```

Access the application at `http://localhost:5173`

### Production Mode

#### Option 1: Using PM2

```bash
# Build all
pnpm run build:backend
pnpm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs
```

#### Option 2: Using Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application at `http://localhost`

## 📝 Default Credentials

After running `pnpm db:seed`:

**Shop Owner:**
- Email: `demo@shopmanagement.com`
- Password: `Demo123!@#`

**Admin User:**
- Username: `admin`
- Password: `Admin123!@#`

**Regular User:**
- Username: `user1`
- Password: `User123!@#`

## 🧪 Testing

```bash
# Run backend tests
cd backend
pnpm test

# Run tests with coverage
pnpm test -- --coverage
```

## 📁 Project Structure

```
shop-management-system/
├── backend/                  # Backend API
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed.ts          # Seed data
│   ├── src/
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── lib/             # Utilities
│   │   └── index.ts         # Entry point
│   └── package.json
│
├── src/                      # Frontend
│   ├── app/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API clients
│   │   ├── store/           # Context providers
│   │   ├── lib/             # Utilities
│   │   └── App.tsx          # Root component
│   └── styles/              # Global styles
│
├── docker-compose.yml        # Docker orchestration
├── nginx.conf               # Nginx configuration
├── ecosystem.config.js      # PM2 configuration
└── package.json             # Root package
```

## 🔒 Security Features

1. **Password Security**: bcrypt with 12 rounds
2. **JWT Tokens**: Separate access (15min) and refresh (7days) tokens
3. **CSRF Protection**: Double-submit cookie pattern
4. **Rate Limiting**: API throttling to prevent abuse
5. **Security Headers**: Helmet.js implementation
6. **Input Validation**: Zod schemas on all inputs
7. **SQL Injection Prevention**: Prisma ORM with parameterized queries
8. **XSS Protection**: React's built-in escaping + CSP headers
9. **CORS**: Configured for specific frontend origin
10. **HTTPS**: Enforced in production

## 📊 Database Schema

The system uses PostgreSQL with Prisma ORM. Key entities:

- `ShopUser`: Shop owners (multi-tenancy root)
- `User`: Shop employees with roles and permissions
- `Product`: Inventory items with pricing and stock
- `Customer`: Customer accounts with credit tracking
- `Sale`: Sales transactions with items
- `Supplier`: Supplier accounts and purchases
- `ShareHolder`: Shareholders with investment tracking
- `ActivityLog`: Comprehensive audit trail
- `CashLedger`: Real-time cash balance tracking

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/shop-auth/register` - Register shop
- `POST /api/shop-auth/login` - Shop owner login

### Resources (Authenticated)
- `/api/products` - Product CRUD
- `/api/customers` - Customer CRUD
- `/api/sales` - Sales management
- `/api/payments` - Payment processing
- `/api/suppliers` - Supplier management
- `/api/shareholders` - Shareholder management
- `/api/expenses` - Expense tracking
- `/api/withdrawals` - Withdrawal management
- `/api/users` - User management
- `/api/logs` - Activity logs
- `/api/cash` - Cash ledger

## 🌐 Deployment

### Environment Variables

**Production Backend (.env):**
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=<production-postgres-url>
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-secret>
FRONTEND_URL=https://yourdomain.com
```

**Production Frontend (.env.production):**
```env
VITE_API_URL=https://api.yourdomain.com
```

### Nginx Configuration

The included `nginx.conf` provides:
- Reverse proxy to backend API
- Static file serving for frontend
- Gzip compression
- Security headers
- HTTPS redirect (configure SSL certificates)

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Scale backend
docker-compose up -d --scale api=3
```

## 📈 Monitoring & Logging

- **Application Logs**: PM2 logs or Docker logs
- **Database**: Prisma query logging
- **HTTP Logs**: Morgan middleware
- **Error Tracking**: Console error logging (integrate Sentry for production)

## 🛠️ Development

### Database Management

```bash
# Open Prisma Studio
cd backend
pnpm db:studio

# Create migration
pnpm db:migrate

# Reset database
pnpm db:reset
```

### Code Quality

```bash
# Lint backend
cd backend
pnpm lint

# Format code
pnpm prettier --write .
```

## 📄 License

Proprietary - All Rights Reserved

## 🤝 Support

For support, email support@shopmanagement.com or open an issue.

## 🔐 Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Configure SSL certificates
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable production logging
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Review security headers
- [ ] Test rate limiting
- [ ] Verify CORS configuration
- [ ] Enable database connection pooling
- [ ] Configure CDN for static assets
- [ ] Set up automated backups
- [ ] Review and test disaster recovery

---

Built with ❤️ for shop owners worldwide
