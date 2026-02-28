import express from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/authService';
import { loginLimiter, checkAccountLock, recordFailedLogin, clearFailedLogins } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(Object.values(UserRole)).withMessage('Invalid role'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  loginLimiter,
  [
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const { identifier, password } = req.body;

      // Check if account is locked
      await checkAccountLock(identifier);

      try {
        const result = await authService.login({ identifier, password });
        
        // Clear failed login attempts on success
        clearFailedLogins(identifier);
        
        res.json(result);
      } catch (error) {
        // Record failed login attempt
        if (error instanceof AppError && error.statusCode === 401) {
          recordFailedLogin(identifier);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const result = await authService.refreshToken(req.body.refreshToken);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await authService.logout(token);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
