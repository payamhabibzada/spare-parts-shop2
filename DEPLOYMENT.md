# Production Deployment Guide

Complete guide for deploying the Shop Management System to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Backup Strategy](#backup-strategy)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Hardware Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- Network: 10Mbps

**Recommended:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Network: 100Mbps

### Software Requirements

- Ubuntu 22.04 LTS or later
- Docker 24.x and Docker Compose 2.x
- PostgreSQL 14+ (or managed service)
- Nginx 1.24+
- Node.js 20.x LTS (for PM2 deployment)

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git wget build-essential

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Install Node.js (for PM2)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2
```

### 2. Configure Firewall

```bash
# Install UFW
sudo apt install ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 3. Create Deployment User

```bash
# Create user
sudo adduser deployer
sudo usermod -aG sudo deployer
sudo usermod -aG docker deployer

# Switch to deployer
su - deployer
```

## Database Configuration

### Option 1: Managed PostgreSQL (Recommended)

Use a managed service like:
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases
- Supabase

**Advantages:**
- Automatic backups
- High availability
- Automatic updates
- Built-in monitoring
- Point-in-time recovery

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

CREATE DATABASE shop_management_prod;
CREATE USER shop_admin WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE shop_management_prod TO shop_admin;
\q
```

**Configure PostgreSQL:**

Edit `/etc/postgresql/14/main/postgresql.conf`:
```conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB
```

Edit `/etc/postgresql/14/main/pg_hba.conf`:
```conf
# IPv4 local connections:
host    shop_management_prod    shop_admin    127.0.0.1/32    md5
```

```bash
sudo systemctl restart postgresql
```

## Application Deployment

### Method 1: Docker Compose (Recommended)

#### 1. Clone Repository

```bash
cd /var/www
sudo mkdir shop-management
sudo chown deployer:deployer shop-management
cd shop-management

git clone <repository-url> .
```

#### 2. Configure Environment

```bash
# Backend environment
cd backend
cp .env.example .env

# Edit .env with production values
nano .env
```

**Production .env:**
```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://shop_admin:password@postgres:5432/shop_management_prod?schema=public"
JWT_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<different-64-char-random-hex>
FRONTEND_URL=https://yourdomain.com
BCRYPT_ROUNDS=12
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 3. Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

#### 4. Run Migrations

```bash
docker-compose exec api pnpm db:migrate:prod
```

### Method 2: PM2 (Alternative)

#### 1. Clone and Install

```bash
cd /var/www/shop-management
git clone <repository-url> .

# Install dependencies
pnpm install

# Build backend
cd backend
pnpm build

# Run migrations
pnpm db:migrate:prod
```

#### 2. Configure PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions output by the command

# Check status
pm2 status
pm2 monit
```

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Update Nginx Configuration

Create `/etc/nginx/sites-available/shop-management`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API Proxy
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend Static Files
    location / {
        root /var/www/shop-management/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/shop-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring & Maintenance

### 1. Application Monitoring

**Using PM2:**
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs
pm2 logs api --lines 100

# Memory usage
pm2 list
```

**Using Docker:**
```bash
# View logs
docker-compose logs -f --tail=100

# Resource usage
docker stats

# Check health
docker-compose ps
```

### 2. Database Monitoring

```bash
# Connect to PostgreSQL
psql -U shop_admin -d shop_management_prod

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Database size
SELECT pg_size_pretty(pg_database_size('shop_management_prod'));

# Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Log Rotation

Create `/etc/logrotate.d/shop-management`:

```
/var/www/shop-management/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deployer deployer
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup Strategy

### 1. Database Backups

**Automated Daily Backup Script:**

Create `/usr/local/bin/backup-shop-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/shop-management"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="shop_management_prod"
DB_USER="shop_admin"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER -Fc $DB_NAME > $BACKUP_DIR/db_backup_$TIMESTAMP.dump

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.dump" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/db_backup_$TIMESTAMP.dump s3://your-bucket/backups/
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/backup-shop-db.sh

# Add to crontab
sudo crontab -e

# Daily at 2 AM
0 2 * * * /usr/local/bin/backup-shop-db.sh
```

### 2. Application Backups

```bash
# Backup application files
tar -czf /var/backups/shop-app-$(date +%Y%m%d).tar.gz \
    /var/www/shop-management \
    --exclude node_modules \
    --exclude dist
```

### 3. Restore from Backup

```bash
# Restore database
pg_restore -U shop_admin -d shop_management_prod -c /var/backups/shop-management/db_backup_TIMESTAMP.dump
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs api --err

# Check environment variables
pm2 show api

# Restart
pm2 restart api
```

### Database Connection Issues

```bash
# Test connection
psql -U shop_admin -d shop_management_prod -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### High Memory Usage

```bash
# Check process memory
pm2 list
docker stats

# Restart services
pm2 restart api
docker-compose restart api
```

### Slow Database Queries

```bash
# Enable slow query logging
ALTER DATABASE shop_management_prod SET log_min_duration_statement = 1000;

# View slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets (64+ characters)
- [ ] Enable SSL/HTTPS with valid certificates
- [ ] Configure firewall (UFW/iptables)
- [ ] Set up fail2ban for SSH protection
- [ ] Enable database encryption at rest
- [ ] Configure automated security updates
- [ ] Set up intrusion detection (OSSEC/AIDE)
- [ ] Regular security audits
- [ ] Monitor application logs
- [ ] Implement rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular dependency updates
- [ ] Database access from localhost only

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_products_shop_barcode ON products(shop_id, barcode);
CREATE INDEX idx_sales_shop_customer ON sales(shop_id, customer_id);
CREATE INDEX idx_activity_logs_shop_date ON activity_logs(shop_id, created_at DESC);

-- Analyze tables
ANALYZE products;
ANALYZE sales;
ANALYZE customers;
```

### Application Optimization

```bash
# Enable PM2 cluster mode
pm2 start ecosystem.config.js --env production -i max

# Configure Nginx caching
# Add to nginx.conf in http block:
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
```

---

For additional support, refer to the main README.md or contact the development team.
