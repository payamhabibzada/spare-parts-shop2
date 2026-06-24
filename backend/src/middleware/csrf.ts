/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 *
 * Implementation using Double Submit Cookie pattern:
 * 1. Generate random CSRF token
 * 2. Set token in both cookie and custom header
 * 3. Verify both match on state-changing requests
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/**
 * Generate a random CSRF token
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to generate and set CSRF token
 * Call this on routes that render forms or return data for forms
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Generate new token if not exists
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    token = generateCsrfToken();

    // Set secure cookie
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  // Attach token to request for easy access
  req.csrfToken = () => token;

  next();
}

/**
 * Middleware to verify CSRF token
 * Call this on state-changing routes (POST, PUT, PATCH, DELETE)
 */
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Skip verification for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Get token from cookie and header
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME) || req.body?._csrf;

  // Verify both exist and match
  if (!cookieToken || !headerToken) {
    res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token is required for this request',
    });
    return;
  }

  if (cookieToken !== headerToken) {
    res.status(403).json({
      error: 'CSRF token mismatch',
      message: 'CSRF token validation failed',
    });
    return;
  }

  next();
}

/**
 * Express middleware type augmentation
 */
declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}
