import { z } from 'zod';
import { emailField, passwordField, text } from './common';

export const registerSchema = z.object({
  name: text(2, 120),
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  // Not `passwordField`: rejecting a short password at sign-in with a
  // validation error would tell an attacker the length rule rather than simply
  // failing the credential check.
  password: z.string().min(1, { error: 'Enter your password.' }),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, { error: 'That reset link looks incomplete.' }),
  password: passwordField,
});

export const updateProfileSchema = z.object({
  name: text(2, 120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  avatarUrl: z.string().trim().max(255).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { error: 'Enter your current password.' }),
  password: passwordField,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
