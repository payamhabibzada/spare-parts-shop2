# Security Policy

## Overview

This document outlines the security measures implemented in the Shop Management System and provides guidelines for maintaining security in production environments.

## Security Features

### 1. Authentication & Authorization

#### Password Security
- **Hashing Algorithm**: bcrypt with 12 rounds
- **Password Requirements**: 
  - Minimum 8 characters
  - Must contain uppercase, lowercase, number, and special character
  - No common passwords allowed
- **Storage**: Never stored in plaintext, only bcrypt hashes

#### JWT Tokens
- **Access Token**: 
  - Lifetime: 15 minutes
  - Contains: shopId, userId, role
  - Signed with strong secret (64+ chars)
  
- **Refresh Token**: 
  - Lifetime: 7 days
  - Stored in database for revocation capability
  - Rotated on each use
  - Different secret from access token

#### Session Management
- Token rotation on refresh
- Automatic logout on token expiration
- Logout invalidates refresh token in database
- No concurrent sessions allowed

### 2. Role-Based Access Control (RBAC)

Three role levels:
- **SUPER_ADMIN**: Full system access, can manage shops
- **ADMIN**: Full shop access, can manage users
- **USER**: Limited access based on granular permissions

Granular permissions system:
```typescript
permissions: [
  'products:read', 'products:write',
  'customers:read', 'customers:write',
  'sales:read', 'sales:write',
  'reports:read',
  'users:read', 'users:write'
]
```

### 3. Input Validation

- **Frontend**: Zod schemas on all forms
- **Backend**: Zod validation on all API endpoints
- **Database**: Prisma type safety

Example validation:
```typescript
const productSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0).max(999999999),
  barcode: z.string().max(100).optional(),
});
```

### 4. API Security

#### Rate Limiting
```typescript
// Auth endpoints: 20 requests per 15 minutes
// API endpoints: 300 requests per minute
```

#### CORS Configuration
```typescript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
})
```

#### Security Headers (Helmet.js)
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Referrer-Policy

#### CSRF Protection
Double-submit cookie pattern:
- Token generated and set in cookie
- Client sends token in custom header
- Server validates both match

### 5. Database Security

#### SQL Injection Prevention
- Prisma ORM with parameterized queries
- No raw SQL execution
- Type-safe query building

#### Data Isolation
- Multi-tenancy at database level
- All queries scoped by shopId
- Row-level security via Prisma filters

#### Sensitive Data
- Passwords: bcrypt hashed
- JWT secrets: Environment variables
- Database credentials: Environment variables
- API keys: Never committed to git

### 6. Network Security

#### HTTPS Enforcement
```nginx
# Redirect all HTTP to HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

#### TLS Configuration
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### 7. Audit Logging

Comprehensive activity logging:
- All CREATE, UPDATE, DELETE operations
- Login/logout events
- Failed authentication attempts
- Permission changes
- Before/after data snapshots

```typescript
interface ActivityLog {
  userId: string;
  action: 'ADD' | 'EDIT' | 'DELETE';
  entity: string;
  beforeData: JSON;
  afterData: JSON;
  timestamp: DateTime;
}
```

## Security Best Practices

### Environment Variables

Never commit secrets to version control:

```env
# .env.example (safe to commit)
JWT_SECRET=<generate-strong-random-secret>

# .env (NEVER commit)
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database Credentials

- Use strong passwords (20+ characters)
- Rotate credentials regularly (every 90 days)
- Limit database user permissions
- Enable SSL for database connections

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Dependency Management

- Regular updates: `pnpm update`
- Security audits: `pnpm audit`
- Lock file: Committed to version control
- No deprecated packages

### Error Handling

Never expose sensitive information in errors:

```typescript
// ❌ Bad
res.status(500).json({ error: err.stack });

// ✅ Good
res.status(500).json({ error: 'Internal server error' });
console.error(err); // Log internally only
```

### File Uploads

- Validate file types
- Limit file sizes
- Scan for malware
- Store outside web root
- Generate unique filenames

