import { z } from 'zod';
import { text } from './common';

export const chatMessageSchema = z.object({
  message: text(1, 4000),
  threadId: z.string().trim().min(1).max(64).default('main'),
});

export const debugRequestSchema = z.object({
  error: text(1, 4000),
  context: z.string().trim().max(4000).optional(),
});

export const stuckRequestSchema = z.object({
  taskId: z.string().uuid(),
});
