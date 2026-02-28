import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { validateAccessToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../services/authService';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        email?: string;
        phone?: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      throw new AppError('Token has been revoked', 401);
    }

    // Validate token
    let payload;
    try {
      payload = validateAccessToken(token);
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is inactive', 403);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email || undefined,
      phone: user.phone || undefined,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
}
