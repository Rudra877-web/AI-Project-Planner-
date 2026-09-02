import { z } from 'zod';
import {
  EXPERIENCE_LEVELS,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '../types/domain';
import { text } from './common';

export const generatePlanSchema = z.object({
  idea: text(10, 4000),
  projectType: z.enum(PROJECT_TYPES).default('web'),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).default('intermediate'),
  technologies: z.array(z.string().trim().min(1)).default([]),
  letAiChooseStack: z.boolean().default(false),
});

export const updateProjectSchema = z.object({
  name: text(2, 180).optional(),
  description: text(1, 400).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});

export const createProjectSchema = z.object({
  name: text(2, 180),
  description: text(1, 400).optional(),
  type: z.enum(PROJECT_TYPES).default('web'),
});

export const listProjectsQuerySchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  search: z.string().trim().max(180).optional(),
});

export const changeRequestSchema = z.object({
  request: text(5, 2000),
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
