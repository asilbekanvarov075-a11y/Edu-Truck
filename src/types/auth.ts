import { UserRole } from '@prisma/client';

export interface RegisterDTO {
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface LoginDTO {
  identifier: string; // email or phone
  password: string;
}

export interface UserResponse {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  languagePreference: string;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}
