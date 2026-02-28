import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { generateTokens, validateRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { RegisterDTO, LoginDTO, UserResponse, AuthResponse } from '../types/auth';

const prisma = new PrismaClient();

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set<string>();

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (simple validation)
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Convert User to UserResponse (exclude sensitive data)
 */
function toUserResponse(user: any): UserResponse {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    languagePreference: user.languagePreference,
    createdAt: user.createdAt,
  };
}

/**
 * Register new user
 */
export async function register(data: RegisterDTO): Promise<AuthResponse> {
  // Validate email or phone is provided
  if (!data.email && !data.phone) {
    throw new AppError('Email or phone number is required', 400);
  }

  // Validate email format
  if (data.email && !isValidEmail(data.email)) {
    throw new AppError('Invalid email format', 400);
  }

  // Validate phone format
  if (data.phone && !isValidPhone(data.phone)) {
    throw new AppError('Invalid phone number format', 400);
  }

  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join(', '), 400);
  }

  // Check for duplicate email or phone
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        data.email ? { email: data.email } : {},
        data.phone ? { phone: data.phone } : {},
      ],
    },
  });

  if (existingUser) {
    throw new AppError('User with this email or phone already exists', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
    },
  });

  // Generate tokens
  const tokens = generateTokens(user.id, user.role);

  return {
    success: true,
    user: toUserResponse(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Login user
 */
export async function login(data: LoginDTO): Promise<AuthResponse> {
  // Find user by email or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.identifier }, { phone: data.identifier }],
    },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is inactive', 403);
  }

  // Validate password
  const isValidPassword = await comparePassword(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate tokens
  const tokens = generateTokens(user.id, user.role);

  return {
    success: true,
    user: toUserResponse(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
  // Check if token is blacklisted
  if (tokenBlacklist.has(refreshToken)) {
    throw new AppError('Token has been revoked', 401);
  }

  // Validate refresh token
  let payload;
  try {
    payload = validateRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  // Generate new access token
  const tokens = generateTokens(user.id, user.role);

  return {
    accessToken: tokens.accessToken,
  };
}

/**
 * Logout user (blacklist token)
 */
export async function logout(token: string): Promise<void> {
  tokenBlacklist.add(token);
  // In production, set expiration in Redis matching token expiry
}

/**
 * Check if token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}
