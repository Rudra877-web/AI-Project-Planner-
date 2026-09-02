import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validators';

export const authRouter = Router();

// Credential endpoints get the tighter limiter; reads don't need it.
authRouter.post('/register', authLimiter, validateBody(registerSchema), auth.register);
authRouter.post('/login', authLimiter, validateBody(loginSchema), auth.login);
authRouter.post('/logout', auth.logout);
authRouter.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  auth.forgotPassword,
);
authRouter.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  auth.resetPassword,
);

authRouter.get('/me', requireAuth, auth.me);
authRouter.patch('/me', requireAuth, validateBody(updateProfileSchema), auth.updateProfile);
authRouter.post(
  '/change-password',
  requireAuth,
  authLimiter,
  validateBody(changePasswordSchema),
  auth.changePassword,
);
