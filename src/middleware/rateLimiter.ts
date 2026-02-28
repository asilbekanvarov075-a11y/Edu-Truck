import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

// General rate limiter: 100 requests per minute per IP
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter: 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
});

// Track failed login attempts per user
interface LoginAttempt {
  count: number;
  lockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

/**
 * Check if account is locked due to failed login attempts
 */
export async function checkAccountLock(identifier: string): Promise<void> {
  const attempt = loginAttempts.get(identifier);

  if (attempt && attempt.lockedUntil) {
    if (new Date() < attempt.lockedUntil) {
      const minutesLeft = Math.ceil(
        (attempt.lockedUntil.getTime() - Date.now()) / 1000 / 60
      );
      throw new AppError(
        `Account is locked due to too many failed login attempts. Try again in ${minutesLeft} minutes`,
        429
      );
    } else {
      // Lock expired, reset attempts
      loginAttempts.delete(identifier);
    }
  }
}

/**
 * Record failed login attempt
 */
export function recordFailedLogin(identifier: string): void {
  const attempt = loginAttempts.get(identifier) || { count: 0 };
  attempt.count += 1;

  // Lock account after 5 failed attempts for 30 minutes
  if (attempt.count >= 5) {
    attempt.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  loginAttempts.set(identifier, attempt);
}

/**
 * Clear failed login attempts on successful login
 */
export function clearFailedLogins(identifier: string): void {
  loginAttempts.delete(identifier);
}