```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
const maxSize = 5 * 1024 * 1024; // 5MB
```

## Vulnerability Disclosure

### Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@shopmanagement.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **24 hours**: Acknowledgment of report
- **7 days**: Initial assessment
- **30 days**: Fix development and testing
- **Release**: Security patch deployed

### Coordinated Disclosure

We request 90 days for coordinated disclosure to allow:
- Fix development
- Testing
- Deployment to production
- User notification

## Security Checklist

### Pre-Production

- [ ] All default passwords changed
- [ ] Strong JWT secrets generated (64+ chars)
- [ ] Database credentials rotated
- [ ] Environment variables configured
- [ ] HTTPS enabled with valid certificates
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] Audit logging verified
- [ ] Error handling reviewed
- [ ] Dependencies updated
- [ ] Security audit performed

### Production Monitoring

- [ ] Monitor failed login attempts
- [ ] Track unusual API patterns
- [ ] Review audit logs weekly
- [ ] Database backup verification
- [ ] SSL certificate expiration alerts
- [ ] Dependency vulnerability scans
- [ ] Performance monitoring
- [ ] Disk space monitoring

### Ongoing Maintenance

- [ ] Monthly dependency updates
- [ ] Quarterly password rotation
- [ ] Annual security audit
- [ ] Regular backup testing
- [ ] Incident response plan review
- [ ] Access control review
- [ ] Log retention policy enforcement

## Common Attack Vectors & Mitigations

### 1. SQL Injection
**Mitigation**: Prisma ORM with parameterized queries

### 2. XSS (Cross-Site Scripting)
**Mitigation**: 
- React's built-in XSS protection
- Content Security Policy headers
- Input sanitization

### 3. CSRF (Cross-Site Request Forgery)
**Mitigation**: 
- Double-submit cookie pattern
- SameSite cookie attribute
- Custom CSRF header

### 4. Authentication Bypass
**Mitigation**:
- JWT signature verification
- Token expiration
- Secure token storage
- No client-side auth logic

### 5. Brute Force
**Mitigation**:
- Rate limiting
- Account lockout (after 5 failed attempts)
- CAPTCHA for sensitive operations

### 6. Session Hijacking
**Mitigation**:
- HTTPS only
- Secure cookie flags
- Token rotation
- Short token lifetime

### 7. Information Disclosure
**Mitigation**:
- Generic error messages
- No stack traces in production
- Secure logging practices

### 8. Privilege Escalation
**Mitigation**:
- RBAC verification on every request
- Permission checks in backend
- Audit logging for role changes

## Incident Response Plan

### 1. Detection
- Monitor logs for suspicious activity
- Set up alerts for anomalies
- Regular security audits

### 2. Containment
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IPs

### 3. Investigation
- Preserve logs and evidence
- Identify attack vector
- Assess impact

### 4. Remediation
- Patch vulnerabilities
- Update security measures
- Restore from clean backups

### 5. Post-Incident
- Document incident
- Update security policies
- Improve detection mechanisms
- Notify affected users

## Compliance

### Data Protection
- GDPR considerations for EU users
- Data encryption at rest and in transit
- Right to deletion implementation
- Data export capabilities

### Access Controls
- Principle of least privilege
- Regular access reviews
- Multi-factor authentication (optional)

### Audit Requirements
- Comprehensive activity logging
- Log retention (minimum 1 year)
- Tamper-proof audit trails

## Security Tools

### Recommended
- **Dependency Scanning**: `pnpm audit`, Snyk
- **Static Analysis**: ESLint security plugins
- **Runtime Protection**: Helmet.js
- **Monitoring**: Sentry, LogRocket
- **Secrets Management**: HashiCorp Vault, AWS Secrets Manager

### Testing
```bash
# Audit dependencies
pnpm audit

# Check for vulnerabilities
pnpm audit --fix

# Security-focused linting
pnpm eslint --plugin security
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Security](https://www.prisma.io/docs/guides/security)

---

**Last Updated**: 2026-06-06
**Version**: 1.0.0
